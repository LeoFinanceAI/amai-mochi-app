import { describe, expect, it } from "vitest";

import { renderMobileApp } from "@/test/renderMobileApp";
import { generateProductos } from "@/components/atomic-crm/providers/fakerest/dataGenerator/sabores";

import type {
  Cliente,
  Gasto,
  Pago,
  Pedido,
  PedidoDetalle,
  Sabor,
} from "../types";

// Made-up clients: never real customer data in tests.
const cliente = (id: number, nombre: string): Cliente => ({
  id,
  nombre,
  tipo: "distribuidor",
  zona: null,
  telefono: null,
  notas: null,
  activo: true,
});

const sabores = (): Sabor[] => [
  { id: 1, nombre: "Fresa", color: "#EE8FA8", activo: true },
  { id: 2, nombre: "Mango", color: "#F3C443", activo: true },
];

const pedido = (
  id: number,
  fecha_entrega: string,
  estado: Pedido["estado"] = "entregado",
): Pedido => ({
  id,
  cliente_id: 1,
  fecha_pedido: new Date().toISOString(),
  fecha_entrega,
  estado,
  metodo_pago: "transferencia",
  direccion: null,
  ubicacion_url: null,
  notas: null,
  entregado_en: null,
});

const linea = (
  id: number,
  pedido_id: number,
  producto_id: number,
  cantidad: number,
): PedidoDetalle => ({
  id,
  pedido_id,
  producto_id,
  cantidad,
  precio_unitario: 25,
});

const pago = (id: number, fecha: string, monto: number): Pago => ({
  id,
  cliente_id: 1,
  pedido_id: 1,
  fecha,
  monto,
  metodo: "efectivo",
  referencia: null,
  notas: null,
});

const gasto = (id: number, fecha: string, monto: number): Gasto => ({
  id,
  fecha,
  categoria: "empaque",
  monto,
  descripcion: "Cajas",
});

// October 2026: one delivered order (Fresa 30 + Mango 10), one pending order
// that is not a sale yet, one payment and one expense. One of each in
// November, which must not show up.
const openExport = () =>
  renderMobileApp({
    path: "/export",
    data: {
      cliente: [cliente(1, "Tienda Centro")],
      sabor: sabores(),
      producto: generateProductos(sabores()),
      pedido: [
        pedido(1, "2026-10-31"),
        pedido(2, "2026-10-15", "pendiente"),
        pedido(3, "2026-11-01"),
      ],
      pedido_detalle: [
        linea(1, 1, 1, 30),
        linea(2, 1, 2, 10),
        linea(3, 2, 1, 40),
        linea(4, 3, 1, 40),
      ],
      pago: [pago(1, "2026-10-31", 1000), pago(2, "2026-11-01", 500)],
      gasto: [gasto(1, "2026-10-01", 300), gasto(2, "2026-11-02", 99)],
    },
  });

// Catches the file the page hands to the browser, instead of saving it.
const capturarDescarga = () =>
  new Promise<{ nombre: string; texto: string }>((resolve) => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest("a[download]");
      if (!(link instanceof HTMLAnchorElement)) return;
      event.preventDefault();
      document.removeEventListener("click", onClick, true);
      void fetch(link.href)
        .then((response) => response.text())
        .then((texto) => resolve({ nombre: link.download, texto }));
    };
    document.addEventListener("click", onClick, true);
  });

type Screen = Awaited<ReturnType<typeof openExport>>;

const exportar = async (screen: Screen, boton: string) => {
  await screen.getByLabelText("Mes").fill("2026-10");
  const descarga = capturarDescarga();
  await screen.getByRole("button", { name: boton }).click();
  return descarga;
};

describe("export to Excel", () => {
  it("downloads the month's delivered orders", async () => {
    // Arrange
    const screen = await openExport();

    // Act
    const { nombre, texto } = await exportar(
      screen,
      "Ventas (pedidos entregados)",
    );

    // Assert: fetch() drops the BOM when decoding UTF-8.
    expect(nombre).toBe("ventas-2026-10.csv");
    expect(texto).toBe(
      '"Fecha","Pedido","Cliente","Sabores","Piezas","Forma de pago","Total"\r\n' +
        '"2026-10-31",1,"Tienda Centro","Fresa 30, Mango 10",40,"Transferencia",1000\r\n',
    );
  });

  it("downloads the month's payments and expenses", async () => {
    // Arrange
    const screen = await openExport();

    // Act
    const cobros = await exportar(screen, "Cobros");
    const gastos = await exportar(screen, "Gastos");

    // Assert
    expect(cobros.nombre).toBe("cobros-2026-10.csv");
    expect(cobros.texto).toBe(
      '"Fecha","Cliente","Pedido","Forma de pago","Referencia","Monto"\r\n' +
        '"2026-10-31","Tienda Centro",1,"Efectivo",,1000\r\n',
    );
    expect(gastos.nombre).toBe("gastos-2026-10.csv");
    expect(gastos.texto).toBe(
      '"Fecha","Categoría","Nota","Monto"\r\n"2026-10-01","Empaque","Cajas",300\r\n',
    );
  });

  it("says when a month has nothing to export", async () => {
    // Arrange
    const screen = await openExport();
    await screen.getByLabelText("Mes").fill("2026-09");

    // Act
    await screen.getByRole("button", { name: "Gastos" }).click();

    // Assert
    await expect
      .element(screen.getByText("No hay nada que exportar en ese mes."))
      .toBeVisible();
  });
});
