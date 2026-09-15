(async function(){
  const grid = document.querySelector('[data-home-products]');
  if (!grid) return;
  try {
    const products = await (await fetch('/api/products')).json();
    grid.innerHTML = products.slice(0,3).map(p => `<article class="product-card revealed"><div class="product-media"><img src="${p.image}" alt="${escapeHtml(p.alt)}" loading="lazy"><span class="badge">${escapeHtml(p.badge)}</span></div><div class="product-body"><div class="product-meta"><span>${escapeHtml(p.servings)}</span><span>${escapeHtml(p.leadTime)}</span></div><div class="product-title-row"><h3>${escapeHtml(p.name)}</h3><span class="price">${money(p.price)}</span></div><p class="product-desc">${escapeHtml(p.description)}</p><div class="product-actions"><button class="btn btn-primary" data-home-add="${p.id}">Añadir</button><a class="btn btn-secondary" href="catalogo.html">Ver más</a></div></div></article>`).join('');
    document.querySelectorAll('[data-home-add]').forEach(btn => btn.addEventListener('click',()=>{ const p=products.find(x=>x.id===btn.dataset.homeAdd); if(p)addToCart(p); }));
  } catch { grid.innerHTML = '<p class="muted">No se pudo cargar el catálogo.</p>'; }
})();
