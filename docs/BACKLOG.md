# Backlog MVP – App Amai Mochi

Oct 30, 2026 · @Leo Fuentes

## Resumen

El MVP son 6 etapas y unas 81 horas de trabajo, 105 con margen para imprevistos, con un costo de operación de $0 al mes, enfocadas en el flujo pedido → entrega → cobro → resumen. Como el proyecto es para demostrar valor, la regla es no agregar nada que no esté aquí hasta que Eduardo lo use en su día a día.

| Etapa | Entregable | Horas |
| --- | --- | --- |
| 0. Base técnica | App vacía, con login, estilo de marca y respaldo semanal, instalable en el celular | 13 |
| 1. Catálogo y clientes | Sabores, precios y clientes cargados | 10 |
| 2. Pedidos y entregas | Registrar pedidos, ventas sueltas y entregas del día | 22 |
| 3. Cobranza | Quién debe y registro de pagos | 12 |
| 4. Gastos y resumen semanal | Gastos, ventas, cobrado y ganancia de la semana | 15 |
| 5. Arranque | Eduardo usándola con sus datos reales | 9 |
| Subtotal |  | 81 |
| Margen para pruebas, imprevistos y aprendizaje del stack (+30%) |  | 24 |
| **Total** |  | **105** |

Las horas son estimaciones para planear tu tiempo; ajusta cada tarea cuando la termines.

## Etapa 0 – Base técnica (13 h)

Terminada cuando Eduardo puede abrir un enlace, iniciar sesión e instalar la app en su celular.

- [ ] Crear repositorio privado en GitHub con README y convención de ramas (1 h)
- [ ] Crear proyecto en Supabase (plan Free) y configurar migraciones versionadas (2 h)
- [ ] Esqueleto del frontend conectado a Supabase (3 h)
- [ ] Login con correo y contraseña para Eduardo y reglas de acceso (RLS) básicas; sin enlaces mágicos por email, por el límite de correos del plan Free (2 h)
- [ ] Tema visual: colores, tipografías, wordmark y barra inferior de navegación (2 h)
- [ ] Publicar en Cloudflare Pages o Netlify (plan gratis con uso comercial) y hacerla instalable como app (PWA) (2 h)
- [ ] Respaldo semanal con GitHub Action y `pg_dump` a un repo privado; también evita que Supabase pause el proyecto (1 h)

## Etapa 1 – Catálogo y clientes (10 h)

Terminada cuando los sabores, precios y clientes reales de Eduardo están en la app.

- [ ] Tablas `sabor`, `producto`, `cliente` y `precio` según el modelo de datos (2 h)
- [ ] Pantalla de sabores: alta, edición, color y activar/desactivar (2 h)
- [ ] Pantalla de clientes: tipo (distribuidor, público, evento), zona y teléfono (2 h)
- [ ] Precios de mayoreo por escalón de piezas y precio especial por cliente (3 h)
- [ ] Cargar los datos reales que mande Eduardo (1 h)
- [ ] Migración desde Treinta (horas por estimar cuando sepamos cómo exporta): clientes, productos y precios y
  deudas pendientes para operar desde el día uno; ventas y gastos pasados solo si Eduardo los quiere. Exportar
  (Excel/CSV, soporte de Treinta o captura manual), cargar a tablas de staging en Supabase local, transformar con
  SQL, validar totales contra Treinta y luego cargar a producción. Los archivos exportados nunca van al repo.

## Etapa 2 – Pedidos y entregas (22 h)

Terminada cuando Eduardo registra un pedido de WhatsApp en menos de un minuto y lo marca como entregado.

- [ ] Tablas `pedido` y `pedido_detalle`, con precio congelado al guardar (2 h)
- [ ] Pantalla "Nuevo pedido" como el mockup: cliente, sabores con +5 y −, fecha y pago (5 h)
- [ ] Aviso del mínimo de 40 piezas, sin bloquear el guardado (1 h)
- [ ] Total calculado con el precio del cliente o del escalón (2 h)
- [ ] Lista de pedidos por fecha de entrega con estado: pendiente, entregado, cancelado (3 h)
- [ ] Marcar como entregado, editar y cancelar un pedido (3 h)
- [ ] Vista "Entregas de hoy": pedidos del día con dirección y enlace a Maps (3 h)
- [ ] Venta rápida al público o en evento, sin mínimo de piezas (3 h)

