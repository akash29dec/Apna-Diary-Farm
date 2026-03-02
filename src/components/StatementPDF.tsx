// ========================================
// Statement PDF Component (Phase 2)
// @react-pdf/renderer — A4 Portrait
// ========================================

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { DailyEntry, Payment, CustomerMonthSummary, Settings } from '@/types';
import { format } from 'date-fns';

// Register Poppins font (Google Fonts CDN)
Font.register({
  family: 'Poppins',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrFJA.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLEj6V1s.ttf',
      fontWeight: 600,
    },
    {
      src: 'https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLCz7V1s.ttf',
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Poppins',
    fontSize: 10,
    padding: 30,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2B7FBF',
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#2B7FBF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#5A6A7A',
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 9,
    color: '#1A1A2E',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1A1A2E',
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#D0E8F2',
    paddingBottom: 4,
  },
  table: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#EBF4FB',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#2B7FBF',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#D0E8F2',
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#D0E8F2',
    backgroundColor: '#F8FCFF',
  },
  colDate: { width: '14%', fontSize: 9 },
  colMilk: { width: '14%', fontSize: 9, textAlign: 'center' as const },
  colPaneer: { width: '14%', fontSize: 9, textAlign: 'center' as const },
  colDahi: { width: '14%', fontSize: 9, textAlign: 'center' as const },
  colRate: { width: '22%', fontSize: 8, textAlign: 'center' as const },
  colAmount: { width: '22%', fontSize: 9, textAlign: 'right' as const, fontWeight: 600 },
  headerText: {
    fontWeight: 600,
    fontSize: 9,
    color: '#2B7FBF',
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: '#EBF4FB',
    borderTopWidth: 2,
    borderTopColor: '#2B7FBF',
  },
  totalText: {
    fontWeight: 700,
    fontSize: 10,
    color: '#1A1A2E',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#EBF4FB',
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#5A6A7A',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 600,
    color: '#1A1A2E',
  },
  outstandingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#2B7FBF',
  },
  outstandingLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#1A1A2E',
  },
  outstandingValueDue: {
    fontSize: 12,
    fontWeight: 700,
    color: '#E63946',
  },
  outstandingValueClear: {
    fontSize: 12,
    fontWeight: 700,
    color: '#27AE60',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#D0E8F2',
    paddingTop: 8,
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: 8,
    color: '#5A6A7A',
    marginBottom: 2,
  },
});

interface StatementPDFProps {
  customerSummary: CustomerMonthSummary;
  entries: DailyEntry[];
  payments: Payment[];
  settings: Settings;
  yearMonth: string;
}

