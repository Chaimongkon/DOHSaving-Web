"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import css from "./ThaiDatePicker.module.css";

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const THAI_SHORT_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.",
  "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.",
  "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

interface ThaiDatePickerProps {
  value: string; // "YYYY-MM-DD" CE format
  onChange: (value: string) => void;
  placeholder?: string;
}

function toBE(ceYear: number) {
  return ceYear + 543;
}

function toCE(beYear: number) {
  return beYear - 543;
}

/** Format "YYYY-MM-DD" to Thai display */
function formatThai(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${d} ${THAI_SHORT_MONTHS[m - 1]} ${toBE(y)}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export default function ThaiDatePicker({ value, onChange, placeholder }: ThaiDatePickerProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Current view month/year (CE)
  const today = new Date();
  const initYear = value ? parseInt(value.slice(0, 4)) : today.getFullYear();
  const initMonth = value ? parseInt(value.slice(5, 7)) - 1 : today.getMonth();
  const [viewYear, setViewYear] = useState(initYear);
  const [viewMonth, setViewMonth] = useState(initMonth);

  // Sync view to value when opening
  useEffect(() => {
    if (open && value) {
      setViewYear(parseInt(value.slice(0, 4)));
      setViewMonth(parseInt(value.slice(5, 7)) - 1);
    }
  }, [open, value]);

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const selectDay = useCallback(
    (year: number, month: number, day: number) => {
      onChange(`${year}-${pad2(month + 1)}-${pad2(day)}`);
      setOpen(false);
    },
    [onChange]
  );

  const selectToday = useCallback(() => {
    const t = new Date();
    selectDay(t.getFullYear(), t.getMonth(), t.getDate());
  }, [selectDay]);

  // Build calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const cells: { day: number; month: number; year: number; isOther: boolean }[] = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    cells.push({ day: d, month: m, year: y, isOther: true });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: viewMonth, year: viewYear, isOther: false });
  }

  // Next month leading days
  const remaining = totalCells - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    cells.push({ day: d, month: m, year: y, isOther: true });
  }

  // Selected date string
  const selectedStr = value || "";
  const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

  // Year options for dropdown (BE)
  const yearOptions: number[] = [];
  for (let y = today.getFullYear() - 5; y <= today.getFullYear() + 10; y++) {
    yearOptions.push(y);
  }

  return (
    <div className={css.wrap} ref={wrapRef}>
      <button
        type="button"
        className={`${css.trigger} ${open ? css.triggerOpen : ""}`}
        onClick={() => setOpen(!open)}
      >
        <span className={css.triggerIcon}>📅</span>
        <span className={css.triggerText}>
          {value ? (
            formatThai(value)
          ) : (
            <span className={css.placeholder}>{placeholder || "เลือกวันที่"}</span>
          )}
        </span>
        {value && (
          <span
            className={css.clearBtn}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            title="ล้าง"
          >
            ✕
          </span>
        )}
      </button>

      {open && (
        <>
          <div className={css.backdrop} onClick={() => setOpen(false)} />
          <div className={css.dropdown}>
            {/* Nav */}
            <div className={css.nav}>
              <button type="button" className={css.navBtn} onClick={prevMonth}>
                ‹
              </button>
              <div className={css.navCenter}>
                <select
                  className={css.navSelect}
                  value={viewMonth}
                  onChange={(e) => setViewMonth(parseInt(e.target.value))}
                >
                  {THAI_MONTHS.map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
                <select
                  className={css.navSelect}
                  value={viewYear}
                  onChange={(e) => setViewYear(parseInt(e.target.value))}
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {toBE(y)}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" className={css.navBtn} onClick={nextMonth}>
                ›
              </button>
            </div>

            {/* Weekdays */}
            <div className={css.weekdays}>
              {WEEKDAYS.map((w) => (
                <div key={w} className={css.weekday}>{w}</div>
              ))}
            </div>

            {/* Days */}
            <div className={css.days}>
              {cells.map((cell, i) => {
                const cellStr = `${cell.year}-${pad2(cell.month + 1)}-${pad2(cell.day)}`;
                const isToday = cellStr === todayStr;
                const isSelected = cellStr === selectedStr;
                return (
                  <button
                    key={i}
                    type="button"
                    className={[
                      css.day,
                      cell.isOther ? css.dayOther : "",
                      isToday ? css.dayToday : "",
                      isSelected ? css.daySelected : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => selectDay(cell.year, cell.month, cell.day)}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {/* Today shortcut */}
            <button type="button" className={css.todayBtn} onClick={selectToday}>
              วันนี้ — {formatThai(todayStr)}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
