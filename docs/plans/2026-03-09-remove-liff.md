# Remove LIFF + Prepare for Future Auth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove LINE LIFF integration and create placeholder authentication structure for future real auth implementation.

**Architecture:** Replace LiffProvider with new AuthProvider using mock user. Remove all LIFF-specific code while maintaining app functionality. Prepare clean structure for NextAuth.js, Clerk, or other auth solutions.

**Tech Stack:** Next.js 14, TypeScript, React Context API

---

## Task 1: Create new Auth types

**Files:**
- Create: `types/auth.ts`

**Step 1: Create auth types file**

```typescript
// File: types/auth.ts

export interface User {
  id: string
  name: string
  email?: string
  role?: 'admin' | 'user'
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  error: Error | null
  isAuthenticated: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}
```

**Step 2: Verify file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add types/auth.ts
git commit -m "feat: add auth type definitions"
```

---

## Task 2: Create new AuthProvider

**Files:**
- Create: `app/components/auth/AuthProvider.tsx`

**Step 1: Create AuthProvider component**

```typescript
// File: app/components/auth/AuthProvider.tsx

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { AuthContextType, User } from '@/types/auth'

// Mock user - temporary until real auth is implemented
const MOCK_USER: User = {
  id: 'admin',
  name: 'Admin User',
  role: 'admin'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Use mock user directly (no localStorage check)
    setUser(MOCK_USER)
    setLoading(false)
  }, [])

  const login = async () => {
    // Placeholder for future real auth
  }

  const logout = async () => {
    // Placeholder for future real auth
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

**Step 2: Verify file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/components/auth/AuthProvider.tsx
git commit -m "feat: add AuthProvider with mock user"
```

---

## Task 3: Update root layout to use AuthProvider

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Read current layout**

Run: `cat app/layout.tsx`

**Step 2: Replace LiffProvider with AuthProvider**

```typescript
// File: app/layout.tsx
// Change import from:
import { LiffProvider } from '@/components/LiffProvider'
// To:
import { AuthProvider } from '@/components/auth/AuthProvider'

// Then replace <LiffProvider> with <AuthProvider>
```

Expected final `app/layout.tsx`:

```typescript
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'IT Helpdesk Admin',
  description: 'Admin dashboard for IT tickets',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

**Step 3: Verify app builds**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "refactor: replace LiffProvider with AuthProvider"
```

---

## Task 4: Update create page to use useAuth

**Files:**
- Modify: `app/create/page.tsx`

**Step 1: Read current create page**

Run: `cat app/create/page.tsx`

**Step 2: Replace useLiff with useAuth**

```typescript
// File: app/create/page.tsx
// Change import from:
import { useLiff } from '@/components/LiffProvider'
// To:
import { useAuth } from '@/components/auth/AuthProvider'

// Then change { profile } to { user }
```

Expected final `app/create/page.tsx`:

```typescript
'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { TicketForm } from '@/components/TicketForm'

export default function CreateTicketPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Ticket</h1>
      <TicketForm />
    </div>
  )
}
```

**Step 3: Verify app builds**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add app/create/page.tsx
git commit -m "refactor: replace useLiff with useAuth in create page"
```

---

## Task 5: Check and update other files using useLiff

**Files:**
- Check: All TypeScript files

**Step 1: Search for remaining useLiff usage**

Run: `grep -r "useLiff" app/ --include="*.tsx" --include="*.ts"`
Expected: May find references in `app/page.tsx` or other components

**Step 2: If found, update each file**

For each file found, change:
- Import: `import { useLiff }` → `import { useAuth } from '@/components/auth/AuthProvider'`
- Hook usage: `const { profile } = useLiff()` → `const { user } = useAuth()`
- Property access: `profile?.userId` → `user?.id`, `profile?.displayName` → `user?.name`

**Step 3: Verify no more useLiff references**

Run: `grep -r "useLiff" app/ --include="*.tsx" --include="*.ts"`
Expected: No results

**Step 4: Commit**

```bash
git add app/
git commit -m "refactor: replace remaining useLiff with useAuth"
```

---

## Task 6: Remove old LiffProvider file

**Files:**
- Delete: `app/components/LiffProvider.tsx`

**Step 1: Verify no imports of LiffProvider**

