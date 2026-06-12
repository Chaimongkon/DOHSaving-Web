"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import css from "./page.module.css";

interface MourningModeData {
  active: boolean;
  intensity: number;
  bannerText: string;
}

const DEFAULTS: MourningModeData = {
  active: false,
  intensity: 100,
  bannerText: "",
};

export default function AdminMourningPage() {
  const [data, setData] = useState<MourningModeData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }, []);

  useEffect(() => {
    fetch("/api/admin/mourning-mode", { credentials: "include" })
      .then((res) => res.json())
      .then((d: MourningModeData) => setData({ ...DEFAULTS, ...d }))
      .catch(() => showToast("โหลดค่าไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/mourning-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("save failed");
      const saved = await res.json();
      setData(saved);
      showToast("บันทึกเรียบร้อย");
    } catch {
      showToast("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={css.page}>
      <header className={css.topbar}>
        <div>
          <div className={css.eyebrow}>Mourning Mode</div>
          <h1 className={css.title}>โหมดไว้อาลัย</h1>
          <p className={css.subtitle}>
            ลดสีหน้าเว็บให้เป็นโทนขาว-ดำเพื่อแสดงความไว้อาลัย พร้อมแถบข้อความด้านบนสุด
            ใช้กับหน้าสาธารณะเท่านั้น ไม่กระทบหน้า admin
          </p>
        </div>
      </header>

      {loading ? (
        <div className={css.stateBox}>
          <Loader2 className={css.spin} size={20} />
          <span>กำลังโหลดค่า...</span>
        </div>
      ) : (
        <section className={css.card}>
          <div className={css.row}>
            <div>
              <h2 className={css.rowTitle}>เปิดโหมดไว้อาลัย</h2>
              <p className={css.rowHint}>เมื่อเปิด หน้าเว็บสาธารณะจะแสดงเป็นโทนขาว-ดำ</p>
            </div>
            <label className={css.switch}>
              <input
                type="checkbox"
                checked={data.active}
                onChange={(e) => setData({ ...data, active: e.target.checked })}
              />
              <span className={css.switchUi} aria-hidden />
              <span className={css.switchLabel}>{data.active ? "เปิด" : "ปิด"}</span>
            </label>
          </div>

          <div className={css.divider} />

          <div className={css.field}>
            <div className={css.fieldHead}>
              <h2 className={css.rowTitle}>ความเข้มของขาว-ดำ</h2>
              <span className={css.value}>{data.intensity}%</span>
            </div>
            <p className={css.rowHint}>0% = สีปกติ, 100% = ขาว-ดำเต็มที่ (แนะนำ 100%)</p>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={data.intensity}
              onChange={(e) => setData({ ...data, intensity: parseInt(e.target.value, 10) || 0 })}
              className={css.slider}
              disabled={!data.active}
            />
          </div>

          <div className={css.divider} />

          <div className={css.field}>
            <h2 className={css.rowTitle}>ข้อความแถบไว้อาลัย</h2>
            <p className={css.rowHint}>
              จะแสดงเป็นแถบสีเข้มด้านบนสุดของทุกหน้าสาธารณะ เว้นว่างไว้ถ้าไม่ต้องการแถบ
            </p>
            <textarea
              className={css.textarea}
              rows={3}
              maxLength={500}
              value={data.bannerText}
              onChange={(e) => setData({ ...data, bannerText: e.target.value })}
              placeholder="เช่น น้อมรำลึกถึงพระมหากรุณาธิคุณ ด้วยเกล้าด้วยกระหม่อม"
            />
            <span className={css.counter}>{data.bannerText.length} / 500</span>
          </div>

          <div className={css.divider} />

          <div className={css.preview}>
            <h2 className={css.rowTitle}>ตัวอย่างแถบ</h2>
            {data.bannerText.trim() ? (
              <div className={css.previewBanner}>{data.bannerText}</div>
            ) : (
              <div className={css.previewEmpty}>ยังไม่มีข้อความ — แถบจะไม่ขึ้น</div>
            )}
          </div>

          <div className={css.footer}>
            <button className={css.primaryBtn} onClick={save} disabled={saving}>
              {saving ? <Loader2 className={css.spin} size={16} /> : <Save size={16} />}
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </section>
      )}

      {toast && <div className={css.toast}>{toast}</div>}
    </div>
  );
}
