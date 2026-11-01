import type { Cliente } from "../../../types";

// Demo clients with made-up names and phones (never real customer data).
export const generateClientes = (): Cliente[] => [
  {
    id: 1,
    nombre: "Distribuidor Centro",
    tipo: "distribuidor",
    zona: "Guadalajara",
    telefono: "3300000001",
    notas: null,
    activo: true,
  },
  {
    id: 2,
    nombre: "Distribuidor Costa",
    tipo: "distribuidor",
    zona: "Colima",
    telefono: "3120000002",
    notas: null,
    activo: true,
  },
  {
    id: 3,
    nombre: "Tienda de la Plaza",
    tipo: "distribuidor",
    zona: "Tepetitlán",
    telefono: null,
    notas: "Entregar antes de las 11",
    activo: true,
  },
  {
    id: 4,
    nombre: "Venta al público",
    tipo: "publico",
    zona: null,
    telefono: null,
    notas: null,
    activo: true,
  },
];
