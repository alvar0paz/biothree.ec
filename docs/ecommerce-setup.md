# Bio-Three.ec — puesta en marcha del e-commerce

Guía de configuración para dejar la tienda vendiendo. El código del storefront
ya está listo; lo que falta vive en el **admin de Shopify**.

Dos cosas que conviene entender antes de empezar, porque cambian qué hay que
hacer y qué no:

- **El inventario no se programa.** Shopify *es* el sistema de inventario
  (ubicaciones, stock, descuento automático al pagar). Este repo solo lo *lee*
  (`availableForSale`, `quantityAvailable`) y lo muestra como "En stock" /
  "Quedan N unidades" / "Agotado". Un inventario paralelo en código se
  desincronizaría en la primera venta.
- **El pago no se programa.** Hydrogen entrega el carrito al **checkout alojado
  de Shopify** vía `cart.checkoutUrl`. Las pasarelas se activan en
  *Configuración → Pagos*. Da igual cuál elijas: este repo no lleva código de
  pagos.

---

## 1. Conectar el storefront (una sola vez)

`.env` está vacío, así que `npm run dev` todavía no puede hablar con Shopify.

```bash
npx shopify hydrogen link      # elegir el storefront "biothree.ec"
npx shopify hydrogen env pull  # escribe las variables en .env
npm run dev
```

`.env` debe quedar con `PUBLIC_STORE_DOMAIN`, `PUBLIC_STOREFRONT_API_TOKEN`,
`PUBLIC_STOREFRONT_ID` y `PUBLIC_CHECKOUT_DOMAIN`. `.env` está en `.gitignore`
— no lo subas.

### Si la tienda responde "Unavailable Shop" (HTTP 402)

Pasó el 6 de septiembre de 2026 y se resolvió el mismo día al activar el plan
Basic. Si vuelve a aparecer: `xzey91-tr.myshopify.com` devuelve **402 /
"Unavailable Shop"** en la tienda pública, la Admin API y la Storefront API
cuando Shopify pausa la tienda (prueba vencida sin plan, o factura pendiente).
Ningún código lo arregla. Se resuelve en *admin.shopify.com → Configuración →
Plan* eligiendo/pagando un plan; revisa también *Facturación* por si hay un
cobro pendiente. Tras reactivar, el admin puede mostrar "This feature is
unavailable on your plan" y ocultar *Productos* durante un rato; cerrar sesión
y volver a entrar suele bastar. Hasta entonces `hydrogen env pull` falla y el
storefront no puede consultar nada.

### Probar el flujo de compra sin la tienda (mock.shop)

Mientras la tienda esté pausada, o antes de crear el producto, se puede
ejercitar **todo el flujo de carrito** contra la tienda demo pública de
Shopify:

```bash
npm run preview:mock     # http://localhost:3000
```

Carga `.env.mock` encima de `.env` (sin secretos: mock.shop no pide token) y
mapea las dos presentaciones a variantes del producto demo `hoodie-old`
mediante `PREVIEW_PRODUCT_HANDLE` / `PREVIEW_OPTION_NAME` /
`PREVIEW_OPTION_VALUES`. Lo que se puede verificar:

- `/productos` y la portada muestran precio y "Agregar al carrito" (no el CTA
  de Instagram). Una variante tiene 3 unidades, así que sale "Quedan 3
  unidades"; la otra "En stock".
- Agregar al carrito abre el panel lateral y sube el contador del header.
- `/cart` lista las líneas, permite cambiar cantidades y muestra el subtotal.
- "Finalizar compra" redirige al checkout de la tienda.

Lo que **no** se puede verificar ahí: el checkout en sí. mock.shop aterriza a
propósito en "Checkout unavailable", así que los métodos de pago
(transferencia/DeUna, PayPhone) solo se prueban con la tienda real activa. Los
precios salen en CAD; es la moneda de la demo, no un bug.

Para ver el estado "Agotado", cambia en `.env.mock`
`PREVIEW_PRODUCT_HANDLE=soft-cotton-hoodie-in-clay` (todas sus variantes están
sin stock) y reinicia.

`npm run preview:local` hace lo mismo pero con las variables de `.env` tal
cual, sin login de Shopify. Sirve para ver el sitio con las credenciales
reales una vez hecho `env pull`.

