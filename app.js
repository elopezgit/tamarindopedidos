'use strict';

/* ─── Tamarindo · WebApp Mobile-First de Pedidos ────────────────────────── */

const CART_KEY = 'tamarindo_cart';
const CUSTOMER_KEY = 'tamarindo_customer';
const THEME_KEY = 'tamarindo_theme_light_v1';
const LAST_ORDER_KEY = 'tamarindo_last_order';

const state = {
  categories: clone(DEFAULT_CATEGORIES),
  menu: clone(DEFAULT_MENU),
  banners: clone(DEFAULT_BANNERS),
  cart: loadJSON(CART_KEY, {}),
  customer: loadJSON(CUSTOMER_KEY, {}),
  currentCat: 'todos',
  search: '',
  deliveryMode: 'delivery',
  modalProductId: null,
  modalQty: 1,
  lastOrder: loadJSON(LAST_ORDER_KEY, null),
  supabase: null,
  toastTimer: null
};

if (state.customer.deliveryMode === 'takeaway' || state.customer.deliveryMode === 'evento') {
  state.deliveryMode = state.customer.deliveryMode;
}

/* ─── ARRANQUE ───────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', init);

function init() {
  document.body.classList.add('js-ready');
  initTheme();
  bindEvents();
  hydrateCustomerForm();
  renderCategories();
  renderBanners();
  renderMenu();
  renderContactChannels();
  renderStoreInfo();
  renderEventInfo();
  renderCart();
  renderStoreStatus();
  applyDeliveryMode(state.deliveryMode, false);
  setFooterYear();
  hideSplash();
  loadFromSupabase();
  setInterval(renderStoreStatus, 60_000);
}

function hideSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;
  const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 120 : 450;
  setTimeout(() => {
    splash.classList.add('is-hidden');
    setTimeout(() => splash.remove(), 450);
  }, delay);
}

/* ─── EVENTOS ────────────────────────────────────────────────────────────── */

function bindEvents() {
  document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);
  document.getElementById('cartOpenBtn')?.addEventListener('click', openCart);
  document.getElementById('sideOpenCheckoutBtn')?.addEventListener('click', openCart);
  document.getElementById('mobileCartTrigger')?.addEventListener('click', openCart);
  document.getElementById('cartCloseBtn')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
  document.getElementById('cartGoMenuBtn')?.addEventListener('click', () => {
    closeCart();
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('openInfoModalBtn')?.addEventListener('click', openInfoModal);
  document.getElementById('storeInfoCardBtn')?.addEventListener('click', openInfoModal);
  document.getElementById('footerInfoBtn')?.addEventListener('click', openInfoModal);
  document.getElementById('infoModalClose')?.addEventListener('click', closeInfoModal);
  document.getElementById('infoModalOverlay')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeInfoModal();
  });

  document.getElementById('menuSearch')?.addEventListener('input', (event) => {
    state.search = event.target.value.trim();
    renderMenu();
  });

  const handleCategoryClick = (event, shouldScroll = false) => {
    const button = event.target.closest('[data-cat]');
    if (!button) return;
    state.currentCat = button.dataset.cat;
    renderCategories();
    renderMenu();
    if (shouldScroll) {
      document.getElementById('catalogStickyBar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  document.getElementById('categoryFilters')?.addEventListener('click', (e) => handleCategoryClick(e, false));
  document.getElementById('heroQuickCategories')?.addEventListener('click', (e) => handleCategoryClick(e, true));
  document.getElementById('bentoCategoriesGrid')?.addEventListener('click', (e) => handleCategoryClick(e, true));

  document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
    state.currentCat = 'todos';
    state.search = '';
    const search = document.getElementById('menuSearch');
    if (search) search.value = '';
    renderCategories();
    renderMenu();
  });

  document.getElementById('productGrid')?.addEventListener('click', handleProductGridClick);
  document.getElementById('productGrid')?.addEventListener('keydown', handleProductGridKeydown);
  document.getElementById('cartItems')?.addEventListener('click', handleCartClick);
  document.getElementById('cartItems')?.addEventListener('input', handleCartNoteInput);
  document.getElementById('sideCartItems')?.addEventListener('click', handleCartClick);

  document.getElementById('deliveryToggle')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-mode]');
    if (!button) return;
    applyDeliveryMode(button.dataset.mode);
  });

  document.getElementById('sideDeliveryToggle')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-mode]');
    if (!button) return;
    applyDeliveryMode(button.dataset.mode);
  });

  ['fNombre', 'fTel', 'fDir', 'fNota', 'fFecha', 'fLugar', 'fInvitados'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', saveCustomerDraft);
    document.getElementById(id)?.addEventListener('change', saveCustomerDraft);
  });

  document.getElementById('checkoutForm')?.addEventListener('submit', submitOrder);

  document.getElementById('productModalClose')?.addEventListener('click', closeProductModal);
  document.getElementById('productModalOverlay')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeProductModal();
  });

  document.getElementById('successCloseBtn')?.addEventListener('click', closeSuccessModal);
  document.getElementById('successOverlay')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeSuccessModal();
  });

  document.addEventListener('keydown', handleEscape);
  window.addEventListener('scroll', onScroll, { passive: true });
}

function handleProductGridClick(event) {
  const addButton = event.target.closest('[data-add]');
  if (addButton) {
    event.preventDefault();
    event.stopPropagation();
    addToCart(addButton.dataset.add, 1);
    return;
  }

  const minusButton = event.target.closest('[data-card-minus]');
  if (minusButton) {
    event.preventDefault();
    event.stopPropagation();
    changeCartQty(minusButton.dataset.cardMinus, -1);
    return;
  }

  const plusButton = event.target.closest('[data-card-plus]');
  if (plusButton) {
    event.preventDefault();
    event.stopPropagation();
    changeCartQty(plusButton.dataset.cardPlus, 1);
    return;
  }

  const card = event.target.closest('[data-product-id]');
  if (card) openProductModal(card.dataset.productId);
}

function handleProductGridKeydown(event) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const card = event.target.closest('[data-product-id]');
  if (!card || event.target.closest('button')) return;
  event.preventDefault();
  openProductModal(card.dataset.productId);
}

function handleCartClick(event) {
  const minus = event.target.closest('[data-cart-minus]');
  if (minus) {
    changeCartQty(minus.dataset.cartMinus, -1);
    return;
  }
  const plus = event.target.closest('[data-cart-plus]');
  if (plus) {
    changeCartQty(plus.dataset.cartPlus, 1);
    return;
  }
  const remove = event.target.closest('[data-cart-remove]');
  if (remove) removeFromCart(remove.dataset.cartRemove);
}

function handleCartNoteInput(event) {
  const input = event.target.closest('[data-note-id]');
  if (!input) return;
  const id = input.dataset.noteId;
  if (!state.cart[id]) return;
  state.cart[id].note = input.value.trim();
  saveCart();
}

