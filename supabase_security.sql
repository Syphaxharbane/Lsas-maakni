-- À exécuter dans Supabase > SQL Editor
-- La table orders existe déjà. Ces règles permettent au site de créer une commande
-- sans donner au public le droit de lire/modifier les commandes.

alter table public.orders enable row level security;

drop policy if exists "Public can create orders" on public.orders;

create policy "Public can create orders"
on public.orders
for insert
to anon
with check (
  customer_name is not null
  and phone is not null
  and wilaya is not null
  and commune is not null
  and delivery_type in ('Bureau','Domicile')
  and subtotal >= 0
  and delivery_price in (550,900)
  and total = subtotal + delivery_price
  and jsonb_typeof(products) = 'array'
);
