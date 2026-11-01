--
-- Amai Mochi: orders screen. v_pedido_lista for the list, actualizar_pedido()
-- to edit a pending order, and fn_guardar_lineas() shared with crear_pedido().
--

-- ---------- Order lines, shared by crear_pedido() and actualizar_pedido() ----------
-- p_lineas: [{"sabor_id": 1, "cantidad": 20}, ...]. Lines with cantidad <= 0 are
-- ignored. precio_unitario is left null so trg_detalle_precio prices and freezes it.
create or replace function fn_guardar_lineas(p_pedido_id bigint, p_lineas jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_lineas    int;
  v_guardadas int;
begin
  select count(*) into v_lineas
  from jsonb_to_recordset(p_lineas) as l(sabor_id bigint, cantidad int)
  where l.cantidad > 0;
  if v_lineas = 0 then
    raise exception 'The order has no pieces' using errcode = '22023';
  end if;

  insert into pedido_detalle (pedido_id, producto_id, cantidad)
  select p_pedido_id, pr.id, l.cantidad
  from jsonb_to_recordset(p_lineas) as l(sabor_id bigint, cantidad int)
  join producto pr on pr.sabor_id = l.sabor_id and pr.presentacion = 'pieza'
  where l.cantidad > 0;
  get diagnostics v_guardadas = row_count;

  -- A flavor without a product would silently drop pieces: undo the whole order.
  if v_guardadas <> v_lineas then
    raise exception 'A flavor in the order has no product' using errcode = '22023';
  end if;
end;
$$;

-- ---------- Create an order with its lines in one transaction ----------
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
  v_id bigint;
begin
  insert into pedido (cliente_id, fecha_entrega, metodo_pago, direccion, notas)
  values (p_cliente_id, p_fecha_entrega, p_metodo_pago,
          nullif(trim(p_direccion), ''), nullif(trim(p_notas), ''))
  returning id into v_id;

  perform fn_guardar_lineas(v_id, p_lineas);
  return v_id;
end;
$$;

-- ---------- Edit a pending order and replace its lines in one transaction ----------
-- Lines are re-priced at today's prices, as if the order were taken again.
-- Delivered or cancelled orders cannot be edited (they affect what is owed).
create or replace function actualizar_pedido(
  p_pedido_id     bigint,
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
begin
  update pedido
     set cliente_id    = p_cliente_id,
         fecha_entrega = p_fecha_entrega,
         metodo_pago   = p_metodo_pago,
         direccion     = nullif(trim(p_direccion), ''),
         notas         = nullif(trim(p_notas), '')
   where id = p_pedido_id and estado = 'pendiente';
  if not found then
    raise exception 'Only pending orders can be edited' using errcode = '22023';
  end if;

  delete from pedido_detalle where pedido_id = p_pedido_id;
  perform fn_guardar_lineas(p_pedido_id, p_lineas);
  return p_pedido_id;
end;
$$;

revoke execute on function fn_guardar_lineas(bigint, jsonb) from public, anon;
grant execute on function fn_guardar_lineas(bigint, jsonb) to authenticated;
revoke execute on function actualizar_pedido(bigint, bigint, date, metodo_pago, text, text, jsonb) from public, anon;
grant execute on function actualizar_pedido(bigint, bigint, date, metodo_pago, text, text, jsonb) to authenticated;

-- Orders screen: each order with its client, pieces, total and flavors.
create view v_pedido_lista with (security_invoker = true) as
select p.id, p.cliente_id, c.nombre as cliente, c.zona, c.telefono,
       p.fecha_pedido, p.fecha_entrega, p.estado, p.metodo_pago,
       p.direccion, p.ubicacion_url, p.notas, p.entregado_en,
       t.piezas, t.total,
       coalesce(jsonb_agg(jsonb_build_object(
                  'sabor_id', s.id, 'nombre', s.nombre,
                  'color', s.color, 'cantidad', d.cantidad)
                order by s.nombre) filter (where d.id is not null),
                '[]') as sabores
from pedido p
join cliente c on c.id = p.cliente_id
join v_pedido_total t on t.pedido_id = p.id
left join pedido_detalle d on d.pedido_id = p.id
left join producto pr on pr.id = d.producto_id
left join sabor s on s.id = pr.sabor_id
group by p.id, c.id, t.piezas, t.total;
