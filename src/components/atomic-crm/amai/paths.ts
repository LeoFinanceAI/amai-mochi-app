// Paths of the Amai Mochi MVP screens, linked from the bottom bar on phones and
// the header on desktop.
export const AMAI_PATHS = {
  orders: "/orders",
  deliveriesToday: "/orders/today",
  production: "/orders/production",
  newOrder: "/orders/new",
  receivables: "/receivables",
  summary: "/summary",
  prices: "/prices",
  expenses: "/expenses",
} as const;

export const editOrderPath = (id: number | string) => `/orders/${id}/edit`;
