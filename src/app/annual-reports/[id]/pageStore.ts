import { loadPdfjs } from "@/lib/pdfjs";

type Listener = () => void;

const MAX_ATTEMPTS = 3;
/** ระหว่างกำลังพลิกหน้า จะเรนเดอร์เฉพาะหน้าที่อยู่ใกล้ ๆ — งานพื้นหลังรอก่อน ไม่ให้แอนิเมชันกระตุก */
const NEAR_RANGE = 3;

/**
 * เก็บภาพของแต่ละหน้า PDF และเรนเดอร์ต่อเนื่องอยู่เบื้องหลัง
 * โดยเริ่มจากหน้าที่กำลังเปิดอยู่แล้วขยายออกไปจนครบทั้งเล่ม
 *
 * แต่ละหน้าติดตาม (subscribe) ภาพของตัวเองแยกกัน — ภาพมาเมื่อไรก็วาดใหม่เฉพาะหน้านั้น
 * ไม่ไปกระตุ้นให้หนังสือทั้งเล่มถูกสร้างใหม่ (ต้นเหตุของหน้าขาวระหว่างพลิก)
 */
export class PageStore {
  private images = new Map<number, string>();
  private listeners = new Map<number, Set<Listener>>();
  private attempts = new Map<number, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private task: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private doc: any = null;
  private total = 0;
  private center = 0;
  private busy = false;
  private running = false;
  private gen = 0;
  private wake: (() => void) | null = null;
  private renderWidth = 1000;

  subscribe = (pageNum: number, listener: Listener) => {
    let set = this.listeners.get(pageNum);
    if (!set) this.listeners.set(pageNum, (set = new Set()));
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  };

  get = (pageNum: number) => this.images.get(pageNum) ?? null;

  /** เปิดไฟล์ PDF แล้วเริ่มเรนเดอร์ — คืนจำนวนหน้าและสัดส่วนหน้ากระดาษ (null = ถูกยกเลิกไปก่อน) */
  async open(url: string): Promise<{ numPages: number; aspect: number } | null> {
    this.close();
    const gen = this.gen;

    const pdfjsLib = await loadPdfjs();
    if (gen !== this.gen) return null;

    // ไฟล์รายงานมีขนาดใหญ่ — ขอทีละช่วงใหญ่ขึ้น ลดจำนวน request ต่อหน้า
    const task = pdfjsLib.getDocument({ url, rangeChunkSize: 262144 });
    this.task = task;
    const doc = await task.promise;
    if (gen !== this.gen) return null;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderWidth = Math.min(1200, Math.round(Math.min(window.innerWidth, 600) * dpr));
    const first = (await doc.getPage(1)).getViewport({ scale: 1 });
    if (gen !== this.gen) return null;

    this.doc = doc;
    this.total = doc.numPages;
    this.pump();
    return { numPages: doc.numPages as number, aspect: first.height / first.width };
  }

  close() {
    this.gen++;
    this.running = false;
    this.wake?.();
    this.task?.destroy();
    this.task = null;
    this.doc = null;
    this.total = 0;
    this.center = 0;
    this.attempts.clear();
    for (const url of this.images.values()) URL.revokeObjectURL(url);
    this.images.clear();
  }

  /** หน้าที่ผู้อ่านกำลังเปิดอยู่ (index เริ่มจาก 0) — ลำดับการเรนเดอร์จะยึดหน้านี้เป็นศูนย์กลาง */
  setCenter(index: number) {
    this.center = index;
    this.wake?.();
    this.pump();
  }

  setBusy(busy: boolean) {
    this.busy = busy;
    if (!busy) this.wake?.();
  }

  /** หน้าถัดไปที่ควรเรนเดอร์: ใกล้หน้าปัจจุบันที่สุดก่อน (หน้าถัดไปมาก่อนหน้าก่อนหน้า) */
  private pick(): number | null {
    for (let d = 0; d < this.total; d++) {
      for (const index of d === 0 ? [this.center] : [this.center + d, this.center - d]) {
        const pageNum = index + 1;
        if (pageNum < 1 || pageNum > this.total) continue;
        if (this.images.has(pageNum)) continue;
        if ((this.attempts.get(pageNum) ?? 0) >= MAX_ATTEMPTS) continue;
        return pageNum;
      }
    }
    return null;
  }

  private async pump() {
    if (this.running || !this.doc) return;
    this.running = true;
    const gen = this.gen;

    while (gen === this.gen) {
      const pageNum = this.pick();
      if (pageNum === null) break;

      if (this.busy && Math.abs(pageNum - 1 - this.center) > NEAR_RANGE) {
        await new Promise<void>((resolve) => (this.wake = resolve));
        this.wake = null;
        continue;
      }

      try {
        const url = await this.render(pageNum);
        if (gen !== this.gen) {
          URL.revokeObjectURL(url);
          return;
        }
        this.images.set(pageNum, url);
        this.listeners.get(pageNum)?.forEach((listener) => listener());
      } catch (err) {
        if (gen !== this.gen) return;
        this.attempts.set(pageNum, (this.attempts.get(pageNum) ?? 0) + 1);
        console.warn(`Render page ${pageNum} failed:`, err);
      }
    }

    if (gen === this.gen) this.running = false;
  }

  private async render(pageNum: number): Promise<string> {
    const page = await this.doc.getPage(pageNum);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: this.renderWidth / base.width });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d")!;

    try {
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.88)
      );
      if (!blob) throw new Error("Cannot encode page image");
      return URL.createObjectURL(blob);
    } finally {
      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();
    }
  }
}
