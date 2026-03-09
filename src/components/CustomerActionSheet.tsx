// ========================================
// Customer Action Sheet (Bottom Sheet)
// ========================================

import { Pencil, Trash2, X } from 'lucide-react';

interface CustomerActionSheetProps {
  customerName: string;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function CustomerActionSheet({
  customerName,
  onEdit,
  onDelete,
  onClose,
}: CustomerActionSheetProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-t-2xl shadow-xl w-full max-w-lg pb-8 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Customer Name */}
        <p className="text-body font-semibold text-text-primary font-poppins text-center px-4 pb-3">
          {customerName}
        </p>

        <div className="border-t border-border" />

        {/* Actions */}
        <div className="px-4 pt-3 space-y-2">
          <button
            onClick={onEdit}
            className="w-full flex items-center gap-3 px-4 h-14 rounded-xl bg-primary-light hover:bg-primary-light/80 transition-colors min-h-touch"
            aria-label={`Edit ${customerName}`}
          >
            <Pencil size={20} className="text-primary-blue shrink-0" />
            <span className="text-body font-semibold text-primary-blue font-poppins">
              ✏️ Edit Customer
            </span>
          </button>

          <button
            onClick={onDelete}
            className="w-full flex items-center gap-3 px-4 h-14 rounded-xl bg-red-50 hover:bg-red-100 transition-colors min-h-touch"
            aria-label={`Delete ${customerName}`}
          >
            <Trash2 size={20} className="text-warning-red shrink-0" />
            <span className="text-body font-semibold text-warning-red font-poppins">
              🗑️ Delete Customer
            </span>
          </button>

          <button
            onClick={onClose}
            className="w-full flex items-center gap-3 px-4 h-14 rounded-xl bg-surface border-2 border-border hover:bg-primary-light/50 transition-colors min-h-touch"
            aria-label="Cancel"
          >
            <X size={20} className="text-text-secondary shrink-0" />
            <span className="text-body font-semibold text-text-secondary font-poppins">
              ✕ Cancel
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
