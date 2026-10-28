import { CATEGORIES, productById } from '../data/products.js';
import { SITE, waLink, hoursTable, isOpenNow } from './config.js';
import { worksOf } from './works.js';
import { layout, icon, openLightbox, workTile, $ } from './ui.js';

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

// Mais pedidos: uma fileira por linha de produto — a arte primeiro e os modelos ao lado
const ROWS = [
  { art: 'prod-camisas', href: 'produtos.html?cat=camisas', label: 'Camisas personalizadas', ids: ['camisas-personalizadas', 'uniformes-esportivos', 'camisas-eventos', 'camisas-polo', 'uniformes-profissionais'] },
  { art: 'prod-cartoes', href: 'produtos.html?cat=impressos', label: 'Impressos', ids: ['cartao-fotografico', 'panfletos', 'cartazes-folders', 'blocos-receituarios', 'adesivos-etiquetas'] },
  { art: 'prod-canecas', href: 'produto.html?id=canecas', label: 'Canecas personalizadas', ids: ['canecas'] },
  { art: 'prod-canetas', href: 'produto.html?id=canetas', label: 'Canetas personalizadas', ids: ['canetas', 'kits-empresas'] },
  { art: 'prod-ecobags', href: 'produto.html?id=ecobags', label: 'Ecobags', ids: ['ecobags'] },
  { icon: 'trophy', t1: 'Troféus e', t2: 'medalhas', sub: 'Para campeonatos, corridas e premiações.', href: 'produto.html?id=trofeus-medalhas', ids: ['trofeus-medalhas'], checks: ['Acrílico, MDF e metal', 'Com nome e logo do evento', 'Do 1º lugar à participação'] },
  { icon: 'key', t1: 'Chaveiros', t2: 'personalizados', sub: 'Lembrancinhas que vão junto todo dia.', href: 'produto.html?id=chaveiros', ids: ['chaveiros'], checks: ['Acrílico, MDF e emborrachado', 'Com foto, nome ou logo', 'Para eventos e empresas'] },
  { icon: 'monitor', t1: 'Comunicação', t2: 'visual', sub: 'Sua empresa vista de longe.', href: 'produtos.html?cat=comunicacao', ids: ['fachadas-letreiros', 'banners-lonas', 'adesivos-vitrine', 'placas-personalizadas'], checks: ['Fachadas e letreiros', 'Banners, lonas e wind banners', 'Adesivos e placas'] },
  { icon: 'pen', t1: 'Design e', t2: 'criação', sub: 'Sua ideia transformada em arte.', href: 'produtos.html?cat=design', ids: ['criacao-logotipo', 'arte-divulgacao'], checks: ['Logotipos', 'Artes para divulgação', 'Identidade visual'] },
];
const rowItems = ROWS.map((r) => r.ids.flatMap(worksOf));
$('#featured').innerHTML = ROWS.map((r, k) => {
  const items = rowItems[k];
  if (!items.length) return ''; // fileira sem modelos ainda não aparece
  const art = r.art
    ? `<a class="shelf-art" href="${r.href}"><img src="img/cards/${r.art}.jpg" alt="${r.label}" loading="lazy"></a>`
    : `<a class="shelf-art gen-art" href="${r.href}" style="background-image:url(${items[0].src})">
        <span class="ga-ico">${icon(r.icon)}</span>
        <b>${r.t1}<em>${r.t2}</em></b><small>${r.sub}</small>
        <ul>${r.checks.map((c) => `<li>${icon('check')}${c}</li>`).join('')}</ul></a>`;
  return `<div class="shelf" data-row="${k}">${art}${items.map((w, i) => workTile(w, i)).join('')}</div>`;
}).join('');
$('#featured').addEventListener('click', (e) => {
  const b = e.target.closest('.work');
  if (b) openLightbox(rowItems[b.closest('.shelf').dataset.row], Number(b.dataset.i));
});

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

// o mapa só carrega quando a seção aparece
const map = $('#map');
new IntersectionObserver((entries, obs) => {
  if (!entries[0].isIntersecting) return;
  map.innerHTML = `<iframe title="Mapa: ${SITE.address}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(SITE.mapsQuery)}&output=embed"></iframe>`;
  obs.disconnect();
}, { rootMargin: '300px' }).observe(map);
