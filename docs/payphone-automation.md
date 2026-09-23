# PayPhone: cobro con tarjeta desde el checkout propio

Cómo funciona y cómo se pone en marcha el cobro con PayPhone. Complementa
`ecommerce-setup.md` (sección 3).

## Qué hace

1. El cliente arma su carrito en biothree.ec y pulsa **Finalizar compra**.
   Aterriza en `/checkout` (checkout propio, no el de Shopify): correo,
   celular, cédula/RUC opcional y dirección de envío.
2. Con la dirección, Shopify cotiza el pedido (`draftOrderCalculate`):
   tarifas de envío de *Configuración → Envíos*, IVA de *Configuración →
   Impuestos* y códigos de descuento del carrito. El cliente ve envío, IVA y
   total, y elige la tarifa si hay más de una.
3. Al pulsar **Pagar con PayPhone**, el sitio crea el pedido en Shopify como
   *Pago pendiente* (borrador completado como pendiente; el inventario queda
   reservado), registra el pago en PayPhone
   (`POST /api/button/Prepare`, con `responseUrl` y `cancellationUrl` de
   biothree.ec) y redirige al cliente al formulario de tarjeta alojado por
   PayPhone. El carrito se vacía en ese momento.
4. PayPhone devuelve al cliente a
   `/pago/payphone/respuesta?id=<transactionId>&clientTransactionId=<id del pedido>`.
   El sitio **confirma la transacción con PayPhone** (`POST
   /api/button/V2/Confirm`, obligatorio: PayPhone reversa lo que no se
   confirma en 5 minutos), comprueba que esté aprobada y que el monto
   coincida con el saldo del pedido, y solo entonces ejecuta
   `orderMarkAsPaid` y etiqueta `payphone-paid`. La página muestra la
   confirmación. Recargarla es inofensivo.
5. Si el cliente cierra el formulario de PayPhone, vuelve a
   `/pago/payphone/cancelado` con un botón para reintentar. Si el banco
   rechaza la tarjeta, la página de respuesta ofrece reintentar. Cada intento
   es una transacción nueva en PayPhone (`clientTransactionId` con sufijo
   `-2`, `-3`… hasta 9 intentos); el pedido sigue pagable desde
   `/pagar/<id numérico del pedido>`, que también sirve para mandar el enlace
   por WhatsApp a mano.

Shopify no maneja provincias para Ecuador (acepta `provinceCode` y lo
descarta), así que la provincia elegida viaja dentro de la ciudad del pedido
("Quito, Pichincha"), que es lo que sale en la etiqueta de envío.

Todo el estado vive en el pedido: metafields `biothree.payphone_link`
(URL del último intento) y `biothree.payphone_client_tx` (id del último
intento), etiquetas `payphone-checkout` (nació en el checkout propio),
`payphone-link` (tiene al menos un intento) y `payphone-paid`. La cédula/RUC
queda como atributo adicional del pedido (`Cédula / RUC`) para la factura.

Dos redes de seguridad, las dos verifican contra PayPhone con nuestro token
antes de tocar el pedido:

- **Conciliación cada 15 min** (GitHub Actions → `POST /api/payphone/reconcile`):
  revisa los pedidos pendientes con intento, consulta cada uno en PayPhone
  (`GET /api/Sale/client/{id}`) y, para los del checkout propio, vuelve a
  confirmar antes de marcarlos pagados. Cubre al cliente que pagó y cerró la
  pestaña antes de volver al sitio.
- **Notificación externa de PayPhone** → `POST /api/webhooks/payphone`
  (opcional, ver paso 4).

**Flujo heredado (enlace por correo).** Si un pedido entra por el checkout
alojado de Shopify con el método de pago manual, el webhook `orders/create`
sigue creando un enlace de pago (API Links) y enviándolo con el correo *Order
invoice*. Los pedidos del checkout propio se saltan (etiqueta
`payphone-checkout`), así que nunca reciben un segundo cobro. Hoy el sitio no
enlaza al checkout de Shopify, pero `/checkout` cae en él solo si faltan las
credenciales (vista previa local sin secretos).

