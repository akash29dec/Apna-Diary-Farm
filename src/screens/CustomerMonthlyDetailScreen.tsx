// ========================================
// Customer Monthly Detail Screen (Phase 2)
// Route: /summary/:customerId?month=YYYY-MM
// ========================================

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Download, Share2, Loader2, Pencil, Settings } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import toast from 'react-hot-toast';
import type { DailyEntry, CustomerMonthSummary, Settings as AppSettings } from '@/types';
import { getCustomerById } from '@/services/localDB';
import { getEntriesByCustomerMonth, getPaymentsByCustomerMonth } from '@/services/localDB';
import { getSettings } from '@/services/localDB';
import { buildCustomerMonthSummary, formatMonthLabel } from '@/utils/summaryUtils';
import { exportCustomerMonthCSV } from '@/utils/csvExport';
import { usePaymentStore } from '@/stores/paymentStore';
import BalanceSummaryBanner from '@/components/BalanceSummaryBanner';
import DailyBreakdownTable from '@/components/DailyBreakdownTable';
import PaymentSection from '@/components/PaymentSection';
import PastDuesSection from '@/components/PastDuesSection';
import StatementPDF from '@/components/StatementPDF';
import { getISTDateString } from '@/utils/dateHelpers';

export default function CustomerMonthlyDetailScreen() {
  const { customerId } = useParams<{ customerId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const month = searchParams.get('month') || getISTDateString().substring(0, 7);

  const [summary, setSummary] = useState<CustomerMonthSummary | null>(null);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const { payments, fetchPayments } = usePaymentStore();

  const loadData = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const customer = await getCustomerById(customerId);
      if (!customer) {
        toast.error('Customer not found');
        navigate('/summary');
        return;
      }

      const [monthEntries, monthPayments, appSettings] = await Promise.all([
        getEntriesByCustomerMonth(customerId, month),
        getPaymentsByCustomerMonth(customerId, month),
        getSettings(),
      ]);

      setEntries(monthEntries);
      setSettings(appSettings ?? null);
      await fetchPayments(customerId, month);

      const customerSummary = await buildCustomerMonthSummary(
        customer,
        monthEntries,
        monthPayments,
        month
      );
      setSummary(customerSummary);
    } catch (err) {
      console.error('Failed to load customer data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [customerId, month, navigate, fetchPayments]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGeneratePDF = async () => {
    if (!summary || !settings) {
      toast.error('Data not ready');
      return;
    }

    setGeneratingPDF(true);
    try {
      const doc = (
        <StatementPDF
          customerSummary={summary}
          entries={entries}
          payments={payments}
          settings={settings}
          yearMonth={month}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);

      // Generate filename
      const safeCustomerName = summary.customer.name.replace(/\s+/g, '_');
      const parts = month.split('-');
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const monthLabel = monthNames[parseInt(parts[1] ?? '1', 10) - 1] ?? 'Jan';
      const filename = `Apna_Diary_${safeCustomerName}_${monthLabel}_${parts[0]}.pdf`;

      // Try share API first (for mobile)
      if (navigator.share && navigator.canShare) {
        try {
          const file = new File([blob], filename, { type: 'application/pdf' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `Apna Diary — ${summary.customer.name} Statement`,
              files: [file],
            });
            toast.success('PDF shared!');
            setGeneratingPDF(false);
            return;
          }
        } catch {
          // Fall through to download
        }
      }

      // Fallback: direct download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleExportCSV = () => {
    if (!summary) return;
    try {
      exportCustomerMonthCSV(summary.customer, entries, payments, month);
      toast.success('CSV downloaded!');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
      </div>
    );
  }

  if (!summary || !customerId) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-body text-text-secondary font-poppins">
          Customer not found
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="bg-primary-blue text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate('/summary')}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 min-w-touch min-h-touch"
          aria-label="Back to summary"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-body font-bold font-poppins truncate">
            {summary.customer.name}
          </h1>
          <p className="text-helper opacity-80 font-poppins">
            {formatMonthLabel(month)}
          </p>
        </div>
        {/* Edit Customer Button */}
        <button
          onClick={() => navigate(`/customers/${customerId}/edit`)}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 min-w-touch min-h-touch"
          aria-label={`Edit ${summary.customer.name}`}
        >
          <Pencil className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-8 space-y-4 pt-4">
        {/* Change Prices Button */}
        <button
          onClick={() => navigate(`/customers/${customerId}/edit`)}
          className="flex items-center gap-2 px-4 h-11 bg-primary-light rounded-xl hover:bg-primary-light/80 transition-colors min-h-touch"
          aria-label={`Change prices for ${summary.customer.name}`}
        >
          <Settings className="w-4 h-4 text-primary-blue" />
          <span className="text-label font-semibold text-primary-blue font-poppins">
            ⚙️ Change Prices
          </span>
        </button>

        {/* Balance Banner */}
        <BalanceSummaryBanner summary={summary} />

        {/* Daily Breakdown */}
        <DailyBreakdownTable
          entries={entries}
          yearMonth={month}
          customerId={customerId}
          onRefresh={loadData}
        />

        {/* Payments */}
        <PaymentSection
          payments={payments}
          customerId={customerId}
          yearMonth={month}
          onRefresh={loadData}
        />

        {/* Past Dues */}
        <PastDuesSection pastDues={summary.pastDues} />

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleGeneratePDF}
            disabled={generatingPDF}
            className="w-full h-14 bg-accent-orange text-white font-bold text-body rounded-xl font-poppins flex items-center justify-center gap-2 transition-colors hover:bg-accent-orange/90 disabled:opacity-50 min-h-touch"
            aria-label="Generate PDF statement"
          >
            {generatingPDF ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                📄 GENERATE PDF STATEMENT
              </>
            )}
          </button>

          <button
            onClick={handleExportCSV}
            className="w-full h-14 bg-white text-primary-blue font-bold text-body rounded-xl font-poppins flex items-center justify-center gap-2 border-2 border-primary-blue transition-colors hover:bg-primary-light min-h-touch"
            aria-label="Export CSV"
          >
            <Download className="w-5 h-5" />
            📥 EXPORT CSV
          </button>

          {typeof navigator.share === 'function' && (
            <button
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
              className="w-full h-14 bg-white text-accent-green font-bold text-body rounded-xl font-poppins flex items-center justify-center gap-2 border-2 border-accent-green transition-colors hover:bg-green-50 min-h-touch"
              aria-label="Share PDF"
            >
              <Share2 className="w-5 h-5" />
              📤 SHARE PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
