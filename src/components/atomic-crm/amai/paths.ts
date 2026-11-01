// Paths of the Amai Mochi MVP screens, linked from the bottom bar on phones and
// the header on desktop. Each one shows a placeholder until its stage ships.
export const AMAI_PATHS = {
  orders: "/orders",
  deliveriesToday: "/orders/today",
  newOrder: "/orders/new",
  receivables: "/receivables",
  summary: "/summary",
} as const;

export const editOrderPath = (id: number | string) => `/orders/${id}/edit`;
