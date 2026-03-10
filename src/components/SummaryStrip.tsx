// ========================================
// Summary Strip Component
// ========================================

import { useCustomerStore } from '@/stores/customerStore';
import { useEntryStore } from '@/stores/entryStore';
import { useMemo } from 'react';

export default function SummaryStrip() {
  const { customers } = useCustomerStore();
  const { entries } = useEntryStore();

  const stats = useMemo(() => {
    const totalCustomers = customers.length;

    // 1. Create a Set of active customer IDs (customers array is already filtered to active only)
    const activeCustomerIds = new Set(customers.map((c) => c.id));

    // 2. Filter entries to only include those for currently active customers
    const activeEntries = entries.filter(
      (e) => !e.is_draft && activeCustomerIds.has(e.customer_id)
    );

    // 3. Recalculate based on active entries
    const savedCustomerIds = new Set(activeEntries.map((e) => e.customer_id));

    // Guard against negative pending numbers
    const pending = Math.max(0, totalCustomers - savedCustomerIds.size);

    // Today's total for active customers only
    const todaysTotal = activeEntries.reduce((sum, e) => sum + e.total_amount, 0);

    return { totalCustomers, pending, todaysTotal };
  }, [customers, entries]);

  return (
    <div className="bg-primary-light px-4 py-3 flex items-center justify-between" style={{ minHeight: '64px' }}>
      <div className="text-center">
        <p className="text-helper text-text-secondary font-poppins">Customers</p>
        <p className="text-body font-bold text-text-primary font-poppins">
          {stats.totalCustomers}
        </p>
      </div>
      <div className="w-px h-8 bg-border" />
      <div className="text-center">
        <p className="text-helper text-text-secondary font-poppins">Pending</p>
        <p className="text-body font-bold text-accent-orange font-poppins">
          {stats.pending}
        </p>
      </div>
      <div className="w-px h-8 bg-border" />
      <div className="text-center">
        <p className="text-helper text-text-secondary font-poppins">Today's Total</p>
        <p className="text-body font-bold text-accent-green font-poppins">
          ₹{stats.todaysTotal.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
