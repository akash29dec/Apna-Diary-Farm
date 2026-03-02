// ========================================
// Payment Modal Component (Phase 2)
// ========================================

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Payment, PaymentFormData } from '@/types';
import { getISTDateString } from '@/utils/dateHelpers';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PaymentFormData) => void;
  existing?: Payment;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSave,
  existing,
}: PaymentModalProps) {
  const [date, setDate] = useState(getISTDateString());
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'Cash' | 'UPI' | 'Other'>('Cash');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (existing) {
      setDate(existing.payment_date);
      setAmount(existing.amount_paid.toString());
      setMethod(existing.payment_method);
      setNotes(existing.notes ?? '');
    } else {
      setDate(getISTDateString());
      setAmount('');
      setMethod('Cash');
      setNotes('');
    }
    setError('');
  }, [existing, isOpen]);

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (!date) {
      setError('Select a date');
      return;
    }
    setError('');
    onSave({
      payment_date: date,
      amount_paid: parsedAmount,
      payment_method: method,
      notes,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-surface rounded-2xl w-full max-w-md p-5 shadow-xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-text-secondary" />
        </button>

        <h3 className="text-body font-semibold text-text-primary font-poppins mb-4">
          {existing ? '✏️ Edit Payment' : '➕ Add Payment'}
        </h3>

        {/* Date */}
        <div className="space-y-1 mb-3">
          <label className="text-label font-medium text-text-primary font-poppins">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-14 px-4 text-body text-text-primary bg-white border-2 border-border rounded-xl font-poppins focus:outline-none focus:border-primary-blue"
            aria-label="Payment date"
          />
        </div>

        {/* Amount */}
        <div className="space-y-1 mb-3">
          <label className="text-label font-medium text-text-primary font-poppins">
            Amount (₹)
          </label>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className={`w-full h-14 px-4 text-body text-text-primary bg-white border-2 rounded-xl font-poppins focus:outline-none ${
              error ? 'border-warning-red' : 'border-border focus:border-primary-blue'
            }`}
            aria-label="Payment amount"
          />
          {error && (
            <p className="text-helper text-warning-red font-poppins">{error}</p>
          )}
        </div>

        {/* Method */}
        <div className="space-y-1 mb-3">
          <label className="text-label font-medium text-text-primary font-poppins">
            Method
          </label>
          <div className="flex gap-2">
            {(['Cash', 'UPI', 'Other'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`flex-1 h-12 rounded-xl text-body font-semibold font-poppins transition-colors min-h-touch ${
                  method === m
                    ? 'bg-primary-blue text-white'
                    : 'bg-primary-light text-text-primary border border-border'
                }`}
                aria-label={`Payment method ${m}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1 mb-4">
          <label className="text-label font-medium text-text-primary font-poppins">
            Notes (optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., received via GPay"
            className="w-full h-14 px-4 text-body text-text-primary bg-white border-2 border-border rounded-xl font-poppins focus:outline-none focus:border-primary-blue"
            aria-label="Payment notes"
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full h-14 bg-accent-orange text-white font-bold text-body rounded-xl font-poppins transition-colors hover:bg-accent-orange/90 min-h-touch"
          aria-label="Save payment"
        >
          {existing ? 'UPDATE PAYMENT' : 'SAVE PAYMENT'}
        </button>
      </div>
    </div>
  );
}
