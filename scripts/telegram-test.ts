/**
 * ทดสอบการแจ้งเตือน Telegram — npm run telegram:test
 *
 * - ยังไม่มี TELEGRAM_CHAT_ID → แสดงรายการห้องที่บอทเห็น (ให้พิมพ์อะไรก็ได้ในห้องก่อน) พร้อม chat id
 * - ตั้งครบแล้ว → ส่งข้อความทดสอบไปทุกห้อง
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const chats = (process.env.TELEGRAM_CHAT_ID ?? "").split(",").map((s) => s.trim()).filter(Boolean);

async function main() {
  if (!token) {
    console.log("ยังไม่ได้ตั้ง TELEGRAM_BOT_TOKEN ใน .env.local — ดูวิธีสร้างบอทใน DEPLOY.md หัวข้อ \"แจ้งเตือนเจ้าหน้าที่ทาง Telegram\"");
    process.exit(1);
  }

  const me = await fetch(`https://api.telegram.org/bot${token}/getMe`).then((r) => r.json());
  if (!me.ok) {
    console.log("Token ไม่ถูกต้อง:", me.description);
    process.exit(1);
  }
  console.log(`บอท: @${me.result.username}`);

  if (chats.length === 0) {
    const updates = await fetch(`https://api.telegram.org/bot${token}/getUpdates`).then((r) => r.json());
    const seen = new Map<string, string>();
    for (const u of updates.result ?? []) {
      const chat = u.message?.chat ?? u.my_chat_member?.chat ?? u.channel_post?.chat;
      if (chat) seen.set(String(chat.id), chat.title ?? [chat.first_name, chat.last_name].filter(Boolean).join(" "));
    }
    if (seen.size === 0) {
      console.log("ยังไม่เห็นห้องไหน — เพิ่มบอทเข้ากลุ่มเจ้าหน้าที่ แล้วพิมพ์ข้อความอะไรก็ได้ในกลุ่ม จากนั้นรันคำสั่งนี้อีกครั้ง");
    } else {
      console.log("ห้องที่บอทเห็น (นำ chat id ไปใส่ TELEGRAM_CHAT_ID):");
      for (const [id, name] of seen) console.log(`  ${id}  ${name}`);
    }
    return;
  }

  for (const chat_id of chats) {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id,
        parse_mode: "HTML",
        text: "✅ <b>ทดสอบการแจ้งเตือน</b>\nเว็บไซต์สหกรณ์ออมทรัพย์กรมทางหลวงเชื่อมต่อ Telegram สำเร็จ\nห้องนี้จะได้รับแจ้งเมื่อมีเรื่องร้องเรียน คำถามใหม่ และสรุปงานค้างทุกเช้าวันทำการ",
      }),
    }).then((r) => r.json());
    console.log(res.ok ? `ส่งถึง ${chat_id} แล้ว` : `ส่งถึง ${chat_id} ไม่สำเร็จ: ${res.description}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
