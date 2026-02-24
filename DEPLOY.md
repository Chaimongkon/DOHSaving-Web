# คู่มือ Deploy DOHSaving-Web บน Windows Server 2012
# (Node.js + PM2 + IIS + MariaDB)

## สถาปัตยกรรม

```
[ผู้ใช้งาน] ──→ IIS (:80/:443 + SSL) ──→ Node.js (:3000) ──→ MariaDB (:3306)
```

- **IIS** = Reverse Proxy + SSL (ใช้ GUI จัดการได้ทั้งหมด)
- **PM2** = Process Manager สำหรับ Node.js (auto-restart, log)
- **Node.js** = รัน Next.js application
- **MariaDB** = ฐานข้อมูล

---

# ═══════════════════════════════════════════════════
# ขั้นตอนที่ 1: ติดตั้ง Software บน Server
# ═══════════════════════════════════════════════════

---

## 1.1 ติดตั้ง Node.js

1. เปิด browser บน server ไปที่ https://nodejs.org/en/download
2. กด **"Windows Installer (.msi)"** เลือก **LTS** version (เช่น 20.x หรือ 22.x)
3. ดับเบิลคลิกไฟล์ .msi ที่โหลดมา → กด **Next** ไปเรื่อยๆ จนเสร็จ
4. เปิด **PowerShell** (คลิกขวา → Run as Administrator) แล้วพิมพ์:

```powershell
node -v
# ควรแสดง เช่น v20.18.0

npm -v
# ควรแสดง เช่น 10.8.2
```

> ถ้าไม่แสดง version → ปิด PowerShell แล้วเปิดใหม่ หรือ restart server

---

## 1.2 ติดตั้ง PM2

เปิด **PowerShell (Run as Administrator)** พิมพ์:

```powershell
npm install -g pm2
```

รอจน install เสร็จ แล้วทดสอบ:

```powershell
pm2 -v
# ควรแสดง เช่น 5.4.2
```

ติดตั้ง auto-startup (เพื่อให้ PM2 start อัตโนมัติเมื่อ restart server):

```powershell
npm install -g pm2-windows-startup
pm2-startup install
```

---

## 1.3 เปิด IIS Role (ถ้ายังไม่เปิด)

1. เปิด **Server Manager** (อยู่ใน Taskbar หรือ Start Menu)
2. คลิก **Manage** → **Add Roles and Features**
3. กด Next จนถึงหน้า **Server Roles**
4. ติ๊ก ✅ **Web Server (IIS)**
5. กด **Add Features** → กด **Next** ไปจนเสร็จ → **Install**
6. รอจน install เสร็จ

ทดสอบ: เปิด browser ไปที่ `http://localhost` ถ้าเห็นหน้า IIS Welcome = สำเร็จ ✅

---

## 1.4 ติดตั้ง IIS Modules (สำหรับ Reverse Proxy)

ต้องติดตั้ง 2 ตัวนี้ (โหลด .msi แล้วดับเบิลคลิกติดตั้ง):

### ตัวที่ 1: URL Rewrite
- โหลดจาก: https://www.iis.net/downloads/microsoft/url-rewrite
- กดปุ่ม **Install this extension**
- เลือก **x64 installer** → ดาวน์โหลด → ดับเบิลคลิก → Next จนเสร็จ

### ตัวที่ 2: Application Request Routing (ARR)
- โหลดจาก: https://www.iis.net/downloads/microsoft/application-request-routing
- กดปุ่ม **Install this extension**
- เลือก **ARR 3.0** → ดาวน์โหลด → ดับเบิลคลิก → Next จนเสร็จ

### เปิด Proxy ใน ARR

1. เปิด **IIS Manager** (พิมพ์ `inetmgr` ใน Run)
2. คลิกที่ **ชื่อ Server** (ด้านซ้ายสุด ระดับบนสุด)
3. ดับเบิลคลิก **Application Request Routing Cache** (ในหน้ากลาง)
4. คลิก **Server Proxy Settings...** (ด้านขวา)
5. ติ๊ก ✅ **Enable proxy**
6. กด **Apply** (ด้านขวาบน)

---

## 1.5 ติดตั้ง MariaDB (ถ้ายังไม่มี)

1. ไปที่ https://mariadb.org/download/
2. เลือก **Windows x86_64** → MSI Package → Download
3. ติดตั้ง:
   - ตั้ง **root password** ให้จำไว้
   - ติ๊ก ✅ "Use UTF8 as default server's character set"
   - ติ๊ก ✅ "Install as Windows Service"