Run: `grep -r "LiffProvider" app/ --include="*.tsx" --include="*.ts"`
Expected: No results (only in layout.tsx which we already updated)

**Step 2: Delete LiffProvider file**

Run: `rm app/components/LiffProvider.tsx`

**Step 3: Verify app still builds**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add app/components/LiffProvider.tsx
git commit -m "refactor: remove LiffProvider component"
```

---

## Task 7: Remove LIFF dependency

**Files:**
- Modify: `package.json`

**Step 1: Uninstall @line/liff package**

Run: `npm uninstall @line/liff`
Expected: Package removed successfully

**Step 2: Verify app builds**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove @line/liff dependency"
```

---

## Task 8: Clean up environment variables

**Files:**
- Modify: `.env.local`

**Step 1: Check for LIFF env variables**

Run: `grep -i "liff" .env.local`
Expected: May find `NEXT_PUBLIC_LIFF_ID`

**Step 2: Remove LIFF env variables**

If found, edit `.env.local` and remove lines containing:
- `NEXT_PUBLIC_LIFF_ID`
- Any other LIFF-related variables

**Step 3: Commit**

```bash
git add .env.local
git commit -m "chore: remove LIFF environment variables"
```

---

## Task 9: Update project documentation

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md` (if exists)

**Step 1: Update AGENTS.md**

Edit `AGENTS.md` to remove LIFF references:

```markdown
# IT Helpdesk Dashboard - Project Context

> **Version**: 1.5.0
> **Purpose**: Web application for submitting and tracking IT Helpdesk tickets, including image attachments and Team KPI Dashboard.
> **Integration**: Next.js + n8n Webhook + Microsoft SQL Server

## 1. Tech Stack
* **Framework**: Next.js 14 App Router
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **UI Components**: shadcn/ui
* **Charts**: Recharts
* **Authentication**: Placeholder (prepared for NextAuth.js, Clerk, etc.)
* **Database Client**: mssql (SQL Server)

## 2. System Architecture
1. **Frontend (Next.js)**: Handles UI/UX with mock authentication. Prepared for future auth integration.
2. **API Routes (Next.js)**: Dashboard queries SQL Server directly via /api/* endpoints using mssql package.
3. **API/Middleware (n8n)**: Frontend sends POST request to existing n8n webhook (Auto_Ticket_1.7) for ticket creation.
4. **Database**: Microsoft SQL Server [Dev_Born].[dbo].[ticket].
```

**Step 2: Check and update README.md**

Run: `cat README.md`
If LIFF is mentioned, remove those references.

**Step 3: Commit**

```bash
git add AGENTS.md README.md
git commit -m "docs: remove LIFF references from documentation"
```

---

## Task 10: Final verification

**Files:**
- All files

**Step 1: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Verify dev server starts**

Run: `npm run dev`
Wait for: "Ready in [time]" message
Then: Press Ctrl+C to stop

**Step 4: Search for any remaining LIFF references**

Run: `grep -ri "liff" app/ --include="*.tsx" --include="*.ts" --include="*.json"`
Expected: No results (case insensitive)

**Step 5: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup after LIFF removal"
```

---

## Task 11: Update design document reference

**Files:**
- Modify: `docs/plans/2026-03-09-remove-liff-design.md`

**Step 1: Mark design as implemented**

Add to design document:

```markdown
## Implementation Status

- [x] Design approved
- [x] Implementation plan created
- [x] Implementation completed (2026-03-09)
```

**Step 2: Commit**

```bash
git add docs/plans/2026-03-09-remove-liff-design.md
git commit -m "docs: mark LIFF removal design as implemented"
```

---

## Summary

After completing all tasks:
- ✅ LIFF integration completely removed
- ✅ New AuthProvider with mock user in place
- ✅ All components using new useAuth hook
- ✅ @line/liff dependency removed
- ✅ Documentation updated
- ✅ Ready for future auth implementation (NextAuth.js, Clerk, etc.)

## Testing Checklist

- [ ] TypeScript compiles without errors
- [ ] App builds successfully (`npm run build`)
- [ ] Dev server starts without errors (`npm run dev`)
- [ ] Create page loads with mock user
- [ ] Dashboard page loads (if it exists)
- [ ] No LIFF references remain in codebase
