import type { Producto, Sabor } from "../../../types";

// The six Amai Mochi flavors, as in supabase/seed.sql.
const FLAVORS: Array<[string, string]> = [
  ["Fresa", "#EE8FA8"],
  ["Mango", "#F3C443"],
  ["Taro", "#A985D1"],
  ["Chocolate", "#8A5A3C"],
  ["Oreo", "#6E6E6E"],
  ["Vainilla", "#E3CC8A"],
];

export const generateSabores = (): Sabor[] =>
  FLAVORS.map(([nombre, color], index) => ({
    id: index + 1,
    nombre,
    color,
    activo: true,
  }));

// Mirrors the sabor_producto trigger: one "pieza" product per flavor, same id,
// priced at 0 until real prices are loaded.
export const generateProductos = (sabores: Sabor[]): Producto[] =>
  sabores.map((sabor) => ({
    id: sabor.id,
    sabor_id: sabor.id,
    presentacion: "pieza",
    piezas_por_unidad: 1,
    precio_lista: 0,
    activo: true,
  }));
