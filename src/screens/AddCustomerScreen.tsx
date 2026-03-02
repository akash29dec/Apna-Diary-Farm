// ========================================
// Add Customer Screen (Route: /customers/add)
// ========================================

import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CustomerForm from '@/components/CustomerForm';
import { useCustomerStore } from '@/stores/customerStore';
import { usePriceStore } from '@/stores/priceStore';
import type { CustomerFormValues } from '@/utils/validation';
import toast from 'react-hot-toast';

export default function AddCustomerScreen() {
  const navigate = useNavigate();
  const { addCustomer } = useCustomerStore();
  const { savePriceOverride } = usePriceStore();

  const handleSubmit = async (data: CustomerFormValues) => {
    try {
      const customer = await addCustomer({
        name: data.name,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
        default_milk_qty: data.default_milk_qty,
        has_custom_price: data.has_custom_price,
        whatsapp_consent: data.whatsapp_consent,
      });

      // Save custom price override if enabled
      if (data.has_custom_price) {
        const milkPrice = data.custom_milk_price ? parseFloat(data.custom_milk_price) : null;
        const paneerPrice = data.custom_paneer_price ? parseFloat(data.custom_paneer_price) : null;
        const dahiPrice = data.custom_dahi_price ? parseFloat(data.custom_dahi_price) : null;

        if (milkPrice !== null || paneerPrice !== null || dahiPrice !== null) {
          await savePriceOverride(customer.id, milkPrice, paneerPrice, dahiPrice);
        }
      }

      toast.success(`✅ ${data.name} added successfully`);
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add customer';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 bg-primary-blue px-4 h-14">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center min-w-touch min-h-touch"
          aria-label="Go back"
        >
          <ArrowLeft size={28} className="text-white" />
        </button>
        <h1 className="text-xl font-bold text-white font-poppins">Add Customer</h1>
      </header>

      {/* Spacer */}
      <div className="h-14" />

      {/* Form */}
      <div className="p-4 pb-8">
        <CustomerForm onSubmit={handleSubmit} submitLabel="SAVE CUSTOMER" />
      </div>
    </div>
  );
}
