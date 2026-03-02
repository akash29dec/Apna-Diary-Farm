---
trigger: always_on
---

# Apna Diary — Agent Coding Rules

## Stack (non-negotiable)
- Frontend: React 18 + Vite + TypeScript
- Styling: TailwindCSS v3 (no inline styles)
- State: Zustand
- Routing: React Router v6
- DB (cloud): Supabase (PostgreSQL)
- DB (offline): IndexedDB via `idb` library
- PDF: @react-pdf/renderer
- Notifications: Web Push API + Service Worker
- PWA: vite-plugin-pwa + Workbox
- Hosting target: Vercel (free tier)

## Code Style
- Every component goes in its own file under src/components/
- Every screen goes in src/screens/
- All Supabase calls go in src/services/supabase.ts
- All IndexedDB calls go in src/services/localDB.ts
- Business logic goes in src/utils/ (never inside components)
- Never hardcode prices, phone numbers, or timezone strings

## Accessibility (mandatory)
- All buttons minimum 44×44px touch target
- Minimum font size 18sp (use Tailwind `text-lg` as base)
- All interactive elements must have aria-label
- Use high contrast color palette from the spec

## Phase Gating
- Phase 1 features MUST be fully working before starting Phase 2
- WhatsApp features (Phase 3) — create UI stubs, wire logic later
- Multi-user/Auth (Phase 4) — do not implement yet, only scaffold

## Do NOT
- Use class-based React components
- Use any paid API or paid service
- Use localStorage (use IndexedDB only)
- Skip TypeScript types (every function must be typed)
