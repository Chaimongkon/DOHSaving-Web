"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Home,
  ChevronRight,
  SearchX,
  Download,
  ZoomIn,
  ZoomOut,
  X,
  FileText,
  ExternalLink,
  Check,
  ListChecks,
  Phone,
  MessagesSquare,
  FolderOpen,
  ImageDown,
  CircleHelp,
} from "lucide-react";
import { parseSteps, type ServiceStep } from "@/lib/serviceSteps";
import { useContactData, telHref } from "@/lib/contactInfo";
import css from "./page.module.css";

interface DownloadLink {
  label: string;
  url: string;
}

interface ServicePageData {
  id: number;
  slug: string;
  title: string;
  category: string;
  infographicUrl: string | null;
  downloadLinks: string | null;
  formGroup: string | null;
  steps: ServiceStep[];
  related: { slug: string; title: string }[];
}

const FORM_GROUP_KEY_MAP: Record<string, string> = {
  "แบบฟอร์มสมัครสมาชิก": "member-registration",
  "แบบฟอร์มเงินฝาก-ถอน": "deposit-withdraw",
  "แบบฟอร์มเกี่ยวกับเงินกู้": "loan",
  "แบบฟอร์มขอสวัสดิการ": "welfare",
  "แบบฟอร์มหนังสือร้องทุกข์": "complaint",
  "หนังสือแต่งตั้งผู้รับโอนประโยชน์": "beneficiary",
  "ใบคำขอเอาประกันภัยกลุ่มสหกรณ์": "insurance",
  "แบบฟอร์มอื่นๆ": "other",
};

