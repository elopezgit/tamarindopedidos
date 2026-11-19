# Tamarindo

Sitio web de pedidos y presupuestos de eventos para **Tamarindo · Pizza napolitana · Tucumán**.

## Marca

Identidad tomada del *Branding Opción 4* incluido en `infoBase/`:

- Claim: **El sabor de lo diferente** · *Hecha despacio. Comida rápido.*
- Colores: crema `#F6EBE2`, naranja `#EC681D`, rojo `#DF1517`, verde profundo `#013325`.
- Tipografías: **Covered By Your Grace** (títulos) y **Urbanist** (textos).
- El hero usa el patrón de personaje + rayo extraído del PDF, en naranja sobre verde profundo; se evitan las combinaciones que el manual marca como «NO» (verde profundo sobre naranja o rojo).
- `npm test` verifica que no reaparezcan colores ajenos a la paleta.
- Retiro de pizzas: **Av. Nicolás Avellaneda 575, San Miguel de Tucumán**.
- Contacto: WhatsApp **+54 9 381 393 7777** · `tamarindopizzeria@gmail.com` · [@tamarindo.pizzeria](https://www.instagram.com/tamarindo.pizzeria).

## Características principales

- **Portada estilo app de delivery** con hero de pizza napolitana, buscador, categorías y carrusel de banners.
- **Carta de 5 pizzas** (Margherita, Jamón cocido, Queso azul y repollo morado, Zapallo cabutia y romero, Pepperoni y tamarindo) con precios de `infoBase/infovarios.txt`.
- **Eventos privados**: Solo pizza (desde $12.500/persona según cantidad de invitados), Experiencia completa ($20.000/persona) y extra Panacota (+$3.000/persona), según el presupuesto v4 de `infoBase/`.
- **Pedidos por WhatsApp** con carrito lateral en escritorio y barra flotante en móviles. El cliente elige la forma de pago: efectivo o transferencia al alias `tamarindo.pizzeria` (copiable desde el checkout y el modal de contacto). Sin descuentos.
- **Panel de administración (`admin.html`)** para gestionar pedidos, clientes, productos, categorías, asignaciones y banners en Supabase.

> Los archivos de `infoBase/` son la fuente de verdad de la marca: PDFs de branding y presupuestos, fotos reales de las pizzas y `infovarios.txt` con los precios.

## Ejecución local

```bash
npm run dev
```

Abre automáticamente el servidor en `http://localhost:8080` (tienda en `/index.html`, panel en `/admin.html`) y recarga el navegador cuando cambian los archivos. **No requiere `npm install`**: usa un servidor propio implementado con Node, sin dependencias externas. Si el puerto 8080 está ocupado, prueba el siguiente automáticamente. Para elegir otro puerto: `node scripts/dev_server.js 3000`.

Verificación rápida:

```bash
npm test
```

## Assets

Los recursos de marca (`img/logo`, `img/productos`, `img/banners`) se generan con:

```bash
python scripts/prepare_assets.py
```

El script extrae el logo con fondo transparente del PDF de branding, convierte las fotos de WhatsApp a WebP y compone los banners con la paleta oficial.

## Base de datos

El proyecto usa un proyecto Supabase multi-empresa. `EMPRESA_ID` en `data.js` identifica de forma exclusiva a Tamarindo. **No modificar ni reutilizar el `empresa_id` de otros negocios**: todo catálogo y pedido se filtra por ese identificador. Para cargar el catálogo inicial, usar los botones *Cargar categorías base*, *Cargar productos base* y *Cargar banners base* del panel de administración.
