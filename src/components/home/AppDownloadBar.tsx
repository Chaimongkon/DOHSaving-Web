"use client";

import React from "react";
import { DownloadOutlined } from "@ant-design/icons";
import css from "./AppDownloadBar.module.css";

export default function AppDownloadBar() {
  return (
    <div className={css.bar}>
      <div className={css.inner}>
        {/* Left: App icon + text */}
        <div className={css.info}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo/logoapp.png"
            alt="DOH Saving App"
            className={css.iconImg}
          />
          <div>
            <span className={css.name}>
              แอป DOH Saving — <span className={css.highlight}>ใหม่!</span>
            </span>
            <span className={css.desc}>ตรวจยอด ทำธุรกรรม ได้ทุกที่ 24 ชม.</span>
          </div>
        </div>

        {/* Right: Store buttons + CTA */}
        <div className={css.actions}>
          <a href="https://apps.apple.com/th/app/id1663748261" className={css.store} target="_blank" aria-label="App Store">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo/AppStore.png" alt="App Store" className={css.storeImg} />
          </a>
          <a href="https://play.google.com/store/apps/details?id=com.dohsaving.mobile" className={css.store} target="_blank" aria-label="Google Play">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo/GooglePlay.png" alt="Google Play" className={css.storeImg} />
          </a>
          <a href="https://appgallery.huawei.com/#/app/C107569233" className={css.store} target="_blank" aria-label="App Gallery">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo/AppGellery.png" alt="App Gallery" className={css.storeImg} />
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
