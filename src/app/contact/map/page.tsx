"use client";

import Link from "next/link";
import {
  MapPin,
  Navigation,
  Clock,
  Phone,
  Car,
  TrainFront,
  Bus,
  Building2,
  Hospital,
  Landmark,
  ShoppingBag,
  TreePine,
  Copy,
  ExternalLink,
  Info,
} from "lucide-react";
import css from "./page.module.css";

export default function MapPage() {
  const copyAddress = () => {
    navigator.clipboard.writeText(
      "2/486 อาคาร 26 ถนนศรีอยุธยา แขวงทุ่งพญาไท เขตราชเทวี กรุงเทพฯ 10400"
    );
    alert("คัดลอกที่อยู่แล้ว");
  };

  return (
    <>
      {/* ── Hero ── */}
      <div className={css.hero}>
        <h1 className={css.heroTitle}>แผนที่ / การเดินทาง</h1>
        <p className={css.heroSub}>
          ตำแหน่งสหกรณ์ออมทรัพย์กรมทางหลวง จำกัด และวิธีการเดินทาง
        </p>
      </div>

      <div className={css.content}>
        {/* ── Map ── */}
        <div className={css.mapContainer}>
          <iframe
            className={css.mapFrame}
            src="https://maps.google.com/maps?q=%E0%B8%AA%E0%B8%AB%E0%B8%81%E0%B8%A3%E0%B8%93%E0%B9%8C%E0%B8%AD%E0%B8%AD%E0%B8%A1%E0%B8%97%E0%B8%A3%E0%B8%B1%E0%B8%9E%E0%B8%A2%E0%B9%8C%E0%B8%81%E0%B8%A3%E0%B8%A1%E0%B8%97%E0%B8%B2%E0%B8%87%E0%B8%AB%E0%B8%A5%E0%B8%A7%E0%B8%87&t=&z=16&ie=UTF8&iwloc=&output=embed"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="แผนที่สหกรณ์ออมทรัพย์กรมทางหลวง"
          />
          <div className={css.mapBar}>
            <span className={css.mapAddress}>
              <MapPin size={16} />
              สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด — 2/486 อาคาร 26 ถนนศรีอยุธยา กรุงเทพฯ 10400
            </span>
            <div className={css.mapActions}>
              <button onClick={copyAddress} className={`${css.btnDirection} ${css.btnSecondary}`}>
                <Copy size={14} /> คัดลอกที่อยู่
              </button>
              <a
                href="https://maps.google.com/?q=สหกรณ์ออมทรัพย์กรมทางหลวง"
                target="_blank"
                rel="noopener noreferrer"
                className={`${css.btnDirection} ${css.btnPrimary}`}
              >
                <Navigation size={14} /> เปิด Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* ── Info Cards ── */}
        <div className={css.infoGrid}>
          {/* Address */}
          <div className={css.card}>
            <div className={css.cardHeader}>
              <div className={css.cardIcon} style={{ background: "linear-gradient(135deg, #FF9F43, #E8652B)" }}>
                <MapPin size={22} />
              </div>
              <h3 className={css.cardTitle}>ที่อยู่สหกรณ์</h3>
            </div>
            <div className={css.cardBody}>
              <p className={css.cardText}>
                <strong>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด</strong><br />
                2/486 อาคาร 26 (อาคารเดียวกับกรมทางหลวง)<br />
                ถนนศรีอยุธยา แขวงทุ่งพญาไท<br />
                เขตราชเทวี กรุงเทพฯ 10400
              </p>
            </div>
          </div>

          {/* Hours */}
          <div className={css.card}>
            <div className={css.cardHeader}>
              <div className={css.cardIcon} style={{ background: "linear-gradient(135deg, #2ECC71, #16a34a)" }}>
                <Clock size={22} />
              </div>
              <h3 className={css.cardTitle}>เวลาทำการ</h3>
            </div>
            <div className={css.cardBody}>
              <p className={css.cardText}>
                <strong>วันจันทร์ – ศุกร์</strong><br />
                08.30 – 16.30 น.<br />
                (ภายใน ปิดทำการเวลา 15.30 น.)<br /><br />
                <strong>หยุด</strong> วันเสาร์ – อาทิตย์ และวันหยุดนักขัตฤกษ์
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className={css.card}>
            <div className={css.cardHeader}>
              <div className={css.cardIcon} style={{ background: "linear-gradient(135deg, #54A0FF, #0369a1)" }}>
                <Phone size={22} />
              </div>
              <h3 className={css.cardTitle}>โทรศัพท์</h3>
            </div>
            <div className={css.cardBody}>
              <p className={css.cardText}>
                <strong>สายตรง:</strong> <a href="tel:022450668" style={{ color: "#0369a1", textDecoration: "none", fontWeight: 600 }}>02-245-0668</a><br />
                <strong>สายอื่น:</strong> 02-644-7940-43<br />
                02-644-9243, 02-644-4833<br />
                <strong>FAX:</strong> 02-354-6717, 02-644-4825
              </p>
            </div>
          </div>
        </div>

        {/* ── Transport Options ── */}
        <div className={css.transportGrid}>
          {/* By Car */}
          <div className={css.transportCard}>
            <div className={css.transportHeader}>
              <div className={css.transportIcon} style={{ background: "linear-gradient(135deg, #FF6B6B, #ee5a24)" }}>
                <Car size={24} />
              </div>
              <div>
                <h3 className={css.transportTitle}>รถยนต์ส่วนตัว</h3>
                <p className={css.transportSub}>ขับรถมาเอง</p>
              </div>
            </div>
            <ol className={css.transportSteps}>
              <li className={css.transportStep}>
                <span className={css.stepNum} style={{ background: "#ee5a24" }}>1</span>
                <span className={css.stepText}>จากทางด่วนศรีรัช ลงทางออก <strong>พญาไท / ราชเทวี</strong></span>
              </li>
              <li className={css.transportStep}>
                <span className={css.stepNum} style={{ background: "#ee5a24" }}>2</span>
                <span className={css.stepText}>ขับตรงมาตาม <strong>ถนนศรีอยุธยา</strong> มุ่งหน้าทิศตะวันออก</span>
              </li>
              <li className={css.transportStep}>
                <span className={css.stepNum} style={{ background: "#ee5a24" }}>3</span>
                <span className={css.stepText}><strong>อาคารกรมทางหลวง</strong> อยู่ด้านซ้ายมือ — สหกรณ์อยู่อาคาร 26</span>
              </li>
              <li className={css.transportStep}>
                <span className={css.stepNum} style={{ background: "#ee5a24" }}>4</span>
                <span className={css.stepText}>มีลานจอดรถกรมทางหลวง สามารถจอดได้ภายในบริเวณ</span>
              </li>
            </ol>
          </div>

          {/* By BTS */}
          <div className={css.transportCard}>
            <div className={css.transportHeader}>
              <div className={css.transportIcon} style={{ background: "linear-gradient(135deg, #45B649, #1B8A3D)" }}>
                <TrainFront size={24} />
              </div>
              <div>
                <h3 className={css.transportTitle}>รถไฟฟ้า BTS / ARL</h3>
                <p className={css.transportSub}>ระบบขนส่งมวลชน</p>
              </div>
            </div>
            <ol className={css.transportSteps}>
              <li className={css.transportStep}>
                <span className={css.stepNum} style={{ background: "#1B8A3D" }}>1</span>
                <span className={css.stepText}>BTS สายสุขุมวิท ลงสถานี <strong>พญาไท (N2)</strong></span>
              </li>
              <li className={css.transportStep}>
                <span className={css.stepNum} style={{ background: "#1B8A3D" }}>2</span>
                <span className={css.stepText}>หรือ Airport Rail Link ลงสถานี <strong>พญาไท</strong></span>
              </li>
              <li className={css.transportStep}>
                <span className={css.stepNum} style={{ background: "#1B8A3D" }}>3</span>
                <span className={css.stepText}>ออกทางออก 4 เดินมาตาม <strong>ถนนศรีอยุธยา</strong> ประมาณ 800 ม.</span>
              </li>
              <li className={css.transportStep}>
                <span className={css.stepNum} style={{ background: "#1B8A3D" }}>4</span>
                <span className={css.stepText}>หรือต่อ <strong>รถจักรยานยนต์รับจ้าง / แท็กซี่</strong> ประมาณ 3 นาที</span>
              </li>
            </ol>
          </div>

          {/* By Bus */}
          <div className={css.transportCard}>
            <div className={css.transportHeader}>
              <div className={css.transportIcon} style={{ background: "linear-gradient(135deg, #FDA085, #f5576c)" }}>
                <Bus size={24} />
              </div>
              <div>
                <h3 className={css.transportTitle}>รถโดยสารประจำทาง</h3>
                <p className={css.transportSub}>รถเมล์สาย ขสมก.</p>
              </div>
            </div>
            <ol className={css.transportSteps}>
              <li className={css.transportStep}>
                <span className={css.stepNum} style={{ background: "#f5576c" }}>1</span>
                <span className={css.stepText}>สายที่ผ่านถนนศรีอยุธยา: <strong>สาย 14, 72, 97</strong></span>
              </li>
              <li className={css.transportStep}>
                <span className={css.stepNum} style={{ background: "#f5576c" }}>2</span>
                <span className={css.stepText}>ลงป้ายรถเมล์ <strong>กรมทางหลวง</strong></span>
              </li>
              <li className={css.transportStep}>
                <span className={css.stepNum} style={{ background: "#f5576c" }}>3</span>
                <span className={css.stepText}>เดินเข้าไปในบริเวณกรมทางหลวง ไปที่ <strong>อาคาร 26</strong></span>
              </li>
            </ol>
          </div>

          {/* By Taxi */}
          <div className={css.transportCard}>
            <div className={css.transportHeader}>
              <div className={css.transportIcon} style={{ background: "linear-gradient(135deg, #F7971E, #FFD200)" }}>
                <Car size={24} />
              </div>
              <div>
                <h3 className={css.transportTitle}>แท็กซี่ / Grab</h3>
                <p className={css.transportSub}>บริการเรียกรถ</p>
              </div>
            </div>
            <ol className={css.transportSteps}>
              <li className={css.transportStep}>
                <span className={css.stepNum} style={{ background: "#F7971E" }}>1</span>
                <span className={css.stepText}>แจ้งปลายทาง <strong>&quot;กรมทางหลวง ถนนศรีอยุธยา&quot;</strong></span>
              </li>
              <li className={css.transportStep}>
                <span className={css.stepNum} style={{ background: "#F7971E" }}>2</span>
                <span className={css.stepText}>หรือค้นหาใน Grab/Bolt: <strong>&quot;สหกรณ์ออมทรัพย์กรมทางหลวง&quot;</strong></span>
              </li>
              <li className={css.transportStep}>
                <span className={css.stepNum} style={{ background: "#F7971E" }}>3</span>
                <span className={css.stepText}>ลงที่ประตูทางเข้ากรมทางหลวง เดินเข้าไปอาคาร 26</span>
              </li>
            </ol>
          </div>
        </div>

        {/* ── Nearby Landmarks ── */}
        <div className={css.landmarkSection}>
          <h3 className={css.landmarkTitle}>
            <Info size={18} /> สถานที่ใกล้เคียง
          </h3>
          <div className={css.landmarkGrid}>
            <div className={css.landmark}>
              <div className={css.landmarkIcon}><Building2 size={16} /></div>
              <div>
                <div className={css.landmarkName}>กรมทางหลวง</div>
                <span className={css.landmarkDist}>อาคารเดียวกัน</span>
              </div>
            </div>
            <div className={css.landmark}>
              <div className={css.landmarkIcon}><TrainFront size={16} /></div>
              <div>
                <div className={css.landmarkName}>BTS พญาไท</div>
                <span className={css.landmarkDist}>~800 ม.</span>
              </div>
            </div>
            <div className={css.landmark}>
              <div className={css.landmarkIcon}><Hospital size={16} /></div>
              <div>
                <div className={css.landmarkName}>รพ. พญาไท 1</div>
                <span className={css.landmarkDist}>~500 ม.</span>
              </div>
            </div>
            <div className={css.landmark}>
              <div className={css.landmarkIcon}><Hospital size={16} /></div>
              <div>
                <div className={css.landmarkName}>รพ. ราชวิถี</div>
                <span className={css.landmarkDist}>~1 กม.</span>
              </div>
            </div>
            <div className={css.landmark}>
              <div className={css.landmarkIcon}><Landmark size={16} /></div>
              <div>
                <div className={css.landmarkName}>อนุสาวรีย์ชัยฯ</div>
                <span className={css.landmarkDist}>~1.5 กม.</span>
              </div>
            </div>
            <div className={css.landmark}>
              <div className={css.landmarkIcon}><ShoppingBag size={16} /></div>
              <div>
                <div className={css.landmarkName}>Century The Movie Plaza</div>
                <span className={css.landmarkDist}>~700 ม.</span>
              </div>
            </div>
            <div className={css.landmark}>
              <div className={css.landmarkIcon}><TreePine size={16} /></div>
              <div>
                <div className={css.landmarkName}>สวนสันติภาพ</div>
                <span className={css.landmarkDist}>~800 ม.</span>
              </div>
            </div>
            <div className={css.landmark}>
              <div className={css.landmarkIcon}><Building2 size={16} /></div>
              <div>
                <div className={css.landmarkName}>ตึกช้าง</div>
                <span className={css.landmarkDist}>~1.2 กม.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Contact ── */}
        <div className={css.quickContact}>
          <div className={css.quickContactText}>
            <h3 className={css.quickContactTitle}>ต้องการความช่วยเหลือ?</h3>
            <p className={css.quickContactSub}>
              สอบถามเส้นทางหรือข้อมูลเพิ่มเติม สามารถติดต่อสหกรณ์ได้ทุกวันทำการ
            </p>
          </div>
          <div className={css.quickContactActions}>
            <a href="tel:022450668" className={`${css.quickBtn} ${css.quickBtnPhone}`}>
              <Phone size={16} /> โทร 02-245-0668
            </a>
            <Link href="/contact" className={`${css.quickBtn} ${css.quickBtnContact}`}>
              <ExternalLink size={14} /> ดูข้อมูลติดต่อทั้งหมด
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
