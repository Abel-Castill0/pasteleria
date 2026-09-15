/* Alma & Azúcar — UI compartida, carrito y checkout. Sin dependencias. */
const CONFIG = window.SITE_CONFIG || {};
const CART_KEY = 'alma_azucar_cart_v1';

const icon = (name) => {
  const icons = {
    cart: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 8H6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="20" r="1.3" fill="currentColor"/><circle cx="18" cy="20" r="1.3" fill="currentColor"/></svg>',
    menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    close: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    whatsapp: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11.7a8 8 0 0 1-11.8 7L4 20l1.3-4.1A8 8 0 1 1 20 11.7Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 8.5c.3 2.6 1.9 4.3 4.6 5.2l1.2-1c.3-.2.6-.2.9-.1l1.5.7c.3.1.4.4.3.7-.3 1.2-1.3 2-2.5 2-4 0-7.5-3.5-7.5-7.5 0-1.1.8-2.2 2-2.5.3-.1.6.1.7.3l.7 1.6c.1.3.1.6-.1.8L9 8.5Z" fill="currentColor" opacity=".35"/></svg>'
  };
  return icons[name] || '';
};

function currentPage() {
  const file = location.pathname.split('/').pop() || 'index.html';
  return file.replace('.html', '') || 'index';
}

function navLink(href, label, key) {
  return `<a href="${href}" class="${currentPage() === key ? 'active' : ''}">${label}</a>`;
}

