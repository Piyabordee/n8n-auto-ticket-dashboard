# Design: Clickable StatsCards with Filtered Ticket List

**Date:** 2026-03-05
**Status:** Approved

## Overview

Enable users to click on StatsCards to view filtered ticket lists in a modal.

## Filter Types

| Filter Type | Stat Card |
|-------------|-----------|
| `all` | จำนวนงานทั้งหมด, เวลาเฉลี่ย |
| `pending` | ยังไม่ปิด |
| `closed` | ปิดแล้ว, อัตราการปิดงาน |

## Files

| File | Action |
|------|--------|
| `app/components/dashboard/TicketListModal.tsx` | NEW |
| `app/api/dashboard/tickets/route.ts` | NEW |
| `app/components/dashboard/StatsCards.tsx` | MODIFY |
| `app/page.tsx` | MODIFY |