Código: `app/lib/payphone.ts` (cliente PayPhone: Prepare/Confirm, Links,
Sale), `app/lib/shopify-admin.ts` (Admin API), `app/lib/shopify-checkout.ts`
(borradores → pedido), `app/lib/checkout.ts` (validación: provincias,
celular, cédula/RUC), `app/lib/payphone-flow.ts` (orquestación), rutas
`app/routes/checkout.tsx`, `pagar.$orderId.tsx`, `pago.payphone.*.tsx` y
`api.*`. Pruebas: `npm test`.

## Variables de entorno (privadas)

Se cargan en *Canales de venta → Hydrogen → biothree.ec → Storefront settings
→ Environments and variables*, para **Production** (y Preview si quieres
probar en una rama). Ninguna lleva prefijo `PUBLIC_`. Localmente viven en
`.env.payphone` (gitignored) y se suben con
`npx shopify hydrogen env push --env production --env-file .env.payphone`.

| Variable | Origen |
|---|---|
| `SHOPIFY_CLIENT_ID` | App del Dev Dashboard → Settings → Client ID (paso 1) |
| `SHOPIFY_CLIENT_SECRET` | Ídem, Client secret. También firma el webhook (paso 2) |
| `PAYPHONE_API_TOKEN` | Token de la aplicación en PayPhone Developer (paso 3) |
| `PAYPHONE_STORE_ID` | StoreId de la sucursal en PayPhone Developer (paso 3). Opcional si la cuenta tiene una sola tienda |
| `PAYPHONE_LINK_EXPIRE_HOURS` | Opcional, horas de vigencia del enlace del flujo heredado. Por defecto 24 |
| `PAYPHONE_WEBHOOK_KEY` | Cadena aleatoria larga que tú inventas (paso 4) |
| `PAYPHONE_RECONCILE_SECRET` | Otra cadena aleatoria larga (paso 5) |

Para generar secretos: `openssl rand -hex 32`.

Sin credenciales de Shopify o sin `PAYPHONE_API_TOKEN`, `/checkout` redirige
al checkout alojado de Shopify y las rutas `api.*` y `/pagar` responden 503;
el sitio sigue funcionando. (`SHOPIFY_ADMIN_API_TOKEN` y
`SHOPIFY_WEBHOOK_SECRET` siguen aceptados para una app personalizada antigua
creada en el admin, hoy descontinuadas por Shopify.)

## Puesta en marcha

### 1. App en el Dev Dashboard de Shopify (Admin API)

Shopify descontinuó las apps personalizadas del admin el 1 de enero de 2026;
ahora se crean en https://dev.shopify.com con la organización de la tienda.

1. *Apps → Create app*. Nombre `Biothree PayPhone`.
2. En la versión (*Versions → Create version*): App URL `https://biothree.ec`
   (la app no tiene interfaz; el campo solo debe ser válido), desmarcar
   *Embed app in Shopify admin*. En *API access* marcar `read_orders`,
   `write_orders` y **`write_draft_orders`** (el checkout propio crea los
   pedidos como borradores). Opcional: `write_payment_terms`; con él el
   pedido pendiente se crea con términos de pago *Due on receipt* (la forma
   actual de Shopify) en vez del parámetro `paymentPending`, que Shopify
   marca como obsoleto pero sigue funcionando. El código detecta el permiso
   solo. Pulsar **Release**.
3. Instalar la app en la tienda *Bio Three Ecuador* (desde la página de la
   app, *Install* / elegir tienda). Si cambias los permisos después, hay que
   volver a instalar/actualizar la app en la tienda.
4. *Settings* de la app → copiar **Client ID** y **Client secret** →
   `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`.