En producción estas variables `PREVIEW_*` no existen y el código usa
`biothree` / `Presentación` / `Tabletas`,`Sobres` como siempre.

---

## 2. Crear el producto (el código espera exactamente esto)

Biothree es **un producto con dos variantes**, no dos productos. En
*Productos → Agregar producto*:

| Campo | Valor |
|---|---|
| Título | `Biothree` |
| Handle (URL) | `biothree` |
| Opción 1 — nombre | `Presentación` |
| Opción 1 — valores | `Tabletas`, `Sobres` |

Esto genera dos variantes. En cada una:

- **Precio** en USD.
- **SKU** propio.
- **Rastrear cantidad**: activado.
- **Cantidad disponible**: el stock real.
- **Seguir vendiendo sin existencias**: desactivado (salvo que hagas pedidos
  por encargo).

> Los nombres importan. `~/lib/biothree.ts` empareja cada presentación con su
> variante por el valor de la opción `Presentación` (`Tabletas` / `Sobres`).
> Si los cambias en el admin, actualiza `optionValue` en
> `app/data/products.ts`. Como respaldo también intenta emparejar por título de
> variante, pero no dependas de eso.

**Mientras el producto no exista, el sitio no se rompe**: las tarjetas siguen
mostrando el CTA de Instagram tal como hoy. En cuanto el producto exista,
aparecen precio, stock y "Agregar al carrito" solos.

### Inventario

- *Productos → Inventario* es donde se ajusta el stock.
- Shopify descuenta al completarse el pago y repone si cancelas el pedido.
- Bajo `LOW_STOCK_THRESHOLD` (5, en `~/lib/biothree.ts`) la tarjeta muestra
  "Quedan N unidades".
- `quantityAvailable` requiere que el token del storefront tenga el permiso
  `unauthenticated_read_product_inventory`. Si llega `null`, la tarjeta muestra
  "En stock" sin número — no se rompe, pero Hydrogen registra un
  `GraphQLError: Access denied for quantityAvailable` en cada carga. Para
  otorgarlo: *Canales de venta → Hydrogen → biothree.ec → Storefront API
  permissions → Editar*, marcar *Read product inventory* y guardar. No hace
  falta volver a hacer `env pull`: el token es el mismo, solo cambian sus
  permisos.

---

## 3. Pagos

Shopify Payments **no opera en Ecuador**, y PayPhone **no tiene integración
oficial con Shopify** (su "Cajita de pagos" es para sitios a medida; sus
plugins oficiales son WooCommerce y Prestashop). Decisión tomada el 6 de
septiembre de 2026: **un solo método de pago manual** que cubre PayPhone, DeUna
y transferencia, con enlaces de pago de PayPhone enviados a mano por pedido.
Cero código, cero comisión de Shopify, y sirve para medir volumen antes de
automatizar nada.

### 3a. Crear el método manual (una sola vez)

*Configuración → Pagos → Métodos de pago manuales → Crear método de pago
personalizado*

**Nombre del método de pago** (lo ve el cliente en el checkout):

```
PayPhone, DeUna o transferencia
```

**Instrucciones adicionales** (se muestran en el checkout y en el correo de
confirmación; rellena los corchetes):

```
Tu pedido queda reservado por 24 horas. Elige cómo pagar:

1) PayPhone (tarjeta de crédito o débito)
   En unos minutos recibirás por correo un enlace de pago de PayPhone.
   Ábrelo desde el celular y paga con tu tarjeta. No necesitas tener la app.

2) DeUna
   Escanea o paga al número [NÚMERO DEUNA] a nombre de [TITULAR].

3) Transferencia bancaria
   Banco: [BANCO]
   Tipo de cuenta: [AHORROS/CORRIENTE]
   Número: [NÚMERO DE CUENTA]
   Titular: [RAZÓN SOCIAL]
   RUC: [RUC]

Envía el comprobante (DeUna o transferencia) por WhatsApp al [NÚMERO] o a
[CORREO] indicando tu número de pedido. Despachamos apenas confirmamos el pago.
```

