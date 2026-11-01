import type { Sabor } from "../../../types";

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
