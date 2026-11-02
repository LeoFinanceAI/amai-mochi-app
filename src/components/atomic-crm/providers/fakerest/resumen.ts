import type { DataProvider } from "ra-core";

import type { Gasto, Pago, ResumenSemana } from "../../types";
import { lunesDeLaSemana } from "../../gastos/gastoForm";
import { fromIsoDate, toIsoDate } from "../../pedidos/fechaEntrega";
import { getPedidoLista } from "./pedidos";

// In-memory version of resumen_semana() (supabase/schemas/09_amai.sql) for
// the demo and tests.

const ALL = {
  pagination: { page: 1, perPage: 10_000 },
  sort: { field: "id", order: "ASC" },
  filter: {},
} as const;

const sumar = <T>(items: T[], valor: (item: T) => number) =>
  items.reduce((total, item) => total + Number(valor(item)), 0);

const diasDesde = (lunes: string, dias: number) => {
  const fecha = fromIsoDate(lunes);
  return toIsoDate(
    new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias),
  );
};

export const resumenSemana = async (
  dataProvider: DataProvider,
  fecha: string,
): Promise<ResumenSemana> => {
  const lunes = lunesDeLaSemana(fromIsoDate(fecha));
  const domingo = diasDesde(lunes, 6);
  const enSemana = (dia: string, desde = lunes, hasta = domingo) =>
    dia >= desde && dia <= hasta;

  const [{ data: pedidos }, { data: pagos }, { data: gastos }] =
    await Promise.all([
      getPedidoLista(dataProvider, { ...ALL, filter: { estado: "entregado" } }),
      dataProvider.getList<Pago>("pago", ALL),
      dataProvider.getList<Gasto>("gasto", ALL),
    ]);
  const entregados = pedidos.filter((p) => enSemana(p.fecha_entrega));
  const pagados = new Set(pagos.map((p) => p.pedido_id));
  const vendido = sumar(entregados, (p) => p.total);
  const gastado = sumar(
    gastos.filter((g) => enSemana(g.fecha)),
    (g) => g.monto,
  );

  const porSabor = new Map<
    string,
    { sabor: string; color: string; piezas: number }
  >();
  for (const sabor of entregados.flatMap((p) => p.sabores)) {
    const actual = porSabor.get(sabor.nombre);
    porSabor.set(sabor.nombre, {
      sabor: sabor.nombre,
      color: sabor.color,
      piezas: (actual?.piezas ?? 0) + sabor.cantidad,
    });
  }
  const porCliente = new Map<number, ResumenSemana["por_cliente"][number]>();
  for (const p of entregados) {
    const actual = porCliente.get(p.cliente_id);
    porCliente.set(p.cliente_id, {
      cliente_id: p.cliente_id,
      nombre: p.cliente,
      zona: p.zona,
      piezas: (actual?.piezas ?? 0) + p.piezas,
      total: (actual?.total ?? 0) + p.total,
    });
  }

  return {
    lunes,
    vendido,
    pedidos: entregados.length,
    piezas: sumar(entregados, (p) => p.piezas),
    cobrado: sumar(
      pagos.filter((p) => enSemana(p.fecha)),
      (p) => p.monto,
    ),
    gastado,
    ganancia: vendido - gastado,
    vendido_semana_anterior: sumar(
      pedidos.filter((p) =>
        enSemana(p.fecha_entrega, diasDesde(lunes, -7), diasDesde(lunes, -1)),
      ),
      (p) => p.total,
    ),
    por_cobrar: sumar(
      entregados.filter((p) => !pagados.has(p.id)),
      (p) => p.total,
    ),
    por_dia: [0, 1, 2, 3, 4, 5, 6].map((dias) => {
      const dia = diasDesde(lunes, dias);
      return {
        fecha: dia,
        piezas: sumar(
          entregados.filter((p) => p.fecha_entrega === dia),
          (p) => p.piezas,
        ),
      };
    }),
    por_sabor: [...porSabor.values()].sort(
      (a, b) => b.piezas - a.piezas || a.sabor.localeCompare(b.sabor),
    ),
    por_cliente: [...porCliente.values()].sort(
      (a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre),
    ),
  };
};
