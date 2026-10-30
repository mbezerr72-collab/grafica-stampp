import { CATEGORIES, productById } from '../data/products.js?v=2610301230';
import { SITE, waLink, hoursTable, isOpenNow } from './config.js?v=2610301230';
import { worksOf } from './works.js?v=2610301230';
import { layout, icon, shopCard, priceLine, rail, openLightbox, esc, $ } from './ui.js?v=2610301230';
import { PRODUCTS } from '../data/products.js?v=2610301230';

layout('inicio');
document.querySelectorAll('[data-i]').forEach((el) => { if (el.tagName === 'SPAN') el.outerHTML = icon(el.dataset.i); else el.innerHTML = icon(el.dataset.i); });

// Letreiro rolando com as linhas de produto (duas voltas para emendar sem pulo)
const MARQ = ['Cartões de visita', 'Camisas', 'Uniformes', 'Canecas', 'Banners', 'Fachadas', 'Adesivos', 'Troféus', 'Chaveiros'];
$('#marq').innerHTML = [...MARQ, ...MARQ].map((t) => `<span>${t}</span>`).join('');

// Categorias: blocos de cor com o nome em cima e a foto de um trabalho embaixo
const CATS = [
  ['impressos', 'img/trabalhos/cartao-fotografico/01.jpg', 'contain'],
  ['camisas', 'img/trabalhos/camisas-polo/03.jpg', 'cover'],
  ['brindes', 'img/trabalhos/canecas/02.jpg', 'contain'],
  ['comunicacao', 'img/trabalhos/fachadas-letreiros/03.jpg', 'cover'],
  ['design', 'img/trabalhos/criacao-logotipo/01.jpg', 'cover'],
];
$('#cats').innerHTML = CATS.map(([cat, img, fit]) => {
  const c = CATEGORIES.find((x) => x.id === cat);
  const n = PRODUCTS.filter((p) => p.cat === cat).length;
  return `<article class="cat-card">
    <div class="cat-meta"><h3><a href="produtos.html?cat=${cat}">${c.label}</a></h3>
      <span class="cat-n">${n} produtos ${icon('arrow')}</span></div>
    <div class="cat-art fit-${fit}"><img src="${img}" alt="" loading="lazy" width="600" height="600"></div>
  </article>`;
}).join('');

