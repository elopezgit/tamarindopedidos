/* Verificación estática rápida: imágenes referenciadas y IDs del DOM. */
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const archivos = ['index.html', 'admin.html', 'data.js', 'app.js', 'admin.js', 'styles.css', 'admin.css'];
const textos = Object.fromEntries(archivos.map((f) => [f, fs.readFileSync(path.join(root, f), 'utf8')]));
const todo = Object.values(textos).join('\n');

let errores = 0;

// Imágenes locales referenciadas en HTML/JS/CSS.
const rutas = new Set([...todo.matchAll(/["'(](img\/[^"'\s)]+\.(?:webp|png|jpeg|jpg))["')]/g)].map((m) => m[1]));
for (const ruta of rutas) {
  if (!fs.existsSync(path.join(root, ruta))) {
    console.error(`Falta imagen: ${ruta}`);
    errores += 1;
  }
}

// IDs creados dinámicamente por plantillas JS (no están en el HTML estático).
const dinamicos = new Set([
  'pmMinusBtn', 'pmPlusBtn', 'pmAddBtn', 'pmQty', 'successContinueBtn',
  'modalImageUrlInput', 'modalImagePreview', 'modalCategoryIcon',
  'modalBannerLinkInput', 'modalProductCashPreview', 'modalCategorySlug'
]);

// IDs usados por app.js que deben existir en index.html.
const html = textos['index.html'];
const idsApp = [...textos['app.js'].matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
for (const id of new Set(idsApp)) {
  if (!dinamicos.has(id) && !html.includes(`id="${id}"`)) {
    console.error(`ID ausente en index.html: ${id}`);
    errores += 1;
  }
}

// IDs usados por admin.js que deben existir en admin.html.
const htmlAdmin = textos['admin.html'];
const idsAdmin = [...textos['admin.js'].matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
for (const id of new Set(idsAdmin)) {
  if (!dinamicos.has(id) && !htmlAdmin.includes(`id="${id}"`)) {
    console.error(`ID ausente en admin.html: ${id}`);
    errores += 1;
  }
}

// Marcas viejas prohibidas en código.
const prohibidas = [/'1460pizzas'/, /Pizzas LPH/i, /Listas para hornear/i, /10% OFF/i, /freezer/i, /muzzarella.webp/i, /1460-logo/i];
for (const patron of prohibidas) {
  if (patron.test(todo)) {
    console.error(`Queda texto antiguo: ${patron}`);
    errores += 1;
  }
}

// Colores que no pertenecen a la paleta oficial (crema/naranja/rojo/verde).
const css = textos['styles.css'] + textos['admin.css'];
const coloresProhibidos = [
  /#e51937/i, /#ff1f40/i, /#ff2947/i, /#12b886/i, /#4ade80/i, /#20c997/i,
  /#3b82f6/i, /#fde047/i, /#18181b/i, /#141210/i, /#c8102e/i, /#99081f/i,
  /#08080a/i, /#fffaf2/i, /rgba\(255,\s*255,\s*255/i, /rgba\(0,\s*0,\s*0/i,
  /rgba\(229,\s*25,\s*55/i
];
for (const patron of coloresProhibidos) {
  if (patron.test(css)) {
    console.error(`Color fuera de paleta: ${patron}`);
    errores += 1;
  }
}

console.log(errores ? `Verificación fallida: ${errores} problema(s)` : `Verificación OK: ${rutas.size} imágenes, ${new Set(idsApp).size} IDs de tienda y ${new Set(idsAdmin).size} IDs de panel.`);
process.exit(errores ? 1 : 0);
