"use client";

import React, { useCallback } from "react";
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

export default function CookiePolicyPage() {
  const handleManageCookies = useCallback(() => {
    // ลบ cookie_consent เพื่อให้ banner แสดงใหม่
    document.cookie = "cookie_consent=; path=/; max-age=0";
    window.location.reload();
  }, []);

  return (
    <div className={css.container}>
      <h1 className={css.title}>นโยบายคุกกี้ (Cookie Policy)</h1>
      <p className={css.updated}>อัปเดตล่าสุด: 18 กุมภาพันธ์ 2569</p>

      {/* What are cookies */}
      <div className={css.section}>
        <h2 className={css.sectionTitle}>คุกกี้คืออะไร?</h2>
        <p className={css.text}>
          คุกกี้ (Cookies) คือไฟล์ข้อมูลขนาดเล็กที่เว็บไซต์จะจัดเก็บไว้ในอุปกรณ์ของคุณ
          (คอมพิวเตอร์ แท็บเล็ต หรือสมาร์ทโฟน) เมื่อคุณเข้าเยี่ยมชมเว็บไซต์
          คุกกี้ช่วยให้เว็บไซต์จดจำข้อมูลการเข้าชมของคุณ เช่น การตั้งค่าภาษา
          และทำให้การเข้าชมครั้งถัดไปสะดวกยิ่งขึ้น
        </p>
      </div>

      {/* Why we use cookies */}
      <div className={css.section}>
        <h2 className={css.sectionTitle}>ทำไมเราจึงใช้คุกกี้?</h2>
        <p className={css.text}>
          สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด ใช้คุกกี้เพื่อวัตถุประสงค์ดังต่อไปนี้:
        </p>
        <ul className={css.list}>
          <li>เพื่อให้เว็บไซต์ทำงานได้อย่างถูกต้องและปลอดภัย</li>
          <li>เพื่อจดจำการตั้งค่าและความชอบของผู้ใช้</li>
          <li>เพื่อวิเคราะห์การใช้งานเว็บไซต์และปรับปรุงการให้บริการ</li>
          <li>เพื่อนำเสนอเนื้อหาและข้อมูลที่เกี่ยวข้องกับความต้องการของผู้ใช้</li>
        </ul>
      </div>

      {/* Types of cookies */}
      <div className={css.section}>
        <h2 className={css.sectionTitle}>ประเภทของคุกกี้ที่เราใช้</h2>
        <table className={css.table}>
          <thead>
            <tr>
              <th>ประเภท</th>
              <th>คำอธิบาย</th>
              <th>ระยะเวลา</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>คุกกี้ที่จำเป็น</strong></td>
              <td>
                จำเป็นสำหรับการทำงานพื้นฐานของเว็บไซต์ เช่น ระบบล็อกอิน การจำสถานะเซสชัน
                ความปลอดภัย CSRF
              </td>
              <td>เซสชัน / 1 ปี</td>
              <td>
                <span className={`${css.badge} ${css.badgeRequired}`}>จำเป็น</span>
              </td>
            </tr>
            <tr>
              <td><strong>คุกกี้วิเคราะห์</strong></td>
              <td>
                เก็บข้อมูลสถิติการเข้าชมเว็บไซต์ เช่น จำนวนผู้เข้าชม หน้าที่ได้รับความนิยม
                เพื่อปรับปรุงการให้บริการ
              </td>
              <td>1 ปี</td>
              <td>
                <span className={`${css.badge} ${css.badgeOptional}`}>เลือกได้</span>
              </td>
            </tr>
            <tr>
              <td><strong>คุกกี้การตลาด</strong></td>
              <td>
                ใช้ติดตามพฤติกรรมการเข้าชมเว็บไซต์เพื่อนำเสนอโฆษณาและเนื้อหาที่เหมาะสมกับผู้ใช้
              </td>
              <td>6 เดือน</td>
              <td>
                <span className={`${css.badge} ${css.badgeOptional}`}>เลือกได้</span>
              </td>
            </tr>
            <tr>
              <td><strong>คุกกี้การตั้งค่า</strong></td>
              <td>
                จดจำการตั้งค่าของผู้ใช้ เช่น ภาษาที่เลือก ขนาดตัวอักษร ธีมสีของเว็บไซต์
              </td>
              <td>1 ปี</td>
              <td>
                <span className={`${css.badge} ${css.badgeOptional}`}>เลือกได้</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Managing cookies */}
      <div className={css.section}>
        <h2 className={css.sectionTitle}>การจัดการคุกกี้</h2>
        <p className={css.text}>
          คุณสามารถจัดการความยินยอมคุกกี้ได้ตลอดเวลาผ่านปุ่มด้านล่าง
          หรือตั้งค่าในเบราว์เซอร์ของคุณ โปรดทราบว่าการปิดใช้งานคุกกี้บางประเภท
          อาจส่งผลต่อประสบการณ์การใช้งานเว็บไซต์
        </p>
        <button className={css.btnManage} onClick={handleManageCookies}>
          <SettingOutlined /> ตั้งค่าคุกกี้ใหม่
        </button>
      </div>

      {/* Browser settings */}
      <div className={css.section}>
        <h2 className={css.sectionTitle}>การตั้งค่าคุกกี้ผ่านเบราว์เซอร์</h2>
        <p className={css.text}>
          คุณสามารถตั้งค่าการใช้คุกกี้ผ่านการตั้งค่าของเบราว์เซอร์ที่ใช้งานได้:
        </p>
        <ul className={css.list}>
          <li><strong>Google Chrome:</strong> ตั้งค่า &gt; ความเป็นส่วนตัวและความปลอดภัย &gt; คุกกี้</li>
          <li><strong>Mozilla Firefox:</strong> ตั้งค่า &gt; ความเป็นส่วนตัวและความปลอดภัย &gt; คุกกี้และข้อมูลไซต์</li>
          <li><strong>Safari:</strong> การตั้งค่า &gt; ความเป็นส่วนตัว &gt; จัดการข้อมูลเว็บไซต์</li>
          <li><strong>Microsoft Edge:</strong> ตั้งค่า &gt; ความเป็นส่วนตัว การค้นหา และบริการ &gt; คุกกี้</li>
        </ul>
      </div>

      {/* Data protection */}
      <div className={css.section}>
        <h2 className={css.sectionTitle}>สิทธิ์ของเจ้าของข้อมูล</h2>
        <p className={css.text}>
          ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) ท่านมีสิทธิ์ดังนี้:
        </p>
        <ul className={css.list}>
          <li>สิทธิ์ในการเข้าถึงข้อมูลส่วนบุคคล</li>
          <li>สิทธิ์ในการแก้ไขข้อมูลให้ถูกต้อง</li>
          <li>สิทธิ์ในการลบข้อมูลส่วนบุคคล</li>
          <li>สิทธิ์ในการคัดค้านการประมวลผลข้อมูล</li>
          <li>สิทธิ์ในการถอนความยินยอม</li>
          <li>สิทธิ์ในการร้องเรียนต่อหน่วยงานที่เกี่ยวข้อง</li>
        </ul>
      </div>

      {/* Contact */}
      <div className={css.section}>
        <h2 className={css.sectionTitle}>ช่องทางติดต่อ</h2>
        <p className={css.text}>
          หากมีข้อสงสัยเกี่ยวกับนโยบายคุกกี้หรือต้องการใช้สิทธิ์ตาม PDPA สามารถติดต่อได้ที่:
        </p>
        <div className={css.contactBox}>
          <div className={css.contactItem}>
            <EnvironmentOutlined />
            <span>สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด 2/486 อาคาร 26 ถนนศรีอยุธยา แขวงทุ่งพญาไท เขตราชเทวี กทม. 10400</span>
          </div>
          <div className={css.contactItem}>
            <PhoneOutlined />
            <span>02-644-4633</span>
          </div>
          <div className={css.contactItem}>
            <MailOutlined />
            <span>dohcoop@hotmail.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
