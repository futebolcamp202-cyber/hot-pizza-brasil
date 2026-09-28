ALTER TABLE public.products ADD COLUMN IF NOT EXISTS allow_two_flavors boolean NOT NULL DEFAULT false;
ALTER TABLE public.pizza_flavors ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
WITH v(name, description) AS (VALUES
('2 Queijos','Molho de tomate, mussarela, provolone e orégano'),
('Alho Crocante','Molho de tomate, mussarela, alho frito e orégano'),
('Bacon','Molho de tomate, mussarela, bacon e orégano'),
('Calabresa sem Cebola','Molho de tomate, mussarela, calabresa e orégano'),
('Calabresa Acebolada','Molho de tomate, mussarela, calabresa, cebola e orégano'),
('Lombo com Catupiry','Molho de tomate, mussarela, lombo fatiado, catupiry e orégano'),
('Lombo com Cheddar','Molho de tomate, mussarela, lombo fatiado, cheddar e orégano'),
('Milho com Bacon','Molho de tomate, mussarela, milho, bacon e orégano'),
('Marguerita','Molho de tomate, mussarela, rodelas de tomate e orégano'),
('Mussarela','Molho de tomate, mussarela e orégano'),
('Napolitana','Molho de tomate, presunto, tomate, mussarela e orégano'),
('Palmito','Molho de tomate, mussarela, palmito, catupiry e orégano'),
('Frango Catupiry','Molho de tomate, frango, requeijão tipo catupiry, mussarela e orégano'),
('Frango com Cheddar','Molho de tomate, frango, cheddar, mussarela e orégano'),
('Atum','Molho de tomate, mussarela, atum e orégano'),
('Atum Acebolado','Molho de tomate, mussarela, atum, cebola e orégano'),
('Carbonara','Molho de tomate, mussarela, bacon, ovo, pimenta do reino e orégano'),
('Gaúcha','Molho de tomate, mussarela, calabresa ralada, cheddar, bacon e orégano'),
('Lombo e Bacon','Molho de tomate, mussarela, lombo, bacon e orégano'),
('Mexicana','Molho de tomate, mussarela, calabresa, ovo, cebola, pimenta calabresa e orégano'),
('Paulista','Molho de tomate, mussarela, palmito, ervilha, milho e orégano'),
('Portuguesa','Molho de tomate, mussarela, presunto, cebola, ovos, azeitona e orégano'),
('Calabresa Especial','Molho de tomate, mussarela, calabresa, cebola, catupiry e orégano'),
('Lombo Especial','Molho de tomate, mussarela, lombo, cheddar, bacon e orégano'),
('4 Queijos','Molho de tomate, mussarela, provolone, parmesão e catupiry'),
('Calabresa Deliciosa','Molho de tomate, mussarela, calabresa, cebola, bacon e orégano'),
('Vegetariana','Molho de tomate, mussarela, brócolis, palmito, ervilha, milho, tomate e orégano'),
('5 Queijos','Molho de tomate, mussarela, provolone, parmesão, catupiry e cheddar')
), upd AS (
  UPDATE public.pizza_flavors f SET description = v.description FROM v WHERE lower(btrim(f.name)) = lower(btrim(v.name)) RETURNING f.name
)
INSERT INTO public.pizza_flavors (name, description)
SELECT v.name, v.description FROM v
WHERE NOT EXISTS (SELECT 1 FROM public.pizza_flavors f WHERE lower(btrim(f.name)) = lower(btrim(v.name)));