"use client";

import { useState, useEffect } from "react";
import {
  BankOutlined,
  InfoCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { Copy, Check, ShieldCheck } from "lucide-react";
import css from "./page.module.css";

/* ── Fallback bank data ── */
const defaultBanks: BankData[] = [
  { bankName: "ธนาคารกรุงไทย", bankNameSub: "จำกัด (มหาชน)", accountNumber: "013-1-25604-1", accountType: "ออมทรัพย์", brandColor: "#1ba5e0", abbr: "KTB", logoUrl: null },
  { bankName: "ธนาคารไทยพาณิชย์", bankNameSub: "จำกัด (มหาชน)", accountNumber: "026-4-09590-2", accountType: "ออมทรัพย์", brandColor: "#4e2a84", abbr: "SCB", logoUrl: null },
  { bankName: "ธนาคารกสิกรไทย", bankNameSub: "จำกัด (มหาชน)", accountNumber: "023-2-56500-4", accountType: "ออมทรัพย์", brandColor: "#138f2d", abbr: "KBANK", logoUrl: null },
  { bankName: "ธนาคารกรุงเทพ", bankNameSub: "จำกัด (มหาชน)", accountNumber: "149-0-89521-4", accountType: "ออมทรัพย์", brandColor: "#1e2b87", abbr: "BBL", logoUrl: null },
  { bankName: "ธนาคารกรุงศรีอยุธยา", bankNameSub: "จำกัด (มหาชน)", accountNumber: "044-1-37968-0", accountType: "ออมทรัพย์", brandColor: "#fec400", abbr: "BAY", logoUrl: null },
  { bankName: "ธนาคารทหารไทยธนชาต", bankNameSub: "จำกัด (มหาชน)", accountNumber: "003-2-90393-2", accountType: "ออมทรัพย์", brandColor: "#1279be", abbr: "TTB", logoUrl: null },
  { bankName: "ธนาคารซีไอเอ็มบี ไทย", bankNameSub: "จำกัด (มหาชน)", accountNumber: "700-0-23218-5", accountType: "ออมทรัพย์", brandColor: "#e02020", abbr: "CIMB", logoUrl: null },
];

interface BankData { bankName: string; bankNameSub: string | null; accountNumber: string; accountType: string; brandColor: string; abbr: string | null; logoUrl: string | null }

/* ── SVG Bank Logos ── */
const BankIcon = ({ abbr, size = 48 }: { abbr: string | null; size?: number }) => {
  const norm = abbr?.toUpperCase();
  switch (norm) {
    case "KTB":
    case "กรุงไทย":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="50" fill="#1ba5e0" />
          <path d="M50 20C30 20 20 40 20 50C20 50 35 35 50 35C65 35 80 50 80 50C80 40 70 20 50 20Z" fill="#fff" />
          <path d="M50 80C30 80 20 60 20 50C20 50 35 65 50 65C65 65 80 50 80 50C80 60 70 80 50 80Z" fill="#fff" />
        </svg>
      );
    case "SCB":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="50" fill="#4e2a84" />
          <path d="M40 70C30 70 25 60 25 50C25 40 30 30 40 30C50 30 55 40 55 50C55 50 45 50 45 45C45 40 40 40 40 45C40 50 50 55 50 60C50 65 45 70 40 70Z" fill="#fff" />
          <path d="M60 70C50 70 45 60 45 50C45 50 55 50 55 55C55 60 60 60 60 55C60 50 50 45 50 40C50 35 55 30 60 30C70 30 75 40 75 50C75 60 70 70 60 70Z" fill="#fff" />
        </svg>
      );
    case "KBANK":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="50" fill="#138f2d" />
          <path d="M50 20L65 45H35L50 20Z" fill="#fff" />
          <path d="M35 55L45 75H25L35 55Z" fill="#fff" />
          <path d="M65 55L75 75H55L65 55Z" fill="#fff" />
          <circle cx="50" cy="65" r="10" fill="#fff" />
        </svg>
      );
    case "BBL":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="50" fill="#1e2b87" />
          <path d="M50 20C40 30 30 50 50 80C70 50 60 30 50 20Z" fill="#fff" />
          <path d="M30 40C40 30 60 30 70 40C80 50 70 70 50 90C30 70 20 50 30 40Z" fill="#fff" opacity="0.6" />
        </svg>
      );
    case "BAY":
    case "KRUNGSRI":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <rect width="100" height="100" rx="20" fill="#fec400" />
          <rect x="25" y="30" width="10" height="40" fill="#fff" />
          <rect x="45" y="20" width="10" height="60" fill="#fff" />
          <rect x="65" y="30" width="10" height="40" fill="#fff" />
        </svg>
      );
    case "TTB":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="50" fill="#1279be" />
          <path d="M30 45H40V70H30V45ZM25 30H45V40H25V30Z" fill="#fff" />
          <path d="M45 45H55V70H45V45ZM40 30H60V40H40V30Z" fill="#fff" opacity="0.8" />
          <path d="M60 45H70V70H60V45ZM55 30H75V40H55V30Z" fill="#f58220" />
        </svg>
      );
    case "CIMB":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <rect width="100" height="100" rx="20" fill="#e02020" />
          <path d="M25 50L50 25L75 50L50 75Z" fill="#fff" />
          <circle cx="50" cy="50" r="10" fill="#e02020" />
        </svg>
      );
    default:
      return (
        <div style={{ width: size, height: size, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.35, fontWeight: 'bold' }}>
          {norm?.substring(0, 2) || <BankOutlined />}
        </div>
      );
  }
};

