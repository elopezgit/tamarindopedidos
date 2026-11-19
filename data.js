// ─── CONFIGURACIÓN DE LA MARCA ─────────────────────────────────────────────
const SUPABASE_URL = 'https://koirnjsbkwqqeyusmbgq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_VuzjOCnvBEuufNsyrK8gCw_GCFPwBqL';

// Empresa nueva de Tamarindo. Nunca reutilizar el id de otra empresa/cliente.
const EMPRESA_ID = '8752abdf-f03a-4f94-881a-7801a9b105a4';

const BRAND = {
  name: 'Tamarindo',
  shortName: 'Tamarindo',
  legalName: 'Tamarindo Pizzería',
  claim: 'El sabor de lo diferente',
  description: 'Pizza napolitana en Tucumán. Masa fresca, horno napolitano y catering para eventos.',
  phone: '5493813937777',
  phoneDisplay: '+54 9 381 393 7777',
  whatsapp: '5493813937777',
  email: 'tamarindopizzeria@gmail.com',
  instagram: 'https://www.instagram.com/tamarindo.pizzeria',
  facebook: '',
  city: 'Tucumán',
  address: 'Av. Nicolás Avellaneda 575, San Miguel de Tucumán',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Av.+Nicol%C3%A1s+Avellaneda+575%2C+San+Miguel+de+Tucum%C3%A1n',
  logo: 'img/logo/tamarindo-logo.webp',
  favicon: 'img/logo/tamarindo-favicon.png',
  hours: [],
  scheduleText: 'Retiro en Av. Nicolás Avellaneda 575 · Horarios a coordinar por WhatsApp',
  delivery: 'Retiro en Av. Nicolás Avellaneda 575 · Delivery a coordinar',
  payments: ['A coordinar por WhatsApp'],
  eventService: {
    production: '3 hs de producción en vivo',
    ovens: 'Hornos tipo napolitano (los llevamos nosotros)',
    dough: 'Masa fresca, estirada y horneada en el momento',
    minGuests: 20,
    includes: [
      '1 pizza por persona, recién salida del horno',
      '3 horas de pizza en vivo durante el evento',
      'Hornos tipo napolitano y masa fresca',
      'Mayonesa saborizada para aderezar'
    ],
    extras: [
      'Panacota de frutos de estación · +$3.000 por persona',
      'Bebidas y tragos · a cotizar',
      'Servicio a la mesa (mozo adicional) · a cotizar'
    ],
    conditions: [
      'La propuesta se adapta a las necesidades de cada cliente.',
      'Los precios pueden variar según la ubicación del evento.',
      'Las variedades dependen de la disponibilidad estacional.'
    ]
  }
};

const CONTACT_CHANNELS = [
  {
    name: 'Retiro en el local',
    detail: BRAND.address,
    icon: '📍',
    url: BRAND.mapsUrl,
    linkLabel: 'Cómo llegar'
  },
  {
    name: 'WhatsApp',
    detail: BRAND.phoneDisplay,
    icon: '💬',
    url: `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent('Hola Tamarindo, quiero consultar por sus pizzas / eventos.')}`
  },
  {
    name: 'Instagram',
    detail: '@tamarindo.pizzeria',
    icon: '📷',
    url: BRAND.instagram
  },
  {
    name: 'Email',
    detail: BRAND.email,
    icon: '✉️',
    url: `mailto:${BRAND.email}`
  }
];

// Tramos de "Solo pizza" según la propuesta v4 (versión final).
const EVENT_TIERS = [
  { min: 20, price: 12500 },
  { min: 30, price: 11500 },
  { min: 40, price: 10500 },
  { min: 60, price: 8500 }
];

const DEFAULT_CATEGORIES = [
  { slug: 'clasicas', name: 'Clásicas', icon: '🍕', order: 1 },
  { slug: 'autor', name: 'De autor', icon: '✨', order: 2 },
  { slug: 'casa', name: 'De la casa', icon: '🔥', order: 3 },
  { slug: 'eventos', name: 'Eventos', icon: '🎉', order: 4 }
];

