import { SITE, waLink, hoursTable, isOpenNow } from './config.js';
import { layout, icon, $ } from './ui.js';

layout('inicio');
document.querySelectorAll('[data-i]').forEach((el) => { if (el.tagName === 'SPAN') el.outerHTML = icon(el.dataset.i); else el.innerHTML = icon(el.dataset.i); });

$('#trust').innerHTML = [['shield', `Desde ${SITE.since}`], ['wa', 'Atendimento pelo WhatsApp'], ['truck', 'Retirada ou entrega']]
  .map(([i, t]) => `<span>${icon(i)}${t}</span>`).join('');

// Cartões das categorias e dos produtos em destaque: imagens prontas, cada uma na proporção original
const cards = (list) => list.map(([href, img, w, label]) => `
  <a class="pic-card" href="${href}" style="flex:${w} 1 0"><img src="img/cards/${img}.jpg" alt="${label}" width="${w * 2}" loading="lazy"></a>`).join('');

$('#cats').innerHTML = cards([
  ['produtos.html?cat=impressos', 'cat-impressos', 305, 'Impressos gráficos: cartões de visita, cartões fotográficos, panfletos e flyers, cartazes e folders, adesivos e etiquetas'],
  ['produtos.html?cat=camisas', 'cat-camisas', 296, 'Camisas e uniformes: camisetas personalizadas, camisetas polo, uniformes profissionais, uniformes esportivos, camisas para eventos'],
  ['produtos.html?cat=brindes', 'cat-brindes', 271, 'Brindes personalizados: canecas, troféus e medalhas, chaveiros, canetas, ecobags'],
  ['produtos.html?cat=comunicacao', 'cat-comunicacao', 298, 'Comunicação visual: banners e lonas, fachadas e letreiros, adesivos para vitrines e adesivação, placas personalizadas'],
  ['produtos.html?cat=design', 'cat-design', 294, 'Design e criação: criação de logotipo, arte para divulgação, arte para camisas, identidade visual, ajustes em arquivos para impressão'],
]);

$('#featured').innerHTML = cards([
  ['produto.html?id=camisas-personalizadas', 'prod-camisas', 304, 'Camisas personalizadas'],
  ['produto.html?id=cartao-visita', 'prod-cartoes', 294, 'Cartões de visita'],
  ['produto.html?id=canecas', 'prod-canecas', 272, 'Canecas personalizadas'],
  ['produto.html?id=canetas', 'prod-canetas', 294, 'Canetas personalizadas'],
  ['produto.html?id=ecobags', 'prod-ecobags', 294, 'Ecobags personalizadas'],
]);

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
