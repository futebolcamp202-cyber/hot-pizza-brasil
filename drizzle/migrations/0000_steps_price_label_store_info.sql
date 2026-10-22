ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price_label text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS savory_flavors_step boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trad_borders_step boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pastel_flavors_step boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_options jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS whatsapp_number text NOT NULL DEFAULT '(43) 99630-9759',
  ADD COLUMN IF NOT EXISTS opening_hours text NOT NULL DEFAULT 'Aberto até 03h',
  ADD COLUMN IF NOT EXISTS broto_price numeric NOT NULL DEFAULT 10;

ALTER TABLE public.store_settings ALTER COLUMN store_name SET DEFAULT 'PIZZA HOT';