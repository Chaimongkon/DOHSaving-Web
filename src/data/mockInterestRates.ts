// Mock data for interest rates display on homepage
// When backend is ready, replace with API call

export interface InterestRate {
  id: number;
  type: "deposit" | "loan";
  name: string;
  rate: string;
  note?: string;
}

export const mockDepositRates: InterestRate[] = [
  { id: 1, type: "deposit", name: "ออมทรัพย์", rate: "2.00", note: "ต่อปี" },
  { id: 2, type: "deposit", name: "ออมทรัพย์ยั่งยืน", rate: "2.75", note: "ต่อปี" },
  { id: 3, type: "deposit", name: "ออมทรัพย์พิเศษ", rate: "3.00", note: "ต่อปี" },
  { id: 4, type: "deposit", name: "ออมทรัพย์พิเศษเกษียณสุข", rate: "3.25", note: "ต่อปี" },
  { id: 5, type: "deposit", name: "ประจำ 24 เดือน", rate: "3.50", note: "ต่อปี" },
];

export const mockLoanRates: InterestRate[] = [
  { id: 1, type: "loan", name: "เงินกู้ฉุกเฉิน", rate: "6.00", note: "ต่อปี" },
  { id: 2, type: "loan", name: "เงินกู้สามัญ", rate: "6.25", note: "ต่อปี" },
  { id: 3, type: "loan", name: "เงินกู้พิเศษ", rate: "5.50", note: "ต่อปี" },
];
