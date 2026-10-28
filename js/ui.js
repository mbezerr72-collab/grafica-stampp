// Partes comuns às páginas: header, gaveta do carrinho, toast e finalização do pedido.
import { cart, lineInfo, totals } from './cart.js';
import { brl } from '../data/products.js';
import { SITE, waLink } from './config.js';

export const ICONS = {
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"/><circle cx="10" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.6 2 2.17 6.43 2.17 11.87c0 1.74.46 3.44 1.32 4.94L2.1 22l5.32-1.4a9.86 9.86 0 0 0 4.62 1.17c5.45 0 9.87-4.43 9.87-9.87a9.8 9.8 0 0 0-2.86-6.99Zm-7.01 15.19a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.16.83.84-3.08-.2-.32a8.2 8.2 0 0 1-1.26-4.33c0-4.53 3.69-8.21 8.22-8.21a8.2 8.2 0 0 1 8.21 8.22c0 4.53-3.69 8.22-8.17 8.22Zm4.5-6.15c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.78.96-.15.17-.29.19-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.12.25-.29.37-.44.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.12.16 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.6.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  insta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};

// Ícone genérico por categoria (enquanto não houver foto em img/produtos/<id>.png)
const PH = {
  camisas: '<path d="M8 3 3 6l2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0Z"/>',
  uniformes: '<path d="M8 3 3 6l2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0Z"/><path d="M10 13h4"/>',
  canecas: '<path d="M5 6h11v11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V6Z"/><path d="M16 9h2a2 2 0 0 1 0 4h-2"/>',
  trofeus: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8l-1-4H9l-1 4Z"/>',
  coletes: '<path d="M8 3 5 6v15h5v-8h4v8h5V6l-3-3-4 5-4-5Z"/>',
  impressos: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 10h6M8 14h4"/>',
  comunicacao: '<path d="M4 5h16v10H4z"/><path d="M12 15v5M8 20h8"/>',
};
export const placeholder = (cat) => `<svg class="ph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round">${PH[cat] || PH.impressos}</svg>`;
export const productImg = (src, cat, alt = '') =>
  `<img src="${src}" alt="${alt}" loading="lazy" onerror="this.outerHTML=this.dataset.ph" data-ph='${placeholder(cat)}'>`;

let toastTimer;
export function toast(msg) {
  const el = document.getElementById('toast');
  el.innerHTML = `<i>✓</i>${msg}`;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 2600);
}

const overlay = () => document.getElementById('overlay');
const openLayers = new Set();
export function openLayer(el) {
  el.classList.add('on'); openLayers.add(el);
  overlay().classList.add('on'); document.body.classList.add('locked');
}
export function closeLayers() {
  openLayers.forEach((el) => el.classList.remove('on')); openLayers.clear();
  overlay().classList.remove('on'); document.body.classList.remove('locked');
}

export function initHeader() {
  const hdr = document.querySelector('.hdr');
  const onScroll = () => hdr.classList.toggle('solid', scrollY > 30);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const nav = document.querySelector('.nav');
  document.querySelector('.menu-btn')?.addEventListener('click', () => nav.classList.toggle('on'));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('on')));

  document.querySelectorAll('[data-wa]').forEach((a) => { a.href = waLink('Olá! Vim pelo site da Gráfica Estamp e quero fazer um orçamento.'); });
  document.getElementById('overlay').addEventListener('click', closeLayers);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLayers(); });
}

export function initDrawer() {
  const drawer = document.getElementById('drawer');
  const list = drawer.querySelector('.drawer-items');
  const foot = drawer.querySelector('.drawer-foot');
  const badge = document.querySelector('.badge-count');

  document.querySelectorAll('[data-open-cart]').forEach((b) => b.addEventListener('click', () => openLayer(drawer)));
  drawer.querySelector('.modal-close').addEventListener('click', closeLayers);

  cart.onChange((items) => {
    const t = totals(items);
    badge.textContent = t.count;
    badge.classList.toggle('on', t.count > 0);
    if (!items.length) {
      list.innerHTML = `<div class="empty">${ICONS.cart}<p>Seu carrinho está vazio.</p><a href="index.html#catalogo" class="btn btn-ghost" data-close>Ver produtos</a></div>`;
      list.querySelector('[data-close]').addEventListener('click', closeLayers);
      foot.hidden = true;
      return;
    }
    foot.hidden = false;
    list.innerHTML = items.map((i) => {
      const l = lineInfo(i);
      if (!l) return '';
      const thumb = l.thumb?.startsWith('data:') ? `<img src="${l.thumb}" alt="">` : productImg(l.thumb, l.cat || 'uniformes');
      return `<div class="line" data-key="${i.key}">
        <div class="line-thumb">${thumb}</div>
        <div><h4>${l.title}</h4><small>${escapeHtml(l.sub)}</small>
          <div class="qty"><button data-q="-1" aria-label="Diminuir">−</button><span>${i.qty}</span><button data-q="1" aria-label="Aumentar">+</button></div></div>
        <div class="line-right"><b>${brl(l.total)}</b><button class="rm">remover</button></div>
      </div>`;
    }).join('');
    foot.querySelector('.sum b').textContent = t.label;
  });

  list.addEventListener('click', (e) => {
    const line = e.target.closest('.line');
    if (!line) return;
    const key = line.dataset.key;
    const item = cart.items().find((i) => i.key === key);
    if (e.target.closest('.rm')) cart.remove(key);
    const q = e.target.closest('[data-q]');
    if (q && item) {
      if (item.id === 'custom' && item.config?.roster?.length) return toast('Ajuste a quantidade na lista de jogadores');
      cart.setQty(key, item.qty + Number(q.dataset.q));
    }
  });

  foot.querySelector('[data-checkout-wa]').addEventListener('click', () => {
    window.open(waLink(orderMessage()), '_blank', 'noopener');
  });
  foot.querySelector('[data-checkout-pay]').addEventListener('click', payOnline);
}

export const escapeHtml = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function orderMessage(items = cart.items()) {
  const lines = items.map((i) => {
    const l = lineInfo(i);
    if (!l) return '';
    let s = `• ${i.qty}x ${l.title} (${l.sub}) — ${brl(l.total)}`;
    const c = i.config;
    if (c) {
      s += `\n   Cores: corpo ${c.body}, manga ${c.sleeve}, gola ${c.collar}, detalhe ${c.detail}, estampa ${c.pattern} ${c.patternColor}`;
      if (c.shorts) s += `, short ${c.shortsColor}/${c.shortsDetail}`;
      if (c.sponsor) s += `\n   Patrocinador: ${c.sponsor}`;
      if (c.hasLogo) s += `\n   (vou enviar o escudo/logo aqui na conversa)`;
      if (c.roster?.length) s += '\n   Jogadores:\n' + c.roster.map((r) => `     - ${r.name || '(sem nome)'} #${r.number || '-'} ${r.size}`).join('\n');
    }
    return s;
  }).join('\n');
  return `Olá, ${SITE.name}! Quero fazer este pedido:\n\n${lines}\n\nTotal estimado: ${totals(items).label}\n(valores do site, sujeitos a confirmação)`;
}

async function payOnline(e) {
  const btn = e.currentTarget;
  btn.disabled = true;
  try {
    const items = cart.items().map(({ id, qty, size, config }) => ({ id, qty, size, config: config && { ...config, logo: undefined } }));
    const r = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.url) throw new Error(data.error || 'indisponível');
    location.href = data.url;
  } catch {
    toast('Pagamento online indisponível — finalize pelo WhatsApp');
    btn.disabled = false;
  }
}
