import type { DataProvider } from "ra-core";

import type { Gasto, Pago, ResumenMes, ResumenSemana } from "../../types";
import { lunesDeLaSemana } from "../../gastos/gastoForm";
import { fromIsoDate, toIsoDate } from "../../pedidos/fechaEntrega";
import { getPedidoLista } from "./pedidos";

// In-memory versions of resumen_semana() and resumen_mes()
// (supabase/schemas/09_amai.sql) for the demo and tests.

const ALL = {
  pagination: { page: 1, perPage: 10_000 },
  sort: { field: "id", order: "ASC" },
  filter: {},
} as const;

const sumar = <T>(items: T[], valor: (item: T) => number) =>
  items.reduce((total, item) => total + Number(valor(item)), 0);

const diasDesde = (inicio: string, dias: number) => {
  const fecha = fromIsoDate(inicio);
  return toIsoDate(
    new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias),
  );
};

interface Rango {
  desde: string;
  hasta: string;
}

type Periodo = Omit<ResumenMes, "inicio" | "vendido_mes_anterior"> & {
  vendido_anterior: number;
  porDia: (desde: string, dias: number) => ResumenSemana["por_dia"];
};

// The figures shared by the week and the month, for a period and the one
// before it (inclusive YYYY-MM-DD dates).
const resumenPeriodo = async (
  dataProvider: DataProvider,
  periodo: Rango,
  anterior: Rango,
): Promise<Periodo> => {
  const dentro = (dia: string, { desde, hasta }: Rango = periodo) =>
    dia >= desde && dia <= hasta;

  const [{ data: pedidos }, { data: pagos }, { data: gastos }] =
    await Promise.all([
      getPedidoLista(dataProvider, { ...ALL, filter: { estado: "entregado" } }),
      dataProvider.getList<Pago>("pago", ALL),
      dataProvider.getList<Gasto>("gasto", ALL),
    ]);
  const entregados = pedidos.filter((p) => dentro(p.fecha_entrega));
  const pagados = new Set(pagos.map((p) => p.pedido_id));
  const vendido = sumar(entregados, (p) => p.total);
  const gastado = sumar(
    gastos.filter((g) => dentro(g.fecha)),
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
    vendido,
    pedidos: entregados.length,
    piezas: sumar(entregados, (p) => p.piezas),
    cobrado: sumar(
      pagos.filter((p) => dentro(p.fecha)),
      (p) => p.monto,
    ),
    gastado,
    ganancia: vendido - gastado,
    vendido_anterior: sumar(
      pedidos.filter((p) => dentro(p.fecha_entrega, anterior)),
      (p) => p.total,
    ),
    por_cobrar: sumar(
      entregados.filter((p) => !pagados.has(p.id)),
      (p) => p.total,
    ),
    porDia: (desde, dias) =>
      Array.from({ length: dias }, (_, i) => {
        const dia = diasDesde(desde, i);
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

export const resumenSemana = async (
  dataProvider: DataProvider,
  fecha: string,
): Promise<ResumenSemana> => {
  const lunes = lunesDeLaSemana(fromIsoDate(fecha));
  const { vendido_anterior, porDia, ...periodo } = await resumenPeriodo(
    dataProvider,
    { desde: lunes, hasta: diasDesde(lunes, 6) },
    { desde: diasDesde(lunes, -7), hasta: diasDesde(lunes, -1) },
  );
  return {
    ...periodo,
    lunes,
    vendido_semana_anterior: vendido_anterior,
    por_dia: porDia(lunes, 7),
  };
};

export const resumenMes = async (
  dataProvider: DataProvider,
  fecha: string,
): Promise<ResumenMes> => {
  const dia = fromIsoDate(fecha);
  const inicio = toIsoDate(new Date(dia.getFullYear(), dia.getMonth(), 1));
  const fin = toIsoDate(new Date(dia.getFullYear(), dia.getMonth() + 1, 0));
  const anterior = {
    desde: toIsoDate(new Date(dia.getFullYear(), dia.getMonth() - 1, 1)),
    hasta: diasDesde(inicio, -1),
  };
  const {
    vendido_anterior,
    porDia: _porDia,
    ...periodo
  } = await resumenPeriodo(
    dataProvider,
    { desde: inicio, hasta: fin },
    anterior,
  );
  return { ...periodo, inicio, vendido_mes_anterior: vendido_anterior };
};
