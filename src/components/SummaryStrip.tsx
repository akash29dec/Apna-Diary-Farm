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
    const savedCustomerIds = new Set(
      entries.filter((e) => !e.is_draft).map((e) => e.customer_id)
    );
    const pending = totalCustomers - savedCustomerIds.size;
    const todaysTotal = entries
      .filter((e) => !e.is_draft)
      .reduce((sum, e) => sum + e.total_amount, 0);

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
