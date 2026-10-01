// "คำถามของฉัน" — จำกระทู้ที่ตั้งจากเบราว์เซอร์นี้ (ไม่มีระบบล็อกอิน)
// seenReplies = จำนวนคำตอบตอนเปิดดูล่าสุด → ใช้คำนวณป้าย "มีคำตอบใหม่"

export interface MyQuestion {
  id: number;
  title: string;
  createdAt: string;
  seenReplies: number;
}

const KEY = "doh-qna-mine";
const MAX = 20;

export function loadMyQuestions(): MyQuestion[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(list) ? list.filter((q) => q && typeof q.id === "number") : [];
  } catch {
    return [];
  }
}

function save(list: MyQuestion[]): MyQuestion[] {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    // storage ถูกปิด — ฟีเจอร์นี้แค่ไม่ทำงาน ไม่กระทบการใช้งานหลัก
  }
  return list;
}

export function addMyQuestion(q: Omit<MyQuestion, "seenReplies">): MyQuestion[] {
  return save([{ ...q, seenReplies: 0 }, ...loadMyQuestions().filter((m) => m.id !== q.id)]);
}

export function isMyQuestion(id: number): boolean {
  return loadMyQuestions().some((m) => m.id === id);
}

/** เรียกเมื่อเปิดดูกระทู้ของตัวเอง — ล้างป้าย "ใหม่" */
export function markSeen(id: number, replyCount: number): void {
  const list = loadMyQuestions();
  const item = list.find((m) => m.id === id);
  if (item && item.seenReplies !== replyCount) {
    item.seenReplies = replyCount;
    save(list);
  }
}

export function removeMyQuestion(id: number): MyQuestion[] {
  return save(loadMyQuestions().filter((m) => m.id !== id));
}

/** ตัดกระทู้ที่ถูกลบ/ซ่อนไปแล้วออกจากรายการ */
export function pruneMyQuestions(existingIds: Set<number>): MyQuestion[] {
  return save(loadMyQuestions().filter((m) => existingIds.has(m.id)));
}
