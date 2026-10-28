// Partes comuns a todas as páginas: cabeçalho, rodapé, ícones, card de produto e avisos.
import { CATEGORIES, PRODUCTS, brl } from '../data/products.js';
import { cart, totals } from './cart.js';
import { SITE, waLink } from './config.js';

// Ícones (traço simples, 24×24)
const P = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  cart: '<path d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20" r="1.2"/><circle cx="17" cy="20" r="1.2"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  wa: '<path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.5L3.5 20.5l1.4-4.2A8.5 8.5 0 1 1 20.5 11.6Z"/><path d="M8.8 8.6c.2-.5.5-.6.8-.6h.5c.2 0 .4 0 .5.4l.7 1.6c.1.2 0 .4-.1.6l-.4.5c-.1.1-.2.3 0 .5.5.9 1.3 1.7 2.2 2.2.2.1.4.1.5 0l.5-.6c.2-.2.4-.2.6-.1l1.6.8c.2.1.3.2.3.4 0 .5-.2 1.2-.7 1.5-.6.4-1.4.5-2.3.2a9 9 0 0 1-4.8-4.6c-.4-.9-.3-1.8.1-2.8Z"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  insta: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  bag: '<path d="M6 7h12l1 13H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
  doc: '<path d="M7 3h7l5 5v13H7V3Z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  inbox: '<path d="M4 13h4l2 3h4l2-3h4"/><path d="M5 5h14l1 8v6H4v-6l1-8Z"/>',
  approve: '<path d="M7 3h7l5 5v13H7V3Z"/><path d="m10 15 2 2 4-4"/>',
  devices: '<rect x="3" y="4" width="13" height="10" rx="1.5"/><path d="M7 18h5"/><rect x="15" y="9" width="6" height="11" rx="1.5"/>',
  truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  store: '<path d="M4 9 5.5 4h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  pen: '<path d="M4 20l4-1 11-11-3-3L5 16l-1 4Z"/><path d="M14 6l3 3"/>',
  shield: '<path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  ruler: '<path d="M3 17 17 3l4 4L7 21l-4-4Z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8l-1-4H9l-1 4Z"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M16 7l2 2M14 9l2 2"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  // camisas
  tee: '<path d="M8 3 3 6l2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0Z"/>',
  polo: '<path d="M8 3 3 6l2 5 3-1v11h8V10l3 1 2-5-5-3-2 3-2-3Z"/><path d="M12 6v4"/>',
  dryfit: '<path d="M8 3 3 6l2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0Z"/><path d="M9 14l3-3 3 3"/>',
  oversized: '<path d="M7 3 1 7l2 5 4-1v10h10V11l4 1 2-5-6-4a5 5 0 0 1-10 0Z"/>',
  front: '<path d="M8 3 3 6l2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0Z"/><rect x="10" y="11" width="4" height="4" fill="currentColor" stroke="none"/>',
  back: '<path d="M8 3 3 6l2 5 3-1v11h8V10l3 1 2-5-5-3c-1 1-2.3 1.4-4 1.4S9 4 8 3Z"/><rect x="9.5" y="9" width="5" height="7" fill="currentColor" stroke="none"/>',
  both: '<path d="M8 3 3 6l2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0Z"/><rect x="10" y="10" width="4" height="3" fill="currentColor" stroke="none"/><rect x="10" y="15" width="4" height="3" fill="currentColor" stroke="none"/>',
  sleeves: '<path d="M8 3 3 6l2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0Z"/><path d="M3.6 7.5l1.5 3.4M20.4 7.5l-1.5 3.4" stroke-width="3"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01"/>',
};
export const icon = (name, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;

export const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (s, el = document) => el.querySelector(s);
export const catById = (id) => CATEGORIES.find((c) => c.id === id);

// ===== Cabeçalho e rodapé =====
export function layout(active) {
  // toda página abre no topo (o navegador às vezes restaura a rolagem da visita anterior)
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) scrollTo(0, 0);
  const nav = [['index.html', 'Início', 'inicio'], ['produtos.html', 'Produtos', 'produtos'], ['index.html#sobre', 'Sobre', 'sobre'], ['index.html#contato', 'Contato', 'contato']];
  document.body.insertAdjacentHTML('afterbegin', `
    <a class="sr" href="#conteudo">Pular para o conteúdo</a>
    <div class="topbar"><div class="wrap">
      <span>${icon('wa')}Atendimento pelo WhatsApp <a href="${waLink('Olá! Vim pelo site.')}" target="_blank" rel="noopener">${SITE.phone}</a></span>
      <span class="hide-m">${icon('clock')}Seg a sex 7h30–17h30 · Sáb 7h30–11h30</span>
    </div></div>
    <header class="hdr">
      <div class="wrap">
        <a href="index.html" class="brand"><img src="assets/logo-dark.png" alt="Gráfica Estamp" width="150" height="30"></a>
        <nav class="nav" id="nav" aria-label="Principal">
          ${nav.map(([h, l, k]) => `<a href="${h}"${k === active ? ' aria-current="page"' : ''}>${l}</a>`).join('')}
        </nav>
        <div class="hdr-actions">
          <button class="icon-btn" id="searchBtn" aria-label="Buscar produtos" aria-expanded="false">${icon('search')}</button>
          <a class="icon-btn" href="carrinho.html" aria-label="Carrinho">${icon('cart')}<span class="count" id="cartCount" hidden>0</span></a>
          <a class="btn btn-dark btn-sm btn-quote" href="${waLink('Olá! Quero um orçamento.')}" target="_blank" rel="noopener">Pedir orçamento</a>
          <button class="icon-btn menu-btn" id="menuBtn" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav">${icon('menu')}</button>
        </div>
      </div>
      <div class="search" id="search" hidden><div class="wrap">
        <form action="produtos.html" role="search"><input name="q" type="search" placeholder="O que você precisa? Ex.: cartão, caneca, banner" aria-label="Buscar produtos"><button class="btn btn-dark">Buscar</button></form>
      </div></div>
    </header>`);

  const cats = CATEGORIES.map((c) => `<li><a href="produtos.html?cat=${c.id}">${c.label}</a></li>`).join('');
  document.body.insertAdjacentHTML('beforeend', `
    <footer class="ftr">
      <div class="wrap">
        <div class="ftr-grid">
          <div><img src="assets/logo-nav.png" alt="Gráfica Estamp" width="150" height="30">
            <p>Gráfica, comunicação visual e personalizados em Cruzeiro do Sul desde ${SITE.since}.</p></div>
          <div><h4>Produtos</h4><ul>${cats}</ul></div>
          <div><h4>Atendimento</h4><ul>
            <li><a href="${waLink('Olá! Vim pelo site.')}" target="_blank" rel="noopener">WhatsApp ${SITE.phone}</a></li>
            <li><a href="https://instagram.com/${SITE.instagram}" target="_blank" rel="noopener">@${SITE.instagram}</a></li>
            <li><a href="carrinho.html">Meu carrinho</a></li></ul></div>
          <div><h4>Endereço</h4><p>${SITE.address}<br>${SITE.city}</p></div>
        </div>
        <div class="ftr-bottom"><span>© ${new Date().getFullYear()} ${SITE.name}</span><span>Preços e prazos confirmados no atendimento.</span></div>
      </div>
    </footer>
    <a class="wa-float" href="${waLink('Olá! Vim pelo site.')}" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">${icon('wa')}</a>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`);

  const menuBtn = $('#menuBtn'), navEl = $('#nav');
  menuBtn.addEventListener('click', () => { const on = navEl.classList.toggle('on'); menuBtn.setAttribute('aria-expanded', on); });
  navEl.addEventListener('click', (e) => { if (e.target.closest('a')) { navEl.classList.remove('on'); menuBtn.setAttribute('aria-expanded', 'false'); } });
  const sBtn = $('#searchBtn'), sBox = $('#search');
  sBtn.addEventListener('click', () => { sBox.hidden = !sBox.hidden; sBtn.setAttribute('aria-expanded', !sBox.hidden); if (!sBox.hidden) $('input', sBox).focus(); });
  cart.onChange((items) => { const n = totals(items).count; const c = $('#cartCount'); c.textContent = n; c.hidden = !n; });
}

