import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

// 1. อัตราดอกเบี้ย (Interest Rate - Orange)
export const InterestRateIcon = ({ size = 48, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }} {...props}>
    <defs>
      <linearGradient id="rateGrad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF9F43" />
        <stop offset="1" stopColor="#E8652B" />
      </linearGradient>
      <filter id="rateShadow" x="-10" y="-10" width="84" height="84" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#E8652B" floodOpacity="0.4" />
      </filter>
    </defs>
    <circle cx="32" cy="32" r="24" fill="url(#rateGrad)" filter="url(#rateShadow)" />
    <path d="M22 24L32 16L42 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 24V44M32 24V44M40 24V44" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <path d="M18 44H46" stroke="white" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// 2. เงินกู้ (Loan - Navy Blue)
export const LoanIcon = ({ size = 48, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }} {...props}>
    <defs>
      <linearGradient id="loanGrad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2c5282" />
        <stop offset="1" stopColor="#1a3a5c" />
      </linearGradient>
      <filter id="loanShadow" x="-10" y="-10" width="84" height="84" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#1a3a5c" floodOpacity="0.4" />
      </filter>
    </defs>
    <circle cx="32" cy="32" r="24" fill="url(#loanGrad)" filter="url(#loanShadow)" />
    <circle cx="32" cy="32" r="16" stroke="white" strokeWidth="2" opacity="0.8" />
    <path d="M32 20V44M28 26C28 26 31 24 34 26C37 28 35 32 32 32C29 32 27 36 30 38C33 40 36 38 36 38" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 3. เงินฝาก (Deposit - Green)
export const DepositIcon = ({ size = 48, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }} {...props}>
    <defs>
      <linearGradient id="depositGrad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2ECC71" />
        <stop offset="1" stopColor="#16a34a" />
      </linearGradient>
      <filter id="depositShadow" x="-10" y="-10" width="84" height="84" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#16a34a" floodOpacity="0.4" />
      </filter>
    </defs>
    <circle cx="32" cy="32" r="24" fill="url(#depositGrad)" filter="url(#depositShadow)" />
    <path d="M32 16L46 26H18L32 16Z" fill="white" opacity="0.9" />
    <path d="M26 38L30 42L40 32" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 28V46M40 28V46" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
  </svg>
);

// 4. สวัสดิการ (Welfare - Purple)
export const WelfareIcon = ({ size = 48, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }} {...props}>
    <defs>
      <linearGradient id="welfareGrad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A29BFE" />
        <stop offset="1" stopColor="#7c3aed" />
      </linearGradient>
      <filter id="welfareShadow" x="-10" y="-10" width="84" height="84" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#7c3aed" floodOpacity="0.4" />
      </filter>
    </defs>
    <circle cx="32" cy="32" r="24" fill="url(#welfareGrad)" filter="url(#welfareShadow)" />
    <circle cx="32" cy="24" r="6" fill="white" />
    <path d="M20 44C20 38 25 34 32 34C39 34 44 38 44 44" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <circle cx="42" cy="28" r="4" fill="white" opacity="0.6" />
    <path d="M36 44C36 40 39 37 44 37C47 37 50 39 50 44" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
  </svg>
);

// 5. ดาวน์โหลดแบบฟอร์ม (Download Forms - Blue)
export const FormIcon = ({ size = 48, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }} {...props}>
    <defs>
      <linearGradient id="formGrad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#54A0FF" />
        <stop offset="1" stopColor="#0369a1" />
      </linearGradient>
      <filter id="formShadow" x="-10" y="-10" width="84" height="84" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0369a1" floodOpacity="0.4" />
      </filter>
    </defs>
    <circle cx="32" cy="32" r="24" fill="url(#formGrad)" filter="url(#formShadow)" />
    <rect x="22" y="16" width="20" height="28" rx="2" fill="white" />
    <path d="M26 24H38M26 30H38M26 36H32" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" />
    <path d="M42 40L48 48L38 48" fill="white" />
  </svg>
);

// 6. ถาม-ตอบ Q&A (Q&A - Cyan)
export const QnAIcon = ({ size = 48, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }} {...props}>
    <defs>
      <linearGradient id="qnaGrad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#48DBFB" />
        <stop offset="1" stopColor="#0891b2" />
      </linearGradient>
      <filter id="qnaShadow" x="-10" y="-10" width="84" height="84" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0891b2" floodOpacity="0.4" />
      </filter>
    </defs>
    <circle cx="32" cy="32" r="24" fill="url(#qnaGrad)" filter="url(#qnaShadow)" />
    <path d="M46 32C46 39.732 39.732 46 32 46C29.6 46 27.3 45.4 25.3 44.3L18 46L19.7 38.7C18.6 36.7 18 34.4 18 32C18 24.268 24.268 18 32 18C39.732 18 46 24.268 46 32Z" stroke="white" strokeWidth="3" fill="none" />
    <path d="M30 25C30 25 34 23 35 26C36 29 32 31 32 34" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <circle cx="32" cy="39" r="2" fill="white" />
  </svg>
);

// 7. ติดต่อเรา (Contact - Pink)
export const ContactIcon = ({ size = 48, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }} {...props}>
    <defs>
      <linearGradient id="contactGrad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f472b6" />
        <stop offset="1" stopColor="#be185d" />
      </linearGradient>
      <filter id="contactShadow" x="-10" y="-10" width="84" height="84" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#be185d" floodOpacity="0.4" />
      </filter>
    </defs>
    <circle cx="32" cy="32" r="24" fill="url(#contactGrad)" filter="url(#contactShadow)" />
    <path d="M22 34V28C22 22.4772 26.4772 18 32 18C37.5228 18 42 22.4772 42 28V34" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <rect x="18" y="32" width="6" height="12" rx="3" fill="white" />
    <rect x="40" y="32" width="6" height="12" rx="3" fill="white" />
    <path d="M22 42C22 44.2091 24.2386 46 27 46H37C39.7614 46 42 44.2091 42 42" stroke="white" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
  </svg>
);

// 8. ร้องเรียน/เสนอแนะ (Complaint - Red)
export const AlertIcon = ({ size = 48, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }} {...props}>
    <defs>
      <linearGradient id="alertGrad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF7675" />
        <stop offset="1" stopColor="#dc2626" />
      </linearGradient>
      <filter id="alertShadow" x="-10" y="-10" width="84" height="84" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#dc2626" floodOpacity="0.4" />
      </filter>
    </defs>
    <circle cx="32" cy="32" r="24" fill="url(#alertGrad)" filter="url(#alertShadow)" />
    <path d="M32 16L46 42H18L32 16Z" stroke="white" strokeWidth="3" strokeLinejoin="round" fill="none" />
    <path d="M32 26V34" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <circle cx="32" cy="38" r="2" fill="white" />
  </svg>
);
