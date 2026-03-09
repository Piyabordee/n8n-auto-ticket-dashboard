# Mock Data for IT Helpdesk Dashboard

เป็นระบบ Mock Data สำหรับการทดสอบและแสดงตัวอย่าง Dashboard โดยไม่ต้องเชื่อมต่อฐานข้อมูลจริง

## วิธีการใช้งาน

### 🎯 วิธีที่ 1: Auto-Fallback (แนะนำสำหรับ Vercel)

ระบบจะ **auto-switch** ไปใช้ mock data โดยอัตโนมัติเมื่อ:
- ฐานข้อมูลเชื่อมต่อไม่ได้
- ไม่มี SQL Server credentials
- ใช้งานบน Vercel โดยไม่ต้อง config env

**ไม่ต้องทำอะไร** - แค่ deploy แล้วใช้งานได้เลย!

### วิธีที่ 2: เปิดใช้ Mock Data Mode แบบ Manual

แก้ไขไฟล์ `.env.local` และเพิ่มบรรทัดนี้:

```bash
USE_MOCK_DATA=true
```

Restart Development Server:

```bash
npm run dev
```

หรือ

```bash
yarn dev
```

### วิธีที่ 3: Set ผ่าน Vercel Environment Variables

1. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. เลือก project
3. **Settings** → **Environment Variables**
4. เพิ่ม `USE_MOCK_DATA` = `true`
5. Redeploy

## Mock Data ที่สร้างขึ้น

ระบบจะสร้างข้อมูลจำลองใหม่ทุกครั้งที่มีการ request โดยมีค่าสุ่มที่สมจริง:

### Dashboard Stats (`/api/dashboard/stats`)
- Total tickets: 700-1000 (ต่อปี)
- Closed rate: 75-92%
- Average time: 85-180 นาที
- Pending tickets

### Monthly Data (`/api/dashboard/monthly`)
- ข้อมูล 12 เดือน
- Monthly tickets: 45-120
- Thai month names: ม.ค., ก.พ., มี.ค., ...

### Daily Data (`/api/dashboard/daily`)
- ข้อมูลรายวันสำหรับเดือนที่เลือก
- Daily tickets: 0-8

### Staff Performance (`/api/dashboard/staff`)
- 8 ชื่อพนักงาน (สมชาย ใจดี, วิภาดา รักงาน, ...)
- Total assigned, closed, pending
- Average time: all, normal, outlier
- Outlier count: 0-3 ต่อคน

### Outliers (`/api/dashboard/outliers`)
- Top 3 outliers
- Total outliers: 15-35 (ต่อปี)
- Deviation score: 2.0-5.0 SD

### Tickets (`/api/dashboard/tickets`)
- สามารถ filter ตาม year, month, status, staff
- Categories: Hardware, Software, Network, User Account, etc.
- Branches: สำนักงานใหญ่, สาขาลาดพร้าว, สาขาสยาม, ...

### Available Months (`/api/dashboard/available-months`)
- ปีปัจจุบันและ 2 ปีย้อนหลัง
- เดือนที่มีข้อมูล

## ข้อมูลทั้งหมดเป็นข้อมูลจำลอง

- ชื่อพนักงาน: สร้างขึ้นเอง ไม่ใช่ข้อมูลจริง
- หัวข้อ ticket: สร้างขึ้นเอง
- สาขา: สร้างขึ้นเอง
- ค่าตัวเลข: สุ่มขึ้นด้วย algorithm ที่สมจริง

## ปิดใช้ Mock Data Mode

เพื่อใช้ข้อมูลจริงจาก SQL Server:

```bash
USE_MOCK_DATA=false
```

หรือลบบรรทัดนี้ออกจาก `.env.local`
