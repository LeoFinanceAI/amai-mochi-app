--
-- Amai Mochi: MVP core (catalog, customers, prices, orders, payments, expenses).
-- Declarative source of truth; first shipped by migration 20261031000000_amai_core.sql,
-- products per flavor and crear_pedido() by 20261101000000_amai_crear_pedido.sql.
--

-- ---------- Tipos ----------
create type tipo_cliente  as enum ('distribuidor', 'publico', 'evento');
create type estado_pedido as enum ('pendiente', 'entregado', 'cancelado');
create type metodo_pago   as enum ('efectivo', 'transferencia', 'tarjeta', 'otro');
create type categoria_gasto as enum ('ingredientes', 'empaque', 'transporte', 'otro');

-- ---------- Catálogo ----------
create table sabor (
  id         bigint generated always as identity primary key,
  nombre     text not null unique,
  color      text not null default '#E8708F' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  activo     boolean not null default true,
  creado_en  timestamptz not null default now()
);

create table producto (
  id                bigint generated always as identity primary key,
  sabor_id          bigint not null references sabor(id) on delete restrict,
  presentacion      text not null default 'pieza',      -- pieza, caja, ...
  piezas_por_unidad int not null default 1 check (piezas_por_unidad > 0),
  precio_lista      numeric(10,2) not null check (precio_lista >= 0),
  activo            boolean not null default true,
  unique (sabor_id, presentacion)
);

-- ---------- Clientes ----------
create table cliente (
  id         bigint generated always as identity primary key,
  nombre     text not null,
  tipo       tipo_cliente not null default 'distribuidor',
  zona       text,                                      -- Guadalajara, Colima, Tepetitlán...
  telefono   text check (telefono is null or telefono ~ '^[0-9]{10,13}$'),  -- solo dígitos, para wa.me
  notas      text,
  activo     boolean not null default true,
  creado_en  timestamptz not null default now()
);

-- Precios de mayoreo por escalón; cliente_id null = precio general.
create table precio (
  id            bigint generated always as identity primary key,
  producto_id   bigint not null references producto(id) on delete restrict,
  cliente_id    bigint references cliente(id) on delete cascade,
  cantidad_min  int not null default 1 check (cantidad_min > 0),
  precio        numeric(10,2) not null check (precio >= 0),
  unique nulls not distinct (producto_id, cliente_id, cantidad_min)
);

-- ---------- Pedidos ----------
create table pedido (
  id             bigint generated always as identity primary key,
  cliente_id     bigint not null references cliente(id) on delete restrict,
  fecha_pedido   timestamptz not null default now(),
  fecha_entrega  date not null,
  estado         estado_pedido not null default 'pendiente',
  metodo_pago    metodo_pago,
  direccion      text,
  ubicacion_url  text,                                  -- link de Maps que manda el cliente
  notas          text,
  entregado_en   timestamptz,
  creado_por     uuid default auth.uid()
);
create index pedido_cliente_idx on pedido (cliente_id);
create index pedido_entrega_idx on pedido (fecha_entrega, estado);

create table pedido_detalle (
  id               bigint generated always as identity primary key,
  pedido_id        bigint not null references pedido(id) on delete cascade,
  producto_id      bigint not null references producto(id) on delete restrict,
  cantidad         int not null check (cantidad > 0),
  precio_unitario  numeric(10,2) not null check (precio_unitario >= 0)  -- congelado al guardar
);
create index pedido_detalle_pedido_idx on pedido_detalle (pedido_id);

-- ---------- Pagos y gastos ----------
create table pago (
  id          bigint generated always as identity primary key,
  cliente_id  bigint not null references cliente(id) on delete restrict,
  pedido_id   bigint references pedido(id) on delete set null,
  fecha       date not null default current_date,
  monto       numeric(10,2) not null check (monto > 0),
  metodo      metodo_pago not null default 'efectivo',
  referencia  text,
  notas       text,
  creado_en   timestamptz not null default now()
);
create index pago_cliente_idx on pago (cliente_id);

create table gasto (
  id           bigint generated always as identity primary key,
  fecha        date not null default current_date,
  categoria    categoria_gasto not null default 'otro',
  monto        numeric(10,2) not null check (monto > 0),
  descripcion  text,
  creado_en    timestamptz not null default now()
);