4. เปิด **HeidiSQL** (มาพร้อม MariaDB) หรือ command line:

```sql
-- สร้าง database
CREATE DATABASE dohsaving CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- สร้าง user สำหรับ application (อย่าใช้ root)
CREATE USER 'dohsaving'@'localhost' IDENTIFIED BY 'ตั้ง-password-ที่แข็งแรง';
GRANT ALL PRIVILEGES ON dohsaving.* TO 'dohsaving'@'localhost';
FLUSH PRIVILEGES;
```

> ⚠️ จดไว้: username = `dohsaving`, password = ที่คุณตั้ง, database = `dohsaving`

---

# ═══════════════════════════════════════════════════
# ขั้นตอนที่ 2: เตรียม Application
# ═══════════════════════════════════════════════════

---

## 2.1 คัดลอกโปรเจกต์ไปยัง Server

คัดลอกทั้ง folder **DOHSaving-Web** ไปวางที่ server เช่น:

```
C:\WebApps\DOHSaving-Web\
```

> วิธีคัดลอก: ใช้ USB drive, Remote Desktop copy, หรือ zip แล้ว upload

---

## 2.2 สร้างไฟล์ .env.local

เปิด **PowerShell** แล้วพิมพ์:

```powershell
cd C:\WebApps\DOHSaving-Web
copy .env.example .env.local
notepad .env.local
```

แก้ไขให้เป็นแบบนี้ (ใส่ค่าจริง):

```env
DATABASE_URL="mysql://dohsaving:รหัสผ่าน-database@localhost:3306/dohsaving"
JWT_SECRET="ใส่-string-สุ่ม-ยาวๆ"
JWT_EXPIRES_IN="8h"
NODE_ENV="production"
```

**วิธีสร้าง JWT_SECRET แบบสุ่ม:**

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

จะได้ string ยาวๆ เช่น `a1b2c3d4e5f6...` ให้ copy ไปวางแทน `ใส่-string-สุ่ม-ยาวๆ`

**ตัวอย่าง .env.local ที่สมบูรณ์:**

```env
DATABASE_URL="mysql://dohsaving:MyStr0ngP@ss!@localhost:3306/dohsaving"
JWT_SECRET="7f3a2b8c9d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a"
JWT_EXPIRES_IN="8h"
NODE_ENV="production"
```

---

## 2.3 Install Dependencies + Build

```powershell
cd C:\WebApps\DOHSaving-Web
npm install
npx prisma generate
npx prisma db push
npm run build
```

> - `npm install` → รอ 2-5 นาที จนเห็น "added xxx packages"
> - `prisma db push` → สร้างตารางใน MariaDB อัตโนมัติ
> - `npm run build` → รอ 1-3 นาที จนเห็น "✓ Compiled successfully"

---

## 2.4 สร้าง Admin User คนแรก

**ขั้นที่ 1:** สร้าง password hash ใน PowerShell:

```powershell
node -e "const b=require('bcryptjs');console.log(b.hashSync('รหัสผ่าน-admin',12))"
```

เปลี่ยน `รหัสผ่าน-admin` เป็นรหัสที่จะใช้ login
จะได้ผลลัพธ์เช่น: `$2a$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**ขั้นที่ 2:** เปิด HeidiSQL หรือ MariaDB command line แล้วรัน:

```sql
INSERT INTO users (userName, password, fullName, userRole, isActive, createdAt, updatedAt)
VALUES (
    'admin',
    '$2a$12$xxxxx-ใส่-hash-ที่ได้จากขั้นที่1',
    'ผู้ดูแลระบบ',
    'admin',
    1,
    NOW(),
    NOW()
);
```

---

# ═══════════════════════════════════════════════════
# ขั้นตอนที่ 3: Start Node.js ด้วย PM2
# ═══════════════════════════════════════════════════

---

```powershell
cd C:\WebApps\DOHSaving-Web
pm2 start ecosystem.config.js
```

ตรวจสอบว่าทำงาน:

```powershell
pm2 status
```

ควรเห็น:

```
┌─────────────────┬────┬──────┬───────┬────────┐
│ name            │ id │ mode │ status│ cpu    │
├─────────────────┼────┼──────┼───────┼────────┤
│ dohsaving-web   │ 0  │ fork │ online│ 0%     │
└─────────────────┴────┴──────┴───────┴────────┘
```

**ทดสอบ:** เปิด browser บน server ไปที่ `http://localhost:3000`
ถ้าเห็นหน้าเว็บ = สำเร็จ ✅

บันทึก PM2 state:

```powershell
pm2 save
```

