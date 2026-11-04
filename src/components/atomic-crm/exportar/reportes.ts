import type { DataProvider, TranslateFunction } from "ra-core";

import type { Cliente, Gasto, Pago, PedidoLista } from "../types";
import type { Celda } from "./csv";

// More rows than a month of the business will have.
const MAX_FILAS = 5000;

export type Reporte = "ventas" | "cobros" | "gastos";

export const REPORTES: ReadonlyArray<Reporte> = ["ventas", "cobros", "gastos"];

interface Rango {
  desde: string;
  hasta: string;
}

type Filas = Array<Array<Celda>>;

const lista = <T extends { id: number }>(
  dataProvider: DataProvider,
  resource: string,
  filter: Record<string, unknown>,
  field: string,
) =>
  dataProvider
    .getList<T>(resource, {
      filter,
      sort: { field, order: "ASC" },
      pagination: { page: 1, perPage: MAX_FILAS },
    })
    .then(({ data }) => data);

// The rows of one report for the month, header first: delivered orders by
// delivery date, payments by payment date, expenses by date. Amounts are plain
// numbers so the accountant can add them up in Excel.
export const filasDelReporte = async (
  reporte: Reporte,
  rango: Rango,
  dataProvider: DataProvider,
  translate: TranslateFunction,
): Promise<Filas> => {
  const t = (key: string) => translate(`amai.export.columns.${key}`);
  const metodo = (valor: string | null) =>
    valor
      ? translate(`amai.orders.payment_methods.${valor}`, { _: valor })
      : null;

  if (reporte === "ventas") {
    const pedidos = await lista<PedidoLista>(
      dataProvider,
      "pedido",
      {
        estado: "entregado",
        "fecha_entrega@gte": rango.desde,
        "fecha_entrega@lte": rango.hasta,
      },
      "fecha_entrega",
    );
    if (!pedidos.length) return [];
    return [
      ["date", "order", "client", "flavors", "pieces", "payment", "total"].map(
        t,
      ),
      ...pedidos.map((p) => [
        p.fecha_entrega,
        p.id,
        p.cliente,
        p.sabores.map((s) => `${s.nombre} ${s.cantidad}`).join(", "),
        Number(p.piezas),
        metodo(p.metodo_pago),
        Number(p.total),
      ]),
    ];
  }

  if (reporte === "cobros") {
    const pagos = await lista<Pago>(
      dataProvider,
      "pago",
      { "fecha@gte": rango.desde, "fecha@lte": rango.hasta },
      "fecha",
    );
    if (!pagos.length) return [];
    const { data: clientes } = await dataProvider.getMany<Cliente>("cliente", {
      ids: [...new Set(pagos.map((p) => p.cliente_id))],
    });
    const nombre = new Map(clientes.map((c) => [c.id, c.nombre]));
    return [
      ["date", "client", "order", "payment", "reference", "amount"].map(t),
      ...pagos.map((p) => [
        p.fecha,
        nombre.get(p.cliente_id) ?? null,
        p.pedido_id,
        metodo(p.metodo),
        p.referencia,
        Number(p.monto),
      ]),
    ];
  }

  const gastos = await lista<Gasto>(
    dataProvider,
    "gasto",
    { "fecha@gte": rango.desde, "fecha@lte": rango.hasta },
    "fecha",
  );
  if (!gastos.length) return [];
  return [
    ["date", "category", "note", "amount"].map(t),
    ...gastos.map((g) => [
      g.fecha,
      translate(`amai.expenses.categories.${g.categoria}`),
      g.descripcion,
      Number(g.monto),
    ]),
  ];
};