/** ไฟล์ที่ดาวน์โหลดได้ (PDF/Word/รูป) ต่างจากลิงก์ไปหน้าอื่นในเว็บ */
function fileType(url: string): string | null {
  const m = /\.([a-z0-9]{2,5})(?:[?#].*)?$/i.exec(url);
  return m ? m[1].toUpperCase() : null;
}

const lineUrl = (id: string) => `https://line.me/R/ti/p/${encodeURIComponent(id.trim())}`;

export default function ServicePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [data, setData] = useState<ServicePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [done, setDone] = useState<Set<number>>(new Set());
  const { info } = useContactData();

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetch(`/api/service-pages/${slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((json) => {
        if (cancelled) return;
        if (json) setData({ ...json, steps: parseSteps(json.steps), related: json.related ?? [] });
        else setNotFound(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const closeLightbox = useCallback(() => {
    setLightbox(false);
    setZoomed(false);
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeLightbox();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, closeLightbox]);

  const toggleDone = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const scrollToDocs = () => document.getElementById("docs")?.scrollIntoView({ behavior: "smooth", block: "start" });

  // ── Loading / Not found ──
  if (loading || notFound || !data) {
    return (
      <>
        <section className={css.hero}>
          <span className={css.heroGlow} aria-hidden="true" />
          <div className={css.heroInner}>
            <h1 className={css.heroTitle}>{loading ? "กำลังโหลด..." : "ไม่พบหน้าบริการนี้"}</h1>
          </div>
        </section>
        <div className={css.main}>
          {loading ? (
            <div className={css.layout}>
              <div className={css.skeleton} style={{ aspectRatio: "4 / 3" }} />
              <div className={css.skeleton} style={{ height: 320 }} />
            </div>
          ) : (
            <div className={css.notFound}>
              <SearchX size={44} strokeWidth={1.5} />
              <h2>ไม่พบหน้าบริการนี้</h2>
              <p>หน้าที่ต้องการอาจถูกย้ายหรือยังไม่เปิดให้บริการ</p>
              <Link href="/" className={css.primaryBtn}><Home size={16} /> กลับหน้าหลัก</Link>
            </div>
          )}
        </div>
      </>
    );
  }

  let links: DownloadLink[] = [];
  try {
    links = data.downloadLinks ? JSON.parse(data.downloadLinks) : [];
  } catch {
    links = [];
  }

  const formGroupKey = data.formGroup ? FORM_GROUP_KEY_MAP[data.formGroup] : null;
  const steps = data.steps;
  const docCount = links.length + (formGroupKey ? 1 : 0);
  const lineId = info.lineOfficial || "@dohsaving";
  const mainPhone = info.mainPhone;

  return (
    <>
      {/* ══ Hero ══ */}
      <section className={css.hero}>
        <span className={css.heroGlow} aria-hidden="true" />
        <div className={css.heroInner}>
          <nav className={css.breadcrumb} aria-label="breadcrumb">
            <Link href="/"><Home size={14} aria-label="หน้าหลัก" /></Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span>{data.category}</span>
            <ChevronRight size={14} aria-hidden="true" />
            <span className={css.breadcrumbActive}>{data.title}</span>
          </nav>
          <h1 className={css.heroTitle}>{data.title}</h1>
          <div className={css.heroChips}>
            {steps.length > 0 && (
              <span className={css.heroChip}><ListChecks size={15} /> {steps.length} ขั้นตอน</span>
            )}
            {docCount > 0 && (
              <button className={css.heroChip} onClick={scrollToDocs}>
                <FileText size={15} /> เอกสาร {docCount} รายการ
              </button>
            )}
          </div>
        </div>
      </section>

      <div className={css.main}>
        <div className={`${css.layout} ${!data.infographicUrl ? css.layoutSingle : ""}`}>
          {/* ── Infographic ── */}
          {data.infographicUrl && (
            <div className={css.visualCol}>
              <figure className={css.visual}>
                <button className={css.visualImgBtn} onClick={() => setLightbox(true)} aria-label="ขยายดูภาพเต็มจอ">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.infographicUrl} alt={`ภาพอธิบาย ${data.title}`} className={css.visualImg} />
                  <span className={css.visualZoomHint}><ZoomIn size={16} /> แตะเพื่อขยาย</span>
                </button>
                <figcaption className={css.visualBar}>
                  <button className={css.visualAction} onClick={() => setLightbox(true)}>
                    <ZoomIn size={16} /> ขยายดูเต็มจอ
                  </button>
                  <a className={css.visualAction} href={data.infographicUrl} download>
                    <ImageDown size={16} /> บันทึกรูปลงเครื่อง
                  </a>
                </figcaption>
              </figure>
            </div>
          )}

          <div className={css.infoCol}>
            {/* ── ขั้นตอนแบบข้อความ ── */}
            {steps.length > 0 && (
              <section className={css.card} aria-labelledby="steps-title">
                <header className={css.cardHead}>
                  <h2 id="steps-title" className={css.cardTitle}><ListChecks size={20} /> ขั้นตอน</h2>
                  <span className={css.progress} aria-live="polite">
                    {done.size > 0 ? `ทำแล้ว ${done.size}/${steps.length}` : "แตะ ✓ เมื่อทำเสร็จ"}
                  </span>
                </header>
                <ol className={css.steps}>
                  {steps.map((st, i) => {
                    const doc = st.docIndex !== undefined ? links[st.docIndex] : undefined;
                    const isDone = done.has(i);
                    return (
                      <li key={i} className={`${css.step} ${isDone ? css.stepDone : ""}`}>
                        <button
                          className={css.stepNum}
                          onClick={() => toggleDone(i)}
                          aria-pressed={isDone}
                          aria-label={`ขั้นที่ ${i + 1} ${isDone ? "ทำแล้ว" : "ยังไม่ได้ทำ"}`}
                        >
                          {isDone ? <Check size={18} strokeWidth={3} /> : i + 1}
                        </button>
                        <div className={css.stepBody}>
                          <h3 className={css.stepTitle}>{st.title}</h3>
                          {st.detail && <p className={css.stepDetail}>{st.detail}</p>}
                          {(doc || st.linkUrl) && (
                            <div className={css.stepActions}>
                              {doc && (
                                <a
                                  href={doc.url}
                                  className={css.stepBtn}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={fileType(doc.url) ? "" : undefined}
                                >
                                  <Download size={15} /> {doc.label}
                                </a>
                              )}
                              {st.linkUrl && (
                                <a
                                  href={st.linkUrl}
                                  className={`${css.stepBtn} ${/line\.me/i.test(st.linkUrl) ? css.stepBtnLine : ""}`}
                                  target={st.linkUrl.startsWith("/") ? undefined : "_blank"}
                                  rel="noopener noreferrer"
                                >
                                  {/line\.me/i.test(st.linkUrl) ? <MessagesSquare size={15} /> : <ExternalLink size={15} />}
                                  {st.linkLabel}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {/* ── เอกสาร ── */}
            {docCount > 0 && (
              <section id="docs" className={css.card} aria-labelledby="docs-title">
                <header className={css.cardHead}>
                  <h2 id="docs-title" className={css.cardTitle}><Download size={20} /> เอกสารที่ต้องใช้</h2>
                </header>
                <ul className={css.docs}>
                  {links.map((link, i) => {
                    const type = fileType(link.url);
                    const internalPage = !type && link.url.startsWith("/");
                    return (
                      <li key={i} className={css.doc}>
                        <span className={`${css.docType} ${type === "PDF" ? css.docPdf : ""}`}>
                          {type ?? <FolderOpen size={18} />}
                        </span>
                        <span className={css.docName}>{link.label}</span>
                        <span className={css.docActions}>
                          {type ? (
                            <>
                              <a href={link.url} target="_blank" rel="noopener noreferrer" className={css.docView}>
                                เปิดดู
                              </a>
                              <a href={link.url} download className={css.docDownload} aria-label={`ดาวน์โหลด ${link.label}`}>
                                <Download size={16} /> <span>ดาวน์โหลด</span>
                              </a>
                            </>
                          ) : (
                            <a
                              href={link.url}
                              className={css.docDownload}
                              target={internalPage ? undefined : "_blank"}
                              rel="noopener noreferrer"
                            >
                              <span>ไปที่หน้า</span> <ChevronRight size={16} />
                            </a>
                          )}
                        </span>
                      </li>
                    );
                  })}
                  {formGroupKey && (
                    <li className={css.doc}>
                      <span className={css.docType}><FolderOpen size={18} /></span>
                      <span className={css.docName}>
                        {data.formGroup}
                        <small>แยกตามประเภทสมาชิก</small>
                      </span>
                      <span className={css.docActions}>
                        <Link href={`/forms?group=${formGroupKey}`} className={css.docDownload}>
                          <span>ดูแบบฟอร์ม</span> <ChevronRight size={16} />
                        </Link>
                      </span>
                    </li>
                  )}
                </ul>
                <Link href="/forms" className={css.allForms}>ดูแบบฟอร์มทั้งหมด <ChevronRight size={14} /></Link>
              </section>
            )}

            {/* ── ช่วยเหลือ ── */}
            <section className={css.help} aria-labelledby="help-title">
              <h2 id="help-title" className={css.helpTitle}><CircleHelp size={20} /> ยังไม่เข้าใจขั้นตอน?</h2>
              <p className={css.helpText}>สอบถามเจ้าหน้าที่ได้ทุกวันทำการ หรือค้นหาคำถามที่สมาชิกท่านอื่นเคยถาม</p>
              <div className={css.helpActions}>
                <a href={lineUrl(lineId)} target="_blank" rel="noopener noreferrer" className={css.helpLine}>
                  <MessagesSquare size={17} /> LINE {lineId}
                </a>
                {mainPhone && (
                  <a href={telHref(mainPhone)} className={css.helpPhone}>
                    <Phone size={17} /> โทร {mainPhone}
                  </a>
                )}
                <Link href={`/qna?q=${encodeURIComponent(data.title)}`} className={css.helpQna}>
                  ถาม-ตอบ <ChevronRight size={15} />
                </Link>
              </div>
            </section>
          </div>
        </div>

        {/* ── บริการอื่นในหมวด ── */}
        {data.related.length > 0 && (
          <nav className={css.related} aria-label={`บริการอื่นในหมวด${data.category}`}>
            <h2 className={css.relatedTitle}>บริการอื่นในหมวด{data.category}</h2>
            <div className={css.relatedList}>
              {data.related.map((r) => (
                <Link key={r.slug} href={`/services/${r.slug}`} className={css.relatedChip}>
                  {r.title} <ChevronRight size={15} />
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>

      {/* ── แถบล่างบนมือถือ ── */}
      <div className={css.mobileBar}>
        {docCount > 0 && (
          <button className={css.mobileDocs} onClick={scrollToDocs}>
            <Download size={18} /> เอกสาร ({docCount})
          </button>
        )}
        <a href={lineUrl(lineId)} target="_blank" rel="noopener noreferrer" className={css.mobileLine}>
          <MessagesSquare size={18} /> สอบถามทาง LINE
        </a>
      </div>

      {/* ── Lightbox ── */}
      {lightbox && data.infographicUrl && (
        <div className={css.lightbox} role="dialog" aria-modal="true" aria-label={`ภาพ ${data.title}`} onClick={closeLightbox}>
          <div className={css.lightboxBar} onClick={(e) => e.stopPropagation()}>
            <button className={css.lightboxBtn} onClick={() => setZoomed((z) => !z)}>
              {zoomed ? <><ZoomOut size={18} /> พอดีจอ</> : <><ZoomIn size={18} /> ขยาย 100%</>}
            </button>
            <a className={css.lightboxBtn} href={data.infographicUrl} download>
              <ImageDown size={18} /> บันทึกรูป
            </a>
            <button className={css.lightboxBtn} onClick={closeLightbox} aria-label="ปิด">
              <X size={20} />
            </button>
          </div>
          <div className={`${css.lightboxStage} ${zoomed ? css.lightboxZoomed : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.infographicUrl}
              alt={`ภาพ ${data.title}`}
              className={css.lightboxImg}
              onClick={(e) => {
                e.stopPropagation();
                setZoomed((z) => !z);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