## Etapa 3 – Cobranza (12 h)

Terminada cuando Eduardo sabe en segundos quién le debe y registra un pago.

- [ ] Tabla `pago` y vista SQL de saldo por cliente: entregado menos pagado (2 h)
- [ ] Pantalla "Por cobrar" agrupada por cliente, como el mockup (4 h)
- [ ] Resaltar pedidos con más de 7 días y filtro para verlos (1 h)
- [ ] Registrar pago en efectivo o transferencia, con opción de deshacer (3 h)
- [ ] Botón "Recordar" que abre WhatsApp con el mensaje de cobro ya escrito (2 h)

## Etapa 4 – Gastos y resumen semanal (15 h)

Terminada cuando Eduardo abre la app el lunes y ve cuánto vendió, cobró y ganó la semana anterior.

- [ ] Tabla `gasto` y pantalla para registrar gastos por categoría: ingredientes, empaque, gasolina, otros (3 h)
- [ ] Vistas SQL de la semana: piezas, pedidos, cobrado, gastos, por día, por sabor y por cliente (3 h)
- [ ] Tarjetas de vendido, pedidos, cobrado vs. por cobrar y ganancia (ventas menos gastos) (3 h)
- [ ] Gráficas de piezas por día y sabores más vendidos, con el color de cada sabor (3 h)
- [ ] Ventas por cliente y comparación con la semana anterior (3 h)

## Etapa 5 – Arranque con Eduardo (9 h)

Terminada cuando Eduardo lleva dos semanas registrando sus pedidos reales en la app.

- [ ] Instalar la app en su celular y explicarle el flujo en una videollamada corta (1 h)
- [ ] Acompañarlo la primera semana y anotar dudas o fricciones (2 h)
- [ ] Corregir errores y ajustar lo que le estorbe (4 h)
- [ ] Guía de una página para usar la app (1 h)
- [ ] Aviso de privacidad sencillo, porque la app guarda nombres, teléfonos y direcciones de clientes (1 h)

## Después del MVP

Ideas que quedan fuera a propósito; se priorizan con lo que Eduardo pida al usarla.

- **Pedido desde WhatsApp:** llevar la demo a la app real, guardando el pedido confirmado.
- **Inventario por lotes:** producción con fechas y movimientos de entrada, venta y merma.
- **Alertas:** lotes por vencer y sabores con poco inventario en el resumen.
- **Costos y ganancia:** recetas, insumos y margen por sabor y por cliente.
- **Más usuarios:** acceso para quien le ayude, con permisos limitados.

## Pendiente de confirmar con Eduardo

Estas respuestas pueden mover tareas o sumar horas antes de empezar la etapa 1.

- [ ] ¿Vende a consignación? Si sí, se agrega un módulo de liquidaciones a la etapa 3 (+8 h aprox.)
- [ ] ¿Acepta abonos parciales o pagos a cuenta general del cliente?
- [ ] ¿Los precios cambian por distribuidor o solo por cantidad de piezas?
- [ ] ¿Vende por pieza, por caja o ambos?
- [ ] ¿Alguien más registraría pedidos además de él?
- [ ] ¿Factura a sus distribuidores? Si sí, la facturación (CFDI) es un módulo aparte con proveedor de timbrado (+15 h o más)
- [ ] ¿Le serviría que los distribuidores pidan solos desde la app en lugar de por WhatsApp? (+20 h o más)
- [ ] Acordar quién sostiene la app después del arranque: errores, cambios y hosting si crece
- [ ] ¿Usa Treinta? ¿Qué plan paga y qué le falta? ¿Permite descargar sus datos? Define cómo migramos y la fecha de
  corte: desde ese día todo se anota en la app nueva y Treinta queda solo para consulta