// ===== Card de produto =====
export function priceTag(p) {
  if (p.flow === 'compra') {
    const min = Math.min(...p.options.flatMap((o) => o.choices.map((c) => c.price).filter((x) => x != null)));
    return `<span class="price-sm">a partir de<b>${brl(min)}</b></span>`;
  }
  return p.from ? `<span class="price-sm">a partir de<b>${brl(p.from)}<small style="font-size:12px;color:var(--muted)">/${p.unit}</small></b></span>` : '<span class="price-sm">Preço<b>Sob orçamento</b></span>';
}
// Preço curto para os cards: valor fixo, "a partir de" ou "Consultar preço"
export function priceLine(p) {
  if (p.flow === 'compra') return `a partir de ${brl(Math.min(...p.options.flatMap((o) => o.choices.map((c) => c.price).filter((x) => x != null))))}`;
  return p.from ? `a partir de ${brl(p.from)}` : 'Consultar preço';
}

// Card de produto (catálogo) e card de modelo (fileiras da página inicial): foto, selo, favorito, nome, detalhe, preço e botão
export function shopCard({ href, img, fit = 'cover', badge, fav, title, sub, price }) {
  return `<article class="scard">
    <a class="scard-img fit-${fit}" href="${href}"><img src="${img}" alt="${esc(title)}" loading="lazy" width="600" height="600"></a>
    ${badge ? `<span class="scard-badge">${badge}</span>` : ''}
    <button class="fav${isFav(fav) ? ' on' : ''}" data-fav="${fav}" aria-label="Favoritar ${esc(title)}" aria-pressed="${isFav(fav)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg></button>
    <a class="scard-body" href="${href}"><h3>${esc(title)}</h3><p>${esc(sub)}</p><b>${price}</b></a>
    <a class="btn btn-ink btn-block" href="${href}">Quero esse</a>
  </article>`;
}
export function productCard(p, { showCat = true } = {}) {
  return shopCard({ href: `produto.html?id=${p.id}`, img: p.img, fit: p.fit, badge: p.badge, fav: p.id, title: p.name,
    sub: showCat ? catById(p.cat)?.label : (p.flow === 'compra' ? 'Compra direta' : 'Sob encomenda'), price: priceLine(p) });
}

