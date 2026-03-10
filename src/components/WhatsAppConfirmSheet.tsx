// ========================================
// WhatsApp Confirmation Bottom Sheet (Phase 3)
// ========================================

import { X, MessageCircle, Loader2 } from 'lucide-react';

interface WhatsAppConfirmSheetProps {
  customerName: string;
  customerPhone: string;
  monthLabel: string;
  isOpen: boolean;
  sending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function WhatsAppConfirmSheet({
  customerName,
  customerPhone,
  monthLabel,
  isOpen,
  sending,
  onConfirm,
  onCancel,
}: WhatsAppConfirmSheetProps) {
  if (!isOpen) return null;

  // Format phone for display: mask middle digits
  const displayPhone = customerPhone.length >= 10
    ? `+91 ${customerPhone.slice(0, 2)}XXXXXX${customerPhone.slice(-2)}`
    : customerPhone;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-3xl p-4 pb-8 space-y-4 animate-slide-up shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-border" />
        </div>

        {/* Close button */}
        <div className="flex justify-between items-center">
          <h3 className="text-body font-bold text-text-primary font-poppins flex items-center gap-2">
            <MessageCircle size={20} style={{ color: '#25D366' }} />
            Send via WhatsApp
          </h3>
          <button
            onClick={onCancel}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-primary-light"
            aria-label="Close confirmation"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Message content */}
        <div className="bg-primary-light rounded-xl p-4 space-y-2">
          <p className="text-body text-text-primary font-poppins">
            Send <strong>{monthLabel}</strong> statement to <strong>{customerName}</strong>?
          </p>
          <p className="text-label text-text-secondary font-poppins flex items-center gap-1">
            📱 {displayPhone}
          </p>
          <p className="text-helper text-text-secondary font-poppins">
            This will send a WhatsApp message with their monthly summary.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={sending}
            className="flex-1 h-14 bg-gray-100 text-text-primary font-bold text-body rounded-xl font-poppins hover:bg-gray-200 transition-colors min-h-touch disabled:opacity-50"
            aria-label="Cancel sending"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={sending}
            className="flex-1 h-14 text-white font-bold text-body rounded-xl font-poppins transition-colors min-h-touch disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#25D366' }}
            aria-label="Confirm send via WhatsApp"
          >
            {sending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <MessageCircle size={20} />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
