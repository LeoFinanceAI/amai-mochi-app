import type {
  Company,
  Contact,
  ContactNote,
  Deal,
  DealNote,
  Cliente,
  Pedido,
  PedidoDetalle,
  Producto,
  Sabor,
  Sale,
  Tag,
  Task,
} from "../../../types";
import type { ConfigurationContextValue } from "../../../root/ConfigurationContext";

export interface Db {
  companies: Company[];
  contacts: Contact[];
  contact_notes: ContactNote[];
  deals: Deal[];
  deal_notes: DealNote[];
  sales: Sale[];
  tags: Tag[];
  tasks: Task[];
  sabor: Sabor[];
  cliente: Cliente[];
  producto: Producto[];
  pedido: Pedido[];
  pedido_detalle: PedidoDetalle[];
  configuration: Array<{ id: number; config: ConfigurationContextValue }>;
}
