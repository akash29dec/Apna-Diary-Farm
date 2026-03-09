// ========================================
// Price Confirmation Dialog Component
// ========================================

interface PriceConfirmDialogProps {
  customerName: string;
  milkPrice: string;
  paneerPrice: string;
  dahiPrice: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function PriceConfirmDialog({
  customerName,
  milkPrice,
  paneerPrice,
  dahiPrice,
  onCancel,
  onConfirm,
  loading = false,
}: PriceConfirmDialogProps) {
  const priceLines: string[] = [];
  if (milkPrice) priceLines.push(`🥛 Milk: ₹${milkPrice}/L`);
  if (paneerPrice) priceLines.push(`🧀 Paneer: ₹${paneerPrice}/kg`);
  if (dahiPrice) priceLines.push(`🥣 Dahi: ₹${dahiPrice}/kg`);

  const currentMonthLabel = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-h2 font-bold text-text-primary font-poppins">
          Update Custom Prices?
        </h2>

        <div className="space-y-2">
          <p className="text-body text-text-primary font-poppins font-semibold">
            Set new prices for <strong>{customerName}</strong>:
          </p>
          {priceLines.length > 0 && (
            <div className="bg-primary-light rounded-xl p-3 space-y-1">
              {priceLines.map((line, i) => (
                <p key={i} className="text-body text-text-primary font-poppins">
                  {line}
                </p>
              ))}
            </div>
          )}
          <p className="text-label text-text-secondary font-poppins leading-relaxed">
            This will update ALL entries in {currentMonthLabel} (current month)
            and apply to all future months. Past months will not be affected.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 h-14 border-2 border-border text-text-primary font-semibold rounded-xl text-body font-poppins hover:bg-primary-light transition-colors disabled:opacity-50 min-h-touch"
            aria-label="Cancel price update"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-14 bg-accent-orange text-white font-bold rounded-xl text-body font-poppins hover:bg-accent-orange/90 transition-colors disabled:opacity-50 min-h-touch"
            aria-label="Confirm price update"
          >
            {loading ? 'Updating...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
