import type { GetListParams } from "ra-core";

// Filters, sorting and pagination of an in-memory view, as PostgREST does them
// for the SQL views (filter keys as the supabase adapter leaves them: "estado",
// "fecha_entrega_lt"...).

const BY_ID = { field: "id", order: "ASC" } as const;

const compare = (a: unknown, b: unknown) =>
  String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true });

const OPERATORS: Record<string, (order: number) => boolean> = {
  neq: (order) => order !== 0,
  lt: (order) => order < 0,
  lte: (order) => order <= 0,
  gt: (order) => order > 0,
  gte: (order) => order >= 0,
};

const matches = <T extends object>(row: T, key: string, value: unknown) => {
  const operator = key.slice(key.lastIndexOf("_") + 1);
  if (operator in OPERATORS) {
    const field = key.slice(0, key.lastIndexOf("_")) as keyof T;
    // Like SQL, a comparison with null is never true.
    if (row[field] == null) return false;
    return OPERATORS[operator](compare(row[field], value));
  }
  return row[key as keyof T] === value;
};

export const listar = <T extends { id: number }>(
  rows: ReadonlyArray<T>,
  params: GetListParams,
): { data: T[]; total: number } => {
  const filter = Object.entries(params.filter ?? {});
  const { field, order } = params.sort ?? BY_ID;
  const direction = order === "DESC" ? -1 : 1;
  const filtered = rows
    .filter((row) => filter.every(([key, value]) => matches(row, key, value)))
    .sort(
      (a, b) =>
        direction * compare(a[field as keyof T], b[field as keyof T]) ||
        a.id - b.id,
    );
  const { page, perPage } = params.pagination ?? { page: 1, perPage: 25 };
  return {
    data: filtered.slice((page - 1) * perPage, page * perPage),
    total: filtered.length,
  };
};
