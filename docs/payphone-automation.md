# PayPhone: automatización de enlaces de pago

Cómo funciona y cómo se pone en marcha el cobro automático con PayPhone sin
pasarela en el checkout. Complementa `ecommerce-setup.md` (sección 3).

## Qué hace

1. El cliente termina el checkout de Shopify con el método manual
   **"PayPhone, DeUna o transferencia"**. El pedido queda *Pago pendiente* y
   el inventario reservado.
2. Shopify dispara el webhook `orders/create` a
   `POST /api/webhooks/shopify/orders-create`. La ruta verifica la firma HMAC,
   vuelve a leer el pedido por Admin API y, si sigue pendiente y no tiene
   enlace, crea un **enlace de pago de PayPhone** (API Links) por el saldo
   exacto, lo guarda en el pedido (metafields `biothree.payphone_link` y
   `biothree.payphone_client_tx`, etiqueta `payphone-link`) y lo envía al
   cliente con el correo *Order invoice* de Shopify.
3. El cliente paga desde el celular. Para marcar el pedido como pagado hay dos
   caminos, y los dos **verifican la transacción en PayPhone con nuestro
   token** antes de tocar nada:
   - **Notificación externa de PayPhone** → `POST /api/webhooks/payphone`.
   - **Conciliación cada 15 min** (GitHub Actions) →
     `POST /api/payphone/reconcile`, que revisa los pedidos pendientes con
     enlace y consulta cada uno en PayPhone.
   Si la transacción está aprobada y el monto coincide con el saldo del
   pedido, se ejecuta `orderMarkAsPaid` y se etiqueta `payphone-paid`.
   Cualquier diferencia se registra y **no** se marca.

El `clientTransactionId` del enlace es el id numérico del pedido de Shopify,
así que no hay base de datos: todo el estado vive en el pedido. Cada paso es
idempotente; los reintentos de Shopify o de PayPhone son inofensivos.

Código: `app/lib/payphone.ts` (cliente PayPhone), `app/lib/shopify-admin.ts`
(Admin API), `app/lib/shopify-webhook.ts` (HMAC), `app/lib/payphone-flow.ts`
(orquestación) y las tres rutas `app/routes/api.*`. Pruebas: `npm test`.

## Variables de entorno (privadas)

Se cargan en *Canales de venta → Hydrogen → biothree.ec → Storefront settings
→ Environments and variables*, para **Production** (y Preview si quieres
probar en una rama). Ninguna lleva prefijo `PUBLIC_`.

| Variable | Origen |
|---|---|
| `SHOPIFY_ADMIN_API_TOKEN` | Token de la app personalizada (paso 1) |
| `SHOPIFY_WEBHOOK_SECRET` | Secreto de firma de webhooks (paso 2) |
| `PAYPHONE_API_TOKEN` | Token de la aplicación en PayPhone Developer (paso 3) |
| `PAYPHONE_STORE_ID` | StoreId de la sucursal en PayPhone Developer (paso 3). Opcional si la cuenta tiene una sola tienda |
| `PAYPHONE_LINK_EXPIRE_HOURS` | Opcional, horas de vigencia del enlace. Por defecto 24 |
| `PAYPHONE_WEBHOOK_KEY` | Cadena aleatoria larga que tú inventas (paso 4) |
| `PAYPHONE_RECONCILE_SECRET` | Otra cadena aleatoria larga (paso 5) |

Para generar secretos: `openssl rand -hex 32`.

Sin `SHOPIFY_ADMIN_API_TOKEN` o `PAYPHONE_API_TOKEN` las rutas responden 503
y no hacen nada; el sitio sigue funcionando.

## Puesta en marcha

### 1. App personalizada de Shopify (Admin API)

*Configuración → Aplicaciones y canales de venta → Desarrollar aplicaciones →
Crear una aplicación*. Nombre: `Biothree PayPhone`.

- *Configuración de la API de administrador* → permisos: `read_orders`,
  `write_orders`. Nada más.
- Instalar la app y copiar el **token de acceso de la API de administrador**
  (`shpat_…`). Se muestra una sola vez → `SHOPIFY_ADMIN_API_TOKEN`.

### 2. Webhook de Shopify

*Configuración → Notificaciones → Webhooks → Crear webhook*:

- Evento: **Creación de pedido** (`orders/create`)
- Formato: JSON
- URL: `https://<dominio del sitio>/api/webhooks/shopify/orders-create`
- Versión de API: `2025-07`

Al pie de esa misma página está el texto "Todos tus webhooks se firmarán con
…": ese valor es `SHOPIFY_WEBHOOK_SECRET`.

