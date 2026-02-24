"use client";

import React, { useState, useEffect } from "react";
import { CaretRightOutlined, RightOutlined, YoutubeOutlined } from "@ant-design/icons";
import Link from "next/link";
import css from "./VideoAndRateSection.module.css";

interface ApiRate {
  id: number;
  interestType: string | null;
  name: string | null;
  interestDate: string | null;
  interestRate: string | null;
}

interface VideoItem {
  id: number;
  title: string;
  youtubeId: string;
  thumbnailUrl: string;
  description: string | null;
}

export default function VideoAndRateSection() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeVideo, setActiveVideo] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [depositRates, setDepositRates] = useState<{ id: number; name: string; rate: string }[]>([]);
  const [loanRates, setLoanRates] = useState<{ id: number; name: string; rate: string }[]>([]);
  const [rateDate, setRateDate] = useState<string | null>(null);

  // Fetch videos from API
  useEffect(() => {
    fetch("/api/videos")
      .then((r) => r.json())
      .then((data: VideoItem[]) => {
        if (Array.isArray(data)) setVideos(data.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  // Fetch interest rates from API
  useEffect(() => {
    fetch("/api/interest-rates")
      .then((r) => r.json())
      .then((d) => {
        const all: ApiRate[] = d.rates || [];
        const dep = all.filter((r) => r.interestType === "deposit");
        const loan = all.filter((r) => r.interestType === "loan");
        setDepositRates(dep.map((r) => ({ id: r.id, name: r.name || "", rate: r.interestRate || "0" })));
        setLoanRates(loan.map((r) => ({ id: r.id, name: r.name || "", rate: r.interestRate || "0" })));
        const dt = all.find((r) => r.interestDate)?.interestDate;
        if (dt) {
          setRateDate(
            new Date(dt).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })
          );
        }
      })
      .catch(() => {});
  }, []);

  const currentVideo = videos[activeVideo];
  const sideVideos = videos.filter((_, i) => i !== activeVideo);
  const dateLabel = rateDate || "";

  return (
    <section className={css.section}>
      <div className={css.inner}>
        {/* Left: Videos */}
        <div className={css.videoBlock}>
          <div className={css.blockHeader}>
            <div className={css.blockHeaderLeft}>
              <span className={css.ytBadge}><YoutubeOutlined /></span>
              <h2 className="section-heading section-heading--left" style={{ marginBottom: 0 }}>
                วิดีโอสหกรณ์
              </h2>
            </div>
            <Link href="/videos" className={css.viewAll}>
              ดูทั้งหมด <RightOutlined />
            </Link>
          </div>

          {/* Main player */}
          <div className={css.player}>
            {currentVideo ? (
              playing ? (
                <div className={css.playerEmbed}>
                  <iframe
                    src={`https://www.youtube.com/embed/${currentVideo.youtubeId}?autoplay=1&rel=0`}
                    title={currentVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className={css.playerThumb} onClick={() => setPlaying(true)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentVideo.thumbnailUrl}
                    alt={currentVideo.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${currentVideo.youtubeId}/mqdefault.jpg`;
                    }}
                  />
                  <div className={css.playerOverlay}>
                    <div className={css.playBtnBig}>
                      <CaretRightOutlined />
                    </div>
                  </div>
                  <div className={css.playerInfo}>
                    <h3 className={css.playerTitle}>{currentVideo.title}</h3>
                    {currentVideo.description && (
                      <p className={css.playerDesc}>{currentVideo.description}</p>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className={css.playerEmpty}>
                <YoutubeOutlined className={css.playerEmptyIcon} />
                <span>ยังไม่มีวิดีโอ</span>
              </div>
            )}
          </div>

          {/* Side video thumbnails */}
          {sideVideos.length > 0 && (
            <div className={css.thumbList}>
              {sideVideos.map((v) => {
                const idx = videos.findIndex((vid) => vid.id === v.id);
                return (
                  <button
                    key={v.id}
                    className={css.thumbItem}
                    onClick={() => { setActiveVideo(idx); setPlaying(false); }}
                  >
                    <div className={css.thumbImg}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`}
                        alt={v.title}
                      />
                      <div className={css.thumbPlayIcon}>
                        <CaretRightOutlined />
                      </div>
                    </div>
                    <span className={css.thumbTitle}>{v.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Interest Rates */}
        <div>
          {depositRates.length > 0 && (
            <div className={css.rateTable}>
              <div className={`${css.rateHeader} ${css.rateHeaderDeposit}`}>
                <span>อัตราดอกเบี้ยเงินฝาก</span>
                {dateLabel && <span className={css.rateDate}>{dateLabel}</span>}
              </div>
              <div className={css.rateBody}>
                {depositRates.map((r) => (
                  <div key={r.id} className={css.rateRow}>
                    <span className={css.rateName}>{r.name}</span>
                    <span className={css.rateValue}>
                      <strong>{r.rate}</strong>
                      <small>%</small>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loanRates.length > 0 && (
            <div className={css.rateTable} style={{ marginTop: 14 }}>
              <div className={`${css.rateHeader} ${css.rateHeaderLoan}`}>
                <span>อัตราดอกเบี้ยเงินกู้</span>
                {dateLabel && <span className={css.rateDate}>{dateLabel}</span>}
              </div>
              <div className={css.rateBody}>
                {loanRates.slice(0, 5).map((r) => (
                  <div key={r.id} className={css.rateRow}>
                    <span className={css.rateName}>{r.name}</span>
                    <span className={css.rateValue}>
                      <strong>{r.rate}</strong>
                      <small>%</small>
                    </span>
                  </div>
                ))}
                {loanRates.length > 5 && (
                  <div className={css.rateRow} style={{ justifyContent: "center", color: "#9ca3af", fontSize: 12 }}>
                    และอีก {loanRates.length - 5} รายการ
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 14 }}>
            <Link href="/interest-rates" className={css.rateViewAll}>
              ดูรายละเอียดทั้งหมด <RightOutlined />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
