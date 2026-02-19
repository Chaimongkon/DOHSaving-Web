"use client";

import React, { useState, useEffect } from "react";
import { PlayCircleOutlined, RightOutlined } from "@ant-design/icons";
import Link from "next/link";
import { mockVideos } from "@/data/mockVideos";
import { mockDepositRates, mockLoanRates } from "@/data/mockInterestRates";
import css from "./VideoAndRateSection.module.css";

interface ApiRate {
  id: number;
  interestType: string | null;
  name: string | null;
  interestDate: string | null;
  interestRate: string | null;
}

const videos = mockVideos.filter((v) => v.isActive).slice(0, 4);

export default function VideoAndRateSection() {
  const [activeVideo, setActiveVideo] = useState(0);
  const [depositRates, setDepositRates] = useState<{ id: number; name: string; rate: string }[]>([]);
  const [loanRates, setLoanRates] = useState<{ id: number; name: string; rate: string }[]>([]);
  const [rateDate, setRateDate] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

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
        setLoaded(true);
      })
      .catch(() => {
        // Fallback to mock data
        setDepositRates(mockDepositRates.map((r) => ({ id: r.id, name: r.name, rate: r.rate })));
        setLoanRates(mockLoanRates.map((r) => ({ id: r.id, name: r.name, rate: r.rate })));
        setLoaded(true);
      });
  }, []);

  const dateLabel = rateDate || "ณ 1 กันยายน 2568";

  return (
    <section className={css.section}>
      <div className={css.inner}>
        {/* Left: Videos */}
        <div>
          <div className={css.blockHeader}>
            <h2 className="section-heading section-heading--left" style={{ marginBottom: 0 }}>
              วิดีโอสหกรณ์ CO-OP
            </h2>
            <Link href="/videos" className={css.viewAll}>
              ดูทั้งหมด <RightOutlined />
            </Link>
          </div>

          {/* Active video player */}
          <div className={css.player}>
            <div className={css.playerInner}>
              <PlayCircleOutlined className={css.playerPlay} />
              <span className={css.playerTitle}>{videos[activeVideo]?.title}</span>
              <span className={css.playerSub}>{videos[activeVideo]?.details}</span>
            </div>
          </div>

          {/* Video list */}
          <div className={css.list}>
            {videos.map((v, i) => (
              <button
                key={v.id}
                className={`${css.listItem} ${i === activeVideo ? css.listItemActive : ""}`}
                onClick={() => setActiveVideo(i)}
              >
                <span className={css.listNum}>{String(i + 1).padStart(2, "0")}</span>
                <span className={css.listTitle}>{v.title}</span>
                <PlayCircleOutlined className={css.listPlay} />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Interest Rates */}
        <div>
          <div className={css.rateTable}>
            <div className={`${css.rateHeader} ${css.rateHeaderDeposit}`}>
              <span>อัตราดอกเบี้ยเงินฝาก</span>
              <span className={css.rateDate}>{dateLabel}</span>
            </div>
            <div className={css.rateBody}>
              {(loaded ? depositRates : mockDepositRates.map((r) => ({ id: r.id, name: r.name, rate: r.rate }))).map((r) => (
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

          <div className={css.rateTable} style={{ marginTop: 14 }}>
            <div className={`${css.rateHeader} ${css.rateHeaderLoan}`}>
              <span>อัตราดอกเบี้ยเงินกู้</span>
              <span className={css.rateDate}>{dateLabel}</span>
            </div>
            <div className={css.rateBody}>
              {(loaded ? loanRates : mockLoanRates.map((r) => ({ id: r.id, name: r.name, rate: r.rate }))).map((r) => (
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
