// ========================================
// Customer Summary Card Component (Phase 2)
// ========================================

import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CustomerMonthSummary } from '@/types';

interface CustomerSummaryCardProps {
  summary: CustomerMonthSummary;
  selectedMonth: string;
}

export default function CustomerSummaryCard({
  summary,
  selectedMonth,
}: CustomerSummaryCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/summary/${summary.customer.id}?month=${selectedMonth}`);
  };

  const isDue = summary.due > 0;
  const isOverpaid = summary.due < 0;

  return (
    <button
      onClick={handleClick}
      className="w-full bg-surface rounded-2xl p-4 shadow-sm border border-border hover:border-primary-blue/40 transition-colors text-left"
      aria-label={`View ${summary.customer.name} monthly detail`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Name */}
          <h3 className="text-body font-semibold text-text-primary font-poppins truncate">
            {summary.customer.name}
          </h3>

          {/* Item totals */}
          <p className="text-helper text-text-secondary font-poppins mt-1">
            {summary.totalMilkL > 0 && (
              <span className="mr-3">🥛 {summary.totalMilkL.toFixed(1)}L</span>
            )}
            {summary.totalPaneerKg > 0 && (
              <span className="mr-3">🧀 {summary.totalPaneerKg.toFixed(2)}kg</span>
            )}
            {summary.totalDahiKg > 0 && (
              <span>🥣 {summary.totalDahiKg.toFixed(2)}kg</span>
            )}
            {summary.totalMilkL === 0 && summary.totalPaneerKg === 0 && summary.totalDahiKg === 0 && (
              <span className="italic">No entries</span>
            )}
          </p>

          {/* Billing line */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-helper font-poppins text-text-secondary">
              Billed: <span className="font-medium text-text-primary">₹{summary.billed.toFixed(0)}</span>
            </span>
            <span className="text-helper font-poppins text-text-secondary">
              Paid: <span className="font-medium text-accent-green">₹{summary.paid.toFixed(0)}</span>
            </span>
            {isDue ? (
              <span className="text-helper font-medium text-warning-red font-poppins">
                ⚠️ Due: ₹{summary.due.toFixed(0)}
              </span>
            ) : isOverpaid ? (
              <span className="text-helper font-medium text-primary-blue font-poppins">
                💰 Advance: ₹{Math.abs(summary.due).toFixed(0)}
              </span>
            ) : (
              <span className="text-helper font-medium text-accent-green font-poppins">
                ✅ Clear
              </span>
            )}
          </div>

          {/* Past dues */}
          {summary.totalPastDue > 0 && (
            <p className="text-helper text-warning-red/80 font-poppins mt-1 italic">
              + ₹{summary.totalPastDue.toFixed(0)} due from prior months
            </p>
          )}
        </div>

        <ChevronRight className="w-5 h-5 text-text-secondary flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}