// Mais pedidos: uma fileira por linha de produto, com título em cima e os modelos lado a lado (cada um com página própria)
const ROWS = [
  { title: 'Camisas personalizadas', href: 'produtos.html?cat=camisas', ids: ['camisas-personalizadas', 'uniformes-esportivos', 'camisas-eventos', 'camisas-polo', 'uniformes-profissionais'] },
  { title: 'Cartões e impressos', href: 'produtos.html?cat=impressos', ids: ['cartao-fotografico', 'panfletos', 'cartazes-folders', 'blocos-receituarios', 'adesivos-etiquetas'] },
  { title: 'Canecas personalizadas', href: 'produto.html?id=canecas', ids: ['canecas'] },
  { title: 'Canetas personalizadas', href: 'produto.html?id=canetas', ids: ['canetas', 'kits-empresas'] },
  { title: 'Ecobags personalizadas', href: 'produto.html?id=ecobags', ids: ['ecobags'] },
  { title: 'Troféus e medalhas', href: 'produto.html?id=trofeus-medalhas', ids: ['trofeus-medalhas'] },
  { title: 'Chaveiros personalizados', href: 'produto.html?id=chaveiros', ids: ['chaveiros'] },
  { title: 'Comunicação visual', href: 'produtos.html?cat=comunicacao', ids: ['fachadas-letreiros', 'banners-lonas', 'adesivos-vitrine', 'placas-personalizadas'] },
  { title: 'Design e criação', href: 'produtos.html?cat=design', ids: ['criacao-logotipo', 'arte-divulgacao'] },
];
// Uma aba por linha de produto; só a aba escolhida mostra a fileira
const rows = ROWS.map((r) => ({ ...r, items: r.ids.flatMap((id) => worksOf(id).map((w, m) => ({ ...w, m }))) })).filter((r) => r.items.length);
$('#tabs').innerHTML = rows.map((r, k) => `<button class="tab" role="tab" id="tab-${k}" aria-controls="panel-${k}" aria-selected="${!k}" tabindex="${k ? -1 : 0}">${r.title}</button>`).join('');
$('#featured').innerHTML = rows.map((r, k) => {
  const cards = r.items.map((w, i) => {
    const p = productById(w.id);
    return shopCard({ href: `produto.html?id=${w.id}&m=${w.m}`, img: w.src, fit: w.fit, fav: `${w.id}:${w.m}`,
      badge: i === 0 ? 'Mais pedido' : '', title: w.cap, sub: p.name, price: priceLine(p) });
  }).join('');
  return `<div class="rail-panel" role="tabpanel" id="panel-${k}" aria-labelledby="tab-${k}"${k ? ' hidden' : ''}>
    <div class="rail-wrap">
      <button class="rail-btn rail-side" data-prev aria-label="Ver os anteriores">${icon('arrow')}</button>
      <div class="rail">${cards}</div>
      <button class="rail-btn rail-side" data-next aria-label="Ver os próximos">${icon('arrow')}</button>
    </div></div>`;
}).join('');
const panels = [...document.querySelectorAll('#featured .rail-panel')];
const tabs = [...document.querySelectorAll('#tabs .tab')];
const ready = new Set();
const pick = (k, focus) => {
  tabs.forEach((t, i) => { t.setAttribute('aria-selected', i === k); t.tabIndex = i === k ? 0 : -1; });
  panels.forEach((p, i) => { p.hidden = i !== k; });
  if (!ready.has(k)) { ready.add(k); const p = panels[k]; rail(p.querySelector('.rail'), p.querySelector('[data-prev]'), p.querySelector('[data-next]')); }
  $('#tabAll').href = rows[k].href;
  $('#tabAll').firstChild.textContent = `Ver tudo de ${rows[k].title.toLowerCase()} `;
  if (focus) { tabs[k].focus(); tabs[k].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); }
};
tabs.forEach((t, k) => t.addEventListener('click', () => pick(k)));
$('#tabs').addEventListener('keydown', (e) => {
  const k = tabs.indexOf(document.activeElement);
  if (k < 0) return;
  const to = { ArrowRight: k + 1, ArrowLeft: k - 1, Home: 0, End: tabs.length - 1 }[e.key];
  if (to == null) return;
  e.preventDefault(); pick((to + tabs.length) % tabs.length, true);
});
pick(0);

// Ideias para o pedido: mosaico de fotos (as de foto inteira), ampliam no clique
const WORK = [['fachadas-letreiros', 1], ['adesivos-vitrine', 2], ['adesivos-vitrine', 0], ['chaveiros', 2], ['placas-personalizadas', 2], ['trofeus-medalhas', 8], ['fachadas-letreiros', 3], ['chaveiros', 1]];
const works = WORK.map(([id, i]) => worksOf(id)[i]).filter(Boolean);
$('#works').innerHTML = works.map((w, i) => `<button class="work-tile" data-w="${i}" aria-label="Ampliar: ${esc(w.cap)}"><img src="${w.src}" alt="${esc(w.cap)}" loading="lazy"><span>${esc(w.cap)}</span></button>`).join('');
$('#works').addEventListener('click', (e) => { const b = e.target.closest('[data-w]'); if (b) openLightbox(works, Number(b.dataset.w)); });

$('#ctaWa').href = waLink('Olá! Preciso de um orçamento personalizado. Minha ideia é: ');
$('#badgeYear').textContent = SITE.since;
$('#years').textContent = `+${new Date().getFullYear() - SITE.since}`;

