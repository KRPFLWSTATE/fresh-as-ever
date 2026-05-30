'use client';

import {
  BAG_WEIGHT_PRESETS_KG,
  MAX_BAG_WEIGHT_KG,
  MIN_BAG_WEIGHT_KG,
} from '@/lib/co2Impact';

export function resolveFormBagWeightKg(selectedKg, customKg) {
  const custom = String(customKg ?? '').trim().replace(',', '.');
  if (custom) {
    const parsed = Number(custom);
    if (
      !Number.isFinite(parsed) ||
      parsed < MIN_BAG_WEIGHT_KG ||
      parsed > MAX_BAG_WEIGHT_KG
    ) {
      return null;
    }
    return Math.round(parsed * 100) / 100;
  }
  if (selectedKg != null) return selectedKg;
  return null;
}

export function BagWeightFields({
  selectedKg,
  customKg,
  onSelectPreset,
  onCustomChange,
}) {
  return (
    <div className="md:col-span-2 space-y-3">
      <div>
        <label className="font-label text-xs font-bold text-text-muted uppercase tracking-widest ml-1">
          Estimated food weight *
        </label>
        <p className="font-body-sm text-text-muted mt-1 ml-1">
          Rough kg in the bag — used for CO₂ impact across the app.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
        {BAG_WEIGHT_PRESETS_KG.map((kg) => {
          const active = selectedKg === kg && !String(customKg).trim();
          return (
            <button
              key={kg}
              type="button"
              onClick={() => onSelectPreset(kg)}
              className={`px-3 py-2 rounded-2xl border font-label font-bold text-xs transition-all ${
                active
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-2 text-text border-divider hover:border-primary/30'
              }`}
            >
              {kg} kg
            </button>
          );
        })}
      </div>
      <input
        className="w-full bg-surface-2 border border-divider rounded-2xl py-3.5 px-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-md text-text shadow-inner placeholder:text-text-faint/50"
        placeholder={`Custom (${MIN_BAG_WEIGHT_KG}–${MAX_BAG_WEIGHT_KG} kg)`}
        inputMode="decimal"
        value={customKg}
        onChange={(e) => onCustomChange(e.target.value)}
        aria-label="Custom bag weight in kilograms"
      />
    </div>
  );
}