---

# ═══════════════════════════════════════════════════
# ขั้นตอนที่ 4: ติดตั้ง SSL Certificate ใน IIS
# ═══════════════════════════════════════════════════

---

## 4.1 ใช้ไฟล์จาก folder "IIS-PFX-PKCS12"

จากที่มี SSL cert อยู่แล้ว ใช้ folder **IIS-PFX-PKCS12** ซึ่งจะมีไฟล์:

```
certificate.pfx     (หรือ domain.pfx)
```

> ⚠️ ถ้าไม่มี folder IIS-PFX-PKCS12 หรือไม่มีไฟล์ .pfx → ดูหัวข้อ 4.1.1 ด้านล่าง
> ถ้ามีไฟล์ .pfx อยู่แล้ว → ข้ามไปขั้นที่ 4.2 เลย

### 4.1.1 (ทำเฉพาะกรณีไม่มีไฟล์ .pfx) แปลง PEM เป็น PFX

ถ้ามีแค่ folder **Apache-or-CRT-PEM-Format** ต้องแปลงเป็น .pfx ก่อน:

1. ดาวน์โหลด **OpenSSL for Windows**:
   https://slproweb.com/products/Win32OpenSSL.html
   (เลือก Win64 OpenSSL Light → ติดตั้ง)

2. เปิด **PowerShell (Run as Administrator)** แล้วพิมพ์:

```powershell
cd C:\path\to\Apache-or-CRT-PEM-Format

# ถ้ามี ca_bundle.crt → รวมกับ certificate.crt ก่อน
type certificate.crt ca_bundle.crt > fullchain.crt

# แปลงเป็น .pfx
openssl pkcs12 -export -out certificate.pfx -inkey private.key -in fullchain.crt
```

3. ระบบจะถาม **Export Password** → ตั้งรหัส แล้วจำไว้ (จะใช้ตอน import เข้า IIS)

---

## 4.2 Import SSL Certificate เข้า IIS

1. เปิด **IIS Manager** (พิมพ์ `inetmgr` ใน Run)
2. คลิกที่ **ชื่อ Server** (ด้านซ้ายสุด ระดับบนสุด)
3. ดับเบิลคลิก **Server Certificates** (ในหน้ากลาง ส่วน IIS)
4. คลิก **Import...** (ด้านขวา)
5. ในหน้า Import Certificate:
   - **Certificate file (.pfx):** กด `...` แล้วเลือกไฟล์ `certificate.pfx`
   - **Password:** ใส่รหัสที่ตั้งไว้ตอนสร้าง .pfx (ถ้า cert มาจาก provider อาจเป็นรหัสที่ provider ให้)
   - **Certificate store:** เลือก **Personal**
6. กด **OK**

ถ้าเห็น certificate ปรากฏในรายการ = สำเร็จ ✅

---

# ═══════════════════════════════════════════════════
# ขั้นตอนที่ 5: สร้าง Website ใน IIS (Reverse Proxy)
# ═══════════════════════════════════════════════════

---

## 5.1 ลบ Default Web Site (ถ้าไม่ใช้)

1. เปิด **IIS Manager**
2. ขยาย **Sites** (ด้านซ้าย)
3. คลิกขวาที่ **Default Web Site** → **Remove**
   (หรือ **Stop** ถ้าไม่อยากลบ)

---

## 5.2 สร้าง Website ใหม่

1. คลิกขวาที่ **Sites** → **Add Website...**
2. กรอกข้อมูล:

```
Site name:         DOHSaving
Physical path:     C:\WebApps\DOHSaving-Web
Binding Type:      http
IP address:        All Unassigned
Port:              80
Host name:         your-domain.com    (ใส่ domain จริง)
```

3. กด **OK**

---

## 5.3 เพิ่ม HTTPS Binding (SSL)

1. คลิกที่ website **DOHSaving** (ด้านซ้าย)
2. คลิก **Bindings...** (ด้านขวา)
3. กด **Add...**
4. กรอกข้อมูล:

```
Type:              https
IP address:        All Unassigned
Port:              443
Host name:         your-domain.com    (ใส่ domain จริง เหมือนกับ HTTP)
SSL certificate:   เลือก certificate ที่ import ไว้ในขั้นตอน 4.2
```

5. กด **OK** → **Close**

---

## 5.4 ตั้งค่า Reverse Proxy (URL Rewrite)

