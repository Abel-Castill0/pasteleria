# Alma & Azúcar — Web app para pastelera independiente

Proyecto full-stack sin dependencias externas de npm. Está pensado para una pastelera que trabaja **por encargo desde casa**, no para una tienda física abierta al público.

## Qué incluye

- Inicio profesional y responsive.
- Catálogo de tortas, cupcakes y postres con filtros.
- Carrito persistente con `localStorage`.
- Checkout de solicitud (no cobra automáticamente).
- Formulario guiado de pastel personalizado en 4 pasos.
- Estimador de precio orientativo según porciones, relleno, cobertura y complejidad.
- Carga de una foto de referencia (JPG/PNG/WEBP, hasta 1.5 MB).
- API de productos y API de pedidos.
- Persistencia local de pedidos en `data/orders.json`.
- Galería, página de la pastelera, FAQ, contacto y políticas.
- Enlace final a WhatsApp con resumen e ID del pedido.
- 404 personalizada, `robots.txt`, sitemap de ejemplo y manifest.
- Seguridad básica: validación de inputs, límite de payload, headers CSP, no publicación de dirección residencial.
- Accesibilidad: skip link, labels, estados ARIA, foco visible y `prefers-reduced-motion`.

## Ejecutar

Necesitas Node.js 18 o superior.

```bash
npm start
```

Luego abre:

```text
http://localhost:3000
```

No abras los HTML con doble clic, porque el catálogo y los pedidos usan la API local.

## Personalización rápida

### 1. Marca y contacto

Edita `public/assets/config.js`:

- `brand`
- `tagline`
- `whatsapp`
- `whatsappDisplay`
- `instagram`
- `instagramUrl`
- `serviceArea`
- `pickupText`
- `minCustomLeadDays`

### 2. Productos

Edita `data/products.json` para cambiar:

- nombre
- categoría
- precio
- porciones
- tiempo de anticipación
- descripción
- foto

### 3. Precios del configurador

Los valores del estimador están en dos lugares y deben mantenerse sincronizados:

- `server.js` → función `estimatedCustomPrice()` (fuente real al guardar el pedido)
- `public/assets/custom-order.js` → función `calculateEstimate()` (vista inmediata del cliente)

En una versión de producción conviene exponer esta configuración desde la API para tener una sola fuente de verdad.

### 4. Fotos

Las fotos actuales son **muestras de Unsplash**. Antes de publicar, reemplázalas por fotos reales de la pastelera. Esto aumenta confianza y evita que el cliente espere diseños que no pertenecen a su portafolio.

### 5. Textos legales y operativos

Revisar antes de publicar:

- porcentaje/monto de adelanto
- cancelaciones y devoluciones
- cambios de fecha o diseño
- zonas y tarifa de delivery
- tiempos reales de anticipación
- alergias y contaminación cruzada
- métodos de pago
- horarios de atención por WhatsApp

## API

### `GET /api/products`
Devuelve el catálogo.

### `GET /api/availability?date=YYYY-MM-DD`
Devuelve disponibilidad simple según una capacidad demo de 4 pedidos por fecha.

### `POST /api/orders`
Registra pedidos de catálogo o personalizados y devuelve un ID tipo `AA-YYYYMMDD-XXXXXX`.

## Estructura

```text
almayazucar_webapp/
├─ data/
│  ├─ orders.json
│  └─ products.json
├─ public/
│  ├─ assets/
│  │  ├─ app.js
│  │  ├─ catalog.js
│  │  ├─ config.js
│  │  ├─ custom-order.js
│  │  ├─ logo.svg
│  │  └─ styles.css
│  ├─ 404.html
│  ├─ catalogo.html
│  ├─ contacto.html
│  ├─ galeria.html
│  ├─ index.html
│  ├─ nosotros.html
│  ├─ personaliza.html
│  ├─ manifest.webmanifest
│  ├─ robots.txt
│  └─ sitemap.xml
├─ package.json
├─ README.md
└─ server.js
```

## Para producción

Esta versión es una base funcional completa para demo/validación. Para escalar a un negocio con mayor volumen recomiendo:

1. PostgreSQL/MySQL en lugar de JSON.
2. Panel privado de administración con autenticación robusta.
3. Cloudinary/S3 para fotos de referencia.
4. Email/WhatsApp API para confirmaciones automáticas.
5. Calendario de capacidad por día y franjas horarias.
6. Pago de adelanto por pasarela o Yape/Plin verificado.
7. Dominio propio, HTTPS, backups y monitoreo.
8. Fotos reales optimizadas en WebP/AVIF.
9. Analítica respetuosa con privacidad y Search Console.
10. Configuración real de sitemap/canonical/OG antes de indexar.

## Nota de negocio

El sitio evita publicar una dirección residencial porque el emprendimiento funciona desde casa. La ubicación exacta de recojo debe compartirse únicamente con pedidos confirmados.
