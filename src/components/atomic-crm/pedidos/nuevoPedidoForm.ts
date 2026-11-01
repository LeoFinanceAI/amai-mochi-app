import type { NuevoPedido } from "../types";
import { fechaEntrega, type OpcionEntrega } from "./fechaEntrega";

// Orders are 40 pieces or more (business rule); the screen warns, never blocks.
export const MINIMO_PIEZAS = 40;

export const PASO_PIEZAS = 5;

export type MetodoPagoAlRecibir = "efectivo" | "transferencia";

export const METODOS_PAGO: ReadonlyArray<MetodoPagoAlRecibir> = [
  "efectivo",
  "transferencia",
];

export interface NuevoPedidoForm {
  clienteId: string | null;
  entrega: OpcionEntrega;
  otraFecha: string;
  // Pieces per flavor id.
  cantidades: Readonly<Record<number, number>>;
  metodoPago: MetodoPagoAlRecibir;
  direccion: string;
  notas: string;
}

export const FORM_VACIO: NuevoPedidoForm = {
  clienteId: null,
  entrega: "manana",
  otraFecha: "",
  cantidades: {},
  metodoPago: "efectivo",
  direccion: "",
  notas: "",
};

export const totalPiezas = (cantidades: NuevoPedidoForm["cantidades"]) =>
  Object.values(cantidades).reduce((total, cantidad) => total + cantidad, 0);

export const cambiarCantidad = (
  cantidades: NuevoPedidoForm["cantidades"],
  saborId: number,
  delta: number,
): NuevoPedidoForm["cantidades"] => ({
  ...cantidades,
  [saborId]: Math.max(0, (cantidades[saborId] ?? 0) + delta),
});

// The crear_pedido() input, or null while the order cannot be saved yet.
export const toNuevoPedido = (
  form: NuevoPedidoForm,
  hoy: Date = new Date(),
): NuevoPedido | null => {
  const fecha = fechaEntrega(form.entrega, form.otraFecha, hoy);
  const lineas = Object.entries(form.cantidades)
    .filter(([, cantidad]) => cantidad > 0)
    .map(([saborId, cantidad]) => ({ sabor_id: Number(saborId), cantidad }));
  if (form.clienteId == null || !fecha || lineas.length === 0) {
    return null;
  }
  return {
    cliente_id: Number(form.clienteId),
    fecha_entrega: fecha,
    metodo_pago: form.metodoPago,
    direccion: form.direccion,
    notas: form.notas,
    lineas,
  };
};
