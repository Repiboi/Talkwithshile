/* TALKWITHSHILE: accessible storefront interactions. Client-side only; no checkout. */
(() => {
  'use strict';
  const PRODUCTS = Array.isArray(window.TWS_PRODUCTS) ? window.TWS_PRODUCTS : [];
  const CONFIG = window.TWS_CONFIG || {};
  const STORE_KEY = 'talkwithshile-enquiry-v1';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const productById = new Map(PRODUCTS.map(product => [product.id, product]));

  const state = { filter: 'all', search: '', sort: 'featured', selected: {}, note: '', activePanel: null, previousFocus: null, toastTimer: 0 };
  const grid = $('#product-grid');
  const overlay = $('#overlay');
  const drawer = $('#enquiry-drawer');
  const modal = $('#product-modal');
  const drawerItems = $('#enquiry-items');
  const enquiryNote = $('#enquiry-note');
  const toast = $('#toast');

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  function loadSaved() {
    try {
      const data = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      if (data && typeof data === 'object') {
        if (data.selected && typeof data.selected === 'object') {
          for (const [id, count] of Object.entries(data.selected)) {
            if (productById.has(id) && Number.isInteger(count) && count > 0) state.selected[id] = Math.min(count, 25);
          }
        }
        if (typeof data.note === 'string') state.note = data.note.slice(0, 1200);
      }
    } catch (_error) { /* Private browsing or invalid stored data. */ }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ selected: state.selected, note: state.note })); }
    catch (_error) { /* Still usable when localStorage is unavailable. */ }
  }
  function totalCount() { return Object.values(state.selected).reduce((sum, n) => sum + n, 0); }
  function itemsInList() { return PRODUCTS.filter(p => state.selected[p.id] > 0); }

  function artType(category) {
    return category === 'tea' ? 'tea' : category === 'cleansing' ? 'cleansing' : category === 'personal' ? 'personal' : 'herbal';
  }
  function productVisual(p) {
    const artName = p.category === 'tea' ? 'Botanical' : p.category === 'cleansing' ? 'Care' : p.category === 'personal' ? 'Oil' : 'Herbal';
    return `<div class="product-visual tone-${escapeHTML(p.tone)}">
      <div class="product-art art-${artType(p.category)}" aria-hidden="true"><span class="product-art-shadow"></span>
        <div class="product-silhouette"><span class="product-silhouette-label">TWS <b>${artName}</b></span></div>
        <svg class="icon product-art-leaf"><use href="#i-leaf"></use></svg>
      </div>
      <img class="product-image" src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)} product packaging" loading="lazy" decoding="async" referrerpolicy="no-referrer">
    </div>`;
  }
  function bindProductImages(scope = document) {
    $$('.product-image:not([data-image-bound])', scope).forEach(img => {
      img.setAttribute('data-image-bound', 'true');
      const show = () => img.closest('.product-visual')?.classList.add('image-ready');
      const hide = () => img.closest('.product-visual')?.classList.remove('image-ready');
      img.addEventListener('load', show, { once: true });
      img.addEventListener('error', hide, { once: true });
      if (img.complete && img.naturalWidth > 0) show();
    });
  }
  function visibleProducts() {
    const term = state.search.toLocaleLowerCase().trim();
    const filtered = PRODUCTS.filter(product => {
      const matchesFilter = state.filter === 'all' || product.category === state.filter;
      const matchesSearch = !term || `${product.name} ${product.categoryName} ${product.subtitle}`.toLocaleLowerCase().includes(term);
      return matchesFilter && matchesSearch;
    });
    if (state.sort === 'az') filtered.sort((a, b) => a.name.localeCompare(b.name));
    if (state.sort === 'za') filtered.sort((a, b) => b.name.localeCompare(a.name));
    return filtered;
  }
  function renderProducts() {
    const visible = visibleProducts();
    grid.innerHTML = visible.map((product, i) => `<article class="product-card" data-id="${escapeHTML(product.id)}">
      <div class="product-photo-area" style="position:relative">${productVisual(product)}
        <span class="product-card-tag">${escapeHTML(product.categoryName)}</span>
        <button type="button" class="product-quick" data-action="details" data-id="${escapeHTML(product.id)}" aria-label="View details for ${escapeHTML(product.name)}"><svg class="icon"><use href="#i-arrow-up-right"></use></svg></button>
      </div>
      <div class="product-meta"><span class="product-category">${escapeHTML(product.categoryName)}</span><span class="product-index">${String(i + 1).padStart(2, '0')}</span></div>
      <h3 class="product-name">${escapeHTML(product.name)}</h3><p class="product-subtitle">${escapeHTML(product.subtitle)}</p>
      <div class="product-footer"><button type="button" class="add-button" data-action="add" data-id="${escapeHTML(product.id)}">Add to enquiry <svg class="icon"><use href="#i-arrow-right"></use></svg></button></div>
    </article>`).join('');
    bindProductImages(grid);
    $('#result-count').textContent = `Showing ${visible.length} of ${PRODUCTS.length} products`;
    $('#empty-results').hidden = visible.length !== 0;
  }
  function updateFilter(next) {
    state.filter = next;
    $$('#category-filters [data-filter]').forEach(button => {
      const selected = button.dataset.filter === next;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    renderProducts();
  }
  function notify(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove('show'), 3100);
  }
  function updateCounts() {
    const count = totalCount();
    $('#bag-count').textContent = String(count);
    $('#bag-count').setAttribute('aria-label', `${count} product${count === 1 ? '' : 's'}`);
    $('#drawer-count').textContent = `(${count})`;
    $('#copy-enquiry').disabled = count < 1;
    $('#share-whatsapp').disabled = count < 1;
    $('#copy-enquiry').style.opacity = count ? '' : '.5';
    $('#share-whatsapp').style.opacity = count ? '' : '.5';
  }
  function renderDrawer() {
    const selected = itemsInList();
    if (!selected.length) {
      drawerItems.innerHTML = `<div class="drawer-empty"><svg class="icon"><use href="#i-bag"></use></svg><h3>Your list is empty</h3><p>See something you like? Add it here to put together a message.</p><a href="#collection" id="browse-from-drawer">Browse the collection →</a></div>`;
    } else {
      drawerItems.innerHTML = selected.map(p => `<div class="enquiry-item" data-id="${escapeHTML(p.id)}">
        <div class="enquiry-thumb"><span>TWS</span></div>
        <div class="enquiry-info"><small>${escapeHTML(p.categoryName)}</small><strong>${escapeHTML(p.name)}</strong>
          <div class="qty-controls"><button type="button" aria-label="Decrease quantity of ${escapeHTML(p.name)}" data-qty="-1" data-id="${escapeHTML(p.id)}"><svg class="icon"><use href="#i-minus"></use></svg></button><span>${state.selected[p.id]}</span><button type="button" aria-label="Increase quantity of ${escapeHTML(p.name)}" data-qty="1" data-id="${escapeHTML(p.id)}"><svg class="icon"><use href="#i-plus"></use></svg></button></div>
        </div><button type="button" class="remove-item" data-remove="${escapeHTML(p.id)}" aria-label="Remove ${escapeHTML(p.name)}"><svg class="icon"><use href="#i-trash"></use></svg></button>
      </div>`).join('');
    }
    updateCounts();
  }
  function addToEnquiry(id, openAfter = false) {
    const product = productById.get(id);
    if (!product) return;
    if ((state.selected[id] || 0) >= 25) { notify('Maximum 25 of each item per enquiry.'); return; }
    state.selected[id] = (state.selected[id] || 0) + 1;
    save(); renderDrawer();
    notify(`${product.name} added to your enquiry`);
    if (openAfter) openPanel('drawer');
  }
  function updateQuantity(id, delta) {
    if (!productById.has(id)) return;
    const next = (state.selected[id] || 0) + delta;
    if (next > 25) { notify('Maximum 25 of each item per enquiry.'); return; }
    if (next <= 0) delete state.selected[id]; else state.selected[id] = next;
    save(); renderDrawer();
  }
  function openPanel(type) {
    if (state.activePanel !== type) state.previousFocus = document.activeElement;
    state.activePanel = type;
    overlay.hidden = false;
    document.body.classList.add('no-scroll');
    drawer.classList.toggle('open', type === 'drawer');
    drawer.setAttribute('aria-hidden', String(type !== 'drawer'));
    drawer.inert = type !== 'drawer';
    modal.classList.toggle('open', type === 'modal');
    modal.setAttribute('aria-hidden', String(type !== 'modal'));
    modal.inert = type !== 'modal';
    if (type === 'drawer') $('#close-drawer').focus();
    if (type === 'modal') $('#close-modal').focus();
  }
  function closePanels() {
    if (!state.activePanel) return;
    state.activePanel = null;
    drawer.classList.remove('open');
    modal.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    modal.setAttribute('aria-hidden', 'true');
    drawer.inert = true;
    modal.inert = true;
    overlay.hidden = true;
    document.body.classList.remove('no-scroll');
    if (state.previousFocus?.isConnected && typeof state.previousFocus.focus === 'function') state.previousFocus.focus();
  }
  function showDetails(id) {
    const p = productById.get(id);
    if (!p) return;
    $('#modal-image').innerHTML = productVisual(p);
    bindProductImages($('#modal-image'));
    $('#modal-category').textContent = p.categoryName;
    $('#modal-title').textContent = p.name;
    $('#modal-description').textContent = p.description;
    $('#modal-add').dataset.id = p.id;
    openPanel('modal');
  }
  function enquiryMessage() {
    const list = itemsInList();
    const lines = ['Hello, I would like to enquire about these Talkwithshile products:', ''];
    list.forEach((p, i) => lines.push(`${i + 1}. ${p.name} (quantity: ${state.selected[p.id]})`));
    lines.push('', 'Please confirm current availability, price, full ingredients, intended use and any precautions.');
    if (state.note.trim()) lines.push('', `My note: ${state.note.trim()}`);
    lines.push('', 'Thank you.');
    return lines.join('\n');
  }
  function whatsappLink() {
    const number = String(CONFIG.businessWhatsApp || '').replace(/\D/g, '');
    const text = encodeURIComponent(enquiryMessage());
    return number ? `https://wa.me/${number}?text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
  }
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
      const field = document.createElement('textarea');
      field.value = text; field.style.position = 'fixed'; field.style.left = '-9999px';
      document.body.appendChild(field); field.focus(); field.select();
      const success = document.execCommand('copy'); field.remove(); return success;
    } catch (_error) { return false; }
  }
  function updateNavigation() {
    const header = $('#site-header');
    header.classList.toggle('scrolled', scrollY > 8);
    $('#scroll-top').classList.toggle('visible', scrollY > 650);
  }
  function closeMenu() {
    $('#site-nav').classList.remove('open');
    $('#menu-button').setAttribute('aria-expanded', 'false');
    $('#menu-button').setAttribute('aria-label', 'Open menu');
    $('#menu-button use').setAttribute('href', '#i-menu');
  }
  function setupNavigation() {
    $('#menu-button').addEventListener('click', () => {
      const open = !$('#site-nav').classList.contains('open');
      $('#site-nav').classList.toggle('open', open);
      $('#menu-button').setAttribute('aria-expanded', String(open));
      $('#menu-button').setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      $('#menu-button use').setAttribute('href', open ? '#i-x' : '#i-menu');
    });
    $$('.site-nav a').forEach(a => a.addEventListener('click', closeMenu));
    $('#header-search').addEventListener('click', () => {
      $('#collection').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      window.setTimeout(() => $('#product-search').focus({ preventScroll: true }), 360);
    });
    $('#scroll-top').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', updateNavigation, { passive: true });
    updateNavigation();
    window.addEventListener('resize', () => { if (window.innerWidth > 950) closeMenu(); });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) {
          $$('.site-nav .nav-link').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
        }
      }, { rootMargin: '-25% 0px -65% 0px', threshold: 0 });
      ['home','collection','about','approach','contact'].forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
    }
  }
  function setupEvents() {
    $('#category-filters').addEventListener('click', event => {
      const button = event.target.closest('[data-filter]');
      if (button) updateFilter(button.dataset.filter);
    });
    $('#product-search').addEventListener('input', event => { state.search = event.target.value; renderProducts(); });
    $('#sort-products').addEventListener('change', event => { state.sort = event.target.value; renderProducts(); });
    $('#clear-filters').addEventListener('click', () => {
      $('#product-search').value = ''; state.search = ''; updateFilter('all');
    });
    grid.addEventListener('click', event => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      if (button.dataset.action === 'add') addToEnquiry(button.dataset.id);
      if (button.dataset.action === 'details') showDetails(button.dataset.id);
    });
    $$('[data-open-enquiry]').forEach(button => button.addEventListener('click', () => openPanel('drawer')));
    $('#close-drawer').addEventListener('click', closePanels);
    $('#close-modal').addEventListener('click', closePanels);
    overlay.addEventListener('click', closePanels);
    $('#modal-add').addEventListener('click', event => addToEnquiry(event.currentTarget.dataset.id, true));
    drawerItems.addEventListener('click', event => {
      const qty = event.target.closest('[data-qty]');
      const remove = event.target.closest('[data-remove]');
      if (qty) updateQuantity(qty.dataset.id, Number(qty.dataset.qty));
      if (remove) { delete state.selected[remove.dataset.remove]; save(); renderDrawer(); notify('Product removed from your enquiry'); }
      if (event.target.closest('#browse-from-drawer')) closePanels();
    });
    enquiryNote.addEventListener('input', () => { state.note = enquiryNote.value.slice(0,1200); save(); });
    $('#copy-enquiry').addEventListener('click', async () => {
      if (!totalCount()) return;
      const success = await copyText(enquiryMessage());
      notify(success ? 'Enquiry copied. Paste it into a message.' : 'Copy not available. Please use WhatsApp sharing instead.');
    });
    $('#share-whatsapp').addEventListener('click', () => {
      if (!totalCount()) return;
      window.open(whatsappLink(), '_blank', 'noopener,noreferrer');
      if (!String(CONFIG.businessWhatsApp || '').trim()) notify('Choose a WhatsApp recipient to share this message.');
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') { closePanels(); closeMenu(); return; }
      if (event.key !== 'Tab' || !state.activePanel) return;
      const panel = state.activePanel === 'drawer' ? drawer : modal;
      const focusable = $$('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])', panel).filter(el => !el.inert && !el.closest('[hidden]'));
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }
  function init() {
    loadSaved();
    drawer.inert = true; modal.inert = true;
    enquiryNote.value = state.note;
    $('#footer-year').textContent = String(new Date().getFullYear());
    $('#total-pill').textContent = String(PRODUCTS.length);
    if (String(CONFIG.businessWhatsApp || '').replace(/\D/g,'')) {
      $('#share-whatsapp').innerHTML = 'Message Talkwithshile on WhatsApp <svg class="icon"><use href="#i-arrow-up-right"></use></svg>';
      $('#drawer-help').textContent = 'Your list is saved on this device. Clicking WhatsApp opens your message; no order or payment is made here.';
    } else {
      $('#drawer-help').textContent = 'No business WhatsApp has been configured yet. WhatsApp will ask you to choose a recipient. Your list stays on this device.';
    }
    renderProducts(); renderDrawer(); setupNavigation(); setupEvents();
  }
  init();
})();
