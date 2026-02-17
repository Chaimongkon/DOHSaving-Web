"use client";

import React, { useRef, useState, useEffect } from "react";
import { Carousel } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import type { CarouselRef } from "antd/es/carousel";
import Link from "next/link";
import { mockSlides, type SlideData } from "@/data/mockSlides";
import css from "./HeroSlider.module.css";

// Fallback mock — ใช้ขณะที่ DB ยังไม่มีข้อมูล
const fallbackSlides = mockSlides
  .filter((item) => item.isActive)
  .sort((a, b) => a.sortOrder - b.sortOrder);

export default function HeroSlider() {
  const carouselRef = useRef<CarouselRef>(null);
  const [slides, setSlides] = useState<SlideData[]>(fallbackSlides);

  useEffect(() => {
    fetch("/api/slides")
      .then((res) => res.json())
      .then((data: SlideData[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setSlides(data);
        }
      })
      .catch(() => {});
  }, []);

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
              {/* Full-width image — แสดงเต็มตามสัดส่วนจริง */}
              {slide.imagePath && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slide.imagePath}
                  alt={slide.title || `Slide ${slide.sortOrder}`}
                  className={css.slideImg}
                  draggable={false}
                />
              )}

              {/* Gradient overlay */}
              {slide.bgGradient && (
                <div
                  className={css.slideOverlay}
                  style={{ background: slide.bgGradient }}
                />
              )}

              {/* Content — แสดงเมื่อมี title */}
              {slide.title && (
                <div className={css.content}>
                  <span className={css.badge}>สหกรณ์ออมทรัพย์กรมทางหลวง</span>
                  <h1 className={css.title}>{slide.title}</h1>
                  {slide.subtitle && <p className={css.subtitle}>{slide.subtitle}</p>}
                  {slide.description && <p className={css.desc}>{slide.description}</p>}
                  {slide.ctaText && slide.urlLink && (
                    <Link href={slide.urlLink} className={css.cta}>
                      {slide.ctaText}
                    </Link>
                  )}
                </div>
              )}

              {/* Right side decorative element — แสดงเมื่อมี title */}
              {slide.title && (
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
              )}
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );
}
