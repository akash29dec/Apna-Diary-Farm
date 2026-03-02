// ========================================
// Edit Customer Screen (Route: /customers/:id/edit)
// ========================================

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CustomerForm from '@/components/CustomerForm';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { useCustomerStore } from '@/stores/customerStore';
import { usePriceStore } from '@/stores/priceStore';
import type { Customer } from '@/types';
import type { CustomerFormValues } from '@/utils/validation';
import toast from 'react-hot-toast';

export default function EditCustomerScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getCustomer, updateCustomer, deleteCustomer } = useCustomerStore();
  const { savePriceOverride } = usePriceStore();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getCustomer(id).then((c) => {
      setCustomer(c ?? null);
      setLoading(false);
    });
  }, [id, getCustomer]);

  const handleSubmit = async (data: CustomerFormValues) => {
    if (!id) return;

    try {
      await updateCustomer(id, {
        name: data.name.trim(),
        phone: data.phone.startsWith('+91') ? data.phone : `+91${data.phone.replace(/\D/g, '')}`,
        address: data.address.trim() || null,
        notes: data.notes.trim() || null,
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
          await savePriceOverride(id, milkPrice, paneerPrice, dahiPrice);
        }
      }

      toast.success(`✅ ${data.name} updated successfully`);
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update customer';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteCustomer(id);
      toast.success('Customer deleted');
      navigate('/');
    } catch {
      toast.error('Failed to delete customer');
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-body text-text-secondary font-poppins">Loading...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
        <p className="text-body text-text-secondary font-poppins">Customer not found</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 h-12 bg-primary-blue text-white font-semibold rounded-xl font-poppins min-h-touch"
          aria-label="Go to home"
        >
          Go Home
        </button>
      </div>
    );
  }

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
        <h1 className="text-xl font-bold text-white font-poppins">Edit Customer</h1>
      </header>

      {/* Spacer */}
      <div className="h-14" />

      {/* Form */}
      <div className="p-4 pb-8 space-y-4">
        <CustomerForm
          initialData={customer}
          onSubmit={handleSubmit}
          submitLabel="SAVE CUSTOMER"
        />

        {/* Delete Button */}
        <button
          onClick={() => setShowDelete(true)}
          className="w-full h-14 border-2 border-warning-red text-warning-red font-bold text-body rounded-xl font-poppins hover:bg-warning-red/5 transition-colors min-h-touch"
          aria-label={`Delete ${customer.name}`}
        >
          DELETE CUSTOMER
        </button>
      </div>

      {/* Delete Confirmation */}
      {showDelete && (
        <DeleteConfirmDialog
          customerName={customer.name}
          onCancel={() => setShowDelete(false)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </div>
  );
}
