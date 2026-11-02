--
-- Amai Mochi: resumen_semana(), the data of the "Tu semana" screen.
--

-- ---------- "Tu semana": the whole weekly summary in one call ----------
-- p_lunes: any day of the week (it is moved to its Monday). Weeks run Monday to
-- Sunday by delivery date, like v_resumen_semanal. Sales are delivered orders;
-- cobrado is payments received that week; por_cobrar is that week's delivered
-- orders still unpaid; ganancia is sales minus expenses.
create or replace function resumen_semana(p_lunes date)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with semana as (
    select date_trunc('week', p_lunes)::date as lunes
  ), entregados as (
    select t.*
    from v_pedido_total t, semana s
    where t.estado = 'entregado'
      and t.fecha_entrega between s.lunes and s.lunes + 6
  )
  select jsonb_build_object(
    'lunes',    s.lunes,
    'vendido',  coalesce(r.vendido, 0),
    'pedidos',  coalesce(r.pedidos, 0),
    'piezas',   coalesce(r.piezas, 0),
    'cobrado',  coalesce(r.cobrado, 0),
    'gastado',  coalesce(r.gastado, 0),
    'ganancia', coalesce(r.ganancia, 0),
    'vendido_semana_anterior',
      coalesce((select a.vendido from v_resumen_semanal a where a.semana = s.lunes - 7), 0),
    'por_cobrar',
      (select coalesce(sum(e.total), 0)
         from entregados e
        where not exists (select 1 from pago p where p.pedido_id = e.pedido_id)),
    'por_dia',
      (select jsonb_agg(jsonb_build_object(
                'fecha', d::date,
                'piezas', (select coalesce(sum(e.piezas), 0)
                             from entregados e where e.fecha_entrega = d::date))
              order by d)
         from generate_series(s.lunes, s.lunes + 6, interval '1 day') d),
    'por_sabor',
      coalesce((select jsonb_agg(jsonb_build_object(
                         'sabor', v.sabor, 'color', v.color, 'piezas', v.piezas)
                       order by v.piezas desc, v.sabor)
                  from v_ventas_sabor_semana v
                 where v.semana = s.lunes), '[]'::jsonb),
    'por_cliente',
      coalesce((select jsonb_agg(jsonb_build_object(
                         'cliente_id', c.id, 'nombre', c.nombre, 'zona', c.zona,
                         'piezas', x.piezas, 'total', x.total)
                       order by x.total desc, c.nombre)
                  from (select cliente_id, sum(piezas) as piezas, sum(total) as total
                          from entregados group by cliente_id) x
                  join cliente c on c.id = x.cliente_id), '[]'::jsonb)
  )
  from semana s
  left join v_resumen_semanal r on r.semana = s.lunes;
$$;

revoke execute on function resumen_semana(date) from public, anon;
grant execute on function resumen_semana(date) to authenticated;
