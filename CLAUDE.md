# App Amai Mochi

App de administración a la medida para **Amai Mochi**, negocio de mochis rellenos de helado de Eduardo
(Guadalajara, Colima y Tepetitlán). La construye Leo **sin costo**, para demostrar valor. La app se adapta
a cómo ya trabaja el negocio, no al revés.

Responde y escribe la interfaz en **español de México**. Leo es data engineer (SQL, dbt, Snowflake, Postgres);
React no es su stack diario: explica las decisiones de frontend y mantén el código simple.

## Cómo opera el negocio (lo que sabemos)

- Pedidos por WhatsApp: el cliente manda cantidad, sabores y ubicación.
- Pedido mínimo de 40 piezas, con 24–48 h de anticipación. Pago al recibir: efectivo o transferencia.
- Precios de mayoreo; ~5 distribuidores más ventas al público y eventos.
- Sabores: fresa, mango, taro, chocolate, oreo, vainilla. Empaque con fecha de elaboración y caducidad.
- **Aún no contesta el cuestionario.** Todo lo anterior viene de su Instagram; trátalo como hipótesis.

## Stack (decidido) y regla de costo

- **Costo de operación: $0 al mes.** No agregues servicios de pago sin preguntar.
- Base: fork de `marmelab/atomic-crm` (React + shadcn-admin-kit/react-admin + Supabase, MIT).
  Plan B: Refine Core con preset `refine-supabase`.
- Supabase plan Free (Postgres, auth, RLS). Hosting: Cloudflare Pages o Netlify (Vercel Hobby no permite uso comercial).
- PWA con `vite-plugin-pwa`. Código en repo privado de GitHub.
- **La lógica de negocio vive en SQL** (vistas, funciones, triggers). El frontend es una capa delgada que lee vistas.
- Migraciones versionadas en `supabase/migrations/`. Nunca cambies una migración ya aplicada: crea una nueva.

## Modelo de datos

Migración inicial: @supabase/migrations/20261030000000_amai_core.sql (probada en Postgres 16).

- Tablas: `sabor`, `producto`, `cliente`, `precio`, `pedido`, `pedido_detalle`, `pago`, `gasto`.
- `fn_precio()` + trigger: precio especial del cliente → escalón de mayoreo → precio de lista; se congela al insertar.
- Vistas (`security_invoker`): `v_pedido_total`, `v_saldo_cliente`, `v_cobranza_pendiente`, `v_entregas_hoy`,
  `v_resumen_semanal`, `v_ventas_sabor_semana`.
- RLS: cualquier usuario autenticado ve todo (un solo usuario en el MVP). **El registro de usuarios debe estar desactivado.**
- Fase 2: `lote` y `movimiento_inventario` como bitácora append-only (stock = suma de movimientos, FEFO por caducidad).

## Identidad visual

- Colores: crema `#FBF5E3`, rosa principal `#B23A62`, rosa claro `#F9D3DC`, texto `#2A2320`,
  amarillo `#F3CD5E`, naranja `#E58F35`, olivo `#8A9A3E`.
- Color por sabor: fresa `#EE8FA8`, mango `#F3C443`, taro `#A985D1`, chocolate `#8A5A3C`, oreo `#6E6E6E`, vainilla `#E3CC8A`.
- Tipografías: Bebas Neue (títulos), Quicksand (texto). Wordmark "amai mochi" arriba; pedir a Eduardo el logo original.
- Móvil primero. Barra inferior: Nuevo pedido / Por cobrar / Resumen. Botones de al menos 44 px.

## Pantallas del MVP (mockups ya aprobados por Leo)

1. **Nuevo pedido:** cliente, sabores con botones +5 y −, aviso (sin bloquear) si no llega a 40 piezas,
   entrega Mañana / Pasado mañana / Otra fecha, pago efectivo o transferencia, notas y ubicación.
2. **Por cobrar:** total que le deben, agrupado por cliente, pedidos con más de 7 días en naranja,
   "Recordar" abre `wa.me/52XXXXXXXXXX?text=...`, "Registrar pago" con deshacer.
3. **Tu semana:** vendido, pedidos, cobrado vs. por cobrar, piezas por día, sabores más vendidos, ventas por cliente, ganancia.

## Plan de trabajo

Guía de la etapa actual: @ETAPA0.md
Backlog completo con tareas: @docs/BACKLOG.md

Referencias (léelas solo cuando las necesites, no las importes): mockups interactivos en `docs/referencias/*.dc.html`,
demo de pedido desde WhatsApp en `docs/referencias/demo-pedido-whatsapp.html`, wordmark en `docs/assets/wordmark-amai-mochi.png`.

| Etapa | Contenido | Horas |
| --- | --- | --- |
| 0 | Repo, Supabase, esqueleto, login, tema, PWA, Cloudflare, respaldo cada 3 días | 13 |
| 1 | Sabores, productos, clientes, precios de mayoreo | 10 |
| 2 | Pedidos, entregas de hoy (link a Maps), venta rápida al público | 22 |
| 3 | Cobranza, pagos, botón Recordar por WhatsApp | 12 |
| 4 | Gastos y resumen semanal con ganancia | 15 |
| 5 | Arranque con Eduardo, ajustes, guía de uso, aviso de privacidad | 9 |

Total 81 h (105 h con margen). Fase 2: crear pedido pegando el mensaje de WhatsApp con IA,
inventario por lotes y alertas, costos/recetas, más usuarios.

## Pendiente de confirmar con Eduardo

Cada respuesta puede requerir una migración nueva. No construyas estas partes sin confirmarlas:

- ¿Consignación? (agregaría liquidaciones)
- ¿Abonos parciales o pagos a cuenta del cliente? (hoy `pago.pedido_id` es opcional)
- ¿Mayoreo por línea o por total del pedido? (hoy `fn_precio` usa la cantidad de la línea)
- ¿Precio por distribuidor o solo por cantidad? ¿Vende por pieza, por caja o ambos?
- ¿Factura (CFDI)? ¿Los distribuidores pedirían solos desde la app? ¿Quién más registraría pedidos?

## Reglas para trabajar

- No subas datos reales de clientes a repos públicos, issues ni prompts de prueba (LFPDPPP).
- Antes de cambios de esquema, muestra el SQL y explica el impacto en vistas existentes.
- Con el MCP de Supabase: solo lectura contra producción; escribe y prueba en Supabase local.
- Mantén el alcance: si algo no está en el plan, propónlo como tarea nueva en vez de construirlo directo.
