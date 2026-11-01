import type { Cliente } from "../types";
import { ClienteCreate } from "./ClienteCreate";
import { ClienteEdit } from "./ClienteEdit";
import { ClienteList } from "./ClienteList";

export default {
  list: ClienteList,
  create: ClienteCreate,
  edit: ClienteEdit,
  recordRepresentation: (record: Cliente) => record.nombre,
};