const DEFAULT_MENU = [
  {
    id: 'default-margherita',
    code: 'TAM-001',
    cat: 'clasicas',
    name: 'Margherita',
    desc: 'Pomodoro, mozzarella, albahaca fresca, aceite de oliva y un toque de orégano.',
    ingredients: 'Pomodoro, mozzarella, albahaca fresca, aceite de oliva y orégano.',
    prepDesc: 'Pizza napolitana de masa fresca, horneada en el momento en horno tipo napolitano.',
    prepTime: 'En vivo',
    price: 18950,
    image: 'img/productos/margherita.webp',
    emoji: '🍕',
    tags: ['clasica', 'vegetariana'],
    hot: true,
    rating: 5.0,
    sort: 1
  },
  {
    id: 'default-jamon-cocido',
    code: 'TAM-002',
    cat: 'clasicas',
    name: 'Jamón cocido',
    desc: 'Pomodoro, mozzarella y jamón cocido. Una clásica bien completa.',
    ingredients: 'Pomodoro, mozzarella, jamón cocido, aceite de oliva, albahaca y orégano.',
    prepDesc: 'Masa fresca estirada al momento y horneada en horno tipo napolitano.',
    prepTime: 'En vivo',
    price: 22450,
    image: 'img/productos/jamon-cocido.webp',
    emoji: '🍖',
    tags: ['clasica', 'popular'],
    hot: true,
    rating: 4.9,
    sort: 2
  },
  {
    id: 'default-queso-azul-repollo',
    code: 'TAM-003',
    cat: 'autor',
    name: 'Queso azul y repollo morado',
    desc: 'Mozzarella, queso azul y repollo morado, con un toque de pomodoro en el centro.',
    ingredients: 'Mozzarella, queso azul, repollo morado y pomodoro.',
    prepDesc: 'Masa fresca estirada al momento y horneada en horno tipo napolitano.',
    prepTime: 'En vivo',
    price: 22450,
    image: 'img/productos/queso-azul-repollo.webp',
    emoji: '💜',
    tags: ['autor', 'vegetariana'],
    hot: false,
    rating: 4.9,
    sort: 3
  },
  {
    id: 'default-zapallo-cabutia-romero',
    code: 'TAM-004',
    cat: 'autor',
    name: 'Zapallo cabutia y romero',
    desc: 'Base de zapallo cabutia, mozzarella y romero. Terminada con sal ahumada de romero.',
    ingredients: 'Zapallo cabutia, mozzarella, romero y sal ahumada de romero.',
    prepDesc: 'Masa fresca estirada al momento y horneada en horno tipo napolitano.',
    prepTime: 'En vivo',
    price: 19450,
    image: 'img/productos/zapallo-cabutia-romero.webp',
    emoji: '🎃',
    tags: ['autor', 'vegetariana'],
    hot: false,
    rating: 4.9,
    sort: 4
  },
  {
    id: 'default-pepperoni-tamarindo',
    code: 'TAM-005',
    cat: 'casa',
    name: 'Pepperoni y tamarindo',
    desc: 'Pomodoro, mozzarella, pepperoni, cebolla morada y jalea de tamarindo. La de la casa.',
    ingredients: 'Pomodoro, mozzarella, pepperoni, cebolla morada y jalea de tamarindo.',
    prepDesc: 'Masa fresca estirada al momento y horneada en horno tipo napolitano.',
    prepTime: 'En vivo',
    price: 24500,
    image: 'img/productos/pepperoni-tamarindo.webp',
    emoji: '🔥',
    tags: ['casa', 'popular', 'picante'],
    hot: true,
    rating: 5.0,
    sort: 5
  },
  {
    id: 'default-evento-solo-pizza',
    code: 'TAM-EV-01',
    cat: 'eventos',
    name: 'Evento · Solo pizza',
    desc: 'Las cinco pizzas de la carta, con masa fresca, preparadas y horneadas en el momento durante las 3 horas de producción. 1 pizza por persona.',
    ingredients: 'Margherita, jamón cocido, queso azul y repollo morado, zapallo cabutia y romero, pepperoni y tamarindo.',
    prepDesc: 'Llevamos los hornos tipo napolitano y todo el equipo. Se prepara todo en el lugar. Precio por persona según cantidad de invitados.',
    prepTime: '3 hs en vivo',
    price: 12500,
    unit: 'persona',
    minQty: 20,
    tiers: EVENT_TIERS,
    image: 'img/productos/pepperoni-detalle.webp',
    emoji: '🎉',
    tags: ['evento', 'popular'],
    hot: true,
    rating: 5.0,
    sort: 6
  },
  {
    id: 'default-evento-experiencia-completa',
    code: 'TAM-EV-02',
    cat: 'eventos',
    name: 'Evento · Experiencia completa',
    desc: 'Entrantes de estación, las cinco pizzas (2 clásicas y 3 de autor) y panacota de frutos de estación para cerrar.',
    ingredients: 'Entrantes de estación · 5 pizzas (2 clásicas y 3 de autor) · panacota de frutos de estación.',
    prepDesc: 'Llevamos los hornos tipo napolitano y todo el equipo. Precio por persona, desde 20 invitados.',
    prepTime: '3 hs en vivo',
    price: 20000,
    unit: 'persona',
    minQty: 20,
    image: 'img/productos/margherita.webp',
    emoji: '🥂',
    tags: ['evento', 'premium'],
    hot: false,
    rating: 5.0,
    sort: 7
  },
  {
    id: 'default-extra-panacota',
    code: 'TAM-EV-03',
    cat: 'eventos',
    name: 'Extra · Panacota',
    desc: 'Panacota de frutos de estación para sumar a la opción Solo pizza.',
    ingredients: 'Panacota de frutos de estación.',
    prepDesc: 'Se agrega al paquete de evento. Precio por persona.',
    prepTime: 'Extra',
    price: 3000,
    unit: 'persona',
    minQty: 20,
    image: 'img/productos/queso-azul-repollo.webp',
    emoji: '🍮',
    tags: ['evento'],
    hot: false,
    rating: 5.0,
    sort: 8
  }
];

const DEFAULT_BANNERS = [
  {
    image: 'img/banners/banner-napolitana.webp',
    title: 'Pizza napolitana',
    subtitle: 'Hecha despacio. Comida rápido.',
    link: '#menu'
  },
  {
    image: 'img/banners/banner-eventos.webp',
    title: 'Catering para eventos',
    subtitle: 'Llevamos el horno a tu evento. Pedí tu presupuesto.',
    link: `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent('Hola, quiero consultar por un evento privado.')}`
  },
  {
    image: 'img/banners/banner-sabores.webp',
    title: 'El sabor de lo diferente',
    subtitle: 'Clásicas, de autor y la de la casa.',
    link: '#menu'
  }
];

const TAG_LABELS = {
  popular: '🔥 Popular',
  premium: '⭐ Premium',
  clasica: '🍕 Clásica',
  autor: '✨ De autor',
  casa: '🔥 De la casa',
  evento: '🎉 Evento',
  picante: '🌶️ Picante',
  vegetariana: '🌿 Veggie'
};