function handleEscape(event) {
  if (event.key !== 'Escape') return;
  if (!document.getElementById('successOverlay')?.hidden) {
    closeSuccessModal();
    return;
  }
  if (!document.getElementById('productModalOverlay')?.hidden) {
    closeProductModal();
    return;
  }
  if (!document.getElementById('infoModalOverlay')?.hidden) {
    closeInfoModal();
    return;
  }
  if (document.getElementById('cartDrawer')?.classList.contains('is-open')) closeCart();
}

function onScroll() {
  document.getElementById('siteHeader')?.classList.toggle('is-scrolled', window.scrollY > 8);
}

/* ─── TEMA ───────────────────────────────────────────────────────────────── */

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved === 'dark' ? 'dark' : 'light');
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem(THEME_KEY, theme);
  const button = document.getElementById('themeToggleBtn');
  if (button) {
    button.querySelector('span').textContent = theme === 'dark' ? '☀️' : '🌙';
    button.setAttribute('aria-label', theme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro');
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#013325' : '#EC681D';
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

/* ─── ESTADO DEL LOCAL ───────────────────────────────────────────────────── */

function renderStoreStatus() {
  const wrap = document.getElementById('storeStatus');
  const text = document.getElementById('storeStatusText');
  if (!wrap || !text) return;
  wrap.classList.add('is-open');
  wrap.classList.remove('is-closed');
  text.textContent = 'Consultanos por WhatsApp';
}

/* ─── CATEGORÍAS Y PROMOS ────────────────────────────────────────────────── */

function renderCategories() {
  const container = document.getElementById('categoryFilters');
  const heroQuick = document.getElementById('heroQuickCategories');
  const bentoGrid = document.getElementById('bentoCategoriesGrid');

  const categories = [...state.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
  const total = state.menu.length;

  if (state.currentCat !== 'todos' && !categories.some((cat) => cat.slug === state.currentCat)) {
    state.currentCat = 'todos';
  }

  const activeCategories = categories.filter((cat) => state.menu.some((item) => item.cat === cat.slug));

  if (container) {
    const buttons = [
      `<button type="button" class="filter-chip ${state.currentCat === 'todos' ? 'active' : ''}" data-cat="todos">🍽️ Todo <em>${total}</em></button>`
    ];

    activeCategories.forEach((cat) => {
      const count = state.menu.filter((item) => item.cat === cat.slug).length;
      buttons.push(
        `<button type="button" class="filter-chip ${state.currentCat === cat.slug ? 'active' : ''}" data-cat="${escapeAttr(cat.slug)}">${escapeHTML(cat.icon || '🍕')} ${escapeHTML(cat.name)} <em>${count}</em></button>`
      );
    });

    container.innerHTML = buttons.join('');
  }

  if (heroQuick) {
    const badgeLabels = [
      { top: 'MASA', main: 'FRESCA', sub: '⭐' },
      { top: 'HORNO', main: 'NAP.', sub: '🔥' },
      { top: 'EVENTOS', main: '3 HS', sub: 'EN VIVO' },
      { top: 'TUCUMÁN', main: '🍕', sub: 'HECHA' }
    ];

    heroQuick.innerHTML = activeCategories.map((cat, idx) => {
      const badge = badgeLabels[idx % badgeLabels.length];
      const isSelected = state.currentCat === cat.slug;
      return `
        <button type="button" class="py-glass-card ${isSelected ? 'is-active' : ''}" data-cat="${escapeAttr(cat.slug)}">
          <span class="py-star-badge" aria-hidden="true">
            <small>${badge.top}</small>
            <strong>${badge.main}</strong>
            <em>${badge.sub}</em>
          </span>
          <span class="py-glass-label">${escapeHTML(cat.name)}</span>
        </button>
      `;
    }).join('');
  }

  if (bentoGrid) {
    const fallbackImages = {
      clasicas: 'img/productos/margherita.webp',
      autor: 'img/productos/queso-azul-repollo.webp',
      casa: 'img/productos/pepperoni-tamarindo.webp',
      eventos: 'img/productos/pepperoni-detalle.webp'
    };

    bentoGrid.innerHTML = activeCategories.map((cat, idx) => {
      const firstProduct = state.menu.find((item) => item.cat === cat.slug && item.image);
      const imgSrc = firstProduct?.image || fallbackImages[cat.slug] || 'img/productos/margherita.webp';
      const isFeatured = idx < 2;
      const isSelected = state.currentCat === cat.slug;
      return `
        <button type="button" class="py-bento-card ${isFeatured ? 'is-large' : 'is-compact'} ${isSelected ? 'is-active' : ''}" data-cat="${escapeAttr(cat.slug)}">
          ${idx === 0 ? '<span class="py-bento-pill"><strong>Tamarindo</strong> <em>Napolitana</em></span>' : ''}
          <div class="py-bento-media">
            <img src="${escapeAttr(imgSrc)}" alt="${escapeAttr(cat.name)}" loading="lazy" onerror="this.src='img/productos/margherita.webp'">
          </div>
          <span class="py-bento-title">${escapeHTML(cat.name)}</span>
        </button>
      `;
    }).join('');
  }
}

function renderBanners() {
  const container = document.getElementById('promoGrid');
  const dotsContainer = document.getElementById('promoDots');
  if (!container) return;

  if (state.bannerTimer) {
    clearInterval(state.bannerTimer);
    state.bannerTimer = null;
  }

  const banners = [...state.banners].sort((a, b) => (a.sort || 0) - (b.sort || 0));
  if (!banners.length) {
    container.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';
    return;
  }

  const count = banners.length;
  const loopSets = count > 1 ? 3 : 1;
  const loopedBanners = [];
  for (let s = 0; s < loopSets; s += 1) {
    banners.forEach((banner, idx) => {
      loopedBanners.push({ banner, realIndex: idx, setIndex: s });
    });
  }

  const badges = ['🍕 Napolitana', '🎉 Eventos', '✨ De autor'];

  container.innerHTML = loopedBanners.map(({ banner, realIndex }, domIndex) => {
    const link = banner.link || '#menu';
    const external = /^https?:\/\//i.test(link);
    const attrs = external ? ' target="_blank" rel="noopener"' : '';
    const kicker = badges[realIndex % badges.length];
    return `
      <a class="promo-card" data-banner-dom-index="${domIndex}" data-banner-real-index="${realIndex}" href="${escapeAttr(link)}"${attrs}
        style="background-image:url('${escapeAttr(banner.image || '')}')">
        <div class="promo-content">
          <span class="promo-kicker">${escapeHTML(kicker)}</span>
          <h3>${escapeHTML(banner.title || 'Nuestra pizza')}</h3>
          <p>${escapeHTML(banner.subtitle || 'Elegí tus favoritas y pedí online.')}</p>
        </div>
      </a>
    `;
  }).join('');

  if (dotsContainer) {
    dotsContainer.innerHTML = count > 1
      ? banners.map((_, idx) => `<button type="button" class="promo-dot ${idx === 0 ? 'is-active' : ''}" data-promo-dot="${idx}" aria-label="Ver banner ${idx + 1}"></button>`).join('')
      : '';
  }

  if (count <= 1) return;
  initInfiniteBannerCarousel(container, dotsContainer, count);
}

function initInfiniteBannerCarousel(container, dotsContainer, count) {
  let currentDomIndex = count;
  let isPaused = false;
  let normalizeTimeout = null;
  let scrollDebounce = null;

  const getCards = () => Array.from(container.querySelectorAll('.promo-card'));

  const getCardStepWidth = () => {
    const cards = getCards();
    if (cards.length < 2) return cards[0]?.offsetWidth || 280;
    return cards[1].offsetLeft - cards[0].offsetLeft;
  };

  const updateDots = (realIdx) => {
    if (!dotsContainer) return;
    const normalized = ((realIdx % count) + count) % count;
    dotsContainer.querySelectorAll('.promo-dot').forEach((dot, idx) => {
      dot.classList.toggle('is-active', idx === normalized);
    });
  };

  const jumpInstantTo = (domIndex) => {
    const step = getCardStepWidth();
    if (!step) return;
    currentDomIndex = domIndex;
    container.style.scrollBehavior = 'auto';
    container.scrollLeft = domIndex * step;
    container.style.scrollBehavior = '';
    updateDots(domIndex % count);
  };

  const normalizeLoopPosition = () => {
    const step = getCardStepWidth();
    if (!step) return;
    const approxIndex = Math.round(container.scrollLeft / step);
    currentDomIndex = approxIndex;
    updateDots(currentDomIndex % count);

    if (currentDomIndex >= count * 2 || currentDomIndex < count) {
      const wrappedReal = ((currentDomIndex % count) + count) % count;
      jumpInstantTo(count + wrappedReal);
    }
  };

  const stepNextBanner = () => {
    if (isPaused || document.hidden) return;
    const step = getCardStepWidth();
    if (!step) return;

    currentDomIndex += 1;
    container.scrollTo({ left: currentDomIndex * step, behavior: 'smooth' });
    updateDots(currentDomIndex % count);

    clearTimeout(normalizeTimeout);
    normalizeTimeout = setTimeout(normalizeLoopPosition, 520);
  };

  requestAnimationFrame(() => jumpInstantTo(count));

  if (!container.dataset.carouselBound) {
    container.dataset.carouselBound = '1';

    container.addEventListener('pointerenter', () => { isPaused = true; });
    container.addEventListener('pointerleave', () => { isPaused = false; });
    container.addEventListener('touchstart', () => { isPaused = true; }, { passive: true });
    container.addEventListener('touchend', () => {
      setTimeout(() => { isPaused = false; }, 1200);
    }, { passive: true });

    container.addEventListener('scroll', () => {
      clearTimeout(scrollDebounce);
      scrollDebounce = setTimeout(() => {
        if (!isPaused) return;
        normalizeLoopPosition();
      }, 150);
    }, { passive: true });

    dotsContainer?.addEventListener('click', (event) => {
      const dot = event.target.closest('[data-promo-dot]');
      if (!dot) return;
      const targetReal = Number(dot.dataset.promoDot || 0);
      const step = getCardStepWidth();
      if (!step) return;
      currentDomIndex = count + targetReal;
      container.scrollTo({ left: currentDomIndex * step, behavior: 'smooth' });
      updateDots(targetReal);
    });
  }

  state.bannerTimer = setInterval(stepNextBanner, 3500);
}

/* ─── CONTACTO E INFO DE EVENTOS ─────────────────────────────────────────── */

function renderContactChannels() {
  const grid = document.getElementById('contactGrid');
  if (!grid) return;

  const canales = Array.isArray(CONTACT_CHANNELS) ? CONTACT_CHANNELS : [];
  grid.innerHTML = canales.map((canal) => {
    const external = /^https?:\/\//i.test(canal.url);
    const attrs = external ? ' target="_blank" rel="noopener"' : '';
    return `
      <article class="pickup-card">
        <span class="pickup-icon" aria-hidden="true">${escapeHTML(canal.icon || '📍')}</span>
        <div>
          <h3>${escapeHTML(canal.name)}</h3>
          <p>${escapeHTML(canal.detail)}</p>
          <div class="pickup-links">
            <a href="${escapeAttr(canal.url)}"${attrs}>${escapeHTML(canal.linkLabel || `Abrir ${canal.name}`)}</a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderStoreInfo() {
  const address = BRAND.address || '';
  const shortAddress = address.split(',')[0] || 'Tucumán';

  const headerText = document.getElementById('headerLocationText');
  if (headerText) headerText.textContent = `${shortAddress} · ${BRAND.city}`;

  const footerText = document.getElementById('footerAddressText');
  if (footerText) footerText.textContent = address;

  const modalAddress = document.getElementById('storeAddressText');
  if (modalAddress) modalAddress.textContent = address || 'A coordinar por WhatsApp';

  const mapsLink = document.getElementById('storeMapsLink');
  if (mapsLink && BRAND.mapsUrl) mapsLink.href = BRAND.mapsUrl;

  const phoneText = document.getElementById('storePhoneText');
  if (phoneText) phoneText.textContent = BRAND.phoneDisplay || BRAND.whatsapp;
}

function renderEventInfo() {
  const list = document.getElementById('eventInfoList');
  if (!list) return;
  const service = BRAND.eventService || {};
  const items = [
    ...(service.includes || []),
    ...(service.extras || []),
    ...(service.conditions || [])
  ];
  list.innerHTML = items.map((item) => `<li>${escapeHTML(item)}</li>`).join('');
}

function openInfoModal() {
  const overlay = document.getElementById('infoModalOverlay');
  if (overlay) overlay.hidden = false;
  syncBodyScroll();
}

function closeInfoModal() {
  const overlay = document.getElementById('infoModalOverlay');
  if (overlay) overlay.hidden = true;
  syncBodyScroll();
}

/* ─── MENÚ ESTILO PEDIDOSYA ──────────────────────────────────────────────── */

function renderMenu() {
  const grid = document.getElementById('productGrid');
  const empty = document.getElementById('menuEmpty');
  if (!grid) return;

  const query = normalize(state.search);
  const filtered = state.menu
    .filter((item) => state.currentCat === 'todos' || item.cat === state.currentCat)
    .filter((item) => {
      if (!query) return true;
      const haystack = normalize(`${item.name} ${item.desc} ${item.ingredients} ${(item.tags || []).join(' ')}`);
      return haystack.includes(query);
    })
    .sort((a, b) => (a.sort || 0) - (b.sort || 0));

  if (filtered.length === 0) {
    grid.innerHTML = '';
    grid.hidden = true;
    if (empty) empty.hidden = false;
    return;
  }

  grid.hidden = false;
  if (empty) empty.hidden = true;

  if (state.currentCat === 'todos' && !query) {
    const categories = [...state.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
    const sectionsHTML = [];

    categories.forEach((cat) => {
      const catItems = filtered.filter((item) => item.cat === cat.slug);
      if (!catItems.length) return;
      sectionsHTML.push(`
        <div class="menu-category-group" id="cat-${escapeAttr(cat.slug)}">
          <div class="menu-group-header">
            <h3>${escapeHTML(cat.icon || '🍕')} ${escapeHTML(cat.name)}</h3>
            <span>${catItems.length}</span>
          </div>
          <div class="menu-cards-grid">
            ${catItems.map(productCardHTML).join('')}
          </div>
        </div>
      `);
    });

    const knownSlugs = new Set(categories.map((c) => c.slug));
    const otherItems = filtered.filter((item) => !knownSlugs.has(item.cat));
    if (otherItems.length) {
      sectionsHTML.push(`
        <div class="menu-category-group">
          <div class="menu-group-header">
            <h3>🍕 Otras variedades</h3>
            <span>${otherItems.length}</span>
          </div>
          <div class="menu-cards-grid">
            ${otherItems.map(productCardHTML).join('')}
          </div>
        </div>
      `);
    }

    grid.innerHTML = sectionsHTML.join('');
    return;
  }

  const title = query
    ? `🔎 Resultados para "${escapeHTML(state.search)}"`
    : `${categoryIcon(state.currentCat)} ${categoryName(state.currentCat)}`;

  grid.innerHTML = `
    <div class="menu-category-group">
      <div class="menu-group-header">
        <h3>${title}</h3>
        <span>${filtered.length}</span>
      </div>
      <div class="menu-cards-grid">
        ${filtered.map(productCardHTML).join('')}
      </div>
    </div>
  `;
}

function getTiers(product) {
  if (Array.isArray(product?.tiers) && product.tiers.length) return product.tiers;
  if (product?.code === 'TAM-EV-01') return EVENT_TIERS;
  return null;
}

function getUnitPrice(product, qty = 1) {
  const base = Number(product?.price || 0);
  const tiers = getTiers(product);
  if (!tiers) return base;
  const cantidad = Math.max(1, Number(qty) || 1);
  let precio = Number(tiers[0].price || base);
  tiers.forEach((tramo) => {
    if (cantidad >= Number(tramo.min)) precio = Number(tramo.price);
  });
  return precio;
}

function productCardHTML(product) {
  const image = product.image || fallbackImage(product.cat);
  const rating = Number(product.rating || 5).toFixed(1);
  const inCartQty = Number(state.cart[product.id]?.qty || 0);
  const isPerPerson = productUnit(product) === 'persona';
  const tiers = getTiers(product);
  const price = tiers ? Number(tiers[0].price) : Number(product.price || 0);
  const minQty = Math.max(1, Number(product.minQty || 1));

  const badgeHTML = product.hot
    ? '<span class="py-badge py-badge-hot">🔥 Popular</span>'
    : `<span class="py-badge py-badge-cat">${escapeHTML(categoryName(product.cat))}</span>`;

  const actionControl = inCartQty > 0
    ? `
      <div class="card-stepper" role="group" aria-label="Cantidad en el pedido">
        <button type="button" class="card-step-btn" data-card-minus="${escapeAttr(product.id)}" aria-label="Restar">−</button>
        <span class="card-step-qty">${inCartQty}</span>
        <button type="button" class="card-step-btn" data-card-plus="${escapeAttr(product.id)}" aria-label="Sumar">+</button>
      </div>
    `
    : `
      <button class="add-btn" type="button" data-add="${escapeAttr(product.id)}"
        aria-label="Agregar ${escapeAttr(product.name)} al pedido">+</button>
    `;

  const priceLabel = tiers
    ? `Desde <strong>${formatPrice(price)}</strong> / persona`
    : formatPrice(price);

  return `
    <article class="product-card ${inCartQty > 0 ? 'in-cart' : ''}" data-product-id="${escapeAttr(product.id)}" tabindex="0" role="button"
      aria-label="Ver detalle de ${escapeAttr(product.name)}">
      <div class="product-body">
        <div class="product-top-meta">
          ${badgeHTML}
          <span class="product-rating">⭐ ${rating}</span>
        </div>
        <h3 class="product-name">${escapeHTML(product.name)}</h3>
        <p class="product-desc">${escapeHTML(product.desc)}</p>
        <div class="product-footer">
          <div class="product-price-block">
            <div class="price-main-row">
              <span class="product-price">${priceLabel}</span>
            </div>
            <span class="product-transfer">
              ${isPerPerson ? `Mínimo ${minQty} personas · precio por tramo` : 'Pizza napolitana · masa fresca'}
            </span>
          </div>
        </div>
      </div>

      <div class="product-media" data-emoji="${escapeAttr(product.emoji || '🍕')}">
        <img src="${escapeAttr(image)}" alt="${escapeAttr(product.name)}" loading="lazy"
          onerror="this.closest('.product-media').classList.add('no-img')">
        ${actionControl}
      </div>
    </article>
  `;
}

function categoryName(slug) {
  return state.categories.find((cat) => cat.slug === slug)?.name || 'Pizzas';
}

function categoryIcon(slug) {
  return state.categories.find((cat) => cat.slug === slug)?.icon || '🍕';
}

function fallbackImage(cat) {
  const map = {
    clasicas: 'img/productos/margherita.webp',
    autor: 'img/productos/queso-azul-repollo.webp',
    casa: 'img/productos/pepperoni-tamarindo.webp',
    eventos: 'img/productos/pepperoni-detalle.webp'
  };
  return map[cat] || 'img/productos/margherita.webp';
}

/* ─── MODAL DE PRODUCTO ──────────────────────────────────────────────────── */

function openProductModal(id) {
  const product = state.menu.find((item) => String(item.id) === String(id));
  if (!product) return;

  const minQty = Math.max(1, Number(product.minQty || 1));
  state.modalProductId = product.id;
  state.modalQty = Math.max(minQty, state.cart[product.id]?.qty || minQty);
  renderProductModal();
  const overlay = document.getElementById('productModalOverlay');
  if (overlay) overlay.hidden = false;
  syncBodyScroll();
  setTimeout(() => document.getElementById('productModalClose')?.focus(), 30);
}

function renderProductModal() {
  const product = state.menu.find((item) => String(item.id) === String(state.modalProductId));
  const container = document.getElementById('productModalContent');
  if (!product || !container) return;

  const image = product.image || fallbackImage(product.cat);
  const rating = Number(product.rating || 5).toFixed(1);
  const tags = (product.tags || []).map((tag) => TAG_LABELS[tag] || tag);
  const tagsHTML = tags.length
    ? `<div class="pm-tags">${tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join('')}</div>`
    : '';
  const isPerPerson = productUnit(product) === 'persona';
  const minQty = Math.max(1, Number(product.minQty || 1));
  const tiers = getTiers(product);
  const precioUnitario = getUnitPrice(product, state.modalQty);
  const tiersHTML = tiers
    ? `<div class="pm-tiers"><h3>Valores por persona</h3>${tiers.map((tramo) => `<span>Desde ${tramo.min} invitados · ${formatPrice(tramo.price)}</span>`).join('')}</div>`
    : '';

  container.innerHTML = `
    <div class="pm-media">
      <img src="${escapeAttr(image)}" alt="${escapeAttr(product.name)}">
      <span class="pm-media-badge">${product.hot ? '🔥 Más pedida' : '🍕 Pizza napolitana'}</span>
    </div>
    <div class="pm-body">
      <span class="pm-cat">${escapeHTML(categoryName(product.cat))}</span>
      <h2 id="pmTitle">${escapeHTML(product.name)}</h2>
      <div class="pm-rating"><span>⭐ ${rating}</span> · ${isPerPerson ? 'Producción en vivo' : 'Masa fresca, hecha al momento'}</div>
      <div class="pm-prices">
        <div class="pm-price-card pm-price-cash">
          <small>${isPerPerson ? '💵 Precio por persona' : '💵 Precio por pizza'}</small>
          <strong>${formatPrice(precioUnitario)}</strong>
        </div>
      </div>
      <p class="pm-desc">${escapeHTML(product.desc)}</p>
      ${tagsHTML}
      ${tiersHTML}
      <div class="pm-detail-grid">
        <div>
          <h3>Ingredientes</h3>
          <p>${escapeHTML(product.ingredients || 'Consultá los ingredientes por WhatsApp.')}</p>
        </div>
        <div>
          <h3>${isPerPerson ? 'El servicio' : 'Preparación'}</h3>
          <p>${escapeHTML(product.prepDesc || 'Masa fresca, estirada y horneada en el momento.')}</p>
        </div>
      </div>
      <div class="pm-actions">
        <div class="qty-control" aria-label="Cantidad">
          <button type="button" id="pmMinusBtn" aria-label="Restar una unidad">−</button>
          <span id="pmQty">${state.modalQty}</span>
          <button type="button" id="pmPlusBtn" aria-label="Sumar una unidad">+</button>
        </div>
        <button type="button" class="pm-add-btn" id="pmAddBtn">
          Sumar · ${formatPrice(precioUnitario * state.modalQty)}
        </button>
      </div>
    </div>
  `;

  const minQtyForModal = minQty;
  document.getElementById('pmMinusBtn')?.addEventListener('click', () => {
    state.modalQty = Math.max(minQtyForModal, state.modalQty - 1);
    updateModalQtyAndPrice();
  });
  document.getElementById('pmPlusBtn')?.addEventListener('click', () => {
    state.modalQty = Math.min(999, state.modalQty + 1);
    updateModalQtyAndPrice();
  });
  document.getElementById('pmAddBtn')?.addEventListener('click', () => {
    setCartQty(product.id, state.modalQty);
    closeProductModal();
  });
}

function updateModalQtyAndPrice() {
  const product = state.menu.find((item) => String(item.id) === String(state.modalProductId));
  if (!product) return;
  const qty = document.getElementById('pmQty');
  const button = document.getElementById('pmAddBtn');
  if (qty) qty.textContent = state.modalQty;
  if (button) {
    button.textContent = `Sumar · ${formatPrice(getUnitPrice(product, state.modalQty) * state.modalQty)}`;
  }
}

function closeProductModal() {
  const overlay = document.getElementById('productModalOverlay');
  if (overlay) overlay.hidden = true;
  state.modalProductId = null;
  syncBodyScroll();
}

/* ─── CARRITO ────────────────────────────────────────────────────────────── */

function openCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (!drawer || !overlay) return;
  overlay.hidden = false;
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  syncBodyScroll();
}

function closeCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (!drawer || !overlay) return;
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  overlay.hidden = true;
  syncBodyScroll();
}

function syncBodyScroll() {
  const cartOpen = document.getElementById('cartDrawer')?.classList.contains('is-open');
  const productOpen = !document.getElementById('productModalOverlay')?.hidden;
  const infoOpen = !document.getElementById('infoModalOverlay')?.hidden;
  const successOpen = !document.getElementById('successOverlay')?.hidden;
  document.body.classList.toggle('no-scroll', Boolean(cartOpen || productOpen || infoOpen || successOpen));
}

function setCartQty(id, quantity) {
  const product = state.menu.find((item) => String(item.id) === String(id));
  if (!product) return;
  const minQty = Math.max(1, Number(product.minQty || 1));
  const current = state.cart[id] || { qty: 0, note: '' };
  state.cart[id] = {
    qty: Math.min(999, Math.max(minQty, Number(quantity || minQty))),
    note: current.note || ''
  };
  saveCart();
  renderCart();
  renderMenu();
  showToast(`✓ ${product.name} actualizado`);
}

function addToCart(id, quantity = 1) {
  const product = state.menu.find((item) => String(item.id) === String(id));
  if (!product) return;

  const minQty = Math.max(1, Number(product.minQty || 1));
  const current = state.cart[id] || { qty: 0, note: '' };
  const nextQty = current.qty === 0
    ? Math.max(minQty, Number(quantity || 1))
    : Number(current.qty) + Number(quantity || 1);

  state.cart[id] = { qty: Math.min(999, nextQty), note: current.note || '' };
  saveCart();
  renderCart();
  renderMenu();
  showToast(`✓ ${product.name} agregado`);
}

function changeCartQty(id, delta) {
  const entry = state.cart[id];
  if (!entry) return;
  const product = state.menu.find((item) => String(item.id) === String(id));
  const minQty = Math.max(1, Number(product?.minQty || 1));
  const next = Number(entry.qty || 0) + delta;
  if (next < minQty) {
    removeFromCart(id);
    return;
  }
  entry.qty = Math.min(999, next);
  saveCart();
  renderCart();
  renderMenu();
}

function removeFromCart(id) {
  delete state.cart[id];
  saveCart();
  renderCart();
  renderMenu();
}

function clearCart() {
  state.cart = {};
  saveCart();
  renderCart();
  renderMenu();
}

function getCartEntries() {
  const entries = [];
  Object.entries(state.cart).forEach(([id, value]) => {
    const product = state.menu.find((item) => String(item.id) === String(id));
    const qty = Math.max(0, parseInt(value?.qty, 10) || 0);
    if (!product || qty <= 0) return;
    entries.push({
      id,
      qty,
      note: String(value?.note || ''),
      product,
      subtotal: getUnitPrice(product, qty) * qty
    });
  });
  return entries;
}

function getCartTotals(entries = getCartEntries()) {
  const subtotal = entries.reduce((sum, entry) => sum + entry.subtotal, 0);
  return { subtotal, descuento: 0, total: subtotal };
}

function renderCart() {
  const entries = getCartEntries();
  const totals = getCartTotals(entries);
  const count = entries.reduce((sum, entry) => sum + entry.qty, 0);

  ['cartCount', 'sideCartCount', 'mobileCartCount'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(count);
  });

  const items = document.getElementById('cartItems');
  const empty = document.getElementById('cartEmpty');
  const form = document.getElementById('checkoutForm');
  if (items) items.innerHTML = entries.map(cartItemHTML).join('');
  if (empty) empty.hidden = entries.length > 0;
  if (form) form.hidden = entries.length === 0;

  const sideItems = document.getElementById('sideCartItems');
  const sideEmpty = document.getElementById('sideCartEmpty');
  const sideFooter = document.getElementById('sideCartFooter');
  if (sideItems) {
    sideItems.innerHTML = entries.map(sideCartItemHTML).join('');
    sideItems.hidden = entries.length === 0;
  }
  if (sideEmpty) sideEmpty.hidden = entries.length > 0;
  if (sideFooter) sideFooter.hidden = entries.length === 0;

  setText('sideSubtotal', formatPrice(totals.subtotal));
  setText('sideCashTotal', formatPrice(totals.total));
  setText('sideBtnTotal', formatPrice(totals.total));

  const mobileBar = document.getElementById('mobileCartBar');
  if (mobileBar) mobileBar.hidden = entries.length === 0;
  document.body.classList.toggle('has-mobile-cart', entries.length > 0);
  setText('mobileCartTotal', formatPrice(totals.total));

  setText('cartSubtotal', formatPrice(totals.subtotal));
  setText('cartTotal', formatPrice(totals.total));
  setText('cartShipping', shippingLabel());

  const info = document.getElementById('paymentInfo');
  if (info) {
    info.innerHTML = '💬 Coordinamos la forma de pago por WhatsApp al confirmar el pedido. Sin costos ocultos.';
  }

  const checkoutButton = document.getElementById('checkoutBtn');
  if (checkoutButton) checkoutButton.disabled = entries.length === 0;
}

function pickupAddress() {
  return BRAND.address || 'a coordinar por WhatsApp';
}

function shippingLabel() {
  if (state.deliveryMode === 'evento') return 'Lugar del evento';
  if (state.deliveryMode === 'takeaway') return `Retiro en ${pickupAddress()}`;
  return 'A coordinar';
}

function sideCartItemHTML(entry) {
  const product = entry.product;
  return `
    <div class="side-item">
      <div class="side-item-info">
        <strong>${escapeHTML(product.name)}</strong>
        <small>${formatPrice(getUnitPrice(product, entry.qty))} c/u · ${formatPrice(entry.subtotal)}</small>
      </div>
      <div class="side-item-controls">
        <div class="qty-control qty-sm">
          <button type="button" data-cart-minus="${escapeAttr(entry.id)}" aria-label="Restar">−</button>
          <span>${entry.qty}</span>
          <button type="button" data-cart-plus="${escapeAttr(entry.id)}" aria-label="Sumar">+</button>
        </div>
        <strong class="side-item-sub">${formatPrice(entry.subtotal)}</strong>
      </div>
    </div>
  `;
}

function cartItemHTML(entry) {
  const product = entry.product;
  const image = product.image || fallbackImage(product.cat);
  const isPerPerson = productUnit(product) === 'persona';
  return `
    <article class="cart-item" data-cart-id="${escapeAttr(entry.id)}">
      <img src="${escapeAttr(image)}" alt="${escapeAttr(product.name)}"
        onerror="this.style.display='none'">
      <div class="cart-item-main">
        <div class="cart-item-top">
          <strong>${escapeHTML(product.name)}</strong>
          <button class="cart-remove" type="button" data-cart-remove="${escapeAttr(entry.id)}"
            aria-label="Quitar ${escapeAttr(product.name)}">✕</button>
        </div>
        <div class="cart-item-price">${formatPrice(getUnitPrice(product, entry.qty))} c/u · ${formatPrice(entry.subtotal)}</div>
        <div class="qty-control">
          <button type="button" data-cart-minus="${escapeAttr(entry.id)}" aria-label="Restar">−</button>
          <span>${entry.qty}</span>
          <button type="button" data-cart-plus="${escapeAttr(entry.id)}" aria-label="Sumar">+</button>
        </div>
        ${isPerPerson ? `<div class="cart-item-hint">Total para ${entry.qty} ${entry.qty === 1 ? 'persona' : 'personas'}</div>` : ''}
        <input class="cart-item-note" type="text" data-note-id="${escapeAttr(entry.id)}"
          value="${escapeAttr(entry.note)}" maxlength="120" placeholder="Nota para este producto (opcional)">
      </div>
      <strong class="cart-item-subtotal">${formatPrice(entry.subtotal)}</strong>
    </article>
  `;
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
}

/* ─── FORMULARIO DE PEDIDO ───────────────────────────────────────────────── */

function hydrateCustomerForm() {
  setValue('fNombre', state.customer.name || '');
  setValue('fTel', state.customer.phone || '');
  setValue('fDir', state.customer.address || '');
  setValue('fFecha', state.customer.eventDate || '');
  setValue('fLugar', state.customer.eventPlace || '');
  setValue('fInvitados', state.customer.guests || '');
  applyDeliveryMode(state.deliveryMode, false);
}

function saveCustomerDraft() {
  state.customer = {
    ...state.customer,
    name: document.getElementById('fNombre')?.value.trim() || '',
    phone: document.getElementById('fTel')?.value.trim() || '',
    address: document.getElementById('fDir')?.value.trim() || '',
    eventDate: document.getElementById('fFecha')?.value || '',
    eventPlace: document.getElementById('fLugar')?.value.trim() || '',
    guests: document.getElementById('fInvitados')?.value || '',
    deliveryMode: state.deliveryMode
  };
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(state.customer));
}

function applyDeliveryMode(mode, persist = true) {
  state.deliveryMode = mode === 'takeaway' || mode === 'evento' ? mode : 'delivery';

  document.querySelectorAll('#deliveryToggle [data-mode], #sideDeliveryToggle [data-mode]').forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === state.deliveryMode);
  });

  const addressField = document.getElementById('addressField');
  const addressInput = document.getElementById('fDir');
  const eventFields = document.getElementById('eventFields');

  if (addressField) addressField.hidden = state.deliveryMode !== 'delivery';
  if (addressInput) addressInput.required = state.deliveryMode === 'delivery';
  if (eventFields) eventFields.hidden = state.deliveryMode !== 'evento';

  setText('cartShipping', shippingLabel());

  if (persist) {
    state.customer.deliveryMode = state.deliveryMode;
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(state.customer));
  }
}

async function submitOrder(event) {
  event.preventDefault();

  const entries = getCartEntries();
  if (!entries.length) {
    showToast('Tu carrito está vacío. Elegí una pizza primero.', 'error');
    return;
  }

  const nombre = document.getElementById('fNombre')?.value.trim() || '';
  const telefono = document.getElementById('fTel')?.value.trim() || '';
  const direccion = document.getElementById('fDir')?.value.trim() || '';
  const nota = document.getElementById('fNota')?.value.trim() || '';
  const fecha = document.getElementById('fFecha')?.value || '';
  const lugar = document.getElementById('fLugar')?.value.trim() || '';
  const invitados = Math.max(0, parseInt(document.getElementById('fInvitados')?.value, 10) || 0);

  if (!nombre) {
    showToast('Completá tu nombre.', 'error');
    document.getElementById('fNombre')?.focus();
    return;
  }

  if (!telefono) {
    showToast('Completá tu teléfono.', 'error');
    document.getElementById('fTel')?.focus();
    return;
  }

  if (state.deliveryMode === 'delivery' && !direccion) {
    showToast('Ingresá tu dirección de entrega.', 'error');
    document.getElementById('fDir')?.focus();
    return;
  }

  if (state.deliveryMode === 'evento') {
    if (!fecha || !lugar) {
      showToast('Completá la fecha y el lugar del evento.', 'error');
      (!fecha ? document.getElementById('fFecha') : document.getElementById('fLugar'))?.focus();
      return;
    }
    if (invitados < 20) {
      showToast('El mínimo para eventos es de 20 invitados.', 'error');
      document.getElementById('fInvitados')?.focus();
      return;
    }
  }

  const totals = getCartTotals(entries);
  const order = {
    codigo: makeOrderCode(),
    nombre,
    telefono,
    modalidad: state.deliveryMode,
    direccion: state.deliveryMode === 'delivery' ? direccion : (state.deliveryMode === 'takeaway' ? pickupAddress() : lugar),
    fecha,
    lugar,
    invitados,
    pago: 'a coordinar',
    nota,
    items: entries.map((entry) => ({
      id: entry.id,
      name: entry.product.name,
      unit: productUnit(entry.product),
      qty: entry.qty,
      price: getUnitPrice(entry.product, entry.qty),
      subtotal: entry.subtotal,
      note: entry.note
    })),
    subtotal: totals.subtotal,
    descuento: 0,
    total: totals.total,
    createdAt: new Date().toISOString()
  };

  const waUrl = buildWhatsAppMessage(order);
  const button = document.getElementById('checkoutBtn');
  setButtonLoading(button, true);

  try {
    const client = getSupabaseClient();
    if (!client) throw new Error('No se pudo conectar con el sistema de pedidos.');

    const comentario = [
      `Pedido ${order.codigo}`,
      modoTexto(order.modalidad),
      order.modalidad === 'evento' ? `Fecha: ${fecha} · Lugar: ${lugar} · Invitados: ${invitados}` : null,
      `Pago: ${order.pago}`,
      nota ? `Nota: ${nota}` : null
    ].filter(Boolean).join(' · ');

    const payload = {
      empresa_id: EMPRESA_ID,
      customer_name: nombre,
      customer_phone: telefono,
      delivery_address: state.deliveryMode === 'delivery' ? direccion : (state.deliveryMode === 'takeaway' ? pickupAddress() : (lugar || null)),
      comment: comentario,
      total: totals.total,
      status: 'pendiente',
      items: {
        codigo: order.codigo,
        modalidad: order.modalidad,
        fecha: order.fecha || null,
        lugar: order.lugar || null,
        invitados: order.invitados || null,
        pago: order.pago,
        notas: nota,
        subtotal: totals.subtotal,
        descuento: 0,
        total: totals.total,
        detalle: order.items
      }
    };

    const { error } = await client.from('orders').insert(payload);
    if (error) throw error;

    await saveCustomerRecord({ nombre, telefono, direccion: state.deliveryMode === 'delivery' ? direccion : lugar });
    state.lastOrder = { ...order, saved: true };
    persistLastOrder();
    clearCart();
    closeCart();
    showSuccessModal(state.lastOrder, true);
    window.location.href = waUrl;
  } catch (error) {
    console.error('Error al guardar el pedido:', error);
    state.lastOrder = { ...order, saved: false };
    persistLastOrder();
    clearCart();
    closeCart();
    showSuccessModal(state.lastOrder, false);
    window.location.href = waUrl;
  } finally {
    setButtonLoading(button, false);
  }
}

function modoTexto(modo) {
  if (modo === 'evento') return 'Evento';
  if (modo === 'takeaway') return 'Retiro en el local';
  return 'Delivery';
}

async function saveCustomerRecord({ nombre, telefono, direccion }) {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const phone = telefono.trim();
    const { data: existing, error: findError } = await client
      .from('customers')
      .select('id')
      .eq('empresa_id', EMPRESA_ID)
      .eq('phone', phone)
      .maybeSingle();

    if (findError) throw findError;

    if (existing?.id) {
      await client
        .from('customers')
        .update({
          name: nombre,
          address: direccion || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .eq('empresa_id', EMPRESA_ID);
    } else {
      await client
        .from('customers')
        .insert({
          empresa_id: EMPRESA_ID,
          name: nombre,
          phone,
          address: direccion || null,
          email: null
        });
    }
  } catch (error) {
    console.warn('No se pudo actualizar la ficha del cliente:', error);
  }
}

function makeOrderCode() {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `#TAM-${random}`;
}

function persistLastOrder() {
  if (state.lastOrder) {
    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(state.lastOrder));
  }
}

function showSuccessModal(order, saved) {
  const content = document.getElementById('successContent');
  if (!content) return;

  const modal = modoTexto(order.modalidad);
  const detalleEvento = order.modalidad === 'evento'
    ? `<div class="success-summary-row"><span>${escapeHTML(order.lugar || 'Lugar a coordinar')}</span><strong>${order.invitados} invitados</strong></div>`
    : '';

  content.innerHTML = `
    <div class="success-check" aria-hidden="true">✓</div>
    <h2 id="successTitle">${saved ? '¡Pedido listo!' : 'Enviar pedido'}</h2>
    <p>${saved
      ? 'Guardamos tu pedido. Tocá el botón verde para enviarlo por WhatsApp.'
      : 'Tocá el botón para enviar tu pedido por WhatsApp.'}</p>
    <span class="success-code">${escapeHTML(order.codigo)}</span>
    <div class="success-summary">
      ${order.items.map((item) => `
        <div class="success-summary-row">
          <span>${item.qty}× ${escapeHTML(item.name)}</span>
          <strong>${formatPrice(item.subtotal)}</strong>
        </div>
      `).join('')}
      <div class="success-summary-row">
        <span>${escapeHTML(modal)}</span>
        <strong>Pago a coordinar</strong>
      </div>
      ${detalleEvento}
      <div class="success-summary-row total">
        <span>Total</span>
        <strong>${formatPrice(order.total)}</strong>
      </div>
    </div>
    <div class="success-actions">
      <a class="btn btn-whatsapp" id="successWaBtn" href="${escapeAttr(buildWhatsAppMessage(order))}"
        target="_blank" rel="noopener">💬 Enviar pedido por WhatsApp</a>
      <button class="btn btn-ghost" id="successContinueBtn" type="button">
        ${saved ? 'Volver al menú' : 'Volver al carrito'}
      </button>
    </div>
  `;

  document.getElementById('successContinueBtn')?.addEventListener('click', () => {
    closeSuccessModal();
    if (!saved) openCart();
  });

  const overlay = document.getElementById('successOverlay');
  if (overlay) overlay.hidden = false;
  syncBodyScroll();
}

function closeSuccessModal() {
  const overlay = document.getElementById('successOverlay');
  if (overlay) overlay.hidden = true;
  syncBodyScroll();
}

/* ─── WHATSAPP ───────────────────────────────────────────────────────────── */

function buildWhatsAppMessage(order) {
  const lines = [];
  lines.push(`🍕 *PEDIDO ${order.codigo}*`);
  lines.push('*Tamarindo · Pizza napolitana*');
  lines.push('');
  lines.push(`👤 *Cliente:* ${order.nombre}`);
  lines.push(`📞 *Teléfono:* ${order.telefono}`);
  lines.push(`🚚 *Modalidad:* ${modoTexto(order.modalidad)}`);

  if (order.modalidad === 'delivery') {
    lines.push(`📍 *Dirección:* ${order.direccion}`);
  } else if (order.modalidad === 'evento') {
    lines.push(`📅 *Fecha:* ${order.fecha || 'A confirmar'}`);
    lines.push(`📍 *Lugar:* ${order.lugar || 'A confirmar'}`);
    lines.push(`👥 *Invitados:* ${order.invitados || 'A confirmar'}`);
  } else {
    lines.push(`📍 *Retiro:* ${pickupAddress()}`);
  }

  lines.push('💳 *Pago:* a coordinar por WhatsApp');
  lines.push('');
  lines.push('🧾 *Detalle:*');

  order.items.forEach((item) => {
    lines.push(`• ${item.qty}× ${item.name} — ${formatPrice(item.subtotal)}`);
    if (item.note) lines.push(`   _${item.note}_`);
  });

  lines.push('');
  lines.push(`Subtotal: ${formatPrice(order.subtotal || order.subtotalLista || order.total)}`);
  lines.push(`*Total: ${formatPrice(order.total)}*`);

  if (order.nota) {
    lines.push('');
    lines.push(`📝 *Nota:* ${order.nota}`);
  }

  return `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}

function buildCartWhatsAppLink() {
  const entries = getCartEntries();
  if (!entries.length) {
    return `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent('Hola, quiero hacer un pedido de pizzas napolitanas.')}`;
  }

  const totals = getCartTotals(entries);
  const lines = ['🍕 Hola, quiero hacer este pedido:', ''];

  entries.forEach((entry) => {
    lines.push(`• ${entry.qty}× ${entry.product.name} — ${formatPrice(entry.subtotal)}`);
    if (entry.note) lines.push(`   _${entry.note}_`);
  });

  lines.push('');
  lines.push(`*Total: ${formatPrice(totals.total)}*`);
  return `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}

/* ─── CARGA DESDE SUPABASE ───────────────────────────────────────────────── */

function getSupabaseClient() {
  if (!window.supabase) return null;
  if (!state.supabase) {
    state.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return state.supabase;
}

async function loadFromSupabase() {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const categoriesResult = await client
      .from('categories')
      .select('*')
      .eq('empresa_id', EMPRESA_ID)
      .eq('is_active', true)
      .order('sort_order');

    if (!categoriesResult.error && categoriesResult.data?.length) {
      state.categories = categoriesResult.data.map((category) => ({
        id: category.id,
        slug: category.slug || 'otros',
        name: category.name,
        icon: category.icon || '🍕',
        order: Number(category.sort_order || 0)
      }));
    }

    const [productsResult, bannersResult] = await Promise.all([
      client.from('products').select('*').eq('empresa_id', EMPRESA_ID).eq('is_active', true).order('sort_order'),
      client.from('banners').select('*').eq('empresa_id', EMPRESA_ID).eq('is_active', true).order('sort_order')
    ]);

    if (!productsResult.error && productsResult.data?.length) {
      const previousMenu = state.menu;
      const nextMenu = productsResult.data.map(mapSupabaseProduct);
      migrateCartByName(previousMenu, nextMenu);
      state.menu = nextMenu;
      saveCart();
    }

    if (!bannersResult.error && bannersResult.data?.length) {
      state.banners = bannersResult.data.map((banner) => ({
        id: banner.id,
        image: banner.image_url,
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        link: banner.link || '#menu',
        sort: Number(banner.sort_order || 0)
      }));
    }

    renderCategories();
    renderBanners();
    renderMenu();
    renderCart();
  } catch (error) {
    console.warn('Se usa el catálogo local:', error);
  }
}

function productUnit(product) {
  return product?.unit || product?.unit_type || 'unidad';
}

function mapSupabaseProduct(product) {
  const category = state.categories.find((cat) => cat.id === product.category_id);
  const unit = product.unit_type || 'unidad';
  const minQty = unit === 'persona' ? 20 : 1;
  return {
    id: product.id,
    code: product.code || '',
    cat: category?.slug || 'otros',
    name: product.name,
    desc: product.description || '',
    ingredients: product.ingredients || '',
    prepDesc: product.prep_descripcion || '',
    prepTime: product.prep_tiempo || '',
    price: Number(product.price || 0),
    unit,
    minQty,
    tiers: product.code === 'TAM-EV-01' ? EVENT_TIERS : null,
    image: product.image_url || fallbackImage(category?.slug),
    emoji: product.emoji || '🍕',
    tags: Array.isArray(product.tags) ? product.tags : [],
    hot: Boolean(product.hot),
    rating: Number(product.rating || 5),
    sort: Number(product.sort_order || 0)
  };
}

function migrateCartByName(previousMenu, nextMenu) {
  const nextIds = new Set(nextMenu.map((product) => String(product.id)));

  Object.keys(state.cart).forEach((oldId) => {
    if (nextIds.has(String(oldId))) return;
    const oldProduct = previousMenu.find((product) => String(product.id) === String(oldId));
    if (!oldProduct) return;
    const match = nextMenu.find(
      (product) => normalize(product.name) === normalize(oldProduct.name)
    );
    if (match) {
      state.cart[match.id] = state.cart[oldId];
      delete state.cart[oldId];
    }
  });
}

/* ─── UTILIDADES ─────────────────────────────────────────────────────────── */

function formatPrice(value) {
  const number = Number(value) || 0;
  return `$${number.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[character]));
}

function escapeAttr(value) {
  return escapeHTML(value);
}

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.value = value;
}

function setButtonLoading(button, loading) {
  if (!button) return;
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = 'Guardando y abriendo WhatsApp…';
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || '💬 Enviar pedido por WhatsApp';
    button.disabled = false;
  }
}

function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  clearTimeout(state.toastTimer);
  toast.textContent = message;
  toast.classList.toggle('is-error', type === 'error');
  toast.classList.add('is-visible');
  state.toastTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 2600);
}

function setFooterYear() {
  const year = document.getElementById('footerYear');
  if (year) year.textContent = String(new Date().getFullYear());
}

/* ─── OCULTAR BADGE INYECTADO DE NETLIFY ─────────────────────────────────── */
(function suppressNetlifyBadge() {
  const ALLOWED_BODY_IDS = new Set([
    'splash',
    'app',
    'mobileCartBar',
    'cartOverlay',
    'cartDrawer',
    'productModalOverlay',
    'infoModalOverlay',
    'successOverlay',
    'toast'
  ]);
  const ALLOWED_TAGS = new Set(['SCRIPT', 'STYLE', 'LINK', 'NOSCRIPT']);

  function cleanNetlifyNodes() {
    Array.from(document.documentElement?.children || []).forEach((node) => {
      if (node.tagName !== 'HEAD' && node.tagName !== 'BODY') node.remove();
    });

    Array.from(document.body?.children || []).forEach((node) => {
      if (!node || !node.tagName) return;
      if (ALLOWED_TAGS.has(node.tagName)) return;
      if (node.id && ALLOWED_BODY_IDS.has(node.id)) return;
      node.style?.setProperty('display', 'none', 'important');
      node.remove();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanNetlifyNodes);
  } else {
    cleanNetlifyNodes();
  }

  const observer = new MutationObserver(() => cleanNetlifyNodes());
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
