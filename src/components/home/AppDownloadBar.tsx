"use client";

import React from "react";
import {
  DownloadOutlined,
  AppleOutlined,
  AndroidOutlined,
} from "@ant-design/icons";
import css from "./AppDownloadBar.module.css";

export default function AppDownloadBar() {
  return (
    <div className={css.bar}>
      <div className={css.inner}>
        {/* Left: App icon + text */}
        <div className={css.info}>
          <div className={css.icon}>
            <span className={css.iconText}>D</span>
          </div>
          <div>
            <span className={css.name}>
              แอป DOH Saving — <span className={css.highlight}>ใหม่!</span>
            </span>
            <span className={css.desc}>ตรวจยอด ทำธุรกรรม ได้ทุกที่ 24 ชม.</span>
          </div>
        </div>

        {/* Right: Store buttons + CTA */}
        <div className={css.actions}>
          <a href="#download-ios" className={css.store} aria-label="App Store">
            <AppleOutlined />
          </a>
          <a href="#download-android" className={css.store} aria-label="Google Play">
            <AndroidOutlined />
          </a>
          <a href="#download-app" className={css.cta}>
            <DownloadOutlined />
            <span>ดาวน์โหลดแอป</span>
          </a>
        </div>
      </div>
    </div>
  );
}
