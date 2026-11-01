// Pure helpers of the prices screen: draft values per product, validation and
// the changes to save.

// Mirrors numeric(10,2) on producto.precio_lista, with a sane ceiling.
const MAX_PRICE = 100_000;
const PRICE_TEXT = /^\d+(\.\d{1,2})?$/;

export type Borradores = Readonly<Record<number, string>>;

// "25", "25.5" or "25.50" are prices; empty, negative, letters or 3 decimals
// are not.
export const esPrecioValido = (texto: string): boolean => {
  const limpio = texto.trim();
  return PRICE_TEXT.test(limpio) && Number(limpio) <= MAX_PRICE;
};

// The products whose draft differs from the saved price, with the new value.
// Only called once every draft is valid.
export const cambios = (
  productos: ReadonlyArray<{ id: number; precio_lista: number }>,
  borradores: Borradores,
): Array<{ id: number; precio_lista: number }> =>
  productos.flatMap((producto) => {
    const borrador = borradores[producto.id];
    if (borrador === undefined) return [];
    const precio = Number(borrador.trim());
    return precio === Number(producto.precio_lista)
      ? []
      : [{ id: producto.id, precio_lista: precio }];
  });
