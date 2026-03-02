// ========================================
// Payment Section Component (Phase 2)
// ========================================

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Payment, PaymentFormData } from '@/types';
import PaymentModal from './PaymentModal';
import { usePaymentStore } from '@/stores/paymentStore';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface PaymentSectionProps {
  payments: Payment[];
  customerId: string;
  yearMonth: string;
  onRefresh: () => void;
}

export default function PaymentSection({
  payments,
  customerId,
  yearMonth,
  onRefresh,
}: PaymentSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>();

  const { addPayment, updatePayment, removePayment } = usePaymentStore();

  const handleAdd = () => {
    setEditingPayment(undefined);
    setModalOpen(true);
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setModalOpen(true);
  };

  const handleDelete = async (payment: Payment) => {
    if (!confirm(`Delete ₹${payment.amount_paid} payment?`)) return;
    try {
      await removePayment(payment.id, customerId, yearMonth);
      toast.success('Payment deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete payment');
    }
  };

  const handleSave = async (data: PaymentFormData) => {
    try {
      if (editingPayment) {
        await updatePayment(editingPayment.id, data);
        toast.success('Payment updated!');
      } else {
        await addPayment(customerId, data);
        toast.success('Payment added!');
      }
      onRefresh();
    } catch {
      toast.error('Failed to save payment');
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount_paid, 0);

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h3 className="text-label font-semibold text-text-primary font-poppins">
          💰 Payments Received
        </h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 h-10 px-3 bg-accent-green text-white text-helper font-semibold rounded-xl font-poppins min-h-touch transition-colors hover:bg-accent-green/90"
          aria-label="Add payment"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Payment list */}
      {payments.length === 0 ? (
        <div className="px-4 pb-4">
          <p className="text-helper text-text-secondary font-poppins italic">
            No payments recorded for this month
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex-1">
                <p className="text-body text-text-primary font-poppins">
                  {format(new Date(p.payment_date + 'T00:00:00'), 'dd MMM yyyy')} —{' '}
                  <span className="font-semibold text-accent-green">
                    ₹{p.amount_paid.toFixed(0)}
                  </span>
                </p>
                <p className="text-helper text-text-secondary font-poppins">
                  {p.payment_method}
                  {p.notes && ` · ${p.notes}`}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(p)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-primary-light"
                  aria-label="Edit payment"
                >
                  <Pencil className="w-4 h-4 text-primary-blue" />
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50"
                  aria-label="Delete payment"
                >
                  <Trash2 className="w-4 h-4 text-warning-red" />
                </button>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="px-4 py-3 bg-green-50">
            <p className="text-label font-semibold text-accent-green font-poppins">
              Total Paid: ₹{totalPaid.toFixed(0)}
            </p>
          </div>
        </div>
      )}

      <PaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        existing={editingPayment}
      />
    </div>
  );
}
