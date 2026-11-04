import type { CreateParams, DataProvider, GetListParams } from "ra-core";

import type { CobranzaPendiente, Pago, SaldoCliente } from "../../types";
import { diasDesdeHoy } from "../../pedidos/fechaEntrega";
import { getPedidoLista } from "./pedidos";

// In-memory versions of the receivables SQL (supabase/schemas/09_amai.sql) for
// the demo and tests.

const ALL = {
  pagination: { page: 1, perPage: 10_000 },
  sort: { field: "id", order: "ASC" },
} as const;

const pagosDePedidos = async (dataProvider: DataProvider) =>
  new Set(
    (await dataProvider.getList<Pago>("pago", { ...ALL, filter: {} })).data
      .map((pago) => pago.pedido_id)
      .filter((id) => id != null),
  );

// v_cobranza_pendiente: delivered orders with no payment linked.
export const getCobranzaPendiente = async (
  dataProvider: DataProvider,
  params: GetListParams,
) => {
  const pagados = await pagosDePedidos(dataProvider);
  const { data: entregados } = await getPedidoLista(dataProvider, {
    ...ALL,
    filter: { estado: "entregado" },
  });
  const rows: CobranzaPendiente[] = entregados
    .filter((pedido) => !pagados.has(pedido.id))
    .map((pedido) => ({
      id: pedido.id,
      pedido_id: pedido.id,
      cliente_id: pedido.cliente_id,
      nombre: pedido.cliente,
      zona: pedido.zona,
      telefono: pedido.telefono,
      fecha_entrega: pedido.fecha_entrega,
      piezas: pedido.piezas,
      total: pedido.total,
      dias: -diasDesdeHoy(pedido.fecha_entrega),
    }))
    .sort((a, b) => a.fecha_entrega.localeCompare(b.fecha_entrega));
  const { page, perPage } = params.pagination ?? { page: 1, perPage: 25 };
  return {
    data: rows.slice((page - 1) * perPage, page * perPage),
    total: rows.length,
  };
};

// The pago_de_pedido trigger: an order's payment takes its client and total.
export const conDatosDelPedido = async (
  dataProvider: DataProvider,
  params: CreateParams,
): Promise<CreateParams> => {
  const pedidoId = params.data.pedido_id;
  if (pedidoId == null) {
    return params;
  }
  if ((await pagosDePedidos(dataProvider)).has(pedidoId)) {
    throw new Error("The order is already paid");
  }
  const { data: entregados } = await getPedidoLista(dataProvider, {
    ...ALL,
    filter: {},
  });
  const pedido = entregados.find((p) => p.id === pedidoId);
  if (!pedido) {
    throw new Error("Order not found");
  }
  const monto = params.data.monto ?? pedido.total;
  if (monto <= 0) {
    throw new Error("The order has no price");
  }
  return {
    ...params,
    data: { ...params.data, cliente_id: pedido.cliente_id, monto },
  };
};

// v_saldo_cliente: delivered orders minus all payments of the client.
export const saldoCliente = async (
  dataProvider: DataProvider,
  clienteId: number,
): Promise<SaldoCliente> => {
  const { data: entregados } = await getPedidoLista(dataProvider, {
    ...ALL,
    filter: { estado: "entregado", cliente_id: clienteId },
  });
  const { data: pagos } = await dataProvider.getList<Pago>("pago", {
    ...ALL,
    filter: { cliente_id: clienteId },
  });
  const cargos = entregados.reduce((total, p) => total + Number(p.total), 0);
  const abonos = pagos.reduce((total, p) => total + Number(p.monto), 0);
  return { cargos, abonos, saldo: cargos - abonos };
};
