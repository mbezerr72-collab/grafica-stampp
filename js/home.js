import { CATEGORIES, productById } from '../data/products.js';
import { SITE, waLink, hoursTable, isOpenNow } from './config.js';
import { WORKS } from './works.js';
import { layout, icon, $ } from './ui.js';

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

// Mais pedidos: uma prateleira por produto, com a arte primeiro e os trabalhos feitos ao lado
const FEATURED = [['camisas-personalizadas', 'prod-camisas'], ['cartao-visita', 'prod-cartoes'], ['canecas', 'prod-canecas'], ['canetas', 'prod-canetas'], ['ecobags', 'prod-ecobags']];
$('#featured').innerHTML = FEATURED.map(([id, img]) => {
  const p = productById(id);
  const works = WORKS[id] || [];
  const tiles = works.length
    ? works.map(([f, cap], i) => `<button class="shelf-item work" data-id="${id}" data-i="${i}" aria-label="Ampliar: ${cap}"><img src="img/trabalhos/${id}/${f}" alt="${cap}" loading="lazy"><span>${cap}</span></button>`).join('')
    : Array.from({ length: 4 }, () => `<div class="shelf-item shelf-ph">${icon('image')}<span>Foto em breve</span></div>`).join('');
  return `<div class="shelf" aria-label="${p.name}">
    <a class="shelf-art" href="produto.html?id=${id}"><img src="img/cards/${img}.jpg" alt="${p.name}" loading="lazy"></a>${tiles}</div>`;
}).join('');

// Ampliar foto de trabalho
const lb = $('#lightbox');
let lbList = [], lbI = 0;
const lbShow = () => { const [f, cap] = lbList[lbI]; $('#lbImg').src = `img/trabalhos/${lb.dataset.id}/${f}`; $('#lbImg').alt = cap; $('#lbCap').textContent = cap; };
$('#featured').addEventListener('click', (e) => {
  const b = e.target.closest('.work');
  if (!b) return;
  lb.dataset.id = b.dataset.id; lbList = WORKS[b.dataset.id]; lbI = Number(b.dataset.i);
  lbShow(); lb.showModal();
});
lb.addEventListener('click', (e) => {
  if (e.target === lb || e.target.closest('[data-close]')) lb.close();
  const n = e.target.closest('[data-step]');
  if (n) { lbI = (lbI + Number(n.dataset.step) + lbList.length) % lbList.length; lbShow(); }
});
lb.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { lbI = (lbI + (e.key === 'ArrowRight' ? 1 : -1) + lbList.length) % lbList.length; lbShow(); }
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
