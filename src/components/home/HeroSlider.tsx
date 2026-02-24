"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Carousel } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import type { CarouselRef } from "antd/es/carousel";
import Link from "next/link";
import { type SlideData } from "@/data/mockSlides";
import css from "./HeroSlider.module.css";

export default function HeroSlider() {
  const carouselRef = useRef<CarouselRef>(null);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [current, setCurrent] = useState(0);

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

  const handleBeforeChange = useCallback((_from: number, to: number) => {
    setCurrent(to);
  }, []);

  // Render slide inner content
  const renderSlideInner = (slide: SlideData) => (
    <>
      {/* Full-width image */}
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
          <h1 className={css.title}>{slide.title}</h1>
          {slide.subtitle && <p className={css.subtitle}>{slide.subtitle}</p>}
          {slide.description && <p className={css.desc}>{slide.description}</p>}
          {slide.ctaText && slide.urlLink && (
            <Link
              href={slide.urlLink}
              className={css.cta}
              onClick={(e) => e.stopPropagation()}
            >
              {slide.ctaText}
            </Link>
          )}
        </div>
      )}
    </>
  );

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

      {/* Slide counter */}
      {slides.length > 1 && (
        <div className={css.counter}>
          {current + 1} / {slides.length}
        </div>
      )}

      <Carousel
        ref={carouselRef}
        autoplay
        autoplaySpeed={5000}
        effect="fade"
        dots
        pauseOnHover
        beforeChange={handleBeforeChange}
      >
        {slides.map((slide) => (
          <div key={slide.id}>
            {/* ถ้ามี urlLink แต่ไม่มี title (ไม่มี CTA ข้างใน) — ครอบทั้ง slide เป็น link */}
            {slide.urlLink && !slide.title ? (
              <Link href={slide.urlLink} className={css.slideLink}>
                <div className={css.slide}>
                  {renderSlideInner(slide)}
                </div>
              </Link>
            ) : (
              /* ถ้ามี title (มี CTA link ข้างใน) หรือไม่มี urlLink — ไม่ครอบ link */
              <div className={css.slide}>
                {renderSlideInner(slide)}
              </div>
            )}
          </div>
        ))}
      </Carousel>
    </div>
  );
}
