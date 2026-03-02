// ========================================
// CSV Export Utility (Phase 2)
// ========================================

import Papa from 'papaparse';
import type { DailyEntry, Payment, Customer } from '@/types';
import { format } from 'date-fns';

interface CSVRow {
  Date: string;
  'Milk (L)': number;
  'Paneer (kg)': number;
  'Dahi (kg)': number;
  'Milk Rate': string;
  'Paneer Rate': string;
  'Dahi Rate': string;
  Amount: string;
}

interface PaymentRow {
  Date: string;
  Amount: string;
  Method: string;
  Notes: string;
}

/**
 * Generate and download a CSV file for a customer's monthly data.
 * Filename: Apna_Diary_{CustomerName}_{Month}_{Year}.csv
 */
export function exportCustomerMonthCSV(
  customer: Customer,
  entries: DailyEntry[],
  payments: Payment[],
  yearMonth: string
): void {
  // Build entry rows — only entries with purchase
  const entryRows: CSVRow[] = entries
    .filter((e) => e.total_amount > 0)
    .map((e) => ({
      Date: format(new Date(e.entry_date + 'T00:00:00'), 'dd MMM yyyy'),
      'Milk (L)': e.milk_qty,
      'Paneer (kg)': e.paneer_qty,
      'Dahi (kg)': e.dahi_qty,
      'Milk Rate': `₹${e.milk_price_used}/L`,
      'Paneer Rate': `₹${e.paneer_price_used}/kg`,
      'Dahi Rate': `₹${e.dahi_price_used}/kg`,
      Amount: `₹${e.total_amount.toFixed(2)}`,
    }));

  // Build payment rows
  const paymentRows: PaymentRow[] = payments.map((p) => ({
    Date: format(new Date(p.payment_date + 'T00:00:00'), 'dd MMM yyyy'),
    Amount: `₹${p.amount_paid.toFixed(2)}`,
    Method: p.payment_method,
    Notes: p.notes ?? '',
  }));

  const totalBilled = entries
    .filter((e) => e.total_amount > 0)
    .reduce((sum, e) => sum + e.total_amount, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount_paid, 0);

  // Generate CSV sections
  const entriesCSV = Papa.unparse(entryRows);
  const paymentsCSV = Papa.unparse(paymentRows);
  const summaryCSV = Papa.unparse([
    { Label: 'Total Billed', Value: `₹${totalBilled.toFixed(2)}` },
    { Label: 'Total Paid', Value: `₹${totalPaid.toFixed(2)}` },
    { Label: 'Balance', Value: `₹${(totalBilled - totalPaid).toFixed(2)}` },
  ]);

  const fullCSV = [
    `Customer: ${customer.name}`,
    `Phone: ${customer.phone}`,
    `Period: ${yearMonth}`,
    '',
    '--- Daily Entries ---',
    entriesCSV,
    '',
    '--- Payments ---',
    paymentsCSV,
    '',
    '--- Summary ---',
    summaryCSV,
  ].join('\n');

  // Trigger download
  const safeCustomerName = customer.name.replace(/\s+/g, '_');
  const parts = yearMonth.split('-');
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthLabel = monthNames[parseInt(parts[1] ?? '1', 10) - 1] ?? 'Jan';
  const filename = `Apna_Diary_${safeCustomerName}_${monthLabel}_${parts[0]}.csv`;

  const blob = new Blob([fullCSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
