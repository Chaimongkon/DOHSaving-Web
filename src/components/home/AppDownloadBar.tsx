"use client";

import React from "react";
import {
  DownloadOutlined,
  AppleOutlined,
  AndroidOutlined,
} from "@ant-design/icons";

export default function AppDownloadBar() {
  return (
    <div className="app-bar">
      <div className="app-bar-inner">
        {/* Left: App icon + text */}
        <div className="app-bar-info">
          <div className="app-bar-icon">
            <span className="app-bar-icon-text">D</span>
          </div>
          <div>
            <span className="app-bar-name">
              แอป DOH Saving — <span className="app-bar-name-highlight">ใหม่!</span>
            </span>
            <span className="app-bar-desc">ตรวจยอด ทำธุรกรรม ได้ทุกที่ 24 ชม.</span>
          </div>
        </div>

        {/* Right: Store buttons + CTA */}
        <div className="app-bar-actions">
          <a href="#download-ios" className="app-bar-store" aria-label="App Store">
            <AppleOutlined />
          </a>
          <a href="#download-android" className="app-bar-store" aria-label="Google Play">
            <AndroidOutlined />
          </a>
          <a href="#download-app" className="app-bar-cta">
            <DownloadOutlined />
            <span>ดาวน์โหลดแอป</span>
          </a>
        </div>
      </div>
    </div>
  );
}
