// ========================================
// Customer Form Component (Add / Edit)
// ========================================

import { useState, useEffect } from 'react';
import type { Customer } from '@/types';
import { validateCustomer, type CustomerFormValues } from '@/utils/validation';
import { usePriceStore } from '@/stores/priceStore';

interface CustomerFormProps {
  initialData?: Customer;
  onSubmit: (data: CustomerFormValues) => Promise<void>;
  submitLabel: string;
}

export default function CustomerForm({
  initialData,
  onSubmit,
  submitLabel,
}: CustomerFormProps) {
  const { getOverridesForCustomer } = usePriceStore();

  const [name, setName] = useState(initialData?.name ?? '');
  const [phone, setPhone] = useState(
    initialData?.phone ? initialData.phone.replace('+91', '') : ''
  );
  const [address, setAddress] = useState(initialData?.address ?? '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [defaultMilkQty, setDefaultMilkQty] = useState(
    initialData?.default_milk_qty?.toString() ?? '0.50'
  );
  const [hasCustomPrice, setHasCustomPrice] = useState(initialData?.has_custom_price ?? false);
  const [customMilkPrice, setCustomMilkPrice] = useState('');
  const [customPaneerPrice, setCustomPaneerPrice] = useState('');
  const [customDahiPrice, setCustomDahiPrice] = useState('');
  const [whatsappConsent, setWhatsappConsent] = useState(initialData?.whatsapp_consent ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Load existing price overrides
  useEffect(() => {
    if (initialData?.id && initialData.has_custom_price) {
      getOverridesForCustomer(initialData.id).then((overrides) => {
        const latest = overrides[0];
        if (latest) {
          setCustomMilkPrice(latest.milk_price?.toString() ?? '');
          setCustomPaneerPrice(latest.paneer_price?.toString() ?? '');
          setCustomDahiPrice(latest.dahi_price?.toString() ?? '');
        }
      });
    }
  }, [initialData, getOverridesForCustomer]);

  const handleSubmit = async () => {
    const formData: CustomerFormValues = {
      name,
      phone,
      address,
      notes,
      default_milk_qty: parseFloat(defaultMilkQty) || 0.5,
      has_custom_price: hasCustomPrice,
      custom_milk_price: customMilkPrice,
      custom_paneer_price: customPaneerPrice,
      custom_dahi_price: customDahiPrice,
      whatsapp_consent: whatsappConsent,
    };

    const validationErrors = validateCustomer(formData);
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      for (const err of validationErrors) {
        errorMap[err.field] = err.message;
      }
      setErrors(errorMap);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Full Name */}
      <div className="space-y-1">
        <label className="text-label font-medium text-text-primary font-poppins">
          Full Name <span className="text-warning-red">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Ramesh Gupta"
          className={`w-full h-14 px-4 text-body text-text-primary bg-surface border-2 rounded-xl font-poppins focus:outline-none transition-colors ${
            errors['name'] ? 'border-warning-red' : 'border-border focus:border-primary-blue'
          }`}
          aria-label="Customer full name"
          maxLength={50}
        />
        {errors['name'] && (
          <p className="text-helper text-warning-red font-poppins">{errors['name']}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-1">
        <label className="text-label font-medium text-text-primary font-poppins">
          Phone Number <span className="text-warning-red">*</span>
        </label>
        <div className="flex gap-2">
          <div className="flex items-center justify-center h-14 px-3 bg-primary-light border-2 border-border rounded-xl text-body text-text-secondary font-poppins">
            +91
          </div>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="9876543210"
            className={`flex-1 h-14 px-4 text-body text-text-primary bg-surface border-2 rounded-xl font-poppins focus:outline-none transition-colors ${
              errors['phone'] ? 'border-warning-red' : 'border-border focus:border-primary-blue'
            }`}
            aria-label="Customer phone number"
            maxLength={10}
          />
        </div>
        {errors['phone'] && (
          <p className="text-helper text-warning-red font-poppins">{errors['phone']}</p>
        )}
      </div>

      {/* Address */}
      <div className="space-y-1">
        <label className="text-label font-medium text-text-primary font-poppins">
          Address
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Street, City"
          className="w-full h-14 px-4 text-body text-text-primary bg-surface border-2 border-border rounded-xl font-poppins focus:outline-none focus:border-primary-blue transition-colors"
          aria-label="Customer address"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-label font-medium text-text-primary font-poppins">
          Notes
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., delivers at 7am"
          className="w-full h-14 px-4 text-body text-text-primary bg-surface border-2 border-border rounded-xl font-poppins focus:outline-none focus:border-primary-blue transition-colors"
          aria-label="Customer notes"
        />
      </div>

      {/* Default Milk Qty */}
      <div className="space-y-1">
        <label className="text-label font-medium text-text-primary font-poppins">
          Default Milk Qty (litres)
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={defaultMilkQty}
          onChange={(e) => setDefaultMilkQty(e.target.value)}
          step="0.25"
          min="0"
          className="w-full h-14 px-4 text-body text-text-primary bg-surface border-2 border-border rounded-xl font-poppins focus:outline-none focus:border-primary-blue transition-colors"
          aria-label="Default milk quantity in litres"
        />
      </div>

      {/* Custom Price Section */}
      <div className="bg-primary-light rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-label font-medium text-text-primary font-poppins">
            Use Custom Prices for this customer?
          </label>
          <div className="flex items-center justify-center min-w-[44px] min-h-[44px]">
            <button
              role="switch"
              aria-checked={hasCustomPrice}
              onClick={() => setHasCustomPrice(!hasCustomPrice)}
              className={`relative inline-flex items-center w-12 h-6 rounded-full transition-all duration-200
                ${hasCustomPrice ? 'bg-green-500' : 'bg-gray-200'}`}
              aria-label="Toggle custom prices"
            >
              <span
                className={`inline-block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200
                  ${hasCustomPrice ? 'translate-x-6' : 'translate-x-0.5'}`}
              />
            </button>
          </div>
        </div>

        {hasCustomPrice && (
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-helper text-text-secondary font-poppins">
                🥛 Milk Price (₹/litre)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={customMilkPrice}
                onChange={(e) => setCustomMilkPrice(e.target.value)}
                placeholder="Leave blank to use global price"
                className={`w-full h-14 px-4 text-body text-text-primary bg-surface border-2 rounded-xl font-poppins focus:outline-none transition-colors ${
                  errors['custom_milk_price']
                    ? 'border-warning-red'
                    : 'border-border focus:border-primary-blue'
                }`}
                aria-label="Custom milk price per litre"
              />
              {errors['custom_milk_price'] && (
                <p className="text-helper text-warning-red font-poppins">
                  {errors['custom_milk_price']}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-helper text-text-secondary font-poppins">
                🧀 Paneer Price (₹/kg)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={customPaneerPrice}
                onChange={(e) => setCustomPaneerPrice(e.target.value)}
                placeholder="Leave blank to use global price"
                className={`w-full h-14 px-4 text-body text-text-primary bg-surface border-2 rounded-xl font-poppins focus:outline-none transition-colors ${
                  errors['custom_paneer_price']
                    ? 'border-warning-red'
                    : 'border-border focus:border-primary-blue'
                }`}
                aria-label="Custom paneer price per kg"
              />
              {errors['custom_paneer_price'] && (
                <p className="text-helper text-warning-red font-poppins">
                  {errors['custom_paneer_price']}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-helper text-text-secondary font-poppins">
                🥣 Dahi Price (₹/kg)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={customDahiPrice}
                onChange={(e) => setCustomDahiPrice(e.target.value)}
                placeholder="Leave blank to use global price"
                className={`w-full h-14 px-4 text-body text-text-primary bg-surface border-2 rounded-xl font-poppins focus:outline-none transition-colors ${
                  errors['custom_dahi_price']
                    ? 'border-warning-red'
                    : 'border-border focus:border-primary-blue'
                }`}
                aria-label="Custom dahi price per kg"
              />
              {errors['custom_dahi_price'] && (
                <p className="text-helper text-warning-red font-poppins">
                  {errors['custom_dahi_price']}
                </p>
              )}
            </div>

            <p className="text-helper text-text-secondary font-poppins">
              Effective From: <strong>TODAY</strong>
            </p>
            <p className="text-helper text-text-secondary font-poppins italic">
              ℹ️ Custom prices apply from today onwards only. Leaving a field blank means that item uses the global price.
            </p>
          </div>
        )}
      </div>

      {/* WhatsApp Consent */}
      <div className="bg-primary-light rounded-2xl p-4 space-y-2">
        <p className="text-label font-medium text-text-primary font-poppins">
          📱 WhatsApp Notifications
        </p>
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="flex items-center justify-center min-w-[44px] min-h-[44px]">
            <button
              type="button"
              role="switch"
              aria-checked={whatsappConsent}
              onClick={() => setWhatsappConsent(!whatsappConsent)}
              className={`relative inline-flex items-center w-12 h-6 rounded-full transition-all duration-200
                ${whatsappConsent ? 'bg-green-500' : 'bg-gray-200'}`}
              aria-label="WhatsApp consent"
            >
              <span
                className={`inline-block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200
                  ${whatsappConsent ? 'translate-x-6' : 'translate-x-0.5'}`}
              />
            </button>
          </div>
          <span className="text-helper text-text-secondary font-poppins leading-relaxed">
            This customer agrees to receive daily WhatsApp messages about their purchases from Apna Diary
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full h-14 bg-accent-orange text-white font-bold text-body rounded-xl font-poppins transition-colors hover:bg-accent-orange/90 active:bg-accent-orange/80 disabled:opacity-50 min-h-touch"
        aria-label={submitLabel}
      >
        {submitting ? 'Saving...' : submitLabel}
      </button>
    </div>
  );
}
