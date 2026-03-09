// ========================================
// Delete Confirm Dialog Component
// ========================================

interface DeleteConfirmDialogProps {
  customerName: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function DeleteConfirmDialog({
  customerName,
  onCancel,
  onConfirm,
  loading = false,
}: DeleteConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-h2 font-bold text-text-primary font-poppins">
          Delete Customer?
        </h2>
        <p className="text-body text-text-secondary font-poppins">
          Delete <strong>{customerName}</strong>? All their entries, payments, and records will be permanently removed. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 h-14 border-2 border-border text-text-primary font-semibold rounded-xl text-body font-poppins hover:bg-primary-light transition-colors disabled:opacity-50 min-h-touch"
            aria-label="Cancel delete"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-14 bg-warning-red text-white font-bold rounded-xl text-body font-poppins hover:bg-warning-red/90 transition-colors disabled:opacity-50 min-h-touch"
            aria-label={`Confirm delete ${customerName}`}
          >
            {loading ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
