// ========================================
// Month Summary Cards Component (Phase 2)
// ========================================

import type { MonthSummary } from '@/types';

interface MonthSummaryCardsProps {
  summary: MonthSummary | null;
}

export default function MonthSummaryCards({ summary }: MonthSummaryCardsProps) {
  if (!summary) return null;

  const cards = [
    {
      label: 'Total Billed',
      value: `₹${summary.totalBilled.toFixed(0)}`,
      bg: 'bg-primary-light',
      textColor: 'text-primary-blue',
      border: 'border-primary-blue/20',
    },
    {
      label: 'Total Paid',
      value: `₹${summary.totalPaid.toFixed(0)}`,
      bg: 'bg-green-50',
      textColor: 'text-accent-green',
      border: 'border-accent-green/20',
    },
    {
      label: 'Total Dues',
      value: `₹${summary.totalDue.toFixed(0)}`,
      bg: summary.totalDue > 0 ? 'bg-red-50' : 'bg-green-50',
      textColor: summary.totalDue > 0 ? 'text-warning-red' : 'text-accent-green',
      border: summary.totalDue > 0 ? 'border-warning-red/20' : 'border-accent-green/20',
    },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`flex-shrink-0 flex-1 min-w-[100px] ${card.bg} border ${card.border} rounded-2xl p-3 text-center`}
        >
          <p className="text-helper text-text-secondary font-poppins mb-1">
            {card.label}
          </p>
          <p className={`text-xl font-bold ${card.textColor} font-poppins`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
