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
  fs.readFileSync(path.join(root, 'data.js'), 'utf8') + '\n;globalThis.__DATA={DEFAULT_MENU, EVENT_TIERS, BRAND};',
  contexto
);
vm.runInContext(
  fs.readFileSync(path.join(root, 'app.js'), 'utf8') + '\n;globalThis.__APP={getUnitPrice, getCartEntries, getCartTotals, makeOrderCode, buildWhatsAppMessage, state};',
  contexto
);

const { DEFAULT_MENU } = contexto.__DATA;
const { getUnitPrice, getCartEntries, getCartTotals, makeOrderCode, buildWhatsAppMessage, state } = contexto.__APP;

const fallos = [];
const igual = (nombre, real, esperado) => {
  if (String(real) !== String(esperado)) fallos.push(`${nombre}: ${real} != ${esperado}`);
};

const pizza = DEFAULT_MENU[0];
const evento = DEFAULT_MENU.find((p) => p.code === 'TAM-EV-01');

igual('precio Margherita', getUnitPrice(pizza, 1), 18950);
igual('tramo 20 invitados', getUnitPrice(evento, 20), 12500);
igual('tramo 25 invitados', getUnitPrice(evento, 25), 12500);
igual('tramo 30 invitados', getUnitPrice(evento, 30), 11500);
igual('tramo 40 invitados', getUnitPrice(evento, 40), 10500);
igual('tramo 60 invitados', getUnitPrice(evento, 60), 8500);
igual('total 30 invitados', getUnitPrice(evento, 30) * 30, 345000);

state.cart = { [evento.id]: { qty: 30, note: 'Cumpleaños' } };
const entradas = getCartEntries();
const totales = getCartTotals(entradas);
igual('subtotal carrito', totales.subtotal, 345000);
igual('sin descuento', totales.descuento, 0);
igual('total carrito', totales.total, 345000);

igual('código pedido', /^#TAM-\d{4}$/.test(makeOrderCode()), true);

const mensaje = buildWhatsAppMessage({
  codigo: '#TAM-1234',
  nombre: 'Ana',
  telefono: '3815555555',
  modalidad: 'evento',
  direccion: 'Centro',
  fecha: '2026-12-20',
  lugar: 'Casa de Ana',
  invitados: 30,
  pago: 'a coordinar',
  nota: '',
  items: [{ name: 'Evento · Solo pizza', qty: 30, subtotal: 345000, note: '' }],
  subtotal: 345000,
  total: 345000
});
igual('WhatsApp usa número real', mensaje.startsWith('https://wa.me/5493813937777?'), true);
igual('WhatsApp incluye fecha', decodeURIComponent(mensaje).includes('2026-12-20'), true);
igual('WhatsApp incluye invitados', decodeURIComponent(mensaje).includes('30'), true);
igual('WhatsApp sin descuento', decodeURIComponent(mensaje).includes('Descuento'), false);

if (fallos.length) {
  console.error('Fallo(s):\n' + fallos.join('\n'));
  process.exit(1);
}
console.log('Smoke test OK: precios por tramos, carrito y WhatsApp.');