-- ---------- Precio: regla de negocio en SQL ----------
-- Orden: precio especial del cliente → escalón general → precio de lista.
create or replace function fn_precio(p_cliente bigint, p_producto bigint, p_cantidad int)
returns numeric
language sql stable
set search_path = public
as $$
  select coalesce(
    (select precio from precio
      where producto_id = p_producto and cliente_id = p_cliente and cantidad_min <= p_cantidad
      order by cantidad_min desc limit 1),
    (select precio from precio
      where producto_id = p_producto and cliente_id is null and cantidad_min <= p_cantidad
      order by cantidad_min desc limit 1),
    (select precio_lista from producto where id = p_producto)
  );
$$;

-- Si la app no manda precio_unitario, se calcula y se congela al insertar.
create or replace function trg_detalle_precio()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.precio_unitario is null then
    new.precio_unitario := fn_precio(
      (select cliente_id from pedido where id = new.pedido_id),
      new.producto_id,
      new.cantidad);
  end if;
  return new;
end;
$$;

create trigger detalle_precio
before insert on pedido_detalle
for each row execute function trg_detalle_precio();

-- Registra la hora de entrega automáticamente.
create or replace function trg_pedido_entregado()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.estado = 'entregado' and old.estado is distinct from 'entregado' then
    new.entregado_en := now();
  elsif new.estado <> 'entregado' then
    new.entregado_en := null;
  end if;
  return new;
end;
$$;

create trigger pedido_entregado
before update of estado on pedido
for each row execute function trg_pedido_entregado();

-- ---------- One "pieza" product per flavor ----------
-- Orders are taken by flavor; pedido_detalle points to producto. Each flavor gets
-- a per-piece product automatically, priced at 0 until real prices are loaded.
create or replace function trg_sabor_producto()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into producto (sabor_id, presentacion, piezas_por_unidad, precio_lista)
  values (new.id, 'pieza', 1, 0)
  on conflict (sabor_id, presentacion) do nothing;
  return new;
end;
$$;

create trigger sabor_producto
after insert on sabor
for each row execute function trg_sabor_producto();

-- ---------- Create an order with its lines in one transaction ----------
-- p_lineas: [{"sabor_id": 1, "cantidad": 20}, ...]. Lines with cantidad <= 0 are
-- ignored. precio_unitario is left null so trg_detalle_precio prices and freezes it.
-- security invoker: runs with the caller's rights, so RLS applies.
create or replace function crear_pedido(
  p_cliente_id    bigint,
  p_fecha_entrega date,
  p_metodo_pago   metodo_pago,
  p_direccion     text,
  p_notas         text,
  p_lineas        jsonb
)
returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id       bigint;
  v_lineas   int;
  v_guardadas int;
begin
  select count(*) into v_lineas
  from jsonb_to_recordset(p_lineas) as l(sabor_id bigint, cantidad int)
  where l.cantidad > 0;
  if v_lineas = 0 then
    raise exception 'The order has no pieces' using errcode = '22023';
  end if;

  insert into pedido (cliente_id, fecha_entrega, metodo_pago, direccion, notas)
  values (p_cliente_id, p_fecha_entrega, p_metodo_pago,
          nullif(trim(p_direccion), ''), nullif(trim(p_notas), ''))
  returning id into v_id;

  insert into pedido_detalle (pedido_id, producto_id, cantidad)
  select v_id, pr.id, l.cantidad
  from jsonb_to_recordset(p_lineas) as l(sabor_id bigint, cantidad int)
  join producto pr on pr.sabor_id = l.sabor_id and pr.presentacion = 'pieza'
  where l.cantidad > 0;
  get diagnostics v_guardadas = row_count;

  -- A flavor without a product would silently drop pieces: undo the whole order.
  if v_guardadas <> v_lineas then
    raise exception 'A flavor in the order has no product' using errcode = '22023';
  end if;

  return v_id;
end;
$$;

revoke execute on function crear_pedido(bigint, date, metodo_pago, text, text, jsonb) from public, anon;
grant execute on function crear_pedido(bigint, date, metodo_pago, text, text, jsonb) to authenticated;

