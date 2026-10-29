import { CATEGORIES, productById } from '../data/products.js?v=2610291430';
import { SITE, waLink, hoursTable, isOpenNow } from './config.js?v=2610291430';
import { worksOf } from './works.js?v=2610291430';
import { layout, icon, shopCard, priceLine, rail, $ } from './ui.js?v=2610291430';

layout('inicio');
document.querySelectorAll('[data-i]').forEach((el) => { if (el.tagName === 'SPAN') el.outerHTML = icon(el.dataset.i); else el.innerHTML = icon(el.dataset.i); });

$('#trust').innerHTML = [['shield', `Desde ${SITE.since}`], ['wa', 'Atendimento pelo WhatsApp'], ['truck', 'Retirada ou entrega']]
  .map(([i, t]) => `<span>${icon(i)}${t}</span>`).join('');

// Categorias: arte em cima e a lista de produtos em texto, cada nome é um link
const CATS = [
  ['impressos', 305, ['cartao-visita', 'cartao-fotografico', 'panfletos', 'cartazes-folders', 'adesivos-etiquetas']],
  ['camisas', 296, ['camisas-personalizadas', 'camisas-polo', 'uniformes-profissionais', 'uniformes-esportivos', 'camisas-eventos']],
  ['brindes', 271, ['canecas', 'trofeus-medalhas', 'chaveiros', 'canetas', 'ecobags']],
  ['comunicacao', 298, ['banners-lonas', 'fachadas-letreiros', 'adesivos-vitrine', 'placas-personalizadas']],
  ['design', 294, ['criacao-logotipo', 'arte-divulgacao', 'arte-camisas', 'identidade-visual', 'ajustes-arquivos']],
];
$('#cats').innerHTML = CATS.map(([cat, w, ids]) => {
  const c = CATEGORIES.find((x) => x.id === cat);
  return `<div class="cat-card" style="flex:${w} 1 0">
    <a class="cat-art" href="produtos.html?cat=${cat}"><img src="img/cards/cat-${cat}-top.jpg" alt="${c.label}" loading="lazy"></a>
    <ul class="cat-list">${ids.map((id) => `<li><a href="produto.html?id=${id}">${icon('check')}<span>${productById(id).name}</span></a></li>`).join('')}</ul>
  </div>`;
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
$('#featured').innerHTML = ROWS.map((r, k) => {
  const items = r.ids.flatMap((id) => worksOf(id).map((w, m) => ({ ...w, m })));
  if (!items.length) return ''; // fileira sem modelos ainda não aparece
  const cards = items.map((w, i) => {
    const p = productById(w.id);
    return shopCard({ href: `produto.html?id=${w.id}&m=${w.m}`, img: w.src, fit: w.fit, fav: `${w.id}:${w.m}`,
      badge: i === 0 ? 'Mais pedido' : '',
      title: w.cap, sub: p.name, price: priceLine(p) });
  }).join('');
  return `<section class="row" aria-labelledby="row-${k}">
    <div class="row-head"><h3 id="row-${k}">${r.title}</h3>
      <div class="row-nav"><a class="link-arrow" href="${r.href}">Ver todos</a></div></div>
    <div class="rail-wrap">
      <button class="rail-btn rail-side" data-prev aria-label="Ver os anteriores">${icon('arrow')}</button>
      <div class="rail">${cards}</div>
      <button class="rail-btn rail-side" data-next aria-label="Ver os próximos">${icon('arrow')}</button>
    </div>
  </section>`;
}).join('');
document.querySelectorAll('#featured .row').forEach((row) => rail(row.querySelector('.rail'), row.querySelector('[data-prev]'), row.querySelector('[data-next]')));

$('#ctaWa').href = waLink('Olá! Preciso de um orçamento personalizado. Minha ideia é: ');
$('#years').textContent = `+${new Date().getFullYear() - SITE.since}`;

const open = isOpenNow();
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
