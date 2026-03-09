# Design: Remove LIFF + Prepare for Future Auth

**Date:** 2026-03-09
**Status:** Approved
**Version:** 1.0

---

## Overview

Remove LINE LIFF integration from the IT Helpdesk Dashboard project and create a placeholder authentication structure that can accommodate real auth solutions (NextAuth.js, Clerk, Auth0, etc.) in the future.

## Background

- Current project uses mock LIFF implementation via localStorage
- No longer needs LINE integration
- Want to prepare clean structure for future real authentication

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Next.js App                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │           AuthProvider (NEW)                 │   │
│  │  ┌────────────────────────────────────────┐ │   │
│  │  │  Mock User: { id: "admin", name: ... }  │ │   │
│  │  │  Status: "authenticated" (fixed)        │ │   │
│  │  └────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────┘   │
│                      ↓                              │
│  ┌─────────────────────────────────────────────┐   │
│  │     useAuth() Hook (NEW)                    │   │
│  │  - user, loading, isAuthenticated           │   │
│  └─────────────────────────────────────────────┘   │
│                      ↓                              │
│  ┌─────────────────────────────────────────────┐   │
│  │  Components (Dashboard, Create, etc.)       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Files to Remove

| File | Reason |
|------|--------|
| `app/components/LiffProvider.tsx` | LIFF-specific code |
| `types/liff.ts` (if exists) | LIFF types |

## Files to Create

| File | Description |
|------|-------------|
| `app/components/auth/AuthProvider.tsx` | New Auth provider with mock user |
| `types/auth.ts` | Auth-related types |

## Files to Modify

| File | Changes |
|------|---------|
| `app/layout.tsx` | Change `LiffProvider` → `AuthProvider` |
| `app/create/page.tsx` | Change `useLiff()` → `useAuth()` |
| `app/page.tsx` (if uses useLiff) | Change `useLiff()` → `useAuth()` |
| `package.json` | Remove `@line/liff` dependency |

## New Type Definitions

**File:** `types/auth.ts`

```typescript
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
  // Placeholder functions for future Auth
  login: () => Promise<void>
  logout: () => Promise<void>
}
```

## New AuthProvider Implementation

**File:** `app/components/auth/AuthProvider.tsx`

```typescript
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

## Migration Example

**Before (`app/create/page.tsx`):**
```tsx
import { useLiff } from '@/components/LiffProvider'

export default function CreateTicketPage() {
  const { profile, loading } = useLiff()
  // ...
}
```

**After (`app/create/page.tsx`):**
```tsx
import { useAuth } from '@/components/auth/AuthProvider'

export default function CreateTicketPage() {
  const { user, loading } = useAuth()
  // ...
}
```

## Cleanup Tasks

1. Remove localStorage data (if exists):
   - `localStorage.removeItem('liff_user_id')`
   - `localStorage.removeItem('liff_display_name')`

2. Remove dependency:
   ```bash
   npm uninstall @line/liff
   ```

3. Update `.env.local`:
   - Remove `NEXT_PUBLIC_LIFF_ID` (if exists)

## Future Auth Compatibility

This structure supports:
- **NextAuth.js** - Add `[...nextauth]` route, modify AuthProvider
- **Clerk** - Replace AuthProvider with `<ClerkProvider>`
- **Auth0** - Use `@auth0/auth0-react` Provider
- **Supabase Auth** - Use Supabase Auth context

## Out of Scope (Not Doing Now)

- Login UI
- Protected routes
- Role-based access control
- Session management

## Implementation Steps

See separate implementation plan.

---

## Implementation Status

- [x] Design approved
- [x] Implementation plan created
- [x] Implementation completed (2026-03-09)

---

**Approved by:** User
**Next Step:** Create implementation plan via writing-plans skill
