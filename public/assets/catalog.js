let PRODUCTS = [];
let activeFilter = 'todos';

function productCard(product) {
  return `<article class="product-card" data-category="${product.category}" data-reveal>
    <div class="product-media"><img src="${product.image}" alt="${escapeHtml(product.alt)}" loading="lazy"><span class="badge">${escapeHtml(product.badge)}</span></div>
    <div class="product-body">
      <div class="product-meta"><span>${escapeHtml(product.servings)}</span><span>Anticipación ${escapeHtml(product.leadTime)}</span></div>
      <div class="product-title-row"><h3>${escapeHtml(product.name)}</h3><span class="price">${money(product.price)}</span></div>
      <p class="product-desc">${escapeHtml(product.description)}</p>
      <div class="product-actions"><button class="btn btn-primary" type="button" data-add="${product.id}">Añadir</button><a class="btn btn-secondary" href="personaliza.html">Personalizar</a></div>
    </div>
  </article>`;
}

async function loadProducts() {
  const grid = document.querySelector('[data-product-grid]');
  if (!grid) return;
  try {
    const response = await fetch('/api/products');
    PRODUCTS = await response.json();
    renderProducts();
  } catch {
    grid.innerHTML = '<p>No se pudo cargar el catálogo. Ejecuta la web con <strong>node server.js</strong>.</p>';
  }
}

function renderProducts() {
  const grid = document.querySelector('[data-product-grid]');
  const filtered = activeFilter === 'todos' ? PRODUCTS : PRODUCTS.filter(p => p.category === activeFilter);
  grid.innerHTML = filtered.map(productCard).join('');
  document.querySelectorAll('[data-add]').forEach(btn => btn.addEventListener('click', () => {
    const product = PRODUCTS.find(p => p.id === btn.dataset.add);
    if (product) addToCart(product);
  }));
  document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('revealed'));
}

document.querySelectorAll('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
  activeFilter = btn.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b === btn));
  renderProducts();
}));

loadProducts();
