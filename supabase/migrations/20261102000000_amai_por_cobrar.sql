--
-- Amai Mochi: "Por cobrar". v_cobranza_pendiente gains telefono and id and
-- counts days in Mexico time; a payment for an order takes its client and
-- total from SQL.
--

-- Delivered orders with no payment linked, for the "Por cobrar" screen. Days are
-- counted with Mexico's date, not the server's UTC date. telefono feeds the
-- WhatsApp reminder; id lets the app list the rows.
create or replace view v_cobranza_pendiente with (security_invoker = true) as
select t.pedido_id, t.cliente_id, c.nombre, c.zona, t.fecha_entrega,
       t.piezas, t.total,
       (now() at time zone 'America/Mexico_City')::date - t.fecha_entrega as dias,
       c.telefono,
       t.pedido_id as id
from v_pedido_total t
join cliente c on c.id = t.cliente_id
where t.estado = 'entregado'
  and not exists (select 1 from pago pg where pg.pedido_id = t.pedido_id);

-- ---------- A payment for an order takes its client and total from SQL ----------
-- The app sends only pedido_id and metodo. One payment per order for now: allowing
-- partial payments (abonos) means dropping the "already paid" rule. Payments with
-- no order ("a cuenta") are left as they are.
create or replace function trg_pago_de_pedido()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_cliente bigint;
  v_total   numeric;
begin
  if new.pedido_id is null then
    return new;
  end if;

  select cliente_id, total into v_cliente, v_total
  from v_pedido_total where pedido_id = new.pedido_id;
  if not found then
    raise exception 'Order not found' using errcode = '22023';
  end if;
  if exists (select 1 from pago where pedido_id = new.pedido_id) then
    raise exception 'The order is already paid' using errcode = '22023';
  end if;
  if new.monto is null then
    if v_total <= 0 then
      raise exception 'The order has no price' using errcode = '22023';
    end if;
    new.monto := v_total;
  end if;
  new.cliente_id := v_cliente;
  return new;
end;
$$;

create trigger pago_de_pedido
before insert on pago
for each row execute function trg_pago_de_pedido();
