---
description: Core app
---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7 — SCREEN-BY-SCREEN SPECIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────────────────────
7.1  SCREEN 1: DAILY DATA ENTRY  (Route: /)
────────────────────────────────────────────────────────────
This is the HOME screen. App always opens here. No other screen is shown first.

LAYOUT (top to bottom):
  [A] App Header Bar (fixed top, 56px tall, primary blue #2B7FBF)
      - Left:  Apna Diary logo + wordmark (white)
      - Right: Settings icon (gear, 28px, white, navigates to /settings)

  [B] Date Navigator Bar (sticky below header, white bg, shadow)
      - Left arrow "←"  (44×44 tap area, navigates to previous day)
      - Center: Date display "Monday, 2 March 2026" (22sp bold, tappable
        to open calendar date picker modal)
      - Right arrow "→" (44×44 tap area, navigates to next day;
        DISABLED and grayed if date is today or future)
      - Small calendar icon next to date text (opens DatePicker modal)

  [C] Summary Strip (below date bar, light blue bg #EBF4FB, 64px tall)
      - Left:  "Customers: X"       (total customers)
      - Center: "Pending: Y"        (not yet entered today)
      - Right:  "Today's Total: ₹Z" (sum of all today's entries)
      All figures update in real time as entries are saved.

  [D] Customer List (scrollable, takes remaining screen height)
      Each customer is rendered as a CustomerCard component:

      ┌──────────────────────────────────────────────────┐
      │  [Avatar initials circle]  RAMESH GUPTA          │
      │  🥛 Not entered yet          ›  [Tap to expand] │
      └──────────────────────────────────────────────────┘

      When tapped, card EXPANDS in-place (no navigation) to show EntryForm:

      ┌──────────────────────────────────────────────────────────┐
      │  RAMESH GUPTA                               [✕ collapse] │
      ├──────────────────────────────────────────────────────────┤
      │  🥛 Milk (litres)                                        │
      │  [ − ]  [ 0.50 ]  [ + ]   (stepper, 0.25 increment)    │
      │         or type manually (number keyboard)               │
      │                                                          │
      │  🧀 Paneer   [ OFF ●───── ]  (toggle, default OFF)      │
      │     [only shown when toggled ON]                         │
      │     Paneer (kg): [ 0.00 ]  (number input, 2 decimal)    │
      │                                                          │
      │  🥣 Dahi     [ OFF ●───── ]  (toggle, default OFF)      │
      │     [only shown when toggled ON]                         │
      │     Dahi (kg):   [ 0.00 ]  (number input, 2 decimal)    │
      │                                                          │
      │  Price: ₹18.50/L milk  [custom price badge if override] │
      │  Amount: ₹9.25 today                                    │
      │                                                          │
      │  [       SAVE ENTRY       ]  (orange button, 56px tall) │
      │  [    Mark as No Purchase  ]  (ghost/text button)       │
      └──────────────────────────────────────────────────────────┘

  Ordering Rules (see Section 8 for full logic):
  - Customers not yet entered today → sorted A–Z by name
  - Customers already entered today → moved to bottom, in order of entry time
  - "Mark as No Purchase" also moves customer to bottom with zero-entry

  Draft Auto-Save:
  - As soon as any field is changed in EntryForm, save draft to IndexedDB
  - Show small "Draft saved" indicator below the form (not a toast)
  - Draft is shown with a 🔵 dot on the CustomerCard
  - If app is closed and reopened, draft is restored automatically
  - Draft is only cleared after explicit "SAVE ENTRY" tap

  After Save:
  - Green toast: "✅ Entry saved for Ramesh Gupta"
  - Customer card collapses and moves to bottom of list
  - Summary Strip totals update immediately

  "Mark as No Purchase" behavior:
  - Saves a zero-entry (all quantities 0) for that day
  - Moves customer to bottom
  - No WhatsApp message sent for zero entries

  Keyboard Behavior:
  - Number pad opens for all quantity inputs
  - "Done"/"Next" on keyboard moves to next input
  - Tapping outside the card does NOT collapse it (prevents accidental closes)
  - Explicit ✕ button to collapse without saving (draft preserved)

  Error States:
  - If milk qty is 0 AND paneer/dahi toggles are OFF → show inline warning:
    "Please enter at least one quantity or mark as No Purchase"
  - If offline → show banner: "📶 Offline — entry will sync when connected"

  Accessibility:
  - aria-label on all buttons ("Save entry for Ramesh Gupta")
  - aria-expanded on customer cards
  - Focus trap inside expanded EntryForm
  - All text min 18sp

────────────────────────────────────────────────────────────
7.2  SCREEN 2: ADD / EDIT CUSTOMER  (Routes: /customers/add, /customers/:id/edit)
────────────────────────────────────────────────────────────
Accessed via:
  - FAB (Floating Action Button) "+" on Daily Entry screen (bottom-right)
  - Long-press on a customer card → context menu → "Edit Customer"
  - Swipe-left on customer card → reveals Edit and Delete actions

LAYOUT:
  [A] Header: "Add Customer" or "Edit Customer" with ← back arrow

  [B] Form Fields (all 56px tall inputs, 18sp text):

      FULL NAME *           [__________________________]
      PHONE NUMBER *        [+91] [__________________]
                            (auto-format: +91XXXXXXXXXX)
      ADDRESS               [__________________________]
                            (optional, placeholder: "Street, City")
      NOTES                 [__________________________]
                            (optional, placeholder: "e.g., delivers at 7am")
      DEFAULT MILK QTY (L)  [ 0.50 ]
                            (pre-fills milk qty in EntryForm every day)

  [C] Custom Price Section:
      ┌──────────────────────────────────────────────────────────┐
      │  Use Custom Prices for this customer?  [ OFF ●─────── ] │
      │  (toggle; when ON, expands to show below)                │
      │                                                          │
      │  🥛 Milk Price (₹/litre):     [ _____ ]                 │
      │  🧀 Paneer Price (₹/kg):      [ _____ ]                 │
      │  🥣 Dahi Price (₹/kg):        [ _____ ]                 │
      │                                                          │
      │  Effective From: TODAY (label, not editable)             │
      │  ℹ️  "Custom prices apply from today onwards only"       │
      └──────────────────────────────────────────────────────────┘
      NOTE: Leaving a custom price field blank means that item uses
      the global price for this customer.

  [D] WhatsApp Consent Section:
      ┌──────────────────────────────────────────────────────────┐
      │  📱 WhatsApp Notifications                               │
      │  [ ✓ ] This customer agrees to receive daily WhatsApp   │
      │        messages about their purchases from Apna Diary    │
      │  (checkbox, default: checked)                            │
      │                                                          │
      │  On first save with consent=YES, send this welcome msg: │
      │  ─────────────────────────────────────────────────────  │
      │  "Namaste 🙏                                             │
      │   Welcome to the Apna Diary Family 🤍                   │
      │   We will maintain your daily dairy records carefully    │
      │   and keep you updated.                                  │
      │   Thank you for choosing us!                             │
      │   – Apna Diary 🥛"                                      │
      └──────────────────────────────────────────────────────────┘

  [E] Action Buttons:
      [       SAVE CUSTOMER       ]  (primary orange, 56px)
      [     DELETE CUSTOMER       ]  (red outlined, 56px — only in Edit mode)
      Delete shows confirmation dialog:
        "Delete Ramesh Gupta? All entries will be removed. This cannot be undone."
        [Cancel]  [Yes, Delete]

  Validation:
  - Name: required, min 2 chars, max 50 chars
  - Phone: required, must be 10 digits (stored with +91 prefix)
  - Custom prices: optional, if entered must be > 0 and < 9999

────────────────────────────────────────────────────────────
7.5  SCREEN 5: SETTINGS  (Route: /settings)
────────────────────────────────────────────────────────────
LAYOUT:

  Section: Shop Information
  - Shop / Seller Name:    [______________]  (shown on PDFs)
  - Seller Phone (+91):    [______________]  (for WhatsApp sender — Phase 3)

  Section: Global Prices
  [→ Tap to open Price Settings Screen 6]
  Shows current prices: "Milk: ₹18/L  |  Paneer: ₹350/kg  |  Dahi: ₹60/kg"

  Section: Notifications
  - Daily entry reminder:  [ON/OFF toggle]
  - Reminder time:         [08:00 AM  ▼]  (time picker)

  Section: WhatsApp (Phase 3 — show but disable in Phase 1/2)
  - WhatsApp sender number: [grayed out — "Coming Soon"]
  - Send time: 10:00 PM IST (fixed, shown as info label)
  - Test WhatsApp: [grayed out button]

  Section: Data & Backup
  - [  📥 Export All Data as CSV  ]
  - [  📄 Export All Data as PDF  ]
  - [  ☁️  Backup to Supabase Cloud  ]  (shows last backup time)
  - [  📤 Import / Restore Backup  ]

  Section: About
  - App version, Apna Diary tagline, contact info placeholder

────────────────────────────────────────────────────────────
7.6  SCREEN 6: PRICE SETTINGS  (Route: /settings/prices)
────────────────────────────────────────────────────────────
LAYOUT:

  [A] Header: "Global Prices"

  [B] Current Active Prices:
      🥛 Milk Price (₹/litre):   [ 18.00 ]
      🧀 Paneer Price (₹/kg):    [ 350.00 ]
      🥣 Dahi Price (₹/kg):      [ 60.00  ]

  [C] Info Banner:
      ℹ️  "Changing prices here will apply to NEW entries only.
           Past entries will keep the price at the time of entry."

  [D] Price History (collapsible list):
      Shows all previous global price records with effective dates.
      E.g.:
        18 Jan 2026 — Milk: ₹17/L → ₹18/L

  [E] [  SAVE NEW PRICES  ] button (orange, 56px)
      On save: creates new GlobalPrices record with today's date.
      Old record is kept in history (never deleted).

────────────────────────────────────────────────────────────
7.7  BOTTOM NAVIGATION BAR (persistent, fixed bottom)
────────────────────────────────────────────────────────────
  72px tall, white background, shadow-top.
  Three tabs:
  [📋 Daily Entry]   [📅 Summary]   [⚙️ Settings]
  Active tab shows primary blue color + bold label.
  Inactive tabs show grey icons + normal label.
  Font size: 12sp for labels, icons 24px.