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

Al 6 de septiembre de 2026, `xzey91-tr.myshopify.com` devuelve **402 /
"Unavailable Shop"** tanto en la tienda pública como en la Admin API y la
Storefront API. Eso significa que Shopify pausó la tienda: prueba vencida sin
plan elegido, o factura pendiente. Ningún código lo arregla. Se resuelve en
*admin.shopify.com → Configuración → Plan* eligiendo/pagando un plan. Hasta
entonces `hydrogen env pull` falla y el storefront no puede consultar nada.

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
  "En stock" sin número — no se rompe.

---

## 3. Pagos

Shopify Payments **no opera en Ecuador**. Hay que usar proveedores locales.
Plan recomendado: arrancar con transferencia manual y sumar tarjetas con
PayPhone.

### 3a. Transferencia / DeUna (sin integración, sin comisión)

Lo más rápido para empezar a recibir pedidos reales hoy.

*Configuración → Pagos → Métodos de pago manuales → Crear método personalizado*

- **Nombre**: `Transferencia bancaria / DeUna`
- **Instrucciones adicionales**: banco, tipo de cuenta, número, titular, RUC/CI,
  y que envíen el comprobante al WhatsApp o correo de Biothree.

Flujo: el cliente hace el pedido → Shopify lo crea como *pago pendiente* y
reserva inventario → confirmas la transferencia → marcas el pedido como pagado.

Costo 0%. La contra es que es manual y tienes que conciliar a mano.

### 3b. PayPhone (tarjetas)

La pasarela local más fácil: se instala desde la Shopify App Store, no exige
certificación PCI ni cuota mensual. Tarifa publicada ≈ **5% + IVA** por
transacción — cara por venta, pero sin costo fijo, así que para volumen bajo
sale a cuenta.

1. Abrir cuenta de comercio en PayPhone (RUC, datos bancarios).
2. Instalar la app de PayPhone desde la Shopify App Store.
3. Conectar credenciales y activarla en *Configuración → Pagos*.
4. Hacer un pedido de prueba de $1 y reembolsarlo.

No soporta pagos recurrentes ni de un clic. Solo USD (que es lo que se necesita).

### Cuándo cambiar

- **Kushki** ≈ 2.95% + $0.25 — más barato por transacción, pero exige contrato
  y onboarding. Vale la pena cuando el volumen haga que el 5% duela.
- **Datafast** — respaldo bancario tradicional, más papeleo, sin app nativa de
  Shopify.
- **Place to Pay** — orientado a corporativo; el onboarding más pesado de todos.
  No es el camino para lanzar.

Cambiar de pasarela después **no toca este repo**: se activa la nueva en
*Pagos* y el checkout la muestra.

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
- [ ] Al menos un método de pago activo
- [ ] Zona de envío Ecuador configurada
- [ ] Pedido de prueba completo, de principio a fin
- [ ] Facturación SRI resuelta
- [ ] Poner una variante en stock 0 y confirmar que muestra "Agotado"
