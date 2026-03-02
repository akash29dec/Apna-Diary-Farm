---
description: Summary, monthly detail, PDF, export, notifications
---

────────────────────────────────────────────────────────────
7.3  SCREEN 3: MONTHLY SUMMARY  (Route: /summary)
────────────────────────────────────────────────────────────
Accessed via bottom navigation tab "Summary" (calendar icon).

LAYOUT:

  [A] Header: "Monthly Summary"
      Month selector: "← February 2026 →" (prev/next month arrows + tap for picker)

  [B] Monthly Calendar Widget (compact, 7-column grid):
      - Shows current month with colored dots per day:
        🟢 Green dot = entries exist for that day
        🟡 Yellow dot = some customers pending (partial entries)
        ⚪ Grey = no entries / future date
      - Tap any past day → navigate to Screen 1 (/daily-entry) for that date

  [C] Month-Level Summary Cards (horizontal scroll row):
      ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
      │ Total Billed │  │  Total Paid  │  │  Total Dues  │
      │   ₹12,450    │  │   ₹10,000    │  │    ₹2,450    │
      └──────────────┘  └──────────────┘  └──────────────┘

  [D] Customer List for that month (sorted A–Z):

      ┌────────────────────────────────────────────────────┐
      │  RAMESH GUPTA                              ›       │
      │  🥛 45L milk  🧀 2.5kg paneer              total  │
      │  Billed: ₹900  Paid: ₹900  ✅ Clear               │
      └────────────────────────────────────────────────────┘

      ┌────────────────────────────────────────────────────┐
      │  SUNITA DEVI                               ›       │
      │  🥛 30L milk                               total  │
      │  Billed: ₹600  Paid: ₹400  ⚠️ Due: ₹200          │
      │  (+ ₹150 due from Jan 2026)                        │
      └────────────────────────────────────────────────────┘

      Past dues from prior months are shown inline as a secondary line
      in orange/red, e.g., "+ ₹150 due from Jan 2026".
      Total outstanding = current month dues + all past month dues.

  Tapping any customer card navigates to Screen 4 (Customer Monthly Detail).

────────────────────────────────────────────────────────────
7.4  SCREEN 4: CUSTOMER MONTHLY DETAIL  (Route: /summary/:customerId?month=YYYY-MM)
────────────────────────────────────────────────────────────
LAYOUT:

  [A] Header: "RAMESH GUPTA — February 2026" with ← back

  [B] Summary Banner:
      Billed: ₹900  |  Paid: ₹900  |  Balance: ₹0 (green = clear)
      OR
      Billed: ₹600  |  Paid: ₹400  |  Due: ₹200 (red = outstanding)
      Past Dues: ₹150 (from Jan 2026)
      TOTAL OUTSTANDING: ₹350

  [C] Daily Breakdown Table:
      ──────────────────────────────────────────────────────
      Date       Milk(L)  Paneer  Dahi   Amount   Edit
      ──────────────────────────────────────────────────────
      01 Feb     0.5L     —       —      ₹9.00    [✏️]
      02 Feb     0.5L     0.25kg  —      ₹49.00   [✏️]
      03 Feb     —        —       —      No entry  [+]
      04 Feb     1.0L     —       0.5kg  ₹53.00   [✏️]
      ...
      ──────────────────────────────────────────────────────
      Tapping [✏️] opens an inline edit row for that day's entry.
      Tapping [+] for a day with no entry opens EntryForm for that date.

      Edit Row Behavior:
      - Shows same fields as EntryForm (milk qty, paneer toggle, dahi toggle)
      - Shows: "⚠️ Editing past entry — customer will be notified via WhatsApp"
        (Phase 3 feature — stub the UI now, wire in Phase 3)
      - Save edit → updates ONLY that day's record
      - Logs edit to AuditLog table with timestamp, old values, new values
      - Audit log is NEVER shown to customers (only internal)

  [D] Payment Section:
      ┌──────────────────────────────────────────────────────────┐
      │  PAYMENTS RECEIVED                     [+ Add Payment]   │
      ├──────────────────────────────────────────────────────────┤
      │  10 Feb 2026 — ₹500 paid    Cash       [✏️] [🗑️]        │
      │  20 Feb 2026 — ₹400 paid    UPI        [✏️] [🗑️]        │
      └──────────────────────────────────────────────────────────┘

      Add Payment Modal:
        Date: [today, editable]
        Amount: [______] ₹
        Method: [ Cash | UPI | Other ]
        Notes:  [optional]
        [SAVE PAYMENT]

      Payments are shown in the PDF statement.

  [E] Past Dues Section (collapsible):
      ┌──────────────────────────────────────────────────────────┐
      │  PAST DUES                                    [▼ Show]   │
      ├──────────────────────────────────────────────────────────┤
      │  January 2026: Billed ₹600, Paid ₹450, Due ₹150         │
      │  December 2025: Billed ₹550, Paid ₹550, Due ₹0 ✅       │
      └──────────────────────────────────────────────────────────┘

  [F] Action Buttons:
      [  📄 GENERATE PDF STATEMENT  ]  (primary orange, full width, 56px)
      [  📥 EXPORT CSV              ]  (outlined, full width)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 11 — PDF GENERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Library: jsPDF + html2canvas (client-side, no server needed, free)
         OR @react-pdf/renderer (if richer layout control is needed)
         Recommendation: Use @react-pdf/renderer for cleaner table layouts.

