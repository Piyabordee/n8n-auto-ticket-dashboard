# Clickable StatsCards Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans

**Goal:** Enable users to click on StatsCards to view filtered ticket lists.

**Tech Stack:** Next.js 14, TypeScript, Tailwind, SQL Server

---

## Task 1: Create API Endpoint

**Create:** `app/api/dashboard/tickets/route.ts`

See design doc for full code. Supports year/month filter with status filter (all/pending/closed).

**Commit:** `git add app/api/dashboard/tickets/route.ts && git commit -m "feat: add filtered tickets API"`

---

## Task 2: Create TicketListModal

**Create:** `app/components/dashboard/TicketListModal.tsx`

Modal component that fetches tickets and displays MonthlyTicketList.

**Commit:** `git add app/components/dashboard/TicketListModal.tsx && git commit -m "feat: add TicketListModal"`

---

## Task 3: Modify StatsCards

**Modify:** `app/components/dashboard/StatsCards.tsx`

- Add onCardClick prop
- Wrap cards with clickable divs
- Add hover effect and 👆 indicator

**Commit:** `git add app/components/dashboard/StatsCards.tsx && git commit -m "feat: make StatsCards clickable"`

---

## Task 4: Modify page.tsx

**Modify:** `app/page.tsx`

- Import TicketListModal
- Add modal state
- Add handleStatCardClick handler
- Pass onCardClick to StatsCards
- Render TicketListModal

**Commit:** `git add app/page.tsx && git commit -m "feat: integrate TicketListModal"`

---

## Task 5: Test

- Click each card, verify correct filter
- Test with month selection
- Test empty state
- Test modal close

**Commit:** `git add . && git commit -m "fix: testing adjustments"`
