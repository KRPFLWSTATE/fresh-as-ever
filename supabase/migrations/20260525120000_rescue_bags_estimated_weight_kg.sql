-- Merchant-estimated food weight (kg) for CO2e and waste metrics app-wide.
ALTER TABLE public.rescue_bags
  ADD COLUMN IF NOT EXISTS estimated_weight_kg numeric(5, 2) NOT NULL DEFAULT 1.0;

ALTER TABLE public.rescue_bags
  DROP CONSTRAINT IF EXISTS rescue_bags_estimated_weight_kg_check;

ALTER TABLE public.rescue_bags
  ADD CONSTRAINT rescue_bags_estimated_weight_kg_check
  CHECK (estimated_weight_kg >= 0.1 AND estimated_weight_kg <= 25);

COMMENT ON COLUMN public.rescue_bags.estimated_weight_kg IS
  'Merchant-estimated food weight (kg) for CO2e and waste metrics.';
