/* Servidor de desarrollo sin dependencias externas.
 * Uso: npm run dev  (o: node scripts/dev_server.js 3000)
 * Recarga automáticamente el navegador cuando cambian los archivos.
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PUERTO_INICIAL = Number(process.argv[2] || process.env.PORT || 8080);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf'
};

const clients = new Set();

function notificarRecarga() {
  for (const res of clients) {
    try {
      res.write('data: reload\n\n');
    } catch {
      clients.delete(res);
    }
  }
}

function vigilarCambios() {
  const objetivos = [
    'index.html', 'admin.html', 'styles.css', 'admin.css',
    'data.js', 'app.js', 'admin.js', 'package.json',
    'img', 'infoBase'
  ];

  for (const nombre of objetivos) {
    const ruta = path.join(ROOT, nombre);
    if (!fs.existsSync(ruta)) continue;
    try {
      fs.watch(ruta, { recursive: true }, () => notificarRecarga());
    } catch {
      // En algunos sistemas no se puede watch recursivo; se vigila la carpeta raíz.
      fs.watch(ROOT, () => notificarRecarga());
    }
  }
}

const SCRIPT_RECARGA = `<script>
(function () {
  try {
    var fuente = new EventSource('/__reload');
    fuente.onmessage = function () { location.reload(); };
  } catch (e) {}
})();
</script>`;

function resolverArchivo(url) {
  let rutaUrl;
  try {
    rutaUrl = decodeURIComponent(url.split('?')[0]);
  } catch {
    return null;
  }
  if (rutaUrl === '/' || rutaUrl === '') rutaUrl = '/index.html';

  const destino = path.resolve(ROOT, '.' + rutaUrl);
  // No permitir salir de la carpeta del proyecto.
  if (!destino.startsWith(ROOT + path.sep) && destino !== path.join(ROOT, 'index.html')) return null;
  return destino;
}

function servir(req, res) {
  if (req.url.startsWith('/__reload')) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });
    res.write(': conectado\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  const archivo = resolverArchivo(req.url);
  if (!archivo) {
    res.writeHead(403).end('Acceso denegado');
    return;
  }

  fs.stat(archivo, (error, stats) => {
    if (error || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado: ' + req.url);
      return;
    }

    const extension = path.extname(archivo).toLowerCase();
    const tipo = TIPOS[extension] || 'application/octet-stream';
    const cabeceras = {
      'Content-Type': tipo,
      'Cache-Control': 'no-store'
    };

    if (extension === '.html') {
      fs.readFile(archivo, 'utf8', (err, contenido) => {
        if (err) {
          res.writeHead(500).end('Error al leer el archivo');
          return;
        }
        const conRecarga = contenido.replace(/<\/body>/i, SCRIPT_RECARGA + '</body>');
        res.writeHead(200, cabeceras).end(conRecarga);
      });
      return;
    }

    res.writeHead(200, cabeceras);
    fs.createReadStream(archivo).pipe(res);
  });
}

function iniciar(puerto, intentos = 0) {
  const servidor = http.createServer(servir);
  servidor.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && intentos < 10) {
      iniciar(puerto + 1, intentos + 1);
      return;
    }
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  });
  servidor.listen(puerto, () => {
    vigilarCambios();
    console.log(`\n  Tamarindo listo en http://localhost:${puerto}`);
    console.log('  Tienda:  http://localhost:' + puerto + '/index.html');
    console.log('  Panel:   http://localhost:' + puerto + '/admin.html');
    console.log('  (Ctrl+C para detener)\n');
  });
}

iniciar(PUERTO_INICIAL);
