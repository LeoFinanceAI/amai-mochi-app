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
- Ya lleva su administración en una app, probablemente **Treinta** (ventas, gastos, deudas, clientes). Por confirmar:
  qué usa de ella, qué plan paga y si permite exportar sus datos. Hay que migrar lo que necesite.
- **No terminó el cuestionario** (https://amai-mochi.pages.dev/cuestionario/): lo dejó a tres cuartos y prefiere
  platicarlo. Lo anterior viene de su Instagram y de Leo; trátalo como hipótesis, salvo lo que corrige el audio de abajo.

## Lo que dijo Eduardo (audio del 12 nov 2026)

Es la única fuente directa hasta ahora y **corrige varias hipótesis de arriba**:

- **Ya no tienen repartidor ni venden directo a clientes.** Hoy venden solo a distribuidores: cinco, con los que
  trabajan cómodamente. Con el crecimiento quieren volver a vender directo.
- **Decide junto con Marifer** (nombre tomado de la transcripción automática; confirmarlo). Les falta sentarse a
  definir qué quieren que tenga la app.
- **Lo que quieren:** que cada distribuidor lleve en la app sus tiendas y ubicaciones, sus clientes, las ventas que
  hace y el inventario que recibe cuando compra un pedido, y que vea su propio reporte. Amai ve el global de todos.
- **Crecimiento:** piensan crear su red de distribución en otra ciudad; preguntan si se trabaja desde ahora o después.
  Respuesta acordada: no construirlo ahora, pero diseñar para que sumar una ciudad o un distribuidor sea un alta.
- **Prefieren una junta** en lugar del cuestionario: Eduardo y Marifer platican y Leo toma nota. Puede ser en persona
  o por videollamada.

Consecuencias para el proyecto:

- El alcance pasa de una app de un solo usuario a una plataforma para la red (varias empresas adentro).
  **No construyas nada de esto antes de la junta.**
- Entregas de hoy, la ruta en Maps y la venta rápida suponían reparto y venta al público: quedan guardadas para
  cuando vuelvan a hacerlo; no les agregues funciones.
- Antes de crear la cuenta de cualquier distribuidor hay que rehacer los permisos: hoy cualquier usuario con
  sesión ve todo (ver «Modelo de datos»).
- Riesgo de canal: un distribuidor puede no querer que Amai vea a sus clientes, más si Amai volverá a vender
  directo. Propuesta: Amai ve totales por tienda y por sabor; los datos de contacto son solo del distribuidor.
- Etapas propuestas: 1) arranque de Amai con datos reales, 2) prueba con uno o dos distribuidores, 3) tablero
  global y alta del resto, 4) crecimiento (otra ciudad, lotes y caducidad, venta directa).
- **Materiales para Eduardo y Marifer:** en primera persona (habla Leo), muy visuales y **sin mencionar pagos ni
  honorarios**; eso lo platica Leo directamente con Eduardo.

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

Cada respuesta puede requerir una migración nueva. No construyas estas partes sin confirmarlas.
Se resuelven en la junta con Eduardo y Marifer, no con el cuestionario:

- ¿Con qué uno o dos distribuidores se hace la prueba? ¿Venden a tiendas, al público o a ambos?
- ¿Amai ve los clientes de cada distribuidor o solo totales por tienda y sabor?
- ¿Cuánto dura el producto congelado y qué pasa con lo dañado o caducado? (inventario del distribuidor)

- ¿Consignación? (agregaría liquidaciones)
- ¿Abonos parciales o pagos a cuenta del cliente? (hoy `pago.pedido_id` es opcional)
- ¿Mayoreo por línea o por total del pedido? (hoy `fn_precio` usa la cantidad de la línea)
- ¿Precio por distribuidor o solo por cantidad? ¿Vende por pieza, por caja o ambos?
- ¿Factura (CFDI)? ¿Los distribuidores pedirían solos desde la app? ¿Quién más registraría pedidos?
- ¿Usa Treinta? ¿Puede descargar sus datos? Las deudas que ya traen sus clientes necesitan un "saldo inicial"
  (campo/tabla nueva o pedido histórico): decidirlo antes de la migración.

## Reglas para trabajar

- No subas datos reales de clientes a repos públicos, issues ni prompts de prueba (LFPDPPP).
- Antes de cambios de esquema, muestra el SQL y explica el impacto en vistas existentes.
- Con el MCP de Supabase: solo lectura contra producción; escribe y prueba en Supabase local.
- Mantén el alcance: si algo no está en el plan, propónlo como tarea nueva en vez de construirlo directo.
