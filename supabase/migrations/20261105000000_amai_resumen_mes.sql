--
-- Amai Mochi: resumen_mes(), the monthly view of "Tu semana".
-- Adds one function; existing tables, views and functions are unchanged.
--

-- ---------- "Tu mes": the whole monthly summary in one call ----------
-- p_dia: any day of the month. Same rules as resumen_semana(): sales are
-- delivered orders by delivery date; cobrado is payments received in the
-- month; por_cobrar is the month's delivered orders still unpaid; ganancia is
-- sales minus expenses. vendido_mes_anterior compares with the previous month.
create or replace function resumen_mes(p_dia date)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with mes as (
    select date_trunc('month', p_dia)::date as inicio,
           (date_trunc('month', p_dia) + interval '1 month' - interval '1 day')::date as fin
  ), entregados as (
    select t.*
    from v_pedido_total t, mes m
    where t.estado = 'entregado'
      and t.fecha_entrega between m.inicio and m.fin
  ), ventas as (
    select coalesce(sum(total), 0) as vendido, count(*) as pedidos,
           coalesce(sum(piezas), 0) as piezas
    from entregados
  )
  select jsonb_build_object(
    'inicio',   m.inicio,
    'vendido',  v.vendido,
    'pedidos',  v.pedidos,
    'piezas',   v.piezas,
    'cobrado',
      (select coalesce(sum(p.monto), 0) from pago p
        where p.fecha between m.inicio and m.fin),
    'gastado',  g.gastado,
    'ganancia', v.vendido - g.gastado,
    'vendido_mes_anterior',
      (select coalesce(sum(a.total), 0) from v_pedido_total a
        where a.estado = 'entregado'
          and a.fecha_entrega >= (m.inicio - interval '1 month')::date
          and a.fecha_entrega < m.inicio),
    'por_cobrar',
      (select coalesce(sum(e.total), 0)
         from entregados e
        where not exists (select 1 from pago p where p.pedido_id = e.pedido_id)),
    'por_sabor',
      coalesce((select jsonb_agg(jsonb_build_object(
                         'sabor', x.sabor, 'color', x.color, 'piezas', x.piezas)
                       order by x.piezas desc, x.sabor)
                  from (select s.nombre as sabor, s.color, sum(d.cantidad) as piezas
                          from entregados e
                          join pedido_detalle d on d.pedido_id = e.pedido_id
                          join producto pr on pr.id = d.producto_id
                          join sabor s on s.id = pr.sabor_id
                         group by s.nombre, s.color) x), '[]'::jsonb),
    'por_cliente',
      coalesce((select jsonb_agg(jsonb_build_object(
                         'cliente_id', c.id, 'nombre', c.nombre, 'zona', c.zona,
                         'piezas', x.piezas, 'total', x.total)
                       order by x.total desc, c.nombre)
                  from (select cliente_id, sum(piezas) as piezas, sum(total) as total
                          from entregados group by cliente_id) x
                  join cliente c on c.id = x.cliente_id), '[]'::jsonb)
  )
  from mes m
  cross join ventas v
  cross join lateral (
    select coalesce(sum(gs.monto), 0) as gastado from gasto gs
     where gs.fecha between m.inicio and m.fin
  ) g;
$$;

revoke execute on function resumen_mes(date) from public, anon;
grant execute on function resumen_mes(date) to authenticated;
