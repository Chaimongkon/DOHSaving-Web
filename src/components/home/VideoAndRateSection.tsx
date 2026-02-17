"use client";

import React, { useState } from "react";
import { PlayCircleOutlined, RightOutlined } from "@ant-design/icons";
import Link from "next/link";
import { mockVideos } from "@/data/mockVideos";
import { mockDepositRates, mockLoanRates } from "@/data/mockInterestRates";

const videos = mockVideos.filter((v) => v.isActive).slice(0, 4);

export default function VideoAndRateSection() {
  const [activeVideo, setActiveVideo] = useState(0);

  return (
    <section className="video-rate-section">
      <div className="video-rate-inner">
        {/* Left: Videos */}
        <div className="video-block">
          <div className="video-block-header">
            <h2 className="section-heading" style={{ textAlign: "left", marginBottom: 0 }}>
              วิดีโอสหกรณ์ CO-OP
            </h2>
            <Link href="/videos" className="video-view-all">
              ดูทั้งหมด <RightOutlined />
            </Link>
          </div>

          {/* Active video player */}
          <div className="video-player">
            <div className="video-player-inner">
              <PlayCircleOutlined className="video-player-play" />
              <span className="video-player-title">{videos[activeVideo]?.title}</span>
              <span className="video-player-sub">{videos[activeVideo]?.details}</span>
            </div>
          </div>

          {/* Video list */}
          <div className="video-list">
            {videos.map((v, i) => (
              <button
                key={v.id}
                className={`video-list-item ${i === activeVideo ? "video-list-item--active" : ""}`}
                onClick={() => setActiveVideo(i)}
              >
                <span className="video-list-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="video-list-title">{v.title}</span>
                <PlayCircleOutlined className="video-list-play" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Interest Rates */}
        <div className="rate-block">
          <div className="rate-table">
            <div className="rate-table-header rate-table-header--deposit">
              <span>อัตราดอกเบี้ยเงินฝาก</span>
              <span className="rate-table-date">ณ 1 กันยายน 2568</span>
            </div>
            <div className="rate-table-body">
              {mockDepositRates.map((r) => (
                <div key={r.id} className="rate-row">
                  <span className="rate-name">{r.name}</span>
                  <span className="rate-value">
                    <strong>{r.rate}</strong>
                    <small>%</small>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rate-table" style={{ marginTop: 14 }}>
            <div className="rate-table-header rate-table-header--loan">
              <span>อัตราดอกเบี้ยเงินกู้</span>
              <span className="rate-table-date">ณ 1 กันยายน 2568</span>
            </div>
            <div className="rate-table-body">
              {mockLoanRates.map((r) => (
                <div key={r.id} className="rate-row">
                  <span className="rate-name">{r.name}</span>
                  <span className="rate-value">
                    <strong>{r.rate}</strong>
                    <small>%</small>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 14 }}>
            <Link href="/interest-rates" className="rate-view-all">
              ดูรายละเอียดทั้งหมด <RightOutlined />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