function renderShell() {
  const header = document.querySelector('[data-site-header]');
  const footer = document.querySelector('[data-site-footer]');
  const floating = document.querySelector('[data-whatsapp-float]');

  if (header) {
    header.innerHTML = `
      <div class="topbar">Pedidos con anticipación · Tortas personalizadas y postres artesanales · ${CONFIG.serviceArea}</div>
      <header class="site-header">
        <div class="container nav">
          <a class="brand" href="index.html" aria-label="Ir al inicio de ${CONFIG.brand}">
            <img src="assets/logo.svg" alt="" width="44" height="44">
            <span class="brand-copy"><strong>${CONFIG.brand}</strong><span>${CONFIG.tagline}</span></span>
          </a>
          <nav class="nav-links" aria-label="Navegación principal">
            ${navLink('index.html','Inicio','index')}
            ${navLink('catalogo.html','Catálogo','catalogo')}
            ${navLink('personaliza.html','Pastel a medida','personaliza')}
            ${navLink('galeria.html','Galería','galeria')}
            ${navLink('nosotros.html','La pastelera','nosotros')}
            ${navLink('contacto.html','Contacto','contacto')}
          </nav>
          <div class="nav-actions">
            <a class="btn btn-primary header-cta" href="personaliza.html">Cotizar pastel</a>
            <button class="icon-btn" type="button" data-cart-open aria-label="Abrir carrito">${icon('cart')}<span class="cart-count" data-cart-count>0</span></button>
            <button class="icon-btn menu-toggle" type="button" data-menu-toggle aria-label="Abrir menú" aria-expanded="false">${icon('menu')}</button>
          </div>
        </div>
      </header>`;
  }

  if (footer) {
    footer.innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <a class="brand" href="index.html"><img src="assets/logo.svg" alt="" width="44" height="44"><span class="brand-copy"><strong>${CONFIG.brand}</strong><span>${CONFIG.tagline}</span></span></a>
              <p>Pasteles hechos en pequeños lotes, por encargo y con atención directa. La dirección de producción no se publica por tratarse de un emprendimiento desde casa.</p>
            </div>
            <div><div class="footer-title">Explora</div><div class="footer-links"><a href="catalogo.html">Catálogo</a><a href="personaliza.html">Pastel a medida</a><a href="galeria.html">Galería</a></div></div>
            <div><div class="footer-title">Información</div><div class="footer-links"><a href="nosotros.html">La pastelera</a><a href="contacto.html#faq">Preguntas frecuentes</a><a href="contacto.html#politicas">Políticas de pedido</a></div></div>
            <div><div class="footer-title">Pedidos</div><div class="footer-links"><a href="${waLink('Hola, quisiera información para hacer un pedido.')}" target="_blank" rel="noopener">WhatsApp · ${CONFIG.whatsappDisplay}</a><a href="${CONFIG.instagramUrl}" target="_blank" rel="noopener">Instagram · ${CONFIG.instagram}</a><span>${CONFIG.pickupText}</span></div></div>
          </div>
          <div class="footer-bottom"><span>© ${new Date().getFullYear()} ${CONFIG.brand}. Demo profesional personalizable.</span><span>Fotos de muestra: Unsplash · reemplazar por fotos reales antes de publicar.</span></div>
        </div>
      </footer>`;
  }

  if (floating) {
    floating.innerHTML = `<a class="whatsapp-float" href="${waLink('Hola, vi la web y quisiera hacer un pedido.')}" target="_blank" rel="noopener" aria-label="Contactar por WhatsApp">${icon('whatsapp')}<span>WhatsApp</span></a>`;
  }

  injectCartDrawer();
}

function waLink(message) {
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
}

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}
function setCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartUI();
}
function cartCount() { return getCart().reduce((sum, item) => sum + item.qty, 0); }
function cartTotal() { return getCart().reduce((sum, item) => sum + item.price * item.qty, 0); }
function money(value) { return `${CONFIG.currency || 'S/'} ${Number(value).toFixed(2).replace('.00','')}`; }

window.addToCart = function(product) {
  const cart = getCart();
  const found = cart.find(item => item.id === product.id);
  if (found) found.qty = Math.min(20, found.qty + 1);
  else cart.push({ id: product.id, name: product.name, price: Number(product.price), image: product.image, qty: 1 });
  setCart(cart);
  openCart();
};

function updateQty(id, delta) {
  let cart = getCart();
  const item = cart.find(p => p.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(p => p.id !== id);
  setCart(cart);
}

function updateCartUI() {
  document.querySelectorAll('[data-cart-count]').forEach(el => el.textContent = cartCount());
  const body = document.querySelector('[data-cart-body]');
  const total = document.querySelector('[data-cart-total]');
  const checkoutBtn = document.querySelector('[data-checkout-open]');
  if (!body) return;
  const cart = getCart();
  if (!cart.length) {
    body.innerHTML = `<div class="empty"><div><strong>Tu carrito está vacío</strong><p class="mt-8">Elige una torta o un postre del catálogo.</p><a class="btn btn-secondary mt-24" href="catalogo.html">Ver catálogo</a></div></div>`;
    if (checkoutBtn) checkoutBtn.disabled = true;
  } else {
    body.innerHTML = cart.map(item => `
      <article class="cart-item">
        <img src="${item.image}" alt="" loading="lazy">
        <div><h4>${escapeHtml(item.name)}</h4><p>${money(item.price)} c/u</p><div class="qty"><button type="button" data-qty="-1" data-id="${item.id}" aria-label="Reducir cantidad">−</button><strong>${item.qty}</strong><button type="button" data-qty="1" data-id="${item.id}" aria-label="Aumentar cantidad">+</button></div></div>
        <strong>${money(item.price * item.qty)}</strong>
      </article>`).join('');
    if (checkoutBtn) checkoutBtn.disabled = false;
  }
  if (total) total.textContent = money(cartTotal());
}

function injectCartDrawer() {
  if (document.querySelector('[data-cart-drawer]')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <aside class="cart-drawer" data-cart-drawer aria-hidden="true">
      <div class="drawer-backdrop" data-cart-close></div>
      <div class="drawer-panel" role="dialog" aria-modal="true" aria-label="Carrito de pedidos">
        <div class="drawer-head"><h2>Tu pedido</h2><button class="icon-btn" type="button" data-cart-close aria-label="Cerrar carrito">${icon('close')}</button></div>
        <div class="drawer-body" data-cart-body></div>
        <div class="drawer-foot"><div class="cart-total"><span>Total referencial</span><span data-cart-total>S/ 0</span></div><button class="btn btn-primary btn-block" type="button" data-checkout-open>Continuar pedido</button><p class="help mt-8">El pedido queda sujeto a confirmación de fecha, disponibilidad y adelanto.</p></div>
      </div>
    </aside>
    <div class="modal" data-checkout-modal aria-hidden="true">
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <button class="icon-btn modal-close" type="button" data-checkout-close aria-label="Cerrar">${icon('close')}</button>
        <p class="eyebrow">Finalizar solicitud</p><h2 id="checkout-title">Datos para coordinar tu pedido</h2>
        <div class="checkout-summary" data-checkout-summary></div>
        <form data-checkout-form>
          <div class="form-grid">
            <div class="field"><label class="required" for="checkout-name">Nombre</label><input id="checkout-name" name="name" required maxlength="80" autocomplete="name"></div>
            <div class="field"><label class="required" for="checkout-phone">WhatsApp</label><input id="checkout-phone" name="phone" required inputmode="tel" placeholder="+51 999 999 999" autocomplete="tel"></div>
            <div class="field"><label class="required" for="checkout-date">Fecha deseada</label><input id="checkout-date" type="date" name="eventDate" required></div>
            <div class="field"><label for="checkout-district">Distrito</label><input id="checkout-district" name="district" maxlength="80" placeholder="Ej. Los Olivos"></div>
            <div class="field"><label class="required" for="checkout-delivery">Entrega</label><select id="checkout-delivery" name="deliveryMethod" required><option value="pickup">Recojo coordinado</option><option value="delivery">Delivery (sujeto a zona)</option></select></div>
            <div class="field"><label for="checkout-payment">Forma de pago</label><select id="checkout-payment" name="paymentMethod"><option>Yape / Plin</option><option>Transferencia</option><option>Por coordinar</option></select></div>
            <div class="field full"><label for="checkout-notes">Notas del pedido</label><textarea id="checkout-notes" name="notes" maxlength="600" placeholder="Colores, mensaje, horario preferido, etc."></textarea></div>
          </div>
          <div class="alert" data-checkout-alert></div>
          <button class="btn btn-primary btn-block mt-24" type="submit">Registrar y continuar por WhatsApp</button>
          <p class="help mt-8">No se cobra automáticamente. La pastelera confirma disponibilidad y el monto del adelanto antes de aceptar el pedido.</p>
        </form>
      </div>
    </div>`);
  updateCartUI();
}

