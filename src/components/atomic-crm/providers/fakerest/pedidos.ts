import type {
  DataProvider,
  GetListParams,
  Identifier,
  UpdateParams,
} from "ra-core";

import type {
  Cliente,
  NuevoPedido,
  Pedido,
  PedidoDetalle,
  PedidoLista,
  Producto,
  Sabor,
} from "../../types";

// In-memory versions of the order SQL (supabase/schemas/09_amai.sql) for the
// demo and tests. Simplification: lines are priced at the list price (no
// wholesale tiers).

const ALL = { pagination: { page: 1, perPage: 10_000 } } as const;
const BY_ID = { field: "id", order: "ASC" } as const;

const getAll = async <T extends { id: Identifier }>(
  dataProvider: DataProvider,
  resource: string,
  filter: Record<string, unknown> = {},
): Promise<T[]> =>
  (await dataProvider.getList<T>(resource, { ...ALL, sort: BY_ID, filter }))
    .data;

const textOrNull = (value: string) => value.trim() || null;

// fn_guardar_lineas(): every line resolved to its product before writing.
const guardarLineas = async (
  dataProvider: DataProvider,
  pedidoId: Identifier,
  lineas: NuevoPedido["lineas"],
) => {
  const conPiezas = lineas.filter((linea) => linea.cantidad > 0);
  if (conPiezas.length === 0) {
    throw new Error("The order has no pieces");
  }
  const productos = await getAll<Producto>(dataProvider, "producto", {
    presentacion: "pieza",
  });
  const detalle = conPiezas.map((linea) => {
    const producto = productos.find((p) => p.sabor_id === linea.sabor_id);
    if (!producto) {
      throw new Error("A flavor in the order has no product");
    }
    return { producto, cantidad: linea.cantidad };
  });
  for (const { producto, cantidad } of detalle) {
    await dataProvider.create("pedido_detalle", {
      data: {
        pedido_id: pedidoId,
        producto_id: producto.id,
        cantidad,
        precio_unitario: producto.precio_lista,
      },
    });
  }
};

export const crearPedido = async (
  dataProvider: DataProvider,
  pedido: NuevoPedido,
): Promise<{ id: number }> => {
  if (!pedido.lineas.some((linea) => linea.cantidad > 0)) {
    throw new Error("The order has no pieces");
  }
  const { data: creado } = await dataProvider.create<Pedido>("pedido", {
    data: {
      cliente_id: pedido.cliente_id,
      fecha_pedido: new Date().toISOString(),
      fecha_entrega: pedido.fecha_entrega,
      estado: "pendiente",
      metodo_pago: pedido.metodo_pago,
      direccion: textOrNull(pedido.direccion),
      ubicacion_url: null,
      notas: textOrNull(pedido.notas),
      entregado_en: null,
    },
  });
  await guardarLineas(dataProvider, creado.id, pedido.lineas);
  return { id: creado.id };
};

export const actualizarPedido = async (
  dataProvider: DataProvider,
  id: number,
  pedido: NuevoPedido,
): Promise<{ id: number }> => {
  const { data: actual } = await dataProvider.getOne<Pedido>("pedido", {
    id,
  });
  if (actual.estado !== "pendiente") {
    throw new Error("Only pending orders can be edited");
  }
  if (!pedido.lineas.some((linea) => linea.cantidad > 0)) {
    throw new Error("The order has no pieces");
  }
  await dataProvider.update<Pedido>("pedido", {
    id,
    previousData: actual,
    data: {
      cliente_id: pedido.cliente_id,
      fecha_entrega: pedido.fecha_entrega,
      metodo_pago: pedido.metodo_pago,
      direccion: textOrNull(pedido.direccion),
      notas: textOrNull(pedido.notas),
    },
  });
  const anteriores = await getAll<PedidoDetalle>(
    dataProvider,
    "pedido_detalle",
    { pedido_id: id },
  );
  for (const linea of anteriores) {
    await dataProvider.delete("pedido_detalle", {
      id: linea.id,
      previousData: linea,
    });
  }
  await guardarLineas(dataProvider, id, pedido.lineas);
  return { id };
};

// The trg_pedido_entregado trigger: stamp or clear the delivery time.
export const conHoraDeEntrega = (params: UpdateParams): UpdateParams =>
  params.data.estado === undefined
    ? params
    : {
        ...params,
        data: {
          ...params.data,
          entregado_en:
            params.data.estado === "entregado"
              ? new Date().toISOString()
              : null,
        },
      };

// v_pedido_lista, computed from the in-memory tables.
const pedidoLista = async (
  dataProvider: DataProvider,
): Promise<PedidoLista[]> => {
  const [pedidos, detalle, productos, sabores, clientes] = await Promise.all([
    getAll<Pedido>(dataProvider, "pedido"),
    getAll<PedidoDetalle>(dataProvider, "pedido_detalle"),
    getAll<Producto>(dataProvider, "producto"),
    getAll<Sabor>(dataProvider, "sabor"),
    getAll<Cliente>(dataProvider, "cliente"),
  ]);
  return pedidos.map((pedido) => {
    const cliente = clientes.find((c) => c.id === pedido.cliente_id);
    const lineas = detalle.filter((d) => d.pedido_id === pedido.id);
    const lineasConSabor = lineas.map((linea) => {
      const producto = productos.find((p) => p.id === linea.producto_id);
      const sabor = sabores.find((s) => s.id === producto?.sabor_id);
      return {
        sabor_id: sabor?.id ?? 0,
        nombre: sabor?.nombre ?? "",
        color: sabor?.color ?? "",
        cantidad: linea.cantidad,
      };
    });
    return {
      ...pedido,
      cliente: cliente?.nombre ?? "",
      zona: cliente?.zona ?? null,
      telefono: cliente?.telefono ?? null,
      piezas: lineas.reduce((total, l) => total + l.cantidad, 0),
      total: lineas.reduce(
        (total, l) => total + l.cantidad * l.precio_unitario,
        0,
      ),
      sabores: lineasConSabor.sort((a, b) => a.nombre.localeCompare(b.nombre)),
    };
  });
};

const compare = (a: unknown, b: unknown) =>
  String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true });

// Equality filters, one sort field and pagination: what the orders screen uses.
export const getPedidoLista = async (
  dataProvider: DataProvider,
  params: GetListParams,
) => {
  const filter = Object.entries(params.filter ?? {});
  const { field, order } = params.sort ?? BY_ID;
  const direction = order === "DESC" ? -1 : 1;
  const rows = (await pedidoLista(dataProvider))
    .filter((row) =>
      filter.every(([key, value]) => row[key as keyof PedidoLista] === value),
    )
    .sort(
      (a, b) =>
        direction *
          compare(
            a[field as keyof PedidoLista],
            b[field as keyof PedidoLista],
          ) || Number(a.id) - Number(b.id),
    );
  const { page, perPage } = params.pagination ?? { page: 1, perPage: 25 };
  return {
    data: rows.slice((page - 1) * perPage, page * perPage),
    total: rows.length,
  };
};

export const getPedidoListaOne = async (
  dataProvider: DataProvider,
  id: Identifier,
) => {
  const row = (await pedidoLista(dataProvider)).find(
    (pedido) => String(pedido.id) === String(id),
  );
  if (!row) {
    throw new Error("Order not found");
  }
  return { data: row };
};
