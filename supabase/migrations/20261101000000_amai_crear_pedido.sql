--
-- Amai Mochi: one product per flavor and crear_pedido(), the atomic
-- "new order" write used by the Nuevo pedido screen.
--

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

-- Backfill: products for the flavors that already exist.
insert into producto (sabor_id, presentacion, piezas_por_unidad, precio_lista)
select id, 'pieza', 1, 0 from sabor
on conflict (sabor_id, presentacion) do nothing;
