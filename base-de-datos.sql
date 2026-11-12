-- =====================================================================
-- Recoleta PickUp · Base de datos en Supabase
-- Pegar TODO este archivo en Supabase → SQL Editor → New query → Run.
-- Antes de correrlo, cambiar el mail de la última línea por el de Martín.
-- =====================================================================

-- ---------- Tablas ----------

create table if not exists public.orders (
  id text primary key default gen_random_uuid()::text,
  number text not null unique,
  customer text not null,
  email text not null default '',
  channel text not null check (channel in ('Tiendanube', 'WhatsApp', 'Instagram')),
  products jsonb not null default '[]',
  paid boolean not null default false,
  benefits jsonb not null default '[]',
  discount_pct integer not null default 0,
  opt_in boolean not null default false,
  status text not null check (status in ('sin_reserva', 'pendiente', 'preparacion', 'listo', 'entregado')),
  code text unique,
  created_date date not null,
  ready_date date,
  delivered_date date,
  created_at bigint not null
);
create index if not exists orders_email_idx on public.orders (lower(email));

create table if not exists public.products (
  name text primary key,
  sku text not null,
  price integer not null,
  stock integer not null default 0,
  min integer not null default 0
);

create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  config jsonb not null,
  next_tn integer not null default 1061,
  last_sync bigint not null default 0
);

-- Quiénes pueden entrar al panel (solo estos mails, aunque alguien cree una cuenta)
create table if not exists public.admins (
  email text primary key
);

-- ---------- Seguridad: nadie lee ni escribe las tablas salvo el admin ----------

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

alter table public.orders enable row level security;
alter table public.products enable row level security;
alter table public.settings enable row level security;
alter table public.admins enable row level security;

drop policy if exists admin_all on public.orders;
drop policy if exists admin_all on public.products;
drop policy if exists admin_all on public.settings;
drop policy if exists admin_read on public.admins;
create policy admin_all on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_read on public.admins for select to authenticated using (public.is_admin());

-- ---------- Ayudas internas ----------

create or replace function public.today_ar() returns date
language sql stable as $$ select (now() at time zone 'America/Argentina/Buenos_Aires')::date $$;

create or replace function public.order_json(o public.orders) returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'id', o.id, 'number', o.number, 'customer', o.customer, 'email', o.email, 'channel', o.channel,
    'products', o.products, 'paid', o.paid, 'benefits', o.benefits, 'discountPct', o.discount_pct,
    'optIn', o.opt_in, 'status', o.status, 'code', o.code, 'createdDate', o.created_date,
    'readyDate', o.ready_date, 'deliveredDate', o.delivered_date, 'createdAt', o.created_at)
$$;

-- Historial del cliente por email (solo números, nunca la lista de pedidos)
create or replace function public.history_of(p_email text, p_products text[], p_except text)
returns table (total int, done int, restock boolean)
language sql stable security definer set search_path = public as $$
  select
    count(*)::int,
    count(*) filter (where status = 'entregado')::int,
    coalesce(bool_or(status = 'entregado' and products ?| p_products), false)
  from orders
  where lower(trim(email)) = lower(trim(p_email)) and trim(p_email) <> ''
    and status <> 'sin_reserva' and id is distinct from p_except
$$;

