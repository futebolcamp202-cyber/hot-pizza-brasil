create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_role after insert on auth.users for each row execute function public.handle_new_user_role();

create table public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_name text not null default 'Nostra Casa Pizzaria e Lanches',
  primary_color text not null default '#f3b91b',
  background_color text not null default '#090909',
  button_color text not null default '#d71920',
  receipt_header text not null default E'NOSTRA CASA PIZZARIA E LANCHES\nAvenida Inglaterra, 210 - Londrina/PR\nWhatsApp: (43) 99630-9759',
  favicon_url text,
  cover_image_url text,
  profile_image_url text,
  updated_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'Pizzas',
  name text not null,
  description text not null default '',
  price numeric(10,2) not null default 0,
  image_url text,
  is_combo boolean not null default false,
  ingredients text[] not null default '{}',
  extras text[] not null default '{}',
  available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  address text not null,
  house_number text not null,
  residence_type text not null default 'Casa',
  distance_km numeric(8,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  subtotal numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  items jsonb not null default '[]',
  payment_method text not null,
  change_for numeric(10,2),
  status text not null default 'pending',
  order_type text not null default 'delivery',
  created_at timestamptz not null default now()
);

grant select on public.store_settings, public.products to anon, authenticated;
grant insert, update, delete on public.store_settings, public.products to authenticated;
grant insert on public.orders to anon, authenticated;
grant select, update, delete on public.orders to authenticated;
grant all on public.store_settings, public.products, public.orders to service_role;

alter table public.store_settings enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

create policy "read settings" on public.store_settings for select to anon, authenticated using (true);
create policy "admin write settings" on public.store_settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "read products" on public.products for select to anon, authenticated using (true);
create policy "admin write products" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "anyone creates orders" on public.orders for insert to anon, authenticated with check (true);
create policy "admin reads orders" on public.orders for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin updates orders" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin deletes orders" on public.orders for delete to authenticated using (public.has_role(auth.uid(),'admin'));

insert into public.store_settings (cover_image_url, profile_image_url) values (
 'https://images.pexels.com/photos/32291147/pexels-photo-32291147.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
 'https://images.pexels.com/photos/28945103/pexels-photo-28945103.jpeg?auto=compress&cs=tinysrgb&h=650&w=940');

insert into public.products (category, name, description, price, image_url, is_combo, ingredients, extras, sort_order) values
('Combos','2 Pizzas Grandes + Guaraná 2L','Escolha até 2 sabores por pizza. A melhor promoção da casa.',54.90,'https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',true,'{}','{}',1),
('Combos','Pizza Grande + Guaraná 2L','Pizza grande 35cm + Guaraná 2L. Escolha seus sabores.',28.90,'https://images.pexels.com/photos/8471699/pexels-photo-8471699.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',true,'{}','{}',2),
('Pizzas','2 Queijos','Molho de tomate, mussarela, provolone e orégano.',25,'https://images.pexels.com/photos/28945103/pexels-photo-28945103.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',false,'{"Molho de tomate","Mussarela","Provolone","Orégano"}','{}',3),
('Pizzas','Bacon','Molho de tomate, mussarela, bacon e orégano.',25,'https://images.pexels.com/photos/15550301/pexels-photo-15550301.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',false,'{"Molho de tomate","Mussarela","Bacon","Orégano"}','{}',4),
('Pizzas','Frango com Catupiry','Frango temperado, catupiry e mussarela.',30,'https://images.pexels.com/photos/11400975/pexels-photo-11400975.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',false,'{"Frango temperado","Catupiry","Mussarela"}','{"Borda Catupiry","Borda Cheddar"}',5),
('Bebidas','Guaraná 2 Litros','Gelado e perfeito para acompanhar.',9,'https://images.pexels.com/photos/31094832/pexels-photo-31094832.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',false,'{}','{}',6);

create policy "public read images" on storage.objects for select to anon, authenticated using (bucket_id = 'images');
create policy "admin upload images" on storage.objects for insert to authenticated with check (bucket_id = 'images' and public.has_role(auth.uid(),'admin'));
create policy "admin update images" on storage.objects for update to authenticated using (bucket_id = 'images' and public.has_role(auth.uid(),'admin'));
create policy "admin delete images" on storage.objects for delete to authenticated using (bucket_id = 'images' and public.has_role(auth.uid(),'admin'));