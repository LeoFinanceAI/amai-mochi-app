import type { DataProvider } from "ra-core";

import type { NuevoPedido, Pedido, Producto } from "../../types";

// In-memory version of the crear_pedido() SQL function, for the demo and tests.
// Simplification: lines are priced at the list price (no wholesale tiers).
export const crearPedido = async (
  dataProvider: DataProvider,
  pedido: NuevoPedido,
): Promise<{ id: number }> => {
  const lineas = pedido.lineas.filter((linea) => linea.cantidad > 0);
  if (lineas.length === 0) {
    throw new Error("The order has no pieces");
  }
  const { data: productos } = await dataProvider.getList<Producto>("producto", {
    filter: { presentacion: "pieza" },
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "id", order: "ASC" },
  });
  const productoDe = (saborId: number) => {
    const producto = productos.find((p) => p.sabor_id === saborId);
    if (!producto) {
      throw new Error("A flavor in the order has no product");
    }
    return producto;
  };
  // Resolve every product first, so a bad line saves nothing.
  const detalle = lineas.map((linea) => ({
    producto: productoDe(linea.sabor_id),
    cantidad: linea.cantidad,
  }));

  const { data: creado } = await dataProvider.create<Pedido>("pedido", {
    data: {
      cliente_id: pedido.cliente_id,
      fecha_pedido: new Date().toISOString(),
      fecha_entrega: pedido.fecha_entrega,
      estado: "pendiente",
      metodo_pago: pedido.metodo_pago,
      direccion: pedido.direccion.trim() || null,
      ubicacion_url: null,
      notas: pedido.notas.trim() || null,
      entregado_en: null,
    },
  });
  for (const { producto, cantidad } of detalle) {
    await dataProvider.create("pedido_detalle", {
      data: {
        pedido_id: creado.id,
        producto_id: producto.id,
        cantidad,
        precio_unitario: producto.precio_lista,
      },
    });
  }
  return { id: creado.id };
};
