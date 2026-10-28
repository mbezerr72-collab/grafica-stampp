import { CATEGORIES, productById } from '../data/products.js';
import { SITE, waLink, hoursTable, isOpenNow } from './config.js';
import { WORKS } from './works.js';
import { layout, icon, $ } from './ui.js';

layout('inicio');
document.querySelectorAll('[data-i]').forEach((el) => { if (el.tagName === 'SPAN') el.outerHTML = icon(el.dataset.i); else el.innerHTML = icon(el.dataset.i); });

$('#trust').innerHTML = [['shield', `Desde ${SITE.since}`], ['wa', 'Atendimento pelo WhatsApp'], ['truck', 'Retirada ou entrega']]
  .map(([i, t]) => `<span>${icon(i)}${t}</span>`).join('');

// Categorias: artes prontas; cada nome da lista dentro da arte é um link (posições em % da imagem)
const CATS = [
  ['impressos', 305, [76.3, 80.6, 84.8, 89.1, 93.3], ['cartao-visita', 'cartao-fotografico', 'panfletos', 'cartazes-folders', 'adesivos-etiquetas']],
  ['camisas', 296, [79.1, 83.1, 87.2, 91.3, 95.2], ['camisas-personalizadas', 'camisas-polo', 'uniformes-profissionais', 'uniformes-esportivos', 'camisas-eventos']],
  ['brindes', 271, [81.8, 85.6, 89.5, 93.2, 97.0], ['canecas', 'trofeus-medalhas', 'chaveiros', 'canetas', 'ecobags']],
  ['comunicacao', 298, [81.2, 85.4, 89.9, 96.6], ['banners-lonas', 'fachadas-letreiros', 'adesivos-vitrine', 'placas-personalizadas']],
  ['design', 294, [82.3, 86.0, 89.7, 93.4, 97.0], ['criacao-logotipo', 'arte-divulgacao', 'arte-camisas', 'identidade-visual', 'ajustes-arquivos']],
];
$('#cats').innerHTML = CATS.map(([cat, w, ys, ids]) => {
  const c = CATEGORIES.find((x) => x.id === cat);
  const gap = (ys[ys.length - 1] - ys[0]) / (ys.length - 1);
  const links = ids.map((id, i) => {
    const top = ys[i] - gap / 2, bottom = i < ys.length - 1 ? ys[i + 1] - gap / 2 : Math.min(100, ys[i] + gap / 2);
    return `<a class="hot" href="produto.html?id=${id}" style="top:${top}%;height:${bottom - top}%">${productById(id).name}</a>`;
  }).join('');
  return `<div class="pic-card" style="flex:${w} 1 0">
    <img src="img/cards/cat-${cat}.jpg" alt="" width="${w * 2}" loading="lazy">
    <a class="pic-cover" href="produtos.html?cat=${cat}">${c.label}</a>${links}</div>`;
}).join('');

// Mais pedidos: uma fileira por produto, com a arte e os trabalhos já feitos ao lado
const FEATURED = [['camisas-personalizadas', 'prod-camisas'], ['cartao-visita', 'prod-cartoes'], ['canecas', 'prod-canecas'], ['canetas', 'prod-canetas'], ['ecobags', 'prod-ecobags']];
$('#featured').innerHTML = FEATURED.map(([id, img]) => {
  const p = productById(id);
  const works = WORKS[id] || [];
  return `<article class="feat">
    <a class="feat-art" href="produto.html?id=${id}"><img src="img/cards/${img}.jpg" alt="${p.name}" loading="lazy"></a>
    <div class="feat-body">
      <div class="feat-head"><div><span class="eyebrow">Feito pela Estamp</span><h3>${p.name}</h3></div>
        <a class="btn btn-dark btn-sm" href="produto.html?id=${id}">${p.flow === 'compra' ? 'Comprar' : 'Quero um igual'}</a></div>
      ${works.length
        ? `<div class="works">${works.map(([f, cap], i) => `<button class="work" data-id="${id}" data-i="${i}" aria-label="Ampliar: ${cap}"><img src="img/trabalhos/${id}/${f}" alt="${cap}" loading="lazy"></button>`).join('')}</div>`
        : `<div class="works-empty">${icon('image')}<p>Fotos dos trabalhos já entregues entram aqui.</p></div>`}
    </div></article>`;
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