**Instrucciones de pago** (campo opcional que ve solo el equipo): deja
`Enlace PayPhone → WhatsApp + correo → marcar como pagado`.

Guardar y activar. Con esto "Finalizar compra" ya deja completar pedidos.

### 3b. Flujo por pedido

Con la automatización de `payphone-automation.md` configurada:

1. Llega el pedido como **Pago pendiente**; Shopify reserva el inventario.
2. El sitio crea el enlace de PayPhone y se lo envía al cliente por correo
   solo. El pedido queda con la etiqueta `payphone-link`.
3. Cuando el cliente paga, el pedido pasa a **Pagado** solo (por la
   notificación de PayPhone o, como máximo, 15 minutos después por la
   conciliación). Etiqueta `payphone-paid`.
4. **DeUna / transferencia** siguen siendo manuales: al recibir el
   comprobante, abre el pedido y pulsa **Marcar como pagado**.
5. Si a las 24 h no hay pago, cancela el pedido para liberar el stock.

Mientras la automatización no esté configurada, el paso 2 se hace a mano en
PayPhone Business (*enlace de pago* con el total y el número de pedido como
referencia) y el paso 3 con *Marcar como pagado*.

Costo: PayPhone cobra su tarifa por cobro (≈ 5% + IVA publicado; confírmalo en
tu contrato). DeUna y transferencia: 0%. Shopify no cobra comisión por métodos
manuales.

### 3c. Automatización

Está construida: ver `docs/payphone-automation.md` para la puesta en marcha
(app personalizada, webhook, credenciales de PayPhone, variables en Oxygen y
el workflow de conciliación).

Alternativas descartadas y por qué:

- **Payphone by CartDNA** (app de Shopify): gratis y se integra al checkout,
  pero es de un tercero (Nabeyond Ltd), lanzada en enero de 2026 y sin reseñas.
  Vale la pena reevaluarla cuando tenga historial.
- **Cajita de pagos de PayPhone** dentro del sitio: implica reemplazar el
  checkout de Shopify (dirección, envío, IVA, descuentos, facturación) por uno
  propio. Semanas de trabajo para una tienda de un producto.
- **Kushki** ≈ 2.95% + $0.25, con contrato y onboarding. Reconsiderar cuando el
  volumen haga que la tarifa de PayPhone duela.
- **Datafast** y **Place to Pay**: onboarding bancario/corporativo pesado.

Cambiar de método después **no toca este repo**: se activa el nuevo en *Pagos*
y el checkout lo muestra.

---

## 4. Pendientes de Ecuador antes de vender

- **Facturación SRI** — Shopify **no** emite comprobantes autorizados por el
  SRI. Hace falta una app de terceros (p. ej. Facturec, ≈ $9.99/mes) que
  capture cédula/RUC en el checkout y genere la factura al pagarse el pedido.
  Resuélvelo antes de la primera venta, no después.
- **Envíos** — *Configuración → Envíos*: crear zona Ecuador con tarifas
  (Quito/Guayaquil vs. resto del país, o envío gratis sobre cierto monto).
- **Impuestos** — configurar IVA en *Configuración → Impuestos*.
- **Moneda** — la tienda debe estar en USD.
- **Políticas** — *Configuración → Políticas*: devoluciones, privacidad,
  términos. Se enlazan solas en el checkout.
- **Correos** — traducir al español las notificaciones en
  *Configuración → Notificaciones*.

---

## 5. Checklist de lanzamiento

- [ ] `hydrogen link` + `env pull` hechos, `npm run dev` levanta
- [ ] Producto `biothree` creado con variantes `Tabletas` y `Sobres`
- [ ] Precio, SKU y stock cargados en ambas variantes
- [ ] `/productos` muestra precio y "Agregar al carrito" (no el CTA de Instagram)
- [ ] Agregar al carrito abre el panel lateral y el contador del header sube
- [ ] "Finalizar compra" lleva al checkout de Shopify
- [ ] Método manual "PayPhone, DeUna o transferencia" activo con datos reales
- [ ] Zona de envío Ecuador configurada
- [ ] Pedido de prueba completo, de principio a fin
- [ ] Facturación SRI resuelta
- [ ] Poner una variante en stock 0 y confirmar que muestra "Agotado"
