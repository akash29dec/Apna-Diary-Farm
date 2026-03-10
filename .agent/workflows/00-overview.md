---
description: Project overview + stack + phases + design
---

╔══════════════════════════════════════════════════════════════════════════════════╗
║              Antigravity Build Spec: Apna Diary                                ║
║              Version 1.0 | Date: March 2, 2026 | Owner: Deepanshu Lohumi       ║
╚══════════════════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — TITLE & SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Apna Diary is a mobile-first, offline-capable Progressive Web App (PWA) designed
for a small-scale Indian dairy seller (specifically an elder parent) to record
daily milk, paneer, and dahi sales for each customer, manage dues and payments,
generate monthly PDF statements per customer, and (in a later phase) automatically
send WhatsApp receipts to each customer every night at 10:00 PM IST. The app must
work on low-end Android phones without internet connectivity, sync to Supabase
cloud when online, and be entirely free to build and host. It will begin as a
single-user app and scale to multi-user with Google Auth in the final phase.

App Name:     Apna Diary
Tagline:      Fresh & Pure Daily 🥛✨
Country Code: +91 (India)
Timezone:     Asia/Kolkata (IST, UTC+5:30)
Language:     English (UI) | English + Hindi emoji/tone (WhatsApp messages)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — PRIMARY PERSONA & KEY UX GOALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Primary Persona:
  Name:        "Papaji" (Deepanshu's father, the daily seller)
  Age:         55–70 years
  Device:      Low-end to mid-range Android phone (Android 8+)
  Tech Skills: Basic smartphone use; can tap, scroll, type numbers
  Daily Goal:  Open app → see customer list → enter today's sales → done
  Pain Points: Small fonts, too many steps, confusing navigation, no offline use

Secondary Persona (Phase 4+):
  Multiple dairy sellers across India, each with their own Google account,
  managing their own customer base through the same platform.

Key UX Goals:
  1. ZERO learning curve — first screen must be the data entry screen, always
  2. Maximum 3 taps to record a customer's full daily purchase
  3. Large, finger-friendly touch targets (minimum 44×44 px)
  4. Minimum 18sp font everywhere; 22sp for primary data fields
  5. High contrast color scheme (WCAG AA minimum)
  6. Clear success/error toasts after every action
  7. Beautiful, clean dairy-themed visual design that looks professional
  8. Works perfectly offline — no "no connection" errors during core tasks

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — RECOMMENDED TECH STACK (100% FREE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Layer               | Technology                    | Why / Free Tier
--------------------|-------------------------------|------------------------------------
Frontend Framework  | React 18 + Vite               | Fast HMR, small bundle, PWA plugin
Styling             | TailwindCSS v3                | Easy large spacing/fonts for elders
PWA Setup           | vite-plugin-pwa + Workbox     | Service worker, manifest, caching
Offline Storage     | IndexedDB via `idb` library   | Browser-native, large capacity
Cloud Database      | Supabase (PostgreSQL)         | Free tier: 500MB DB, 1GB storage,
                    |                               | built-in Auth, Row-Level Security,
                    |                               | Realtime WebSockets, REST API
Auth (Phase 4)      | Supabase Auth + Google OAuth  | Free, built-in, no extra service
State Management    | Zustand                       | Lightweight, no boilerplate
Routing             | React Router v6               | Standard, well-documented
PDF Generation      | jsPDF + html2canvas           | Client-side, no server needed
Date Handling       | date-fns + date-fns-tz        | Accurate IST timezone handling
Notifications       | Web Push API + Service Worker | Local push on Android PWA
WhatsApp (Phase 3)  | Meta WhatsApp Business        | Official API, ₹1500/month
Budget              | Cloud API + Supabase          | ~8000–10000 messages/month,
Security            | Edge Functions                | no n8n, server-side token 
Hosting             | Vercel (free tier)            | HTTPS auto, 100GB bandwidth/month,
                    |                               | CI/CD from GitHub
Icons               | Lucide React                  | Clean, consistent icon set
Toast Alerts        | react-hot-toast               | Simple, accessible notifications
CSV Export          | Papa Parse                    | Client-side CSV generation

NOTE ON DATABASE CHOICE:
Supabase wins over MongoDB for this project because:
  - Dairy records are highly relational (customers → entries → payments → prices)
  - Built-in Google Auth is ready for Phase 4 multi-user expansion
  - Row-Level Security means Phase 4 data isolation between sellers is trivial
  - Free tier is more generous than MongoDB Atlas free tier
  - SQL queries are far easier for monthly totals, dues calculations, aggregates
  - Supabase Storage handles PDF backup files natively

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — DEVELOPMENT PHASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 1 (Core — Build First):
  - PWA setup (manifest, service worker, offline caching)
  - Customer management (add/edit/delete)
  - Daily data entry screen (milk, paneer, dahi)
  - Global & per-customer pricing
  - Alphabetical sort + "move to end after save" logic
  - Date navigation (prev/next arrows + date picker)
  - Auto-save drafts
  - IndexedDB offline-first storage
  - Supabase sync when online
  - Edit logging / audit trail
  - Basic dues & payment tracking

PHASE 2 (Summary & PDF):
  - Monthly summary screen with calendar
  - Customer monthly detail view
  - Dues / extra-paid calculation
  - Payment entry (add/edit/delete payments)
  - PDF generation for single customer monthly statement
  - CSV export
  - Local push notifications (daily reminder to seller)
  - Past dues (carry-forward from previous months)

PHASE 3 (WhatsApp Automation — Second-to-Last):
  - Official Meta WhatsApp Business Cloud API (no n8n)
  - Supabase Edge Function as secure server-side sender
  - Instant send on Save Entry (daily receipt)
  - Instant send on Add Customer (welcome message)
  - Instant send on Edit past entry (correction notification)
  - Send PDF statement summary via WhatsApp from monthly detail screen
  - WhatsApp consent flow on customer add
  - Send log in Supabase (whatsapp_send_log)
  - Settings: API connection test + send log viewer

PHASE 4 (Multi-User + iOS — Last Phase):
  - Google Auth login via Supabase Auth
  - Per-account data isolation (Row-Level Security)
  - Admin panel (reset day, rollback entries)
  - iOS PWA support and testing
  - Multiple sellers / accounts on same platform
  - Multi-device real-time sync via Supabase Realtime

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5 — PWA REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Web App Manifest (manifest.webmanifest):
{
  "name": "Apna Diary",
  "short_name": "Apna Diary",
  "description": "Fresh & Pure Daily Dairy Records",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FAFFFE",
  "theme_color": "#2B7FBF",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}

Service Worker Strategy (Workbox via vite-plugin-pwa):
  - App Shell:          CacheFirst (HTML, CSS, JS bundles)
  - Static Assets:      CacheFirst (icons, fonts, images)
  - Supabase API calls: NetworkFirst with IndexedDB fallback
  - Background Sync:    Register sync tag "apna-diary-sync" for pending writes
  - Offline Fallback:   Serve cached data from IndexedDB when offline

PWA Install Prompt:
  - Show "Add to Home Screen" banner after 2nd app visit
  - Custom install button in Settings screen
  - On install, show onboarding tips screen (3 slides, swipeable)

Minimum OS Support:
  - Android 8.0+ (API level 26) — covers ~95% of Indian Android market
  - iOS 16+ (Phase 4 only)
  - Chrome 90+, Firefox 90+, Samsung Internet 14+

HTTPS: Automatically handled by Vercel deployment.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6 — BRANDING & DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Color Palette:
  Primary Blue:     #2B7FBF  (calm, trustworthy — header, primary buttons)
  Primary Light:    #EBF4FB  (light blue — card backgrounds, hover states)
  Accent Green:     #27AE60  (success states, "Saved" toasts, paid badges)
  Accent Orange:    #F4A261  (CTAs, "Save Entry" button, highlights)
  Warning Red:      #E63946  (dues badge, error toasts, delete actions)
  Background:       #FAFFFE  (near-white with slight cream — easy on elder eyes)
  Surface White:    #FFFFFF  (cards, modals)
  Text Primary:     #1A1A2E  (dark navy — main text, high contrast)
  Text Secondary:   #5A6A7A  (labels, helper text)
  Border:           #D0E8F2  (subtle blue-tinted borders)

Typography (import from Google Fonts — free):
  Primary Font:  "Poppins" (rounded, friendly, excellent readability)
  Sizes:
    H1 (Screen Title):     28sp / bold
    H2 (Section Header):   22sp / semibold
    Body (Data Fields):    18sp / regular
    Labels:                16sp / medium
    Helper / Captions:     14sp / regular
    MINIMUM anywhere:      14sp (never below)

Logo Concept:
  - A stylized milk drop containing a small diary/book icon
  - Color: White on primary blue background
  - Generate SVG logo using the name "Apna Diary" + milk drop icon
  - Use Lucide's "droplets" + "book-open" icons composed together if custom
    SVG is not feasible

Touch Target Rules:
  - All tappable elements: minimum 44×44 px
  - Primary action buttons (Save, Generate PDF): 56px height, full width
  - Toggle switches: 52px wide × 32px tall
  - Bottom navigation tabs: 72px tall
  - Input fields: 56px tall with 18sp text and 16px padding

Spacing System (Tailwind custom config):
  - Section padding: 16px
  - Card padding: 16px
  - Between cards: 12px gap
  - Button vertical padding: 16px