El código intercambia esas credenciales por un token de Admin API de 24 h
(*client credentials grant*) y lo renueva solo. Al 22 de septiembre de 2026 la
app instalada ya tiene `read_all_orders, write_draft_orders, write_orders`.

### 2. Webhook de Shopify (solo para el flujo heredado)

Lo crea la propia app (así queda firmado con el Client secret):

```bash
node scripts/shopify-webhook.mjs          # crea orders/create → /api/webhooks/shopify/orders-create
node scripts/shopify-webhook.mjs --list   # verificar
```

Lee `.env` y `.env.payphone`. Si prefieres crearlo a mano en *Configuración →
Notificaciones → Webhooks*, carga además `SHOPIFY_WEBHOOK_SECRET` con el
secreto de firma que aparece al pie de esa página. Con el checkout propio el
webhook solo actúa sobre pedidos que entren por el checkout de Shopify.

### 3. Aplicación en PayPhone Developer

En https://developer.payphone.app (con la cuenta de comercio):

- Crear una aplicación de tipo web. Copiar el **Token** y el **StoreId** de
  la sucursal → `PAYPHONE_API_TOKEN`, `PAYPHONE_STORE_ID`.
- **Dominio web**: `biothree.ec`. El botón de pago devuelve al cliente a
  `https://biothree.ec/pago/payphone/respuesta` y
  `https://biothree.ec/pago/payphone/cancelado`; ambas URL se mandan en cada
  `Prepare`, no hace falta registrarlas una a una.
- **El formulario de PayPhone solo abre si el cliente llega desde ese
  dominio** (lo lee de la cabecera `Referer`). Probado el 22 de septiembre de
  2026: desde `localhost` PayPhone devuelve al sitio con `msg=Su dominio no
  está autorizado por la aplicación`, y abierto a mano (sin origen) muestra
  "NO AUTORIZADO". Por eso el sitio manda `Referrer-Policy:
  strict-origin-when-cross-origin` (el origen viaja en la redirección) y el
  dominio registrado debe ser exactamente el del sitio (`biothree.ec`, sin
  `www` si el sitio no lo usa).
- **Para probar en local** hay dos caminos: autorizar `localhost` en el
  dominio de la aplicación en PayPhone Developer (si la consola lo permite),
  o crear una segunda aplicación de prueba con dominio `localhost` y sus
  credenciales sandbox (todas las transacciones se aprueban, no toca bancos)
  y cargarlas en `.env.payphone` solo en tu máquina. Sin eso, el flujo
  completo se prueba en `https://biothree.ec` una vez desplegado.
- Para sandbox en Oxygen: cárgalas en el entorno **Preview** y usa una rama;
  en Production van las reales.

### 4. Notificación externa de PayPhone (opcional)

PayPhone activa su webhook previa solicitud a soporte (piden datos del
comercio y técnicos). Pide que apunte a:

```
https://<dominio del sitio>/api/webhooks/payphone?key=<PAYPHONE_WEBHOOK_KEY>
```

Solo notifican transacciones aprobadas y no firman el mensaje; por eso el
`key` en la URL y la verificación contra su API. Con el checkout propio la
confirmación llega por la propia redirección del cliente, así que este paso
es un respaldo más, como la conciliación.

### 5. Conciliación programada (GitHub Actions)

El workflow `.github/workflows/payphone-reconcile.yml` corre cada 15 minutos.
En el repo de GitHub, *Settings → Secrets and variables → Actions*, crear:

- `PAYPHONE_RECONCILE_URL` = `https://<dominio del sitio>/api/payphone/reconcile`
- `PAYPHONE_RECONCILE_SECRET` = el mismo valor cargado en Oxygen

Sin esos secretos el workflow termina en verde sin hacer nada. Se puede
lanzar a mano desde la pestaña *Actions → PayPhone reconcile → Run workflow*,
útil cuando un cliente dice "ya pagué" y el pedido sigue pendiente.

### 6. Correos al cliente

