// ========================================
// Price Settings Screen (Route: /settings/prices)
// ========================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { usePriceStore } from '@/stores/priceStore';
import { validateGlobalPrices } from '@/utils/validation';
import { formatShortDate } from '@/utils/dateHelpers';
import toast from 'react-hot-toast';

export default function PriceSettingsScreen() {
  const navigate = useNavigate();
  const { globalPrices, fetchGlobalPrices, saveNewGlobalPrices } = usePriceStore();

  const [milkPrice, setMilkPrice] = useState('');
  const [paneerPrice, setPaneerPrice] = useState('');
  const [dahiPrice, setDahiPrice] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchGlobalPrices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const latest = globalPrices[0];
    if (latest) {
      setMilkPrice(latest.milk_price.toString());
      setPaneerPrice(latest.paneer_price.toString());
      setDahiPrice(latest.dahi_price.toString());
    }
  }, [globalPrices]);

  const handleSave = async () => {
    const validationErrors = validateGlobalPrices(milkPrice, paneerPrice, dahiPrice);
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      for (const err of validationErrors) {
        errorMap[err.field] = err.message;
      }
      setErrors(errorMap);
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      await saveNewGlobalPrices(
        parseFloat(milkPrice),
        parseFloat(paneerPrice),
        parseFloat(dahiPrice)
      );
      toast.success('✅ Global prices updated');
    } catch {
      toast.error('Failed to save prices');
    } finally {
      setSaving(false);
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
        <h1 className="text-xl font-bold text-white font-poppins">Global Prices</h1>
      </header>

      <div className="h-14" />

      <div className="p-4 space-y-5">
        {/* Current Prices */}
        <section className="bg-surface rounded-2xl p-4 border border-border space-y-4">
          <h2 className="text-label font-semibold text-text-primary font-poppins">
            Current Active Prices
          </h2>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-label text-text-secondary font-poppins flex items-center gap-2">
                🥛 Milk Price (₹/litre)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={milkPrice}
                onChange={(e) => setMilkPrice(e.target.value)}
                className={`w-full h-14 px-4 text-body text-text-primary bg-bg border-2 rounded-xl font-poppins focus:outline-none transition-colors ${
                  errors['milk_price'] ? 'border-warning-red' : 'border-border focus:border-primary-blue'
                }`}
                aria-label="Milk price per litre"
              />
              {errors['milk_price'] && (
                <p className="text-helper text-warning-red font-poppins">{errors['milk_price']}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-label text-text-secondary font-poppins flex items-center gap-2">
                🧀 Paneer Price (₹/kg)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={paneerPrice}
                onChange={(e) => setPaneerPrice(e.target.value)}
                className={`w-full h-14 px-4 text-body text-text-primary bg-bg border-2 rounded-xl font-poppins focus:outline-none transition-colors ${
                  errors['paneer_price'] ? 'border-warning-red' : 'border-border focus:border-primary-blue'
                }`}
                aria-label="Paneer price per kg"
              />
              {errors['paneer_price'] && (
                <p className="text-helper text-warning-red font-poppins">{errors['paneer_price']}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-label text-text-secondary font-poppins flex items-center gap-2">
                🥣 Dahi Price (₹/kg)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={dahiPrice}
                onChange={(e) => setDahiPrice(e.target.value)}
                className={`w-full h-14 px-4 text-body text-text-primary bg-bg border-2 rounded-xl font-poppins focus:outline-none transition-colors ${
                  errors['dahi_price'] ? 'border-warning-red' : 'border-border focus:border-primary-blue'
                }`}
                aria-label="Dahi price per kg"
              />
              {errors['dahi_price'] && (
                <p className="text-helper text-warning-red font-poppins">{errors['dahi_price']}</p>
              )}
            </div>
          </div>
        </section>

        {/* Info Banner */}
        <div className="bg-primary-light rounded-xl p-4 flex items-start gap-3">
          <span className="text-body shrink-0">ℹ️</span>
          <p className="text-helper text-text-secondary font-poppins leading-relaxed">
            Changing prices here will apply to <strong>NEW entries only</strong>.
            Past entries will keep the price at the time of entry.
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 bg-accent-orange text-white font-bold text-body rounded-xl font-poppins transition-colors hover:bg-accent-orange/90 disabled:opacity-50 min-h-touch"
          aria-label="Save new prices"
        >
          {saving ? 'Saving...' : 'SAVE NEW PRICES'}
        </button>

        {/* Price History */}
        {globalPrices.length > 1 && (
          <section className="bg-surface rounded-2xl border border-border overflow-hidden">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between p-4 hover:bg-primary-light transition-colors min-h-touch"
              aria-label="Toggle price history"
              aria-expanded={showHistory}
            >
              <h2 className="text-label font-semibold text-text-primary font-poppins">
                📜 Price History
              </h2>
              {showHistory ? (
                <ChevronUp size={24} className="text-text-secondary" />
              ) : (
                <ChevronDown size={24} className="text-text-secondary" />
              )}
            </button>

            {showHistory && (
              <div className="px-4 pb-4 space-y-2">
                {globalPrices.slice(1).map((price) => (
                  <div
                    key={price.id}
                    className="bg-primary-light rounded-xl p-3 text-helper text-text-secondary font-poppins"
                  >
                    <p className="font-semibold text-text-primary">
                      {formatShortDate(price.effective_from)}
                    </p>
                    <p>
                      Milk: ₹{price.milk_price}/L &nbsp;|&nbsp; Paneer: ₹{price.paneer_price}/kg &nbsp;|&nbsp; Dahi: ₹{price.dahi_price}/kg
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
