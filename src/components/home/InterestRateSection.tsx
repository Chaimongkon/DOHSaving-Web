"use client";

import React from "react";
import { RightOutlined } from "@ant-design/icons";
import Link from "next/link";
import { mockDepositRates, mockLoanRates } from "@/data/mockInterestRates";

export default function InterestRateSection() {
  return (
    <section className="rate-section">
      <div className="rate-section-inner">
        <h2 className="section-heading">อัตราดอกเบี้ย</h2>
        <p className="section-subheading">อัตราดอกเบี้ยเงินฝากและเงินกู้ปัจจุบัน</p>

        <div className="rate-tables">
          {/* Deposit */}
          <div className="rate-table">
            <div className="rate-table-header rate-table-header--deposit">
              เงินฝาก
            </div>
            <div className="rate-table-body">
              {mockDepositRates.map((r) => (
                <div key={r.id} className="rate-row">
                  <span className="rate-name">{r.name}</span>
                  <span className="rate-value">
                    <strong>{r.rate}</strong>
                    <small>% {r.note}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Loan */}
          <div className="rate-table">
            <div className="rate-table-header rate-table-header--loan">
              เงินกู้
            </div>
            <div className="rate-table-body">
              {mockLoanRates.map((r) => (
                <div key={r.id} className="rate-row">
                  <span className="rate-name">{r.name}</span>
                  <span className="rate-value">
                    <strong>{r.rate}</strong>
                    <small>% {r.note}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/interest-rates" className="rate-view-all">
            ดูรายละเอียดอัตราดอกเบี้ยทั้งหมด <RightOutlined />
          </Link>
        </div>
      </div>
    </section>
  );
}