### 3. Aplicación en PayPhone Developer

En https://developer.payphone.app (con la cuenta de comercio):

- Crear una aplicación. Copiar el **Token** y el **StoreId** de la sucursal →
  `PAYPHONE_API_TOKEN`, `PAYPHONE_STORE_ID`.
- Si la aplicación pide "Dominio Web", usar el dominio del sitio. La API de
  enlaces no depende del dominio, pero no cuesta nada dejarlo correcto.
- Para probar primero en sandbox: PayPhone entrega credenciales de prueba por
  aplicación (todas las transacciones se aprueban, no toca bancos). Cárgalas
  en el entorno **Preview** de Oxygen y usa una rama; en Production van las
  reales.

### 4. Notificación externa de PayPhone (opcional pero recomendable)

PayPhone activa su webhook previa solicitud a soporte (piden datos del
comercio y técnicos). Pide que apunte a:

```
https://<dominio del sitio>/api/webhooks/payphone?key=<PAYPHONE_WEBHOOK_KEY>
```

Solo notifican transacciones aprobadas y no firman el mensaje; por eso el
`key` en la URL y la verificación contra su API. Mientras no lo activen, la
conciliación del paso 5 cubre el hueco con hasta 15 minutos de retraso.

### 5. Conciliación programada (GitHub Actions)

El workflow `.github/workflows/payphone-reconcile.yml` corre cada 15 minutos.
En el repo de GitHub, *Settings → Secrets and variables → Actions*, crear:

- `PAYPHONE_RECONCILE_URL` = `https://<dominio del sitio>/api/payphone/reconcile`
- `PAYPHONE_RECONCILE_SECRET` = el mismo valor cargado en Oxygen

Sin esos secretos el workflow termina en verde sin hacer nada. Se puede
lanzar a mano desde la pestaña *Actions → PayPhone reconcile → Run workflow*,
útil cuando un cliente dice "ya pagué" y el pedido sigue pendiente.

### 6. Correo al cliente

El enlace viaja en el `customMessage` del correo **Order invoice** de Shopify,
así que funciona sin tocar plantillas. Para que quede más limpio, en
*Configuración → Notificaciones → Notificaciones al cliente → Order invoice*:

- Añade, donde quieras que aparezca el botón, algo como:

  ```liquid
  {% if order.metafields.biothree.payphone_link != blank %}
    <p><a href="{{ order.metafields.biothree.payphone_link }}">Pagar con PayPhone</a></p>
  {% endif %}
  ```

- Considera quitar o renombrar el botón "Pagar ahora" de la plantilla: apunta
  al checkout de Shopify, donde el cliente solo vería otra vez el método
  manual.

Ajusta también las **instrucciones adicionales** del método manual (en
`ecommerce-setup.md` 3a) para decir que el enlace llega por correo.

### 7. Prueba de punta a punta

1. Con credenciales sandbox en Preview (o reales con un pedido de $1):
   hacer un pedido en el sitio con el método manual.
2. En Shopify, abrir el pedido: debe tener la etiqueta `payphone-link` y, en
   *Metafields*, el enlace. El cliente debe recibir el correo.
3. Pagar el enlace (en sandbox, con un usuario "probador" de PayPhone).
4. Esperar la notificación o el siguiente ciclo de conciliación (≤ 15 min), o
   lanzar el workflow a mano. El pedido pasa a **Pagado** con la etiqueta
   `payphone-paid`.
5. En producción, reembolsar el pedido de prueba desde PayPhone Business.

## Operación y límites

- **Enlace vencido** (cliente tarda más de 24 h): hoy no se genera uno nuevo
  solo. Cancela el pedido para liberar stock, o crea un enlace a mano en
  PayPhone Business. Si esto pasa seguido, el siguiente paso es un segundo
  intento automático (el código ya soporta el sufijo `-2` en el
  `clientTransactionId`).
- **DeUna / transferencia**: siguen siendo manuales. Al recibir el
  comprobante, *Marcar como pagado* en el pedido.
- **Montos**: PayPhone recibe el saldo pendiente exacto del pedido, con el IVA
  separado según la tasa del pedido. Si un pedido se edita después de crear el
  enlace, el monto no coincidirá y **no se marcará pagado**: revisa los logs
  de Oxygen (`amount-mismatch`) y resuélvelo a mano.
- **Límites de PayPhone**: 30 consultas por minuto. La conciliación revisa
  como máximo 25 pedidos por corrida.
- **Logs**: *Hydrogen → biothree.ec → Deployments → Logs*. Todo salto o
  rechazo se registra con el número de pedido y la razón.
