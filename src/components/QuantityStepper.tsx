// ========================================
// Quantity Stepper Component
// ========================================

import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  label: string;
  unit: string;
}

export default function QuantityStepper({
  value,
  onChange,
  step = 0.25,
  min = 0,
  max = 99.99,
  label,
  unit,
}: QuantityStepperProps) {
  const handleDecrement = () => {
    const newVal = Math.max(min, Math.round((value - step) * 100) / 100);
    onChange(newVal);
  };

  const handleIncrement = () => {
    const newVal = Math.min(max, Math.round((value + step) * 100) / 100);
    onChange(newVal);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '' || raw === '.') {
      onChange(0);
      return;
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(Math.round(parsed * 100) / 100);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleDecrement}
        disabled={value <= min}
        className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-colors ${
          value <= min
            ? 'border-border text-text-secondary/40 cursor-not-allowed'
            : 'border-primary-blue text-primary-blue hover:bg-primary-light active:bg-border'
        }`}
        aria-label={`Decrease ${label}`}
      >
        <Minus size={22} />
      </button>

      <div className="flex-1 relative">
        <input
          type="number"
          inputMode="decimal"
          value={value.toFixed(2)}
          onChange={handleInputChange}
          className="w-full h-14 text-center text-h2 font-bold text-text-primary bg-primary-light rounded-xl border-2 border-border focus:border-primary-blue focus:outline-none font-poppins"
          aria-label={`${label} quantity in ${unit}`}
          step={step}
          min={min}
          max={max}
        />
      </div>

      <button
        onClick={handleIncrement}
        disabled={value >= max}
        className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-colors ${
          value >= max
            ? 'border-border text-text-secondary/40 cursor-not-allowed'
            : 'border-primary-blue text-primary-blue hover:bg-primary-light active:bg-border'
        }`}
        aria-label={`Increase ${label}`}
      >
        <Plus size={22} />
      </button>
    </div>
  );
}