const open = isOpenNow();
$('#heroStatus').innerHTML = `<span class="status ${open ? 'on' : 'off'}">${open ? 'Aberta agora' : 'Fechada agora'}</span>${open ? 'Resposta no horário de atendimento' : 'Mande o pedido; respondemos quando abrir'}`;
$('#contactBox').innerHTML = `
  <span class="status ${open ? 'on' : 'off'}">${open ? 'Aberta agora' : 'Fechada agora'}</span>
  <div class="c-row" style="margin-top:12px">${icon('wa')}<div><b><a href="${waLink('Olá! Vim pelo site.')}" target="_blank" rel="noopener">${SITE.phone}</a></b><span>WhatsApp · atendimento por mensagem</span></div></div>
  <div class="c-row">${icon('pin')}<div><b>${SITE.address}</b><span>${SITE.city}</span></div></div>
  <div class="c-row">${icon('insta')}<div><b><a href="https://instagram.com/${SITE.instagram}" target="_blank" rel="noopener">@${SITE.instagram}</a></b><span>Trabalhos recentes e novidades</span></div></div>
  <div class="c-row" style="border:0">${icon('clock')}<div style="flex:1"><b>Horário</b><div class="hours">${hoursTable().map(([d, h]) => `<span>${d}</span><span>${h}</span>`).join('')}</div></div></div>
  <a class="btn btn-wa btn-block" href="${waLink('Olá! Vim pelo site.')}" target="_blank" rel="noopener">${icon('wa')}Chamar no WhatsApp</a>
  <a class="btn btn-line btn-block" style="margin-top:10px" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.mapsQuery)}" target="_blank" rel="noopener">${icon('pin')}Abrir no Google Maps</a>`;

// O mapa carrega quando a seção aparece. Em ambientes que bloqueiam mapas embutidos
// (como a pré-visualização do Claude), mostra um cartão com o link.
const map = $('#map');
const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Gráfica Estamp, ${SITE.mapsQuery}`)}`;
const embedAllowed = !/claude|anthropic/.test(location.hostname);
new IntersectionObserver((entries, obs) => {
  if (!entries[0].isIntersecting) return;
  obs.disconnect();
  map.innerHTML = embedAllowed
    ? `<iframe title="Mapa: Gráfica Estamp, ${SITE.address}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen
        src="https://www.google.com/maps?q=${encodeURIComponent(`Gráfica Estamp, ${SITE.mapsQuery}`)}&z=17&output=embed"></iframe>`
    : `<a class="map-fallback" href="${mapsLink}" target="_blank" rel="noopener">${icon('pin')}<b>${SITE.address}</b><span>${SITE.city}</span><span class="btn btn-dark btn-sm">Abrir no Google Maps</span></a>`;
}, { rootMargin: '300px' }).observe(map);

// ===== Abertura: "GRÁFICA" é digitada letra por letra e "ESTAMP" aparece em seguida =====
(function intro() {
  const el = $('#intro');
  if (!el) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const end = () => { if (el.classList.contains('out')) return; el.classList.add('out'); document.body.classList.remove('intro-on'); setTimeout(() => el.remove(), 700); };
  $('#introSkip').addEventListener('click', end);
  document.body.classList.add('intro-on');
  const word = 'GRÁFICA', out = $('#introType');
  if (reduce) { out.textContent = word; el.classList.add('show-e'); setTimeout(end, 900); return; }
  let i = 0;
  const type = () => {
    out.textContent = word.slice(0, ++i);
    if (i < word.length) setTimeout(type, 140);
    else setTimeout(() => { el.classList.add('show-e'); setTimeout(() => el.classList.add('stamp'), 550); setTimeout(end, 1900); }, 250);
  };
  document.fonts.ready.then(() => setTimeout(type, 300));
  setTimeout(end, 6000); // garantia: nunca prende o visitante
})();
