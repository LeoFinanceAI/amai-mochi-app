import type { DataProvider, GetListParams } from "ra-core";

import type {
  Cliente,
  ClienteActividad,
  Pedido,
  VentaRapida,
} from "../../types";
import { diasDesdeHoy, toIsoDate } from "../../pedidos/fechaEntrega";
import { conDatosDelPedido } from "./cobranza";
import { listar } from "./listar";
import { crearPedido, getPedidoLista } from "./pedidos";

// In-memory versions of venta_rapida() and v_cliente_actividad
// (supabase/schemas/09_amai.sql) for the demo and tests.

const ALL = {
  pagination: { page: 1, perPage: 10_000 },
  sort: { field: "id", order: "ASC" },
} as const;

export const PUBLICO_EN_GENERAL = "Público en general";

const DIAS_RECIENTES = 90;

const publicoEnGeneral = async (dataProvider: DataProvider) => {
  const { data } = await dataProvider.getList<Cliente>("cliente", {
    ...ALL,
    filter: {},
  });
  const existente = data.find(
    (c) => c.tipo === "publico" && c.nombre === PUBLICO_EN_GENERAL,
  );
  if (existente) return existente.id;
  const { data: creado } = await dataProvider.create<Cliente>("cliente", {
    data: {
      nombre: PUBLICO_EN_GENERAL,
      tipo: "publico",
      zona: null,
      telefono: null,
      notas: null,
      activo: true,
    },
  });
  return creado.id;
};

export const ventaRapida = async (
  dataProvider: DataProvider,
  venta: VentaRapida,
): Promise<{ id: number }> => {
  const clienteId = venta.cliente_id ?? (await publicoEnGeneral(dataProvider));
  const hoy = toIsoDate(new Date());
  const { id } = await crearPedido(dataProvider, {
    cliente_id: clienteId,
    fecha_entrega: hoy,
    metodo_pago: venta.metodo_pago,
    direccion: "",
    notas: venta.notas,
    lineas: venta.lineas,
  });
  const { data: pedido } = await dataProvider.getOne<Pedido>("pedido", { id });
  await dataProvider.update<Pedido>("pedido", {
    id,
    data: { estado: "entregado", entregado_en: new Date().toISOString() },
    previousData: pedido,
  });
  const { data: lista } = await getPedidoLista(dataProvider, {
    ...ALL,
    filter: { id },
  });
  if (lista[0]?.total > 0) {
    await dataProvider.create(
      "pago",
      await conDatosDelPedido(dataProvider, {
        data: { pedido_id: id, metodo: venta.metodo_pago, fecha: hoy },
      }),
    );
  }
  return { id };
};

// v_cliente_actividad: sales count delivered orders; the last order counts any
// order that was not cancelled.
export const getClienteActividad = async (
  dataProvider: DataProvider,
  params: GetListParams,
) => {
  const { data: clientes } = await dataProvider.getList<Cliente>("cliente", {
    ...ALL,
    filter: {},
  });
  const { data: pedidos } = await getPedidoLista(dataProvider, {
    ...ALL,
    filter: {},
  });
  const rows: ClienteActividad[] = clientes.map((cliente) => {
    const suyos = pedidos.filter((p) => p.cliente_id === cliente.id);
    const entregados = suyos.filter((p) => p.estado === "entregado");
    const ultimo = suyos
      .filter((p) => p.estado !== "cancelado")
      .map((p) => p.fecha_entrega)
      .sort()
      .at(-1);
    const suma = (lista: typeof entregados, campo: "piezas" | "total") =>
      lista.reduce((total, p) => total + Number(p[campo]), 0);
    return {
      id: cliente.id,
      nombre: cliente.nombre,
      tipo: cliente.tipo,
      zona: cliente.zona,
      telefono: cliente.telefono,
      activo: cliente.activo,
      pedidos: entregados.length,
      piezas: suma(entregados, "piezas"),
      total: suma(entregados, "total"),
      total_90_dias: suma(
        entregados.filter(
          (p) => -diasDesdeHoy(p.fecha_entrega) < DIAS_RECIENTES,
        ),
        "total",
      ),
      ultimo_pedido: ultimo ?? null,
      dias_sin_pedir: ultimo ? -diasDesdeHoy(ultimo) : null,
    };
  });
  return listar(rows, params);
};
