import Link from "next/link";
import {
  HomeOutlined,
  SearchOutlined,
  PhoneOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import css from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={css.page}>
      <div className={css.container}>
        {/* Big animated 404 */}
        <p className={css.errorCode}>404</p>

        {/* Decorative icon row */}
        <div className={css.iconRow}>
          <span className={css.iconDot} />
          <span className={css.iconDot} />
          <span className={css.iconCircle}>
            <SearchOutlined />
          </span>
          <span className={css.iconDot} />
          <span className={css.iconDot} />
        </div>

        <h1 className={css.title}>ไม่พบหน้าที่คุณต้องการ</h1>
        <p className={css.desc}>
          หน้านี้อาจถูกย้าย ลบออก หรือ URL ที่ใส่มาอาจไม่ถูกต้อง
          <br />
          ลองตรวจสอบ URL อีกครั้ง หรือกลับไปหน้าหลัก
        </p>

        {/* Action buttons */}
        <div className={css.actions}>
          <Link href="/" className={css.btnPrimary}>
            <HomeOutlined /> กลับหน้าหลัก
          </Link>
          <Link href="/contact" className={css.btnSecondary}>
            <PhoneOutlined /> ติดต่อเรา
          </Link>
        </div>

        {/* Helpful quick links */}
        <div className={css.helpSection}>
          <p className={css.helpTitle}>หน้าที่คุณอาจกำลังมองหา</p>
          <div className={css.helpLinks}>
            <Link href="/news" className={css.helpLink}>
              <FileTextOutlined /> ข่าวสาร
            </Link>
            <Link href="/qna" className={css.helpLink}>
              <QuestionCircleOutlined /> ถาม-ตอบ
            </Link>
            <Link href="/activities" className={css.helpLink}>
              <CameraOutlined /> ภาพกิจกรรม
            </Link>
            <Link href="/interest-rates" className={css.helpLink}>
              <SearchOutlined /> อัตราดอกเบี้ย
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