Format: A4 (210mm × 297mm), Portrait orientation.
Filename: Apna_Diary_{CustomerName}_{Month}_{Year}.pdf

PDF LAYOUT (single customer monthly statement):

┌──────────────────────────────────────────────────────────────┐
│  HEADER                                                       │
│  [Apna Diary Logo]         Apna Diary | Fresh & Pure Daily 🥛│
│  Shop: {seller_name}                                          │
│  Phone: {seller_phone}                                        │
│  Statement for: {customer_name}  |  Phone: {customer_phone}  │
│  Period: February 2026                                        │
│  Generated: 2 March 2026                                      │
├──────────────────────────────────────────────────────────────┤
│  DAILY BREAKDOWN                                              │
│  ┌─────┬──────────┬────────┬───────┬──────────┬──────────┐  │
│  │ Date│ Milk (L) │Paneer  │ Dahi  │  Rate    │ Amount   │  │
│  ├─────┼──────────┼────────┼───────┼──────────┼──────────┤  │
│  │01Feb│   0.5    │  —     │  —    │ ₹18/L    │ ₹9.00    │  │
│  │02Feb│   0.5    │ 0.25kg │  —    │ ₹18/L    │ ₹96.50   │  │
│  │ ... │  ...     │ ...    │ ...   │  ...     │  ...     │  │
│  ├─────┴──────────┴────────┴───────┴──────────┴──────────┤  │
│  │                      Monthly Total: ₹XXX.XX            │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  PAYMENT DETAILS                                              │
│  10 Feb — ₹500 (Cash)                                        │
│  20 Feb — ₹400 (UPI)                                         │
│  Total Paid this month: ₹900.00                              │
├──────────────────────────────────────────────────────────────┤
│  BALANCE SUMMARY                                              │
│  Carried Forward (from Jan 2026): ₹150.00 (Due)             │
│  This Month Billed:               ₹600.00                    │
│  This Month Paid:                 ₹900.00                    │
│  ─────────────────────────────────────────────────────────── │
│  TOTAL OUTSTANDING:               ₹-150.00 (Advance Paid)    │
│  OR: TOTAL DUE:                   ₹200.00                    │
├──────────────────────────────────────────────────────────────┤
│  FOOTER                                                       │
│  Thank you for choosing Apna Diary 🙏                         │
│  This is a computer-generated statement. No signature needed. │
│  Apna Diary | Fresh & Pure Daily | Page 1 of 1               │
└──────────────────────────────────────────────────────────────┘

Rules:
- Days with zero entry (no purchase, "Mark as No Purchase") are NOT shown.
- Days where customer had no interaction at all are NOT shown.
- Custom prices are used per-row, shown in "Rate" column.
- Audit log edits are NEVER shown in PDF.
- If payment method is "UPI", show it. If "Cash", show it.
- PDF is generated client-side and downloaded immediately.
- Option to SHARE PDF via system share sheet (for WhatsApp/email sharing).