-- Mismo cálculo que la app (quoteBenefits): los descuentos no se suman, los regalos sí
create or replace function public.compute_benefits(p_email text, p_products text[], p_except text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  r jsonb := (select config -> 'benefits' from settings where id = 1);
  h record;
  subtotal int;
  out jsonb := '[]';
  pct int := 0;
  best jsonb;
  b jsonb;
  res jsonb := '[]';
  every int;
begin
  if trim(coalesce(p_email, '')) !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then return jsonb_build_object('benefits', '[]'::jsonb, 'pct', 0); end if;
  select * into h from history_of(p_email, p_products, p_except);
  select coalesce(sum(pr.price), 0) into subtotal from unnest(p_products) as x(n) join products pr on pr.name = x.n;
  every := greatest(1, (r -> 'loyalty' ->> 'every')::int);

  if (r -> 'first' ->> 'on')::boolean and h.total = 0 then
    out := out || jsonb_build_object('id', 'first', 'title', 'Primer retiro', 'detail', r -> 'first' ->> 'gift');
  end if;
  if (r -> 'loyalty' ->> 'on')::boolean and (h.done + 1) % every = 0 then
    out := out || jsonb_build_object('id', 'loyalty', 'title', 'Retiro n.º ' || (h.done + 1),
      'detail', (r -> 'loyalty' ->> 'pct') || ' % off por completar ' || every || ' retiros', 'pct', (r -> 'loyalty' ->> 'pct')::int);
  end if;
  if (r -> 'restock' ->> 'on')::boolean and h.restock then
    out := out || jsonb_build_object('id', 'restock', 'title', 'Recompra',
      'detail', (r -> 'restock' ->> 'pct') || ' % off por volver a comprar un producto', 'pct', (r -> 'restock' ->> 'pct')::int);
  end if;
  if (r -> 'big' ->> 'on')::boolean and subtotal >= (r -> 'big' ->> 'min')::int then
    out := out || jsonb_build_object('id', 'big', 'title', 'Compra grande', 'detail', r -> 'big' ->> 'gift');
  end if;

  select coalesce(max((e ->> 'pct')::int), 0) into pct from jsonb_array_elements(out) e;
  for b in select * from jsonb_array_elements(out) loop
    if b ? 'pct' then
      if best is null and (b ->> 'pct')::int = pct then best := b; res := res || b; end if;
    else
      res := res || b;
    end if;
  end loop;
  return jsonb_build_object('benefits', res, 'pct', pct);
end $$;

create or replace function public.new_code() returns text
language plpgsql volatile security definer set search_path = public as $$
declare c text;
begin
  loop
    c := (1000 + floor(random() * 9000))::int::text;
    exit when not exists (select 1 from orders where code = c);
  end loop;
  return c;
end $$;

-- Descuenta stock; si no alcanza devuelve el nombre del producto que falta
create or replace function public.take_stock(p_products text[]) returns text
language plpgsql volatile security definer set search_path = public as $$
declare x record;
begin
  for x in select n, count(*)::int as q from unnest(p_products) as t(n) group by n loop
    perform 1 from products where name = x.n and stock >= x.q for update;
    if not found then return x.n; end if;
  end loop;
  update products p set stock = p.stock - t.q
  from (select n, count(*)::int as q from unnest(p_products) as t(n) group by n) t where p.name = t.n;
  return null;
end $$;

-- ---------- Funciones que usa el cliente (sin login) ----------

-- Datos públicos del local: horario, beneficios y stock para el checkout
create or replace function public.public_info() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'config', (select config from settings where id = 1),
    'stock', (select coalesce(jsonb_object_agg(name, stock), '{}') from products))
$$;

-- Cuántos retiros lleva ese email (para mostrar la tarjeta y el beneficio antes de pagar)
create or replace function public.quote_context(p_email text, p_products text[], p_except text default null) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('total', total, 'done', done, 'restock', restock) from history_of(p_email, p_products, p_except)
$$;

-- Un pedido por su id (el id solo lo tiene el cliente en su link)
create or replace function public.public_order(p_id text) returns jsonb
language sql stable security definer set search_path = public as $$
  select order_json(o) from orders o where o.id = p_id
$$;

-- Buscar un pedido de WhatsApp/Instagram por número, solo si espera que el cliente lo confirme
create or replace function public.find_pending_order(p_number text) returns text
language sql stable security definer set search_path = public as $$
  select id from orders
  where upper(replace(number, '#', '')) = upper(replace(trim(p_number), '#', '')) and status = 'sin_reserva'
  limit 1
$$;

-- Compra en el checkout (simulado de Tiendanube). Los beneficios se calculan acá, no en el navegador.
create or replace function public.create_purchase(p_customer text, p_email text, p_products text[], p_opt_in boolean) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  q jsonb;
  missing text;
  n int;
  o orders;
begin
  if trim(coalesce(p_email, '')) !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then return jsonb_build_object('ok', false, 'error', 'Ingresá un email válido para tu retiro.'); end if;
  if coalesce(trim(p_customer), '') = '' then return jsonb_build_object('ok', false, 'error', 'Completá tu nombre.'); end if;
  if coalesce(array_length(p_products, 1), 0) = 0 or array_length(p_products, 1) > 20 then return jsonb_build_object('ok', false, 'error', 'Tu carrito está vacío.'); end if;
  if exists (select 1 from unnest(p_products) x(n) where not exists (select 1 from products where name = x.n)) then
    return jsonb_build_object('ok', false, 'error', 'Hay un producto que ya no está en el catálogo.');
  end if;
  q := compute_benefits(p_email, p_products, null);
  missing := take_stock(p_products);
  if missing is not null then return jsonb_build_object('ok', false, 'error', 'No hay stock de ' || missing || ' en Tiendanube.'); end if;
  update settings set next_tn = next_tn + 1 where id = 1 returning next_tn - 1 into n;
  insert into orders (number, customer, email, channel, products, paid, benefits, discount_pct, opt_in, status, code, created_date, created_at)
  values ('#' || n, left(trim(p_customer), 80), left(trim(p_email), 120), 'Tiendanube', to_jsonb(p_products), true, q -> 'benefits', (q ->> 'pct')::int,
          coalesce(p_opt_in, false), 'pendiente', new_code(), today_ar(), (extract(epoch from now()) * 1000)::bigint)
  returning * into o;
  return jsonb_build_object('ok', true, 'order', order_json(o));
