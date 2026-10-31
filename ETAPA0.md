# Etapa 0 – Base técnica de la app Amai Mochi

Meta: Eduardo abre un enlace, inicia sesión e instala la app en su celular. Costo: $0 al mes.

Estos archivos van en tu repo:

```
supabase/migrations/20261030000000_amai_core.sql   ← modelo de datos del MVP (probado en Postgres 16)
.github/workflows/respaldo.yml                      ← respaldo + ping cada 3 días
```

> Lo que no pude revisar por dentro es el repo de Atomic CRM. Los comandos, nombres de variables
> y carpetas que menciono de él vienen de su documentación; confírmalos en su README antes de seguir.

## 0. Requisitos en tu computadora

- Node.js 22 LTS, Git y Docker Desktop (Supabase local corre en Docker).
- Cuenta de GitHub, Supabase y Cloudflare (las tres gratis).

## 1. Base del proyecto (≈2 h)

1. Haz fork de `github.com/marmelab/atomic-crm` como **repo privado**, o usa "Use this template".
2. Clónalo y levántalo tal cual, sin cambiar nada: `make install` y luego `make start`.
3. Recórrelo 20 minutos: login, layout, cómo define una lista y un formulario, y la carpeta `supabase/`.
4. **No borres todavía las tablas del CRM.** Su login depende de algunas (por ejemplo, la de usuarios/ventas). Primero agrega lo tuyo; quita lo del CRM en una migración posterior, cuando entiendas qué usa la autenticación.

## 2. Modelo de datos (≈1 h)

1. Copia `20261030000000_amai_core.sql` a `supabase/migrations/`.
2. Aplica todo en local: `npx supabase db reset` (borra la base local y corre todas las migraciones).
3. Revisa en Supabase Studio local (`http://localhost:54323`) que existan las tablas y vistas.
4. Carga los 6 sabores de prueba para tener con qué trabajar:

```sql
insert into sabor (nombre, color) values
  ('Fresa','#EE8FA8'), ('Mango','#F3C443'), ('Taro','#A985D1'),
  ('Chocolate','#8A5A3C'), ('Oreo','#6E6E6E'), ('Vainilla','#E3CC8A');
```

Qué trae la migración:

| Pieza | Para qué |
| --- | --- |
| `fn_precio()` + trigger | Calcula y congela el precio: especial del cliente → escalón → lista |
| `v_saldo_cliente` | Cuánto debe cada cliente (entregado − pagado) |
| `v_cobranza_pendiente` | Pedidos entregados sin pago ligado y sus días |
| `v_entregas_hoy` | Lo que hay que entregar hoy |
| `v_resumen_semanal`, `v_ventas_sabor_semana` | Pantalla "Tu semana" |
| RLS | Solo usuarios autenticados ven datos; anónimos no ven nada |

Ojo: `v_cobranza_pendiente` solo marca como cobrado un pedido si el pago tiene `pedido_id`. Los pagos "a cuenta" sí bajan el saldo en `v_saldo_cliente`. Se ajusta cuando Eduardo diga cómo cobra.

## 3. Supabase en la nube (≈1 h)

1. Crea un proyecto en el plan **Free**, en la región de EE. UU. más cercana.
2. Vincúlalo y sube las migraciones:
   `npx supabase link --project-ref <ref>` y luego `npx supabase db push`.
3. Crea el usuario de Eduardo (Authentication → Users → Add user, con correo y contraseña).
4. **Importante:** desactiva el registro de usuarios nuevos (Authentication → Sign In / Providers → "Allow new users to sign up"). Las políticas RLS dan acceso total a cualquier usuario autenticado, así que nadie más debe poder crear cuenta.

## 4. Marca y PWA (≈3 h)

1. Colores: crema `#FBF5E3`, rosa principal `#B23A62`, texto `#2A2320`. Tipografías: Bebas Neue para títulos y Quicksand para texto. Wordmark arriba y barra inferior con Nuevo pedido / Por cobrar / Resumen, como en los mockups.
2. Instala la PWA: `npm i -D vite-plugin-pwa` y en `vite.config.ts`:

```ts
import { VitePWA } from 'vite-plugin-pwa'

// dentro de plugins: [...]
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Amai Mochi',
    short_name: 'Amai Mochi',
    lang: 'es-MX',
    display: 'standalone',
    theme_color: '#B23A62',
    background_color: '#FBF5E3',
    icons: [
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  }
})
```

3. Genera los íconos a partir del logo con `npx @vite-pwa/assets-generator`.

## 5. Publicar en Cloudflare Pages (≈1 h)

1. Workers & Pages → Create → Pages → conecta tu repo de GitHub.
2. Build command: `npm run build`. Output: la carpeta que genere Vite (normalmente `dist`).
3. Variables de entorno: las mismas que pide el `.env` del proyecto (URL de Supabase y llave pública), con los valores del proyecto en la nube.
4. Abre el enlace en el celular → "Agregar a pantalla de inicio". Debe abrir como app, sin barra del navegador.

## 6. Respaldo (≈30 min)

1. Copia `respaldo.yml` a `.github/workflows/`.
2. Agrega los 3 secrets que indica el archivo (Settings → Secrets and variables → Actions).
3. Córrelo a mano una vez (Actions → Respaldo Supabase → Run workflow) y descarga el artifact para confirmar que trae datos.
4. Prueba restaurarlo al menos una vez en tu Supabase local. Un respaldo que nunca se probó no es un respaldo.

## Terminada cuando

- [ ] La app abre desde el enlace de Cloudflare y se instala en el celular
- [ ] Eduardo puede iniciar sesión y nadie más puede registrarse
- [ ] Las tablas y vistas existen en producción
- [ ] El respaldo corrió, se descargó y se restauró en local
- [ ] Colores, tipografías y wordmark de Amai Mochi aplicados