ไฟล์ `web.config` ที่อยู่ใน `C:\WebApps\DOHSaving-Web\` จะทำ reverse proxy ให้อัตโนมัติ
(ไฟล์นี้ถูกสร้างไว้แล้วในโปรเจกต์)

**ถ้าต้องการตรวจสอบ:** เปิดไฟล์ `web.config` ควรมีเนื้อหาประมาณนี้:

```xml
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxyToNode" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:3000/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

---

## 5.5 ตั้งค่า HTTP → HTTPS Redirect

1. คลิกที่ website **DOHSaving** (ด้านซ้าย)
2. ดับเบิลคลิก **URL Rewrite** (ในหน้ากลาง)
3. คลิก **Add Rule(s)...** (ด้านขวา)
4. เลือก **Blank rule** → OK
5. กรอกข้อมูล:

```
Name:                    HTTP to HTTPS Redirect
Match URL Pattern:       (.*)
Conditions:
  กด Add...
    Condition input:     {HTTPS}
    Check if:            Matches the Pattern
    Pattern:             ^OFF$
    กด OK
Action:
  Action type:           Redirect
  Redirect URL:          https://{HTTP_HOST}/{R:1}
  Redirect type:         Permanent (301)
```

6. กด **Apply** (ด้านขวาบน)

> ตอนนี้ถ้าคนเข้า http:// จะถูก redirect ไป https:// อัตโนมัติ

---

## 5.6 ทดสอบ

เปิด browser ไปที่:
- `http://your-domain.com` → ควร redirect ไป https://
- `https://your-domain.com` → ควรเห็นหน้าเว็บ + 🔒 ไอคอนแม่กุญแจ

ถ้าเห็น = **สำเร็จ ✅**

---

# ═══════════════════════════════════════════════════
# ขั้นตอนที่ 6: ตั้งค่า Windows Firewall
# ═══════════════════════════════════════════════════

---

เปิด **PowerShell (Run as Administrator)** พิมพ์:

```powershell
# เปิด port 80 (HTTP)
netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=TCP localport=80

# เปิด port 443 (HTTPS)
netsh advfirewall firewall add rule name="HTTPS" dir=in action=allow protocol=TCP localport=443

# ปิด port 3000 จากภายนอก (สำคัญมาก! ป้องกันคนเข้าตรงไม่ผ่าน SSL)
netsh advfirewall firewall add rule name="Block Node.js Direct" dir=in action=block protocol=TCP localport=3000
```

---

# ═══════════════════════════════════════════════════
# ขั้นตอนที่ 7: ตั้ง DNS
# ═══════════════════════════════════════════════════

---

ไปที่ผู้ให้บริการ domain (เช่น GoDaddy, Cloudflare, Thai.name) แล้วตั้ง:

```
Type:    A
Name:    @  (หรือ subdomain เช่น www)
Value:   IP-ของ-server  (เช่น 203.xxx.xxx.xxx)
TTL:     3600
```

> รอ 5-30 นาที ให้ DNS propagate
> ทดสอบ: `nslookup your-domain.com` ดูว่า IP ชี้ถูกต้อง

---

# ═══════════════════════════════════════════════════
# คำสั่งที่ใช้บ่อย
# ═══════════════════════════════════════════════════

---

## PM2 (จัดการ Node.js)

| คำสั่ง | ความหมาย |
|---|---|
| `pm2 status` | ดูสถานะ app |
| `pm2 logs dohsaving-web` | ดู log แบบ realtime |
| `pm2 logs dohsaving-web --lines 100` | ดู log 100 บรรทัดล่าสุด |
| `pm2 restart dohsaving-web` | restart app |
| `pm2 stop dohsaving-web` | หยุด app |

## IIS (จัดการผ่าน GUI)

| การทำงาน | วิธี |
|---|---|
| เปิด IIS Manager | พิมพ์ `inetmgr` ใน Run |
| Start/Stop website | คลิกขวาที่ Site → Manage Website → Start/Stop |
| ดู Log | เปิด folder `C:\inetpub\logs\LogFiles\` |
| แก้ไข Bindings | คลิก Site → Bindings... (ด้านขวา) |

## Deploy version ใหม่

```powershell
cd C:\WebApps\DOHSaving-Web

# 1. คัดลอกไฟล์ใหม่ทับ (ยกเว้น .env.local, node_modules, web.config)

# 2. Install + Build
npm install
npx prisma generate
npx prisma db push
npm run build