export default function BankAccountsPage() {
  const [banks, setBanks] = useState<BankData[]>(defaultBanks);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bank-accounts")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data) && data.length) setBanks(data); })
      .catch(() => { /* use fallback */ });
  }, []);

  const handleCopy = (acc: string) => {
    navigator.clipboard.writeText(acc);
    setCopiedAccount(acc);
    setTimeout(() => {
      setCopiedAccount(null);
    }, 2000);
  };

  return (
    <>
      {/* ── Hero ── */}
      <div className={css.hero}>
        <div className={css.heroBackground}>
          <div className={css.blob1}></div>
          <div className={css.blob2}></div>
        </div>
        <div className={css.heroContent}>
          <div className={css.heroIconWrapper}>
            <ShieldCheck size={48} strokeWidth={1.5} />
          </div>
          <h1 className={css.heroTitle}>บัญชีทางการสำหรับรับโอนเงิน</h1>
          <p className={css.heroSub}>
            ช่องทางการชำระค่าหุ้น ชำระเงินกู้ สหกรณ์ออมทรัพย์กรมทางหลวง จำกัด ปลอดภัยและเชื่อถือได้ 100%
          </p>
        </div>
      </div>

      <div className={css.content}>
        {/* ── Intro ── */}
        <div className={css.introCard}>
          <p className={css.introTitle}>
            <BankOutlined /> กรุณาตรวจสอบเลขบัญชีให้ชัดเจนก่อนทำรายการ
          </p>
          <p className={css.introDesc}>
            สมาชิกสามารถกดปุ่ม <span className={css.highlightText}>"คัดลอกเลขบัญชี"</span> ด้านล่าง เพื่อนำไปวางในแอปพลิเคชันธนาคารของท่านได้ทันที
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
                <div className={css.bankLogo}>
                  {bank.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bank.logoUrl} alt={bank.bankName} style={{ width: 44, height: 44, borderRadius: 10, objectFit: "contain", background: "#fff" }} />
                  ) : (
                    <BankIcon abbr={bank.abbr} size={44} />
                  )}
                </div>
                <div>
                  <p className={css.bankName}>{bank.bankName}</p>
                  <p className={css.bankNameSub}>{bank.bankNameSub}</p>
                </div>
              </div>
              <div className={css.bankBody}>
                <div className={css.accountInfoContainer}>
                  <div className={css.accountTextGroup}>
                    <p className={css.accountLabel}>เลขที่บัญชี</p>
                    <p className={css.accountNumber}>{bank.accountNumber}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(bank.accountNumber)}
                    className={`${css.copyBtn} ${copiedAccount === bank.accountNumber ? css.copied : ''}`}
                    title="คัดลอกเลขบัญชี"
                  >
                    {copiedAccount === bank.accountNumber ? (
                      <>
                        <Check size={16} strokeWidth={3} />
                        <span>คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} strokeWidth={2} />
                        <span>คัดลอก</span>
                      </>
                    )}
                  </button>
                </div>
                <div className={css.accountDivider}></div>
                <p className={css.accountType}>ประเภทบัญชี: <strong>{bank.accountType}</strong></p>
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
              ขั้นตอนการแจ้งหลักฐานหลังโอนเงิน
            </h2>
          </div>
          <div className={css.transferBody}>
            <ol className={css.transferSteps}>
              <li className={css.transferStep}>
                <span className={css.stepNum}>1</span>
                <span className={css.stepText}>
                  แจ้ง <span className={css.stepHighlight}>ชื่อ - นามสกุล</span> และ <span className={css.stepHighlight}>หมายเลขสมาชิก</span> ของท่านให้ชัดเจน
                </span>
              </li>
              <li className={css.transferStep}>
                <span className={css.stepNum}>2</span>
                <span className={css.stepText}>
                  ระบุรายละเอียดและวัตถุประสงค์ที่ต้องการชำระ (เช่น <span className={css.stepHighlight}>ชำระค่าหุ้น, ชำระเงินกู้ระบุเลขที่สัญญา, หรือนำฝากบัญชีออมทรัพย์</span>)
                </span>
              </li>
              <li className={css.transferStep}>
                <span className={css.stepNum}>3</span>
                <span className={css.stepText}>
                  แนบ <strong>สลิปหลักฐานการโอนเงิน (e-Slip)</strong> ให้เจ้าหน้าที่ตรวจสอบเพื่อดำเนินการในระบบ
                </span>
              </li>
            </ol>

            {/* Send proof channels */}
            <div className={css.proofSection}>
              <p className={css.proofTitle}>
                ส่งหลักฐานการโอนได้ตามช่องทางติดต่อด้านล่าง
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
                    style={{ background: "#00B900" }}
                  >
                    <MessageOutlined />
                  </div>
                  <div>
                    <p className={css.proofChannelLabel}>LINE Official Account</p>
                    <p className={css.proofChannelValue}>@dohsaving</p>
                  </div>
                </a>

                <div className={css.proofChannel}>
                  <div
                    className={css.proofChannelIcon}
                    style={{ background: "#00B900" }}
                  >
                    <MessageOutlined />
                  </div>
                  <div>
                    <p className={css.proofChannelLabel}>LINE ID (สำรอง)</p>
                    <p className={css.proofChannelValue}>dohcoop2</p>
                  </div>
                </div>

                <a href="tel:0989984420" className={css.proofChannel}>
                  <div
                    className={css.proofChannelIcon}
                    style={{ background: "#1e3a5f" }}
                  >
                    <PhoneOutlined />
                  </div>
                  <div>
                    <p className={css.proofChannelLabel}>โทรศัพท์ติดต่อเจ้าหน้าที่</p>
                    <p className={css.proofChannelValue}>098-998-4420</p>
                  </div>
                </a>

                <div className={css.proofChannel}>
                  <div
                    className={css.proofChannelIcon}
                    style={{ background: "#64748b" }}
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
