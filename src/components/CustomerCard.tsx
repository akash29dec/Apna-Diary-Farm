// ========================================
// Customer Card Component
// ========================================

import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Customer, DailyEntry, EntryDraft } from '@/types';
import EntryForm from '@/components/EntryForm';

interface CustomerCardProps {
  customer: Customer;
  entry?: DailyEntry;
  draft?: EntryDraft;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function CustomerCard({
  customer,
  entry,
  draft,
  isExpanded,
  onToggle,
}: CustomerCardProps) {
  const initials = useMemo(() => {
    const parts = customer.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
    }
    return (parts[0]?.slice(0, 2) ?? '').toUpperCase();
  }, [customer.name]);

  const hasSavedEntry = entry && !entry.is_draft;
  const hasDraft = !!draft;

  const statusText = hasSavedEntry
    ? `₹${entry.total_amount.toFixed(2)} saved`
    : 'Not entered yet';

  const statusColor = hasSavedEntry
    ? 'text-accent-green'
    : 'text-text-secondary';

  return (
    <div className="mx-4 mb-3">
      {/* Collapsed Card */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-poppins ${
          isExpanded
            ? 'bg-primary-blue text-white rounded-b-none border-2 border-primary-blue'
            : hasSavedEntry
            ? 'bg-surface border-2 border-accent-green/30 shadow-sm'
            : 'bg-surface border-2 border-border shadow-sm hover:border-primary-blue/50'
        }`}
        aria-expanded={isExpanded}
        aria-label={`${customer.name} - ${statusText}. Tap to ${isExpanded ? 'collapse' : 'expand'}`}
      >
        {/* Avatar */}
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-full text-body font-bold shrink-0 ${
            isExpanded
              ? 'bg-white/20 text-white'
              : hasSavedEntry
              ? 'bg-accent-green/10 text-accent-green'
              : 'bg-primary-light text-primary-blue'
          }`}
        >
          {initials}
        </div>

        {/* Name & Status */}
        <div className="flex-1 text-left min-w-0">
          <p className={`text-body font-semibold truncate ${
            isExpanded ? 'text-white' : 'text-text-primary'
          }`}>
            {customer.name}
          </p>
          <p className={`text-helper flex items-center gap-1 ${
            isExpanded ? 'text-white/80' : statusColor
          }`}>
            {hasDraft && !hasSavedEntry && (
              <span className="inline-block w-2 h-2 rounded-full bg-primary-blue mr-1" title="Draft saved" />
            )}
            🥛 {statusText}
          </p>
        </div>

        {/* Chevron */}
        <ChevronRight
          size={24}
          className={`shrink-0 transition-transform ${
            isExpanded ? 'rotate-90 text-white' : 'text-text-secondary'
          }`}
        />
      </button>

      {/* Expanded Form */}
      {isExpanded && (
        <EntryForm
          customer={customer}
          existingEntry={entry}
          existingDraft={draft}
          onClose={onToggle}
        />
      )}
    </div>
  );
}