# 3. Restart Node.js
pm2 restart dohsaving-web
```

> ไม่ต้อง restart IIS — IIS แค่ forward traffic ไป Node.js

## Database Backup

**รันมือ:**

```powershell
mkdir C:\Backup
mysqldump -u dohsaving -p dohsaving > C:\Backup\dohsaving_%date:~-4%-%date:~4,2%-%date:~7,2%.sql
```

**ตั้ง Schedule อัตโนมัติ:**

1. เปิด **Task Scheduler** (พิมพ์ `taskschd.msc` ใน Run)
2. คลิก **Create Basic Task**
   - Name: `DOHSaving DB Backup`
   - Trigger: **Daily** เวลา 02:00
   - Action: **Start a program**
   - Program: `cmd.exe`
   - Arguments: `/c mysqldump -u dohsaving -pYOUR_PASSWORD dohsaving > C:\Backup\dohsaving_%date:~-4%-%date:~4,2%-%date:~7,2%.sql`
3. Finish

---

# ═══════════════════════════════════════════════════
# Checklist ก่อน Go-Live ✅
# ═══════════════════════════════════════════════════

---

### Software ติดตั้ง
- [ ] Node.js ติดตั้งแล้ว (`node -v`)
- [ ] PM2 ติดตั้งแล้ว (`pm2 -v`)
- [ ] IIS Role เปิดแล้ว
- [ ] URL Rewrite module ติดตั้งแล้ว
- [ ] ARR module ติดตั้งแล้ว + Enable Proxy ✅
- [ ] MariaDB ทำงาน + สร้าง database/user แล้ว

### Application
- [ ] `.env.local` ตั้งค่าครบ (DATABASE_URL, JWT_SECRET)
- [ ] `npx prisma db push` สำเร็จ
- [ ] สร้าง Admin user ใน database แล้ว
- [ ] `npm run build` สำเร็จ

### Node.js
- [ ] `pm2 start ecosystem.config.js` → สถานะ online
- [ ] `pm2 save` แล้ว
- [ ] http://localhost:3000 เปิดได้บน server

### IIS + SSL
- [ ] SSL certificate import เข้า IIS แล้ว
- [ ] สร้าง website + HTTP binding (port 80)
- [ ] เพิ่ม HTTPS binding (port 443) + เลือก cert
- [ ] HTTP → HTTPS redirect ทำงาน
- [ ] https://your-domain.com เปิดได้ + 🔒

### Security
- [ ] Firewall เปิด port 80, 443 / ปิด port 3000
- [ ] DNS ชี้มาที่ server IP แล้ว
- [ ] Admin login ทำงาน → /admin/login
- [ ] Database backup schedule ตั้งแล้ว

---

# ═══════════════════════════════════════════════════
# แก้ปัญหาที่พบบ่อย
# ═══════════════════════════════════════════════════

---

### ❌ "Can't reach database server"
→ ตรวจสอบ DATABASE_URL ใน .env.local ว่า password ถูกต้อง
→ ตรวจสอบว่า MariaDB service ทำงานอยู่:
  - เปิด `services.msc` → หา MariaDB → ดูว่า Status เป็น "Running"

### ❌ "FATAL: JWT_SECRET environment variable is not set"
→ ตรวจสอบว่ามีไฟล์ `.env.local` อยู่จริง และมี `JWT_SECRET=...` อยู่ข้างใน

### ❌ เข้า https:// แล้วเห็น IIS Welcome Page
→ ตรวจสอบว่า `web.config` อยู่ใน `C:\WebApps\DOHSaving-Web\`
→ ตรวจสอบว่า ARR Proxy เปิดแล้ว (ดูขั้นตอน 1.4)
→ ตรวจสอบว่า Node.js ทำงานอยู่: `pm2 status`

### ❌ เข้า https:// แล้วเห็น Error 502.3 Bad Gateway
→ Node.js ไม่ทำงาน → `pm2 restart dohsaving-web`
→ ดู log: `pm2 logs dohsaving-web`

### ❌ เข้าเว็บไม่ได้จากภายนอก
→ ตรวจสอบ Firewall เปิด port 80, 443 หรือยัง
→ ตรวจสอบ DNS: `nslookup your-domain.com`

### ❌ SSL ไม่ทำงาน / browser แสดง "Not Secure"
→ ตรวจสอบว่า import .pfx สำเร็จ (ดูใน Server Certificates)
→ ตรวจสอบว่า HTTPS binding เลือก cert ถูกตัว
→ ถ้า cert หมดอายุ → ต้องซื้อ/ต่ออายุใหม่

### ❌ HTTP ไม่ redirect ไป HTTPS
→ ตรวจสอบว่า URL Rewrite module ติดตั้งแล้ว
→ ตรวจสอบ redirect rule (ดูขั้นตอน 5.5)
