// ========================================
// Validation Utilities
// ========================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface CustomerFormValues {
  name: string;
  phone: string;
  address: string;
  notes: string;
  default_milk_qty: number;
  has_custom_price: boolean;
  custom_milk_price: string;
  custom_paneer_price: string;
  custom_dahi_price: string;
  whatsapp_consent: boolean;
}

/**
 * Validate customer form data
 */
export function validateCustomer(data: CustomerFormValues): ValidationError[] {
  const errors: ValidationError[] = [];

  // Name: required, 2–50 chars
  const trimmedName = data.name.trim();
  if (!trimmedName) {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (trimmedName.length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  } else if (trimmedName.length > 50) {
    errors.push({ field: 'name', message: 'Name must be at most 50 characters' });
  }

  // Phone: required, 10 digits
  const cleanPhone = data.phone.replace(/\D/g, '');
  if (!cleanPhone) {
    errors.push({ field: 'phone', message: 'Phone number is required' });
  } else if (cleanPhone.length !== 10) {
    errors.push({ field: 'phone', message: 'Phone number must be exactly 10 digits' });
  }

  // Custom prices: if enabled, must be > 0 and < 9999
  if (data.has_custom_price) {
    const priceFields: Array<{ key: string; value: string; label: string }> = [
      { key: 'custom_milk_price', value: data.custom_milk_price, label: 'Milk price' },
      { key: 'custom_paneer_price', value: data.custom_paneer_price, label: 'Paneer price' },
      { key: 'custom_dahi_price', value: data.custom_dahi_price, label: 'Dahi price' },
    ];

    for (const { key, value, label } of priceFields) {
      if (value && value.trim() !== '') {
        const numVal = parseFloat(value);
        if (isNaN(numVal) || numVal <= 0) {
          errors.push({ field: key, message: `${label} must be greater than 0` });
        } else if (numVal >= 9999) {
          errors.push({ field: key, message: `${label} must be less than ₹9,999` });
        }
      }
    }
  }

  return errors;
}

/**
 * Validate entry before saving (check that at least one quantity is entered)
 */
export function validateEntry(
  milkQty: number,
  paneerEnabled: boolean,
  paneerQty: number,
  dahiEnabled: boolean,
  dahiQty: number
): string | null {
  const hasMilk = milkQty > 0;
  const hasPaneer = paneerEnabled && paneerQty > 0;
  const hasDahi = dahiEnabled && dahiQty > 0;

  if (!hasMilk && !hasPaneer && !hasDahi) {
    return 'Please enter at least one quantity or mark as No Purchase';
  }

  return null;
}

/**
 * Format phone number with +91 prefix
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const digits = cleaned.startsWith('91') && cleaned.length === 12
    ? cleaned.slice(2)
    : cleaned;
  return `+91${digits}`;
}

/**
 * Validate global price values
 */
export function validateGlobalPrices(
  milkPrice: string,
  paneerPrice: string,
  dahiPrice: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  const fields: Array<{ key: string; value: string; label: string }> = [
    { key: 'milk_price', value: milkPrice, label: 'Milk price' },
    { key: 'paneer_price', value: paneerPrice, label: 'Paneer price' },
    { key: 'dahi_price', value: dahiPrice, label: 'Dahi price' },
  ];

  for (const { key, value, label } of fields) {
    const numVal = parseFloat(value);
    if (!value || isNaN(numVal)) {
      errors.push({ field: key, message: `${label} is required` });
    } else if (numVal <= 0) {
      errors.push({ field: key, message: `${label} must be greater than 0` });
    } else if (numVal >= 9999) {
      errors.push({ field: key, message: `${label} must be less than ₹9,999` });
    }
  }

  return errors;
}
