"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Landmark,
  MessageSquareWarning,
  Navigation,
  MessageCircle,
  Users,
} from "lucide-react";
import Image from "next/image";
import css from "./page.module.css";

/* ── Fallback data (used when API unavailable) ── */
const defaultDepartments = [
  { name: "ฝ่ายสินเชื่อ", dohCodes: "27008, 27009, 27010, 27020, 27021", coopExt: "105, 107, 109, 110", mobile: "098-888-3274" },
  { name: "ฝ่ายการเงินและการลงทุน", dohCodes: "27004, 27005, 27006, 27018, 27019", coopExt: "102, 103, 104", mobile: "098-888-4271" },
  { name: "ฝ่ายสมาชิกสัมพันธ์และสวัสดิการ", dohCodes: "27003, 27007, 27017", coopExt: "105, 109, 112", mobile: "098-998-1890" },
  { name: "ฝ่ายทะเบียนหุ้นและกิจการเงินฝาก", dohCodes: "27001, 27012, 27013, 27023, 27024", coopExt: "207, 208, 209, 210, 211, 212", mobile: "098-998-2653" },
  { name: "ฝ่ายบริหารทั่วไป", dohCodes: "27001, 27015, 27097", coopExt: "205, 206", mobile: "061-236-3434" },
  { name: "ฝ่ายบัญชี", dohCodes: "27014, 27022", coopExt: "203, 204", mobile: "" },
];

const defaultLineContacts = [
  { name: "LINE ฝ่ายการเงินและการลงทุน", lineUrl: "https://line.me/ti/p/vFLO1kRR0g" },
  { name: "LINE ฝ่ายสินเชื่อ 1", lineUrl: "https://line.me/ti/p/g8Pp6RF0PU" },
  { name: "LINE ฝ่ายสินเชื่อ 2", lineUrl: "https://line.me/ti/p/l-cisnHSiQ" },
  { name: "LINE ฝ่ายทะเบียนหุ้นและติดตามหนี้สิน", lineUrl: "https://line.me/ti/p/PlckMoqQ04" },
  { name: "LINE ฝ่ายสมาชิกสัมพันธ์และสวัสดิการ", lineUrl: "https://line.me/ti/p/u66nXOIiPr" },
];

const defaultInfo: Record<string, string> = {
  address: "2/486 อาคาร 26\nถนนศรีอยุธยา แขวงทุ่งพญาไท\nเขตราชเทวี กรุงเทพฯ 10400",
  hours: "วันจันทร์ – ศุกร์\n08.30 – 16.30 น.",
  hoursNote: "(ภายใน ปิดทำการเวลา 15.30 น.)",
  phone: "02-245-0668",
  phoneSub1: "02-644-7940-43",
  phoneSub2: "02-644-9243, 02-644-4833",
  email: "dohcoop@hotmail.com",
  lineOfficial: "@dohcoop",
  mainPhone: "02-245-0668",
  fax1: "02-354-6717",
  fax1Note: "ฝ่ายทะเบียนหุ้นฯ, ฝ่ายสินเชื่อ, ฝ่ายบริหารทั่วไป, ฝ่ายบัญชี",
  fax2: "02-644-4825",
  fax2Note: "ฝ่ายการเงินฯ, ฝ่ายสมาชิกฯ, ฝ่ายประจำที่แยกดอนเมืองฯ",
};

interface DeptData { name: string; dohCodes: string | null; coopExt: string | null; mobile: string | null }
interface LineData { name: string; lineUrl: string }

