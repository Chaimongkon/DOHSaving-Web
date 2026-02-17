"use client";

import React, { useRef } from "react";
import { Carousel } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import type { CarouselRef } from "antd/es/carousel";
import Link from "next/link";
import { mockSlides } from "@/data/mockSlides";
import css from "./HeroSlider.module.css";

// Filter only active slides, sorted by sortOrder
const slides = mockSlides
  .filter((item) => item.isActive)
  .sort((a, b) => a.sortOrder - b.sortOrder);

export default function HeroSlider() {
  const carouselRef = useRef<CarouselRef>(null);

  return (
    <div className={css.slider}>
      {/* Navigation arrows */}
      <button
        className={`${css.arrow} ${css.arrowPrev}`}
        onClick={() => carouselRef.current?.prev()}
        aria-label="Previous slide"
      >
        <LeftOutlined />
      </button>
      <button
        className={`${css.arrow} ${css.arrowNext}`}
        onClick={() => carouselRef.current?.next()}
        aria-label="Next slide"
      >
        <RightOutlined />
      </button>

      <Carousel
        ref={carouselRef}
        autoplay
        autoplaySpeed={5000}
        effect="fade"
        dots
      >
        {slides.map((slide) => (
          <div key={slide.id}>
            <div className={css.slide}>
              {/* Background image */}
              {slide.imagePath && (
                <div
                  className={css.slideBg}
                  style={{ backgroundImage: `url(${slide.imagePath})` }}
                />
              )}
              {/* Gradient overlay */}
              <div
                className={css.slideOverlay}
                style={{ background: slide.bgGradient }}
              />

              {/* Content */}
              <div className={css.content}>
                <span className={css.badge}>สหกรณ์ออมทรัพย์กรมทางหลวง</span>
                <h1 className={css.title}>{slide.title}</h1>
                <p className={css.subtitle}>{slide.subtitle}</p>
                <p className={css.desc}>{slide.description}</p>
                {slide.ctaText && slide.urlLink && (
                  <Link href={slide.urlLink} className={css.cta}>
                    {slide.ctaText}
                  </Link>
                )}
              </div>

              {/* Right side decorative element */}
              <div className={css.visual}>
                <div className={css.logoRing}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.svg"
                    alt="โลโก้สหกรณ์"
                    className={css.logoImg}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );
}
