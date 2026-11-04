--
-- Amai Mochi: quick sale to the public and client activity.
-- Adds one function and one view; existing tables, views and functions are
-- unchanged.
--

-- ---------- Quick sale: a delivered and paid order in one transaction ----------
-- For a sale to the public or at an event: no minimum, delivered today (Mexico
-- date) and paid right away. With no client it goes to "Público en general",
-- created the first time. The lines are priced by the usual trigger and the
-- payment takes its amount from SQL; a sale with no price yet stays unpaid, so
-- it shows up in "Por cobrar" instead of a $0 payment.
create or replace function venta_rapida(
  p_cliente_id  bigint,
  p_metodo_pago metodo_pago,
  p_notas       text,
  p_lineas      jsonb
)
returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_cliente bigint := p_cliente_id;
  v_hoy     date   := (now() at time zone 'America/Mexico_City')::date;
  v_id      bigint;
begin
  if v_cliente is null then
    select id into v_cliente
    from cliente
    where tipo = 'publico' and nombre = 'Público en general'
    order by id
    limit 1;
    if v_cliente is null then
      insert into cliente (nombre, tipo)
      values ('Público en general', 'publico')
      returning id into v_cliente;
    end if;
  end if;

  v_id := crear_pedido(v_cliente, v_hoy, p_metodo_pago, null, p_notas, p_lineas);
  update pedido set estado = 'entregado' where id = v_id;

  if (select total from v_pedido_total where pedido_id = v_id) > 0 then
    insert into pago (pedido_id, metodo, fecha)
    values (v_id, p_metodo_pago, v_hoy);
  end if;
  return v_id;
end;
$$;

revoke execute on function venta_rapida(bigint, metodo_pago, text, jsonb) from public, anon;
grant execute on function venta_rapida(bigint, metodo_pago, text, jsonb) to authenticated;

-- ---------- What each client buys and when they last ordered ----------
-- For "Tus clientes": who buys the most in the last 90 days and who has not
-- ordered in a while. Sales count delivered orders; the last order counts any
-- order that was not cancelled. Days use Mexico's date.
create or replace view v_cliente_actividad with (security_invoker = true) as
with hoy as (
  select (now() at time zone 'America/Mexico_City')::date as dia
)
select c.id, c.nombre, c.tipo, c.zona, c.telefono, c.activo,
       count(t.pedido_id) filter (where t.estado = 'entregado')           as pedidos,
       coalesce(sum(t.piezas) filter (where t.estado = 'entregado'), 0)   as piezas,
       coalesce(sum(t.total)  filter (where t.estado = 'entregado'), 0)   as total,
       coalesce(sum(t.total)  filter (where t.estado = 'entregado'
                                        and t.fecha_entrega > hoy.dia - 90), 0)
                                                                          as total_90_dias,
       max(t.fecha_entrega) filter (where t.estado <> 'cancelado')        as ultimo_pedido,
       hoy.dia - max(t.fecha_entrega) filter (where t.estado <> 'cancelado')
                                                                          as dias_sin_pedir
from cliente c
cross join hoy
left join v_pedido_total t on t.cliente_id = c.id
group by c.id, hoy.dia;
