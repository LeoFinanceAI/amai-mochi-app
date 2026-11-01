import type { Sabor } from "../types";
import { SaborCreate } from "./SaborCreate";
import { SaborEdit } from "./SaborEdit";
import { SaborList } from "./SaborList";

export default {
  list: SaborList,
  create: SaborCreate,
  edit: SaborEdit,
  recordRepresentation: (record: Sabor) => record.nombre,
};