export default function ContactPage() {
  const [info, setInfo] = useState<Record<string, string>>(defaultInfo);
  const [departments, setDepartments] = useState<DeptData[]>(defaultDepartments);
  const [lineContacts, setLineContacts] = useState<LineData[]>(defaultLineContacts);

  useEffect(() => {
    fetch("/api/contact")
      .then((r) => r.json())
      .then((data) => {
        if (data.info && Object.keys(data.info).length > 0) setInfo({ ...defaultInfo, ...data.info });
        if (data.departments?.length) setDepartments(data.departments);
        if (data.lineContacts?.length) setLineContacts(data.lineContacts);
      })
      .catch(() => { /* use fallback */ });
  }, []);
  return (
    <>
      {/* ── Hero ── */}
      <div className={css.hero}>
        <h1 className={css.heroTitle}>ติดต่อสหกรณ์</h1>
        <p className={css.heroSub}>
          ช่องทางการติดต่อสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด
        </p>
      </div>

      <div className={css.content}>
        {/* ── Quick Info Cards ── */}
        <div className={css.infoCards}>
          {/* Address */}
          <div className={css.infoCard}>
            <div className={`${css.infoIcon} ${css.iconAddress}`}>
              <MapPin size={28} />
            </div>
            <p className={css.infoLabel}>ที่อยู่</p>
            <p className={css.infoValue}>
              2/486 อาคาร 26
              <br />
              ถนนศรีอยุธยา แขวงทุ่งพญาไท
              <br />
              เขตราชเทวี กรุงเทพฯ 10400
            </p>
          </div>

          {/* Hours */}
          <div className={css.infoCard}>
            <div className={`${css.infoIcon} ${css.iconHours}`}>
              <Clock size={28} />
            </div>
            <p className={css.infoLabel}>เวลาทำการ</p>
            <p className={css.infoValue}>
              วันจันทร์ – ศุกร์
              <br />
              08.30 – 16.30 น.
            </p>
            <p className={css.infoValueSm}>(ภายใน ปิดทำการเวลา 15.30 น.)</p>
          </div>

          {/* Phone */}
          <div className={css.infoCard}>
            <div className={`${css.infoIcon} ${css.iconPhone}`}>
              <Phone size={28} />
            </div>
            <p className={css.infoLabel}>โทรศัพท์</p>
            <p className={css.infoValue}>
              <a href="tel:022450668" className={css.phoneLink}>02-245-0668</a>
            </p>
            <p className={css.infoValueSm}>
              <a href="tel:026447940" className={css.phoneLink}>02-644-7940-43</a>
            </p>
            <p className={css.infoValueSm}>
              <a href="tel:026449243" className={css.phoneLink}>02-644-9243</a>,{" "}
              <a href="tel:026444833" className={css.phoneLink}>02-644-4833</a>
            </p>
          </div>

          {/* Email */}
          <div className={css.infoCard}>
            <div className={`${css.infoIcon} ${css.iconEmail}`}>
              <Mail size={28} />
            </div>
            <p className={css.infoLabel}>อีเมล</p>
            <p className={css.infoValue}>
              <a
                href="mailto:dohcoop@hotmail.com"
                className={css.contactItemLink}
              >
                dohcoop@hotmail.com
              </a>
            </p>
            <p className={css.infoValueSm}>LINE Official: @dohsaving</p>
          </div>
        </div>

        {/* ── Two-Column Layout ── */}
        <div className={css.twoCol}>
          {/* ── LEFT: Department Table ── */}
          <div className={css.sectionCard}>
            <div className={css.sectionHeader}>
              <div className={css.sectionHeaderIcon} style={{ background: "#0369a1" }}>
                <Users size={18} />
              </div>
              <h2 className={css.sectionHeaderTitle}>หมายเลขติดต่อฝ่ายงาน</h2>
            </div>
            <div className={css.sectionBody}>
              {/* Phone/FAX summary */}
              <div className={css.phoneSection} style={{ marginBottom: 20 }}>
                <div className={css.phoneRow}>
                  <span className={css.phoneLabel}>โทรศัพท์</span>
                  <span>สายตรงกรมทางหลวง <a href="tel:022450668" className={css.phoneLink}>02-245-0668</a> ต่อ สายภายในสหกรณ์</span>
                </div>
                <div className={css.phoneRow}>
                  <span className={css.phoneLabel}>FAX</span>
                  <span>
                    <a href="tel:023546717" className={css.phoneLink}>02-354-6717</a> (ฝ่ายทะเบียนหุ้นฯ, ฝ่ายสินเชื่อ, ฝ่ายบริหารทั่วไป, ฝ่ายบัญชี)
                  </span>
                </div>
                <div className={css.phoneRow}>
                  <span className={css.phoneLabel}>FAX</span>
                  <span>
                    <a href="tel:026444825" className={css.phoneLink}>02-644-4825</a> (ฝ่ายการเงินฯ, ฝ่ายสมาชิกฯ, ฝ่ายประจำที่แยกดอนเมืองฯ)
                  </span>
                </div>
              </div>

              {/* Department cards */}
              <div className={css.deptGrid}>
                {departments.map((dept, i) => (
                  <div key={i} className={css.deptCard}>
                    <div className={css.deptCardHeader}>
                      <span className={css.deptNum}>{i + 1}</span>
                      <span className={css.deptName}>{dept.name}</span>
                    </div>
                    <div className={css.deptCardBody}>
                      <div className={css.deptDetail}>
                        <span className={css.deptDetailLabel}>สายตรง</span>
                        <span className={css.deptDetailValue}>{dept.dohCodes}</span>
                      </div>
                      <div className={css.deptDetail}>
                        <span className={css.deptDetailLabel}>ภายใน</span>
                        <span className={css.deptDetailValue}>{dept.coopExt}</span>
                      </div>
                      {dept.mobile && (
                        <div className={css.deptMobile}>
                          <Phone size={14} />
                          <a href={`tel:${dept.mobile.replace(/-/g, "")}`} className={css.deptMobileLink}>
                            {dept.mobile}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT Column ── */}
          <div className={css.rightCol}>
            {/* LINE Contacts */}
            <div className={css.sectionCard}>
              <div className={css.sectionHeader}>
                <div className={`${css.sectionHeaderIcon} ${css.iconLine}`}>
                  <Image src="/images/logo/Line.png" alt="LINE" width={25} height={25} />
                </div>
                <h2 className={css.sectionHeaderTitle}>ติดต่อทาง LINE</h2>
              </div>
              <div className={css.sectionBody}>
                <ul className={css.lineList}>
                  {lineContacts.map((item, i) => (
                    <li key={i}>
                      <a
                        href={item.lineUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={css.lineItem}
                      >
                        <span className={css.lineIconBadge}>
                          <Image src="/images/logo/Line.png" alt="LINE" width={25} height={25} />
                        </span>
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bank Account Link */}
            <Link href="/bank-accounts" className={css.complaintLink} style={{ background: "linear-gradient(135deg, #faf5ff, #f3e8ff)", borderColor: "#e9d5ff" }}>
              <div className={css.complaintLinkIcon} style={{ background: "#7c3aed" }}>
                <Landmark size={20} />
              </div>
              <div>
                <div className={css.complaintLinkText} style={{ color: "#5b21b6" }}>บัญชีธนาคาร</div>
                <div className={css.complaintLinkSub} style={{ color: "#7c3aed" }}>
                  ดูเลขบัญชีธนาคารทั้ง 7 แห่งสำหรับโอนเงิน
                </div>
              </div>
            </Link>

            {/* Complaint Link */}
            <Link href="/complaints" className={css.complaintLink}>
              <div className={css.complaintLinkIcon}>
                <MessageSquareWarning size={20} />
              </div>
              <div>
                <div className={css.complaintLinkText}>แจ้งข้อเสนอแนะ / ร้องเรียน</div>
                <div className={css.complaintLinkSub}>
                  แจ้งเรื่องร้องเรียนหรือข้อเสนอแนะต่อสหกรณ์
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* ── Google Map ── */}
        <div className={css.mapSection}>
          <iframe
            className={css.mapFrame}
            src="https://maps.google.com/maps?q=%E0%B8%AA%E0%B8%AB%E0%B8%81%E0%B8%A3%E0%B8%93%E0%B9%8C%E0%B8%AD%E0%B8%AD%E0%B8%A1%E0%B8%97%E0%B8%A3%E0%B8%B1%E0%B8%9E%E0%B8%A2%E0%B9%8C%E0%B8%81%E0%B8%A3%E0%B8%A1%E0%B8%97%E0%B8%B2%E0%B8%87%E0%B8%AB%E0%B8%A5%E0%B8%A7%E0%B8%87&t=&z=16&ie=UTF8&iwloc=&output=embed"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="แผนที่สหกรณ์ออมทรัพย์กรมทางหลวง"
          />
          <div className={css.mapInfo}>
            <span className={css.mapAddress}>
              <MapPin size={16} /> สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด — 2/486 อาคาร 26 ถนนศรีอยุธยา กรุงเทพฯ 10400
            </span>
            <a
              href="https://maps.google.com/?q=สหกรณ์ออมทรัพย์กรมทางหลวง"
              target="_blank"
              rel="noopener noreferrer"
              className={css.mapDirectionLink}
            >
              <Navigation size={14} /> นำทาง
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
