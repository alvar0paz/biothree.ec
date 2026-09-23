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
- **El pago sí se programa, pero poco.** Shopify Payments no opera en
  Ecuador, así que el sitio tiene su propio checkout (`/checkout`) que crea el
  pedido en Shopify y cobra con tarjeta a través de **PayPhone** (ver
  `payphone-automation.md`). Envíos, IVA y descuentos los sigue calculando
  Shopify: se configuran en el admin, no en el código.

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
- "Finalizar compra" lleva a `/checkout`, que sin credenciales de PayPhone
  redirige al checkout de la tienda.

Lo que **no** se puede verificar ahí: el checkout propio ni el pago. mock.shop
aterriza a propósito en "Checkout unavailable"; el cobro con PayPhone solo se
prueba con la tienda real (`npm run preview:payphone`, ver
`payphone-automation.md`). Los precios salen en CAD; es la moneda de la demo,
no un bug.

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
oficial con Shopify** (su "Cajita de pagos" y su "Botón de pago" son para
sitios a medida; sus plugins oficiales son WooCommerce y Prestashop).

Decisión del 22 de septiembre de 2026: **checkout propio en biothree.ec con
el Botón de pago de PayPhone**. El cliente llena sus datos en el sitio, el
sitio crea el pedido en Shopify (pendiente de pago, inventario reservado) y
lo manda directo al formulario de tarjeta de PayPhone; al pagar vuelve al
sitio con la confirmación y el pedido queda **Pagado** solo. Reemplaza la
decisión del 6 de septiembre (método manual + enlace por correo), que exigía
esperar un correo para pagar. Cómo funciona y cómo se configura:
`payphone-automation.md`.

### 3a. Qué configurar en el admin

- **Envíos** — *Configuración → Envíos*: zona Ecuador con sus tarifas. El
  checkout muestra exactamente esas tarifas (hoy: *Standard*, gratis).
- **Impuestos** — *Configuración → Impuestos*: IVA de Ecuador. El checkout
  cobra la tasa configurada (hoy 12 %; revisa que sea la vigente).
- **Método de pago manual** (*Configuración → Pagos*): ya no lo ve ningún
  cliente, porque el sitio no enlaza al checkout de Shopify. Puedes dejarlo
  activo como respaldo (si faltan credenciales, `/checkout` cae ahí) o
  desactivarlo. Si lo dejas, cambia sus instrucciones para que no prometan un
  correo con el enlace.

### 3b. Flujo por pedido

1. Llega el pedido como **Pago pendiente** con la etiqueta
   `payphone-checkout`; Shopify reserva el inventario. El cliente ya está en
   PayPhone.
2. Cuando paga, el pedido pasa a **Pagado** solo (por la vuelta del cliente
   al sitio o, como máximo, 15 minutos después por la conciliación). Etiqueta
   `payphone-paid`.
3. Si a las 24 h sigue pendiente (cerró PayPhone y no volvió), cancela el
   pedido para liberar el stock o mándale por WhatsApp
   `https://biothree.ec/pagar/<id numérico del pedido>`.
4. **Transferencia o DeUna** ya no se ofrecen en el sitio. Si un cliente lo
   pide, crea el pedido a mano en el admin (*Pedidos → Crear pedido → Pago
   pendiente*) y márcalo pagado al recibir el comprobante.

Costo: PayPhone cobra su tarifa por cobro (≈ 5% + IVA publicado; confírmalo en
tu contrato). Shopify no cobra comisión por pedidos creados por la API.

### 3c. Alternativas descartadas y por qué

- **Método manual + enlace de PayPhone por correo** (implementación del 6 de
  septiembre de 2026): funcionaba, pero el cliente tenía que esperar un correo
  y pagar desde ahí, sin volver al sitio. El código sigue en
  `app/lib/payphone-flow.ts` (`handleOrderCreated`) para los pedidos que
  entren por el checkout de Shopify.
- **Enlaces de pago (API Links) con redirección**: la API de enlaces no
  devuelve al cliente al sitio (confirmado en la documentación de PayPhone).
- **Extensión de Shopify en la página "Gracias"**: permitiría un botón hacia
  PayPhone después del checkout de Shopify, pero exige desplegar una app con
  extensiones y activarla en el editor de checkout, y el cliente igual tendría
  que hacer clic ahí. El checkout propio lo evita.
- **Payphone by CartDNA** (app de Shopify): gratis y se integra al checkout,
  pero es de un tercero (Nabeyond Ltd), lanzada en enero de 2026 y sin reseñas.
  Vale la pena reevaluarla cuando tenga historial.
- **Kushki** ≈ 2.95% + $0.25, con contrato y onboarding. Reconsiderar cuando el
  volumen haga que la tarifa de PayPhone duela.
- **Datafast** y **Place to Pay**: onboarding bancario/corporativo pesado.

---

## 4. Pendientes de Ecuador antes de vender

- **Facturación SRI** — Shopify **no** emite comprobantes autorizados por el
  SRI. Hace falta una app de terceros (p. ej. Facturec, ≈ $9.99/mes) que
  genere la factura al pagarse el pedido. El checkout propio ya guarda la
  cédula/RUC del cliente como atributo del pedido (`Cédula / RUC`).
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
- [ ] "Finalizar compra" lleva a `/checkout` y muestra envío, IVA y total
- [ ] Variables de PayPhone y de la app de Shopify cargadas en Oxygen (Production)
- [ ] Zona de envío Ecuador configurada
- [ ] Pedido de prueba completo, de principio a fin: pagar en PayPhone y volver
      al sitio con "¡Pago confirmado!" y el pedido en **Pagado**
- [ ] Facturación SRI resuelta
- [ ] Poner una variante en stock 0 y confirmar que muestra "Agotado"
