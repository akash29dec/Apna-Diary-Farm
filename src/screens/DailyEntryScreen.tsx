// ========================================
// Daily Entry Screen (Home — Route: /)
// ========================================

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import DateNavigator from '@/components/DateNavigator';
import SummaryStrip from '@/components/SummaryStrip';
import CustomerCard from '@/components/CustomerCard';
import CustomerActionSheet from '@/components/CustomerActionSheet';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import OfflineBanner from '@/components/OfflineBanner';
import PastDateBanner from '@/components/PastDateBanner';
import BottomNav from '@/components/BottomNav';
import { useCustomerStore } from '@/stores/customerStore';
import { useEntryStore } from '@/stores/entryStore';
import { sortCustomersForDate } from '@/utils/ordering';
import type { Customer } from '@/types';
import toast from 'react-hot-toast';

export default function DailyEntryScreen() {
  const navigate = useNavigate();
  const { customers, fetchCustomers, deleteCustomer } = useCustomerStore();
  const {
    entries,
    drafts,
    selectedDate,
    expandedCustomerId,
    setExpandedCustomerId,
    fetchEntries,
    fetchDrafts,
  } = useEntryStore();

  const [actionSheetCustomer, setActionSheetCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchEntries();
    fetchDrafts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sortedCustomers = useMemo(
    () => sortCustomersForDate(customers, entries, selectedDate),
    [customers, entries, selectedDate]
  );

  const entryMap = useMemo(() => {
    const map = new Map<string, typeof entries[number]>();
    for (const entry of entries) {
      if (!entry.is_draft) {
        map.set(entry.customer_id, entry);
      }
    }
    return map;
  }, [entries]);

  const handleLongPress = useCallback((customer: Customer) => {
    setActionSheetCustomer(customer);
  }, []);

  const handleEdit = useCallback(() => {
    if (actionSheetCustomer) {
      navigate(`/customers/${actionSheetCustomer.id}/edit`);
      setActionSheetCustomer(null);
    }
  }, [actionSheetCustomer, navigate]);

  const handleDeleteRequest = useCallback(() => {
    if (actionSheetCustomer) {
      setDeleteTarget(actionSheetCustomer);
      setActionSheetCustomer(null);
    }
  }, [actionSheetCustomer]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCustomer(deleteTarget.id);
      toast.success('🗑️ Customer removed');
    } catch {
      toast.error('Failed to delete customer');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteCustomer]);

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <AppHeader />

      {/* Spacer for fixed header */}
      <div className="h-14" />

      <DateNavigator />
      <SummaryStrip />
      <OfflineBanner />
      <PastDateBanner />

      {/* Customer List */}
      <div className="flex-1 py-3 pb-24">
        {sortedCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-8">
            <span className="text-6xl mb-4">🥛</span>
            <h2 className="text-h2 text-text-primary font-poppins text-center mb-2">
              No customers yet
            </h2>
            <p className="text-body text-text-secondary font-poppins text-center mb-6">
              Add your first customer to start recording daily entries
            </p>
            <button
              onClick={() => navigate('/customers/add')}
              className="px-6 h-14 bg-accent-orange text-white font-bold text-body rounded-xl font-poppins hover:bg-accent-orange/90 transition-colors min-h-touch"
              aria-label="Add your first customer"
            >
              + Add Customer
            </button>
          </div>
        ) : (
          sortedCustomers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              entry={entryMap.get(customer.id)}
              draft={drafts.get(customer.id)}
              isExpanded={expandedCustomerId === customer.id}
              onToggle={() =>
                setExpandedCustomerId(
                  expandedCustomerId === customer.id ? null : customer.id
                )
              }
              onLongPress={handleLongPress}
            />
          ))
        )}
      </div>

      {/* FAB - Add Customer */}
      {sortedCustomers.length > 0 && (
        <button
          onClick={() => navigate('/customers/add')}
          className="fixed bottom-24 right-4 z-40 flex items-center justify-center w-14 h-14 bg-accent-orange text-white rounded-full shadow-lg hover:bg-accent-orange/90 active:scale-95 transition-all"
          aria-label="Add new customer"
        >
          <Plus size={28} />
        </button>
      )}

      <BottomNav />

      {/* Long Press Action Sheet */}
      {actionSheetCustomer && (
        <CustomerActionSheet
          customerName={actionSheetCustomer.name}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          onClose={() => setActionSheetCustomer(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <DeleteConfirmDialog
          customerName={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleting}
        />
      )}
    </div>
  );
}