end $$;

-- El cliente de WhatsApp/Instagram confirma con su email desde el link
create or replace function public.confirm_pickup(p_id text, p_email text, p_opt_in boolean) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  o orders;
  q jsonb;
  missing text;
  prods text[];
begin
  select * into o from orders where id = p_id for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'No encontramos el pedido.'); end if;
  if o.status <> 'sin_reserva' then return jsonb_build_object('ok', false, 'error', 'Este pedido ya fue confirmado.'); end if;
  if trim(coalesce(p_email, '')) !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then return jsonb_build_object('ok', false, 'error', 'Ingresá un email válido para tu retiro.'); end if;
  prods := array(select jsonb_array_elements_text(o.products));
  q := compute_benefits(p_email, prods, o.id);
  missing := take_stock(prods);
  if missing is not null then return jsonb_build_object('ok', false, 'error', 'No hay stock de ' || missing || ' en Tiendanube. Escribinos por WhatsApp y lo resolvemos.'); end if;
  update orders set email = left(trim(p_email), 120), opt_in = coalesce(p_opt_in, false), benefits = q -> 'benefits',
    discount_pct = (q ->> 'pct')::int, code = new_code(), status = 'pendiente'
  where id = p_id returning * into o;
  return jsonb_build_object('ok', true, 'order', order_json(o));
end $$;

-- ---------- Permisos ----------

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.orders, public.products, public.settings to authenticated;
grant select on public.admins to authenticated;
revoke all on public.orders, public.products, public.settings, public.admins from anon;

revoke all on function public.history_of(text, text[], text) from public, anon, authenticated;
revoke all on function public.compute_benefits(text, text[], text) from public, anon, authenticated;
revoke all on function public.new_code() from public, anon, authenticated;
revoke all on function public.take_stock(text[]) from public, anon, authenticated;
grant execute on function public.public_info() to anon, authenticated;
grant execute on function public.quote_context(text, text[], text) to anon, authenticated;
grant execute on function public.public_order(text) to anon, authenticated;
grant execute on function public.find_pending_order(text) to anon, authenticated;
grant execute on function public.create_purchase(text, text, text[], boolean) to anon, authenticated;
grant execute on function public.confirm_pickup(text, text, boolean) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- ---------- Datos iniciales ----------

insert into public.settings (id, config, next_tn, last_sync) values (1, '{
  "store": {"address": "French 3160, Recoleta, CABA", "openDays": [1,2,3,4,5,6], "openHour": 9, "closeHour": 20, "pickupDays": 7, "closedDates": []},
  "benefits": {
    "first": {"on": true, "gift": "Muestra gratis de proteína"},
    "loyalty": {"on": true, "every": 5, "pct": 20},
    "big": {"on": true, "min": 60000, "gift": "Shaker Recoleta al Fallo de regalo"},
    "restock": {"on": true, "pct": 10}
  }
}', 1061, 0) on conflict (id) do nothing;

insert into public.products (name, sku, price, stock, min) values
  ('Whey Protein Star Nutrition 1 kg', 'TN-1001', 38900, 14, 5),
  ('Creatina Monohidrato Star Nutrition 300 g', 'TN-1002', 24500, 22, 6),
  ('Whey Protein ENA 930 g', 'TN-1003', 36700, 9, 5),
  ('Pre-entreno ENA Pre War', 'TN-1004', 21900, 3, 4),
  ('Colágeno Hidrolizado Gentech', 'TN-1005', 18400, 6, 4),
  ('BCAA Xtrenght 250 g', 'TN-1006', 16900, 2, 3),
  ('Barras de proteína x12', 'TN-1007', 14800, 17, 6),
  ('Shaker Recoleta al Fallo', 'TN-1008', 6500, 30, 10)
on conflict (name) do nothing;

-- CAMBIAR por el mail con el que va a entrar Martín al panel:
insert into public.admins (email) values ('MAIL_DE_MARTIN@ejemplo.com') on conflict do nothing;
