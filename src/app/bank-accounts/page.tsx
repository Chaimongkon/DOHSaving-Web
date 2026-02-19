"use client";

import { useState, useEffect } from "react";
import {
  BankOutlined,
  InfoCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import css from "./page.module.css";

/* ── Fallback bank data ── */
const defaultBanks = [
  { bankName: "ธนาคารกรุงไทย", bankNameSub: "จำกัด (มหาชน)", accountNumber: "013-1-25604-1", accountType: "ออมทรัพย์", brandColor: "#1ba5e0", abbr: "กรุงไทย" },
  { bankName: "ธนาคารไทยพาณิชย์", bankNameSub: "จำกัด (มหาชน)", accountNumber: "026-4-09590-2", accountType: "ออมทรัพย์", brandColor: "#4e2a84", abbr: "SCB" },
  { bankName: "ธนาคารกสิกรไทย", bankNameSub: "จำกัด (มหาชน)", accountNumber: "023-2-56500-4", accountType: "ออมทรัพย์", brandColor: "#138f2d", abbr: "KBANK" },
  { bankName: "ธนาคารกรุงเทพ", bankNameSub: "จำกัด (มหาชน)", accountNumber: "149-0-89521-4", accountType: "ออมทรัพย์", brandColor: "#1e2b87", abbr: "BBL" },
  { bankName: "ธนาคารกรุงศรีอยุธยา", bankNameSub: "จำกัด (มหาชน)", accountNumber: "044-1-37968-0", accountType: "ออมทรัพย์", brandColor: "#ffc423", abbr: "KrungSri" },
  { bankName: "ธนาคารทหารไทยธนชาต", bankNameSub: "จำกัด (มหาชน)", accountNumber: "003-2-90393-2", accountType: "ออมทรัพย์", brandColor: "#1279be", abbr: "ttb" },
  { bankName: "ธนาคารซีไอเอ็มบี ไทย", bankNameSub: "จำกัด (มหาชน)", accountNumber: "700-0-23218-5", accountType: "ออมทรัพย์", brandColor: "#ec1c24", abbr: "CIMB" },
];

interface BankData { bankName: string; bankNameSub: string | null; accountNumber: string; accountType: string; brandColor: string; abbr: string | null }

export default function BankAccountsPage() {
  const [banks, setBanks] = useState<BankData[]>(defaultBanks);

  useEffect(() => {
    fetch("/api/bank-accounts")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data) && data.length) setBanks(data); })
      .catch(() => { /* use fallback */ });
  }, []);
  return (
    <>
      {/* ── Hero ── */}
      <div className={css.hero}>
        <h1 className={css.heroTitle}>บัญชีธนาคาร</h1>
        <p className={css.heroSub}>
          ช่องทางการโอนเงิน ชำระค่าหุ้น ชำระเงินกู้ สหกรณ์ออมทรัพย์กรมทางหลวง
          จำกัด
        </p>
      </div>

      <div className={css.content}>
        {/* ── Intro ── */}
        <div className={css.introCard}>
          <p className={css.introTitle}>
            <BankOutlined /> บัญชีเงินฝากธนาคาร
          </p>
          <p className={css.introDesc}>
            สมาชิกสามารถโอนเงินผ่านบัญชีธนาคารด้านล่าง
            เพื่อชำระค่าหุ้น ชำระเงินกู้ หรือฝากเงิน
          </p>
        </div>

        {/* ── Bank Cards ── */}
        <div className={css.bankGrid}>
          {banks.map((bank, i) => (
            <div
              key={i}
              className={css.bankCard}
              style={{ "--bank-color": bank.brandColor } as React.CSSProperties}
            >
              <div
                className={css.bankHeader}
                style={{ background: bank.brandColor }}
              >
                <div className={css.bankLogo}>{bank.abbr}</div>
                <div>
                  <p className={css.bankName}>{bank.bankName}</p>
                  <p className={css.bankNameSub}>{bank.bankNameSub}</p>
                </div>
              </div>
              <div className={css.bankBody}>
                <p className={css.accountLabel}>เลขที่บัญชี</p>
                <p className={css.accountNumber}>{bank.accountNumber}</p>
                <p className={css.accountType}>ประเภท: {bank.accountType}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Transfer Instructions ── */}
        <div className={css.transferSection}>
          <div className={css.transferHeader}>
            <div className={css.transferHeaderIcon}>
              <InfoCircleOutlined />
            </div>
            <h2 className={css.transferHeaderTitle}>
              ขั้นตอนหลังโอนเงิน
            </h2>
          </div>
          <div className={css.transferBody}>
            <ol className={css.transferSteps}>
              <li className={css.transferStep}>
                <span className={css.stepNum}>1</span>
                <span className={css.stepText}>
                  แจ้ง <span className={css.stepHighlight}>ชื่อ - นามสกุล</span>
                </span>
              </li>
              <li className={css.transferStep}>
                <span className={css.stepNum}>2</span>
                <span className={css.stepText}>
                  แจ้ง <span className={css.stepHighlight}>หมายเลขสมาชิก</span>
                </span>
              </li>
              <li className={css.transferStep}>
                <span className={css.stepNum}>3</span>
                <span className={css.stepText}>
                  ระบุรายละเอียดที่ต้องการชำระ เช่น ชำระค่าหุ้น ชำระเงินกู้
                  ชำระเงินฝาก พร้อมระบุจำนวนเงินที่ต้องชำระ
                  หรือ{" "}
                  <span className={css.stepHighlight}>
                    สัญญาเงินกู้ที่ต้องการชำระ
                  </span>
                </span>
              </li>
            </ol>

            {/* Send proof channels */}
            <div className={css.proofSection}>
              <p className={css.proofTitle}>
                ส่งหลักฐานการโอน มาได้ตามช่องทางต่อไปนี้
              </p>
              <div className={css.proofChannels}>
                <a
                  href="https://line.me/ti/p/@dohsaving"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css.proofChannel}
                >
                  <div
                    className={css.proofChannelIcon}
                    style={{ background: "#22c55e" }}
                  >
                    <MessageOutlined />
                  </div>
                  <div>
                    <p className={css.proofChannelLabel}>LINE Official</p>
                    <p className={css.proofChannelValue}>@dohsaving</p>
                  </div>
                </a>

                <div className={css.proofChannel}>
                  <div
                    className={css.proofChannelIcon}
                    style={{ background: "#22c55e" }}
                  >
                    <MessageOutlined />
                  </div>
                  <div>
                    <p className={css.proofChannelLabel}>LINE ID</p>
                    <p className={css.proofChannelValue}>dohcoop2</p>
                  </div>
                </div>

                <a href="tel:0989984420" className={css.proofChannel}>
                  <div
                    className={css.proofChannelIcon}
                    style={{ background: "#0369a1" }}
                  >
                    <PhoneOutlined />
                  </div>
                  <div>
                    <p className={css.proofChannelLabel}>โทรศัพท์</p>
                    <p className={css.proofChannelValue}>098-998-4420</p>
                  </div>
                </a>

                <div className={css.proofChannel}>
                  <div
                    className={css.proofChannelIcon}
                    style={{ background: "#6b7280" }}
                  >
                    <MailOutlined />
                  </div>
                  <div>
                    <p className={css.proofChannelLabel}>FAX</p>
                    <p className={css.proofChannelValue}>02-644-4826</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