export default function StatementPDF({
  customerSummary,
  entries,
  payments,
  settings,
  yearMonth,
}: StatementPDFProps) {
  const customer = customerSummary.customer;
  const monthLabel = format(
    new Date(parseInt(yearMonth.split('-')[0] ?? '2026'), parseInt(yearMonth.split('-')[1] ?? '1') - 1),
    'MMMM yyyy'
  );

  // Filter only entries with purchases
  const purchaseEntries = entries.filter((e) => e.total_amount > 0);
  const totalBilled = purchaseEntries.reduce((s, e) => s + e.total_amount, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount_paid, 0);

  // Carried forward (past dues)
  const carriedForward = customerSummary.totalPastDue;
  const totalOutstanding = carriedForward + totalBilled - totalPaid;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Apna Diary | Fresh &amp; Pure Daily 🥛</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>Shop: {settings.seller_name || 'Apna Diary'}</Text>
            <Text style={styles.infoText}>Phone: {settings.seller_phone || '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>
              Statement for: {customer.name} | Phone: {customer.phone}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>Period: {monthLabel}</Text>
            <Text style={styles.infoText}>
              Generated: {format(new Date(), 'dd MMMM yyyy')}
            </Text>
          </View>
        </View>

        {/* Daily Breakdown Table */}
        <Text style={styles.sectionTitle}>DAILY BREAKDOWN</Text>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colDate, styles.headerText]}>Date</Text>
            <Text style={[styles.colMilk, styles.headerText]}>Milk (L)</Text>
            <Text style={[styles.colPaneer, styles.headerText]}>Paneer</Text>
            <Text style={[styles.colDahi, styles.headerText]}>Dahi</Text>
            <Text style={[styles.colRate, styles.headerText]}>Rate</Text>
            <Text style={[styles.colAmount, styles.headerText]}>Amount</Text>
          </View>

          {/* Data Rows */}
          {purchaseEntries.map((entry, idx) => (
            <View
              key={entry.id}
              style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={styles.colDate}>
                {format(new Date(entry.entry_date + 'T00:00:00'), 'dd MMM')}
              </Text>
              <Text style={styles.colMilk}>
                {entry.milk_qty > 0 ? entry.milk_qty.toString() : '—'}
              </Text>
              <Text style={styles.colPaneer}>
                {entry.paneer_qty > 0 ? `${entry.paneer_qty}kg` : '—'}
              </Text>
              <Text style={styles.colDahi}>
                {entry.dahi_qty > 0 ? `${entry.dahi_qty}kg` : '—'}
              </Text>
              <Text style={styles.colRate}>
                {entry.milk_qty > 0 ? `₹${entry.milk_price_used}/L` : ''}
                {entry.paneer_qty > 0 ? ` ₹${entry.paneer_price_used}/kg` : ''}
              </Text>
              <Text style={styles.colAmount}>
                ₹{entry.total_amount.toFixed(2)}
              </Text>
            </View>
          ))}

          {/* Total Row */}
          <View style={styles.totalRow}>
            <Text style={[styles.colDate, styles.totalText]}>Total</Text>
            <Text style={[styles.colMilk, styles.totalText]}>
              {purchaseEntries.reduce((s, e) => s + e.milk_qty, 0).toFixed(1)}L
            </Text>
            <Text style={[styles.colPaneer, styles.totalText]}>
              {purchaseEntries.reduce((s, e) => s + e.paneer_qty, 0).toFixed(2)}kg
            </Text>
            <Text style={[styles.colDahi, styles.totalText]}>
              {purchaseEntries.reduce((s, e) => s + e.dahi_qty, 0).toFixed(2)}kg
            </Text>
            <Text style={styles.colRate}></Text>
            <Text style={[styles.colAmount, styles.totalText]}>
              ₹{totalBilled.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Payment Details */}
        <Text style={styles.sectionTitle}>PAYMENT DETAILS</Text>
        {payments.length > 0 ? (
          <View>
            {payments.map((p) => (
              <View key={p.id} style={styles.paymentRow}>
                <Text style={styles.infoText}>
                  {format(new Date(p.payment_date + 'T00:00:00'), 'dd MMM yyyy')} — ₹
                  {p.amount_paid.toFixed(2)} ({p.payment_method})
                </Text>
              </View>
            ))}
            <View style={[styles.paymentRow, { marginTop: 4 }]}>
              <Text style={[styles.infoText, { fontWeight: 600 }]}>
                Total Paid this month: ₹{totalPaid.toFixed(2)}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.infoText}>No payments recorded</Text>
        )}

        {/* Balance Summary */}
        <View style={styles.summaryBox}>
          <Text
            style={[styles.sectionTitle, { marginTop: 0, borderBottomWidth: 0 }]}
          >
            BALANCE SUMMARY
          </Text>

          {carriedForward > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Carried Forward (past dues):
              </Text>
              <Text style={[styles.summaryValue, { color: '#E63946' }]}>
                ₹{carriedForward.toFixed(2)}
              </Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>This Month Billed:</Text>
            <Text style={styles.summaryValue}>₹{totalBilled.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>This Month Paid:</Text>
            <Text style={styles.summaryValue}>₹{totalPaid.toFixed(2)}</Text>
          </View>

          <View style={styles.outstandingRow}>
            <Text style={styles.outstandingLabel}>
              {totalOutstanding > 0
                ? 'TOTAL DUE:'
                : totalOutstanding < 0
                  ? 'ADVANCE PAID:'
                  : 'BALANCE:'}
            </Text>
            <Text
              style={
                totalOutstanding > 0
                  ? styles.outstandingValueDue
                  : styles.outstandingValueClear
              }
            >
              ₹{Math.abs(totalOutstanding).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for choosing Apna Diary 🙏
          </Text>
          <Text style={styles.footerText}>
            This is a computer-generated statement. No signature needed.
          </Text>
          <Text style={styles.footerText}>
            Apna Diary | Fresh &amp; Pure Daily | Page 1 of 1
          </Text>
        </View>
      </Page>
    </Document>
  );
}
