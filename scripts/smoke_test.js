/* Prueba rápida de la lógica de negocio sin navegador. */
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
const nodos = () => [];
const documento = {
  readyState: 'complete',
  documentElement: { children: nodos() },
  body: { children: nodos(), classList: { add() {}, remove() {}, toggle() {} } },
  addEventListener() {},
  querySelector() { return null; },
  getElementById() { return null; }
};
const almacenamiento = {
  datos: {},
  getItem(k) { return this.datos[k] ?? null; },
  setItem(k, v) { this.datos[k] = v; }
};
const contexto = {
  console,
  document: documento,
  window: { addEventListener() {}, matchMedia: () => ({ matches: true }) },
  localStorage: almacenamiento,
  MutationObserver: class { observe() {} },
  setTimeout: () => 0,
  setInterval: () => 0,
  clearTimeout() {},
  encodeURIComponent,
  Date,
  Intl,
  Math,
  Number,
  String,
  Array,
  Object,
  Boolean,
  JSON,
  structuredClone
};
contexto.window.document = documento;
contexto.globalThis = contexto;
vm.createContext(contexto);

vm.runInContext(
  fs.readFileSync(path.join(root, 'data.js'), 'utf8') + '\n;globalThis.__DATA={DEFAULT_MENU, BRAND};',
  contexto
);
vm.runInContext(
  fs.readFileSync(path.join(root, 'app.js'), 'utf8') + '\n;globalThis.__APP={getUnitPrice, getCartEntries, getCartTotals, makeOrderCode, buildWhatsAppMessage, state};',
  contexto
);

const { DEFAULT_MENU, BRAND } = contexto.__DATA;
const { getUnitPrice, getCartEntries, getCartTotals, makeOrderCode, buildWhatsAppMessage, state } = contexto.__APP;

const fallos = [];
const igual = (nombre, real, esperado) => {
  if (String(real) !== String(esperado)) fallos.push(`${nombre}: ${real} != ${esperado}`);
};

const pizza = DEFAULT_MENU[0];

igual('precio Margherita', getUnitPrice(pizza, 1), 18950);
igual('catálogo sin eventos', DEFAULT_MENU.some((p) => p.cat === 'eventos'), false);
igual('alias de transferencia', BRAND.transferAlias, 'tamarindo.pizzeria');

state.cart = { [pizza.id]: { qty: 2, note: 'Sin cebolla' } };
const entradas = getCartEntries();
const totales = getCartTotals(entradas);
igual('subtotal carrito', totales.subtotal, 37900);
igual('sin descuento', totales.descuento, 0);
igual('total carrito', totales.total, 37900);

igual('código pedido', /^#TAM-\d{4}$/.test(makeOrderCode()), true);

const mensaje = buildWhatsAppMessage({
  codigo: '#TAM-1234',
  nombre: 'Ana',
  telefono: '3815555555',
  modalidad: 'takeaway',
  direccion: BRAND.address,
  pago: `Transferencia (alias ${BRAND.transferAlias})`,
  nota: '',
  items: [{ name: pizza.name, qty: 2, subtotal: 37900, note: '' }],
  subtotal: 37900,
  descuento: 0,
  total: 37900
});
igual('WhatsApp usa número real', mensaje.startsWith('https://wa.me/5493813937777?'), true);
igual('WhatsApp incluye retiro', decodeURIComponent(mensaje).includes(BRAND.address), true);
igual('WhatsApp incluye forma de pago', decodeURIComponent(mensaje).includes(BRAND.transferAlias), true);
igual('WhatsApp sin evento', decodeURIComponent(mensaje).includes('Evento'), false);
igual('WhatsApp sin descuento', decodeURIComponent(mensaje).includes('Descuento'), false);

if (fallos.length) {
  console.error('Fallo(s):\n' + fallos.join('\n'));
  process.exit(1);
}
console.log('Smoke test OK: carta, carrito, retiro y forma de pago.');