-- ---------- Vistas (security_invoker para respetar RLS) ----------
create view v_pedido_total with (security_invoker = true) as
select p.id as pedido_id, p.cliente_id, p.fecha_entrega, p.estado,
       coalesce(sum(d.cantidad), 0)                     as piezas,
       coalesce(sum(d.cantidad * d.precio_unitario), 0) as total
from pedido p
left join pedido_detalle d on d.pedido_id = p.id
group by p.id;

-- Saldo = pedidos entregados − pagos.
create view v_saldo_cliente with (security_invoker = true) as
with cargos as (
  select cliente_id, sum(total) as cargos
  from v_pedido_total where estado = 'entregado' group by cliente_id
), abonos as (
  select cliente_id, sum(monto) as abonos from pago group by cliente_id
)
select c.id as cliente_id, c.nombre, c.zona, c.telefono,
       coalesce(cg.cargos, 0)                            as cargos,
       coalesce(ab.abonos, 0)                            as abonos,
       coalesce(cg.cargos, 0) - coalesce(ab.abonos, 0)   as saldo
from cliente c
left join cargos cg on cg.cliente_id = c.id
left join abonos ab on ab.cliente_id = c.id;

-- Pedidos entregados sin pago ligado, con días transcurridos (pantalla "Por cobrar").
create view v_cobranza_pendiente with (security_invoker = true) as
select t.pedido_id, t.cliente_id, c.nombre, c.zona, t.fecha_entrega,
       t.piezas, t.total,
       current_date - t.fecha_entrega as dias
from v_pedido_total t
join cliente c on c.id = t.cliente_id
where t.estado = 'entregado'
  and not exists (select 1 from pago pg where pg.pedido_id = t.pedido_id);

create view v_entregas_hoy with (security_invoker = true) as
select p.id as pedido_id, c.nombre, c.telefono, p.direccion, p.ubicacion_url,
       t.piezas, t.total, p.metodo_pago, p.notas
from pedido p
join cliente c on c.id = p.cliente_id
join v_pedido_total t on t.pedido_id = p.id
where p.fecha_entrega = current_date and p.estado = 'pendiente';

-- Resumen por semana (lunes a domingo).
create view v_resumen_semanal with (security_invoker = true) as
with ventas as (
  select date_trunc('week', fecha_entrega)::date as semana,
         count(*) as pedidos, sum(piezas) as piezas, sum(total) as vendido
  from v_pedido_total where estado = 'entregado' group by 1
), cobros as (
  select date_trunc('week', fecha)::date as semana, sum(monto) as cobrado
  from pago group by 1
), gastos as (
  select date_trunc('week', fecha)::date as semana, sum(monto) as gastado
  from gasto group by 1
)
select coalesce(v.semana, c.semana, g.semana) as semana,
       coalesce(v.pedidos, 0)  as pedidos,
       coalesce(v.piezas, 0)   as piezas,
       coalesce(v.vendido, 0)  as vendido,
       coalesce(c.cobrado, 0)  as cobrado,
       coalesce(g.gastado, 0)  as gastado,
       coalesce(v.vendido, 0) - coalesce(g.gastado, 0) as ganancia
from ventas v
full join cobros c on c.semana = v.semana
full join gastos g on g.semana = coalesce(v.semana, c.semana);

create view v_ventas_sabor_semana with (security_invoker = true) as
select date_trunc('week', p.fecha_entrega)::date as semana,
       s.nombre as sabor, s.color,
       sum(d.cantidad) as piezas
from pedido p
join pedido_detalle d on d.pedido_id = p.id
join producto pr on pr.id = d.producto_id
join sabor s on s.id = pr.sabor_id
where p.estado = 'entregado'
group by 1, 2, 3;

-- ---------- Seguridad (RLS) ----------
-- MVP: un solo usuario (Eduardo). Cualquier usuario autenticado tiene acceso total;
-- anon no ve nada. Endurecer cuando haya más usuarios.
do $$
declare t text;
begin
  foreach t in array array['sabor','producto','cliente','precio','pedido','pedido_detalle','pago','gasto']
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I on %I for all to authenticated using (true) with check (true)',
      t || '_autenticados', t);
  end loop;
end $$;
