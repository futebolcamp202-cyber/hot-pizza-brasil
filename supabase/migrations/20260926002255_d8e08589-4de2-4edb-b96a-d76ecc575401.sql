ALTER TABLE public.products ADD COLUMN requires_border boolean NOT NULL DEFAULT false;
UPDATE public.products SET requires_border = true WHERE is_combo;

CREATE TABLE public.pizza_flavors (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX pizza_flavors_name_uq ON public.pizza_flavors (lower(btrim(name)));
GRANT SELECT ON public.pizza_flavors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pizza_flavors TO authenticated;
GRANT ALL ON public.pizza_flavors TO service_role;
ALTER TABLE public.pizza_flavors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read flavors" ON public.pizza_flavors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin write flavors" ON public.pizza_flavors FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TABLE public.borders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, price numeric NOT NULL DEFAULT 0, sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.borders TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.borders TO authenticated;
GRANT ALL ON public.borders TO service_role;
ALTER TABLE public.borders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read borders" ON public.borders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin write borders" ON public.borders FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

INSERT INTO public.pizza_flavors (name) VALUES ('2 Queijos'),('Alho crocante'),('Bacon'),('Calabresa sem cebola'),('Calabresa acebolada'),('Lombo com catupiry'),('Lombo com cheddar'),('Milho com bacon'),('Margherita'),('Mussarela'),('Napolitana'),('Palmito'),('Frango catupiry'),('Frango cheddar');
INSERT INTO public.borders (name, price, sort_order) VALUES ('Borda Cheddar',8,1),('Borda Catupiry',8,2),('Sem Borda',0,3);

ALTER PUBLICATION supabase_realtime ADD TABLE public.pizza_flavors, public.borders;