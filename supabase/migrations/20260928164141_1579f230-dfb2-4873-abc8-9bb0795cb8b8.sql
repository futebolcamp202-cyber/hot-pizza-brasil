DELETE FROM public.pizza_flavors WHERE created_at >= '2026-09-28';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS combo_flavors_step boolean NOT NULL DEFAULT false;