// ========================================
// Entry Form Component (inline inside CustomerCard)
// ========================================

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import QuantityStepper from '@/components/QuantityStepper';
import { useEntryStore } from '@/stores/entryStore';
import type { Customer, DailyEntry, EntryDraft } from '@/types';
import { resolvePrice } from '@/utils/pricing';
import { calculateTotal } from '@/utils/pricing';
import { validateEntry } from '@/utils/validation';
import toast from 'react-hot-toast';

interface EntryFormProps {
  customer: Customer;
  existingEntry?: DailyEntry;
  existingDraft?: EntryDraft;
  onClose: () => void;
}

export default function EntryForm({
  customer,
  existingEntry,
  existingDraft,
  onClose,
}: EntryFormProps) {
  const { saveEntry, markNoPurchase, saveDraft, selectedDate } = useEntryStore();

  const [milkQty, setMilkQty] = useState(existingEntry?.milk_qty ?? existingDraft?.milk_qty ?? customer.default_milk_qty);
  const [paneerEnabled, setPaneerEnabled] = useState(
    existingEntry ? existingEntry.paneer_qty > 0 : existingDraft?.paneer_enabled ?? false
  );
  const [paneerQty, setPaneerQty] = useState(existingEntry?.paneer_qty ?? existingDraft?.paneer_qty ?? 0);
  const [dahiEnabled, setDahiEnabled] = useState(
    existingEntry ? existingEntry.dahi_qty > 0 : existingDraft?.dahi_enabled ?? false
  );
  const [dahiQty, setDahiQty] = useState(existingEntry?.dahi_qty ?? existingDraft?.dahi_qty ?? 0);
  const [prices, setPrices] = useState({ milk_price: 57, paneer_price: 350, dahi_price: 60 });
  const [saving, setSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load resolved prices
  useEffect(() => {
    resolvePrice(customer.id, selectedDate).then(setPrices).catch(console.error);
  }, [customer.id, selectedDate]);

  // Auto-save draft on field change
  const saveDraftDebounced = useCallback(() => {
    const draft: EntryDraft = {
      customer_id: customer.id,
      entry_date: selectedDate,
      milk_qty: milkQty,
      paneer_enabled: paneerEnabled,
      paneer_qty: paneerQty,
      dahi_enabled: dahiEnabled,
      dahi_qty: dahiQty,
      updated_at: new Date().toISOString(),
    };
    saveDraft(draft).then(() => {
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    });
  }, [customer.id, selectedDate, milkQty, paneerEnabled, paneerQty, dahiEnabled, dahiQty, saveDraft]);

  useEffect(() => {
    // Don't auto-save on initial mount if we have an existing entry
    if (existingEntry) return;
    const timer = setTimeout(saveDraftDebounced, 500);
    return () => clearTimeout(timer);
  }, [milkQty, paneerEnabled, paneerQty, dahiEnabled, dahiQty, saveDraftDebounced, existingEntry]);

  const computedTotal = calculateTotal(
    milkQty,
    paneerEnabled ? paneerQty : 0,
    dahiEnabled ? dahiQty : 0,
    prices.milk_price,
    prices.paneer_price,
    prices.dahi_price
  );

  const handleSave = async () => {
    const validationError = validateEntry(milkQty, paneerEnabled, paneerQty, dahiEnabled, dahiQty);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);

    try {
      await saveEntry({
        customerId: customer.id,
        milkQty,
        paneerQty: paneerEnabled ? paneerQty : 0,
        dahiQty: dahiEnabled ? dahiQty : 0,
        existingEntryId: existingEntry?.id,
      });
      toast.success(`✅ Entry saved for ${customer.name}`);
    } catch {
      toast.error('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleNoPurchase = async () => {
    setSaving(true);
    try {
      await markNoPurchase(customer.id);
      toast.success(`Marked as No Purchase for ${customer.name}`);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-surface rounded-b-2xl border-x-2 border-b-2 border-primary-blue p-4 space-y-4">
      {/* Close button */}
      <div className="flex justify-between items-center">
        <h3 className="text-body font-semibold text-text-primary font-poppins">
          {customer.name}
        </h3>
        <button
          onClick={onClose}
          className="flex items-center justify-center min-w-touch min-h-touch rounded-lg hover:bg-primary-light"
          aria-label={`Close entry form for ${customer.name}`}
        >
          <X size={24} className="text-text-secondary" />
        </button>
      </div>

      {/* Milk Quantity */}
      <div className="space-y-2">
        <label className="text-label font-medium text-text-primary font-poppins flex items-center gap-2">
          🥛 Milk (litres)
        </label>
        <QuantityStepper
          value={milkQty}
          onChange={setMilkQty}
          step={0.25}
          label="Milk"
          unit="litres"
        />
      </div>

      {/* Paneer Toggle + Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-label font-medium text-text-primary font-poppins flex items-center gap-2">
            🧀 Paneer
          </label>
          <div className="flex items-center justify-center min-w-[44px] min-h-[44px]">
            <button
              role="switch"
              aria-checked={paneerEnabled}
              onClick={() => {
                setPaneerEnabled(!paneerEnabled);
                if (!paneerEnabled) setPaneerQty(0);
              }}
              className={`relative inline-flex items-center w-12 h-6 rounded-full transition-all duration-200
                ${paneerEnabled ? 'bg-green-500' : 'bg-gray-200'}`}
              aria-label="Toggle paneer"
            >
              <span
                className={`inline-block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200
                  ${paneerEnabled ? 'translate-x-6' : 'translate-x-0.5'}`}
              />
            </button>
          </div>
        </div>
        {paneerEnabled && (
          <div className="pl-2">
            <label className="text-helper text-text-secondary font-poppins">
              Paneer (kg)
            </label>
            <QuantityStepper
              value={paneerQty}
              onChange={setPaneerQty}
              step={0.25}
              label="Paneer"
              unit="kg"
            />
          </div>
        )}
      </div>

      {/* Dahi Toggle + Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-label font-medium text-text-primary font-poppins flex items-center gap-2">
            🥣 Dahi
          </label>
          <div className="flex items-center justify-center min-w-[44px] min-h-[44px]">
            <button
              role="switch"
              aria-checked={dahiEnabled}
              onClick={() => {
                setDahiEnabled(!dahiEnabled);
                if (!dahiEnabled) setDahiQty(0);
              }}
              className={`relative inline-flex items-center w-12 h-6 rounded-full transition-all duration-200
                ${dahiEnabled ? 'bg-green-500' : 'bg-gray-200'}`}
              aria-label="Toggle dahi"
            >
              <span
                className={`inline-block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200
                  ${dahiEnabled ? 'translate-x-6' : 'translate-x-0.5'}`}
              />
            </button>
          </div>
        </div>
        {dahiEnabled && (
          <div className="pl-2">
            <label className="text-helper text-text-secondary font-poppins">
              Dahi (kg)
            </label>
            <QuantityStepper
              value={dahiQty}
              onChange={setDahiQty}
              step={0.25}
              label="Dahi"
              unit="kg"
            />
          </div>
        )}
      </div>

      {/* Price & Amount Display */}
      <div className="bg-primary-light rounded-xl p-3 space-y-1">
        <div className="flex justify-between text-label text-text-secondary font-poppins">
          <span>Price</span>
          <span>
            ₹{prices.milk_price}/L milk
            {customer.has_custom_price && (
              <span className="ml-2 text-xs bg-accent-orange text-white px-2 py-0.5 rounded-full">
                Custom
              </span>
            )}
          </span>
        </div>
        <div className="flex justify-between text-body font-bold text-text-primary font-poppins">
          <span>Amount</span>
          <span className="text-accent-green">₹{computedTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-helper text-warning-red font-poppins px-1">{error}</p>
      )}

      {/* Draft saved indicator */}
      {draftSaved && (
        <p className="text-helper text-text-secondary font-poppins text-center">
          Draft saved
        </p>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 bg-accent-orange text-white font-bold text-body rounded-xl font-poppins transition-colors hover:bg-accent-orange/90 active:bg-accent-orange/80 disabled:opacity-50 min-h-touch"
          aria-label={`Save entry for ${customer.name}`}
        >
          {saving ? 'Saving...' : 'SAVE ENTRY'}
        </button>
        <button
          onClick={handleNoPurchase}
          disabled={saving}
          className="w-full h-12 text-text-secondary font-medium text-label rounded-xl font-poppins hover:bg-primary-light transition-colors disabled:opacity-50 min-h-touch"
          aria-label={`Mark no purchase for ${customer.name}`}
        >
          Mark as No Purchase
        </button>
      </div>
    </div>
  );
}