- **Confirmación de pedido**: Shopify la envía al completar el borrador, con
  el pedido en *Pago pendiente*; al marcarse pagado no manda otro correo.
  Revisa la plantilla en *Configuración → Notificaciones → Order
  confirmation* y considera añadir, para los pedidos pendientes, un enlace de
  pago por si el cliente no terminó:

  ```liquid
  {% if financial_status == 'pending' %}
    <p><a href="https://biothree.ec/pagar/{{ order.id }}">Pagar con PayPhone</a></p>
  {% endif %}
  ```

- **Order invoice** (flujo heredado): el enlace de PayPhone viaja en el
  `customMessage`; el bloque `order.metafields.biothree.payphone_link` que
  recomendaba la versión anterior de esta guía sigue siendo válido.

### 7. Prueba de punta a punta

Local, con las credenciales reales (`.env` + `.env.payphone`) y `localhost`
autorizado en PayPhone Developer (ver paso 3):

```bash
npm run preview:payphone     # http://localhost:5173
```

1. Agregar Biothree al carrito → **Finalizar compra** → llenar datos con
   una dirección de Ecuador → **Continuar al envío**. Debe aparecer *Standard
   · Gratis*, IVA y total.
2. **Pagar con PayPhone**: en Shopify aparece un pedido nuevo en *Pago
   pendiente* con etiquetas `payphone-checkout` y `payphone-link`, y el
   navegador queda en el formulario de tarjeta de PayPhone.
3. Cerrar el formulario con la X → vuelve a `/pago/payphone/cancelado` con el
   botón *Intentar el pago de nuevo*.
4. Pagar (sandbox, o real con un pedido de $1 que luego se reembolsa desde
   PayPhone Business) → vuelve a `/pago/payphone/respuesta` con **¡Pago
   confirmado!**; el pedido pasa a **Pagado** con la etiqueta `payphone-paid`.
5. Recargar la página de respuesta: sigue mostrando la confirmación, sin
   marcar nada dos veces.
6. Cancelar (y borrar) el pedido de prueba en Shopify para liberar el stock.

## Despliegue

El checkout y el webhook `orders/create` viven en el mismo despliegue. Hasta
que la versión con el checkout esté en Production, el webhook viejo no conoce
la etiqueta `payphone-checkout` y le mandaría por correo un segundo enlace de
pago a cualquier pedido que el checkout nuevo cree contra la tienda real (pasó
con el pedido de prueba #1002 del 22 de septiembre de 2026). Despliega antes
de abrir el checkout a clientes.

## Operación y límites

- **Pedido pendiente sin pago** (cliente que nunca volvió): hoy no se cancela
  solo. A las 24 h, cancela el pedido para liberar stock o mándale
  `https://biothree.ec/pagar/<id numérico del pedido>` (el id está en la URL
  del pedido en el admin).
- **Reintentos**: cada clic en *Pagar con PayPhone* es una transacción nueva
  en PayPhone; tras 9 intentos el código se niega (límite de 15 caracteres
  del `clientTransactionId`). Si eso pasa, crea un enlace a mano en PayPhone
  Business y marca el pedido pagado al recibirlo.
- **Montos**: PayPhone recibe el saldo pendiente exacto del pedido, con el IVA
  separado según la tasa del pedido. Si un pedido se edita después de crear
  el intento, el monto no coincidirá y **no se marcará pagado**: la página
  de respuesta le dice al cliente que lo revisamos a mano; revisa los logs de
  Oxygen (`amount-mismatch`) y resuélvelo desde el admin.
- **Ventana de 5 minutos**: si PayPhone no responde al confirmar, la página de
  respuesta reintenta sola y ofrece un botón; la conciliación vuelve a
  confirmar en su siguiente corrida.
- **Límites de PayPhone**: 30 consultas por minuto. La conciliación revisa
  como máximo 25 pedidos por corrida.
- **Logs**: *Hydrogen → biothree.ec → Deployments → Logs*. Todo salto o
  rechazo se registra con el número de pedido y la razón.