// Favoritos (só neste navegador)
const FAV = 'estamp-favoritos';
const favs = () => { try { return JSON.parse(localStorage.getItem(FAV)) || []; } catch { return []; } };
const isFav = (k) => favs().includes(k);
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-fav]');
  if (!b) return;
  e.preventDefault();
  const k = b.dataset.fav, list = favs();
  const on = !list.includes(k);
  try { localStorage.setItem(FAV, JSON.stringify(on ? [...list, k] : list.filter((x) => x !== k))); } catch { /* sem armazenamento */ }
  b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
});

// Trilho horizontal: setas com deslize suave e arrastar com o mouse
export function rail(track, prev, next) {
  const stepW = () => track.clientWidth * 0.8;
  const sync = () => {
    prev.disabled = track.scrollLeft < 4;
    next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 4;
  };
  prev.addEventListener('click', () => track.scrollBy({ left: -stepW(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: stepW(), behavior: 'smooth' }));
  track.addEventListener('scroll', sync, { passive: true });
  addEventListener('resize', sync);
  // arrastar com o mouse (no toque o navegador já desliza sozinho)
  let down = null, moved = false;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = { x: e.clientX, left: track.scrollLeft }; moved = false;
  });
  addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x;
    if (Math.abs(dx) > 5) { moved = true; track.classList.add('dragging'); }
    if (moved) track.scrollLeft = down.left - dx;
  });
  addEventListener('pointerup', () => { down = null; setTimeout(() => track.classList.remove('dragging'), 0); });
  track.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  track.addEventListener('dragstart', (e) => e.preventDefault());
  sync();
}
export const productsIn = (cat) => PRODUCTS.filter((p) => p.cat === cat);

let toastTimer;
export function toast(html) {
  const el = $('#toast');
  el.innerHTML = html;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 3500);
}

// ===== Foto ampliada (galerias de modelos) =====
// items: [{ src, cap, id }] — o botão leva à página do produto da foto
let lb, lbItems = [], lbI = 0;
export function openLightbox(items, i) {
  if (!lb) {
    document.body.insertAdjacentHTML('beforeend', `<dialog class="lightbox" id="lightbox" aria-label="Foto ampliada">
      <img id="lbImg" alt=""><div class="lb-bar"><p id="lbCap"></p><a class="btn btn-brand btn-sm" id="lbGo">Quero um igual</a></div>
      <button class="lb-btn lb-close" data-close aria-label="Fechar">✕</button>
      <button class="lb-btn lb-prev" data-step="-1" aria-label="Anterior">‹</button>
      <button class="lb-btn lb-next" data-step="1" aria-label="Próxima">›</button></dialog>`);
    lb = $('#lightbox');
    lb.addEventListener('click', (e) => {
      if (e.target === lb || e.target.closest('[data-close]')) lb.close();
      const n = e.target.closest('[data-step]');
      if (n) step(Number(n.dataset.step));
    });
    lb.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
  }
  lbItems = items; lbI = i; show(); lb.showModal();
}
function step(d) { lbI = (lbI + d + lbItems.length) % lbItems.length; show(); }
function show() {
  const it = lbItems[lbI];
  $('#lbImg').src = it.src; $('#lbImg').alt = it.cap; $('#lbCap').textContent = it.cap;
  $('#lbGo').href = `produto.html?id=${it.id}`;
  lb.querySelectorAll('.lb-prev, .lb-next').forEach((b) => { b.hidden = lbItems.length < 2; });
}
export const workTile = (w, i, cls = 'shelf-item') => `<button class="${cls} work fit-${w.fit}" data-i="${i}" aria-label="Ampliar: ${esc(w.cap)}"><img src="${w.src}" alt="${esc(w.cap)}" loading="lazy"><span>${esc(w.cap)}</span></button>`;
