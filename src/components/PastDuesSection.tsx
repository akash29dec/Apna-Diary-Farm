// ========================================
// Past Dues Section Component (Phase 2)
// ========================================

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { PastDueRecord } from '@/types';

interface PastDuesSectionProps {
  pastDues: PastDueRecord[];
}

export default function PastDuesSection({ pastDues }: PastDuesSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (pastDues.length === 0) return null;

  const hasDues = pastDues.some((r) => r.due > 0);

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left"
        aria-label={expanded ? 'Collapse past dues' : 'Expand past dues'}
      >
        <h3 className="text-label font-semibold text-text-primary font-poppins">
          📅 Past Dues
          {hasDues && (
            <span className="ml-2 text-helper text-warning-red">
              (₹{pastDues.reduce((s, r) => s + Math.max(0, r.due), 0).toFixed(0)} outstanding)
            </span>
          )}
        </h3>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-text-secondary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-secondary" />
        )}
      </button>

      {expanded && (
        <div className="divide-y divide-border">
          {pastDues
            .slice()
            .reverse()
            .map((record) => (
              <div
                key={record.month}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-body text-text-primary font-poppins font-medium">
                    {record.monthLabel}
                  </p>
                  <p className="text-helper text-text-secondary font-poppins">
                    Billed: ₹{record.billed.toFixed(0)} · Paid: ₹{record.paid.toFixed(0)}
                  </p>
                </div>
                <div>
                  {record.due > 0 ? (
                    <span className="text-body font-semibold text-warning-red font-poppins">
                      Due: ₹{record.due.toFixed(0)}
                    </span>
                  ) : record.due < 0 ? (
                    <span className="text-body font-semibold text-primary-blue font-poppins">
                      Advance: ₹{Math.abs(record.due).toFixed(0)}
                    </span>
                  ) : (
                    <span className="text-body font-semibold text-accent-green font-poppins">
                      ✅ Clear
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
