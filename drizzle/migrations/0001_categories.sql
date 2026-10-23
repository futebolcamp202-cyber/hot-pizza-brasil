CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX categories_name_unique ON public.categories (lower(trim(name)));
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin write categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.categories (name, sort_order)
SELECT c.name, c.ord FROM unnest(ARRAY['COMBO LANCHE','Pizzas salgadas','Pizzas doce','Pastéis doces e salgados','Salgados de festa','Delicioso churros','Lanches linha Smash','Lanches linha Premium','Lanches econômica','Hot dog e misto','Porções','Bebidas','Sucos naturais','Bebidas alcoólica']) WITH ORDINALITY AS c(name, ord);
INSERT INTO public.categories (name, sort_order)
SELECT DISTINCT ON (lower(trim(p.category))) trim(p.category), 100
FROM public.products p
WHERE trim(coalesce(p.category,'')) <> ''
  AND NOT EXISTS (SELECT 1 FROM public.categories c WHERE lower(trim(c.name)) = lower(trim(p.category)));
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;