function openCart() {
  const drawer = document.querySelector('[data-cart-drawer]');
  if (!drawer) return;
  drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false'); document.body.classList.add('drawer-open');
}
function closeCart() {
  const drawer = document.querySelector('[data-cart-drawer]');
  if (!drawer) return;
  drawer.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); document.body.classList.remove('drawer-open');
}
function openCheckout() {
  if (!getCart().length) return;
  closeCart();
  const modal = document.querySelector('[data-checkout-modal]');
  const summary = document.querySelector('[data-checkout-summary]');
  const date = document.querySelector('#checkout-date');
  const min = new Date(); min.setDate(min.getDate() + 1);
  date.min = min.toISOString().slice(0,10);
  summary.innerHTML = getCart().map(i => `<div>${i.qty} × ${escapeHtml(i.name)} <strong style="float:right">${money(i.qty*i.price)}</strong></div>`).join('') + `<hr style="border:0;border-top:1px solid #eadad4"><strong>Total referencial: ${money(cartTotal())}</strong>`;
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open');
}
function closeCheckout() {
  const modal = document.querySelector('[data-checkout-modal]');
  if (!modal) return;
  modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.classList.remove('modal-open');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}
window.escapeHtml = escapeHtml;
window.money = money;
window.waLink = waLink;

async function submitCheckout(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const alert = document.querySelector('[data-checkout-alert]');
  const fd = new FormData(form);
  const payload = {
    type: 'catalog',
    eventDate: fd.get('eventDate'),
    deliveryMethod: fd.get('deliveryMethod'),
    paymentMethod: fd.get('paymentMethod'),
    notes: fd.get('notes'),
    customer: { name: fd.get('name'), phone: fd.get('phone'), district: fd.get('district') },
    items: getCart()
  };
  alert.className = 'alert';
  try {
    const response = await fetch('/api/orders', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'No se pudo registrar el pedido.');
    alert.textContent = `Solicitud ${result.id} registrada. Abriendo WhatsApp…`;
    alert.className = 'alert success visible';
    const lines = getCart().map(i => `• ${i.qty} x ${i.name} — ${money(i.qty*i.price)}`).join('\n');
    const msg = `Hola, acabo de registrar el pedido ${result.id} en la web.\n\n${lines}\n\nTotal referencial: ${money(cartTotal())}\nFecha deseada: ${payload.eventDate}\nEntrega: ${payload.deliveryMethod === 'delivery' ? 'Delivery' : 'Recojo coordinado'}\n\nQuedo pendiente de la confirmación y adelanto.`;
    setCart([]);
    setTimeout(() => { window.open(waLink(msg), '_blank', 'noopener'); closeCheckout(); form.reset(); }, 700);
  } catch (error) {
    alert.textContent = error.message;
    alert.className = 'alert error visible';
  }
}

function initFaqs() {
  document.querySelectorAll('.faq-button').forEach(btn => btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const open = item.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }));
}

function initReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) return els.forEach(el => el.classList.add('revealed'));
  const obs = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('revealed'); obs.unobserve(entry.target); } }), { threshold: .12 });
  els.forEach(el => obs.observe(el));
}

function initInteractions() {
  document.addEventListener('click', (e) => {
    const menu = e.target.closest('[data-menu-toggle]');
    if (menu) {
      const open = document.body.classList.toggle('menu-open');
      menu.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.innerHTML = open ? icon('close') : icon('menu');
    }
    if (e.target.closest('[data-cart-open]')) openCart();
    if (e.target.closest('[data-cart-close]')) closeCart();
    if (e.target.closest('[data-checkout-open]')) openCheckout();
    if (e.target.closest('[data-checkout-close]')) closeCheckout();
    const qty = e.target.closest('[data-qty]');
    if (qty) updateQty(qty.dataset.id, Number(qty.dataset.qty));
  });
  document.querySelector('[data-checkout-form]')?.addEventListener('submit', submitCheckout);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeCart(); closeCheckout(); document.body.classList.remove('menu-open'); } });
}

renderShell();
initInteractions();
initFaqs();
initReveal();
updateCartUI();
