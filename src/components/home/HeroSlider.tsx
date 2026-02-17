"use client";

import React, { useRef } from "react";
import { Carousel } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import type { CarouselRef } from "antd/es/carousel";
import Link from "next/link";
import { mockSlides } from "@/data/mockSlides";

// Filter only active slides, sorted by sortOrder
const slides = mockSlides
  .filter((s) => s.isActive)
  .sort((a, b) => a.sortOrder - b.sortOrder);

export default function HeroSlider() {
  const carouselRef = useRef<CarouselRef>(null);

  return (
    <div className="hero-slider">
      {/* Navigation arrows */}
      <button
        className="hero-slider-arrow hero-slider-arrow--prev"
        onClick={() => carouselRef.current?.prev()}
        aria-label="Previous slide"
      >
        <LeftOutlined />
      </button>
      <button
        className="hero-slider-arrow hero-slider-arrow--next"
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
        dots={{ className: "hero-slider-dots" }}
      >
        {slides.map((slide) => (
          <div key={slide.id}>
            <div className="hero-slide">
              {/* Background image */}
              {slide.imagePath && (
                <div
                  className="hero-slide-bg"
                  style={{ backgroundImage: `url(${slide.imagePath})` }}
                />
              )}
              {/* Gradient overlay */}
              <div
                className="hero-slide-overlay"
                style={{ background: slide.bgGradient }}
              />

              {/* Content */}
              <div className="hero-slide-content">
                <span className="hero-slide-badge">สหกรณ์ออมทรัพย์กรมทางหลวง</span>
                <h1 className="hero-slide-title">{slide.title}</h1>
                <p className="hero-slide-subtitle">{slide.subtitle}</p>
                <p className="hero-slide-desc">{slide.description}</p>
                {slide.ctaText && slide.urlLink && (
                  <Link href={slide.urlLink} className="hero-slide-cta">
                    {slide.ctaText}
                  </Link>
                )}
              </div>

              {/* Right side decorative element */}
              <div className="hero-slide-visual">
                <div className="hero-slide-logo-ring">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.svg"
                    alt="โลโก้สหกรณ์"
                    className="hero-slide-logo-img"
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
