// ========================================
// Balance Summary Banner Component (Phase 2)
// ========================================

import type { CustomerMonthSummary } from '@/types';

interface BalanceSummaryBannerProps {
  summary: CustomerMonthSummary;
}

export default function BalanceSummaryBanner({ summary }: BalanceSummaryBannerProps) {
  const isDue = summary.due > 0;
  const isOverpaid = summary.due < 0;

  return (
    <div
      className={`rounded-2xl p-4 border ${
        isDue
          ? 'bg-red-50 border-warning-red/20'
          : 'bg-green-50 border-accent-green/20'
      }`}
    >
      {/* Current month row */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-body font-poppins">
        <div>
          <span className="text-text-secondary text-label">Billed: </span>
          <span className="font-semibold text-text-primary">₹{summary.billed.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-text-secondary text-label">Paid: </span>
          <span className="font-semibold text-accent-green">₹{summary.paid.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-text-secondary text-label">
            {isDue ? 'Due: ' : isOverpaid ? 'Advance: ' : 'Balance: '}
          </span>
          <span
            className={`font-semibold ${
              isDue
                ? 'text-warning-red'
                : isOverpaid
                  ? 'text-primary-blue'
                  : 'text-accent-green'
            }`}
          >
            ₹{Math.abs(summary.due).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Past dues */}
      {summary.totalPastDue > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-helper text-warning-red/80 font-poppins">
            Past Dues: ₹{summary.totalPastDue.toFixed(2)}
          </p>
          <p className="text-body font-bold text-warning-red font-poppins mt-1">
            TOTAL OUTSTANDING: ₹{summary.totalOutstanding.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}
