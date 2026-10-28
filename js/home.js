import { CATEGORIES, productById } from '../data/products.js';
import { SITE, waLink, hoursTable, isOpenNow } from './config.js';
import { layout, icon, productCard, productsIn, $ } from './ui.js';

layout('inicio');
document.querySelectorAll('[data-i]').forEach((el) => { if (el.tagName === 'SPAN') el.outerHTML = icon(el.dataset.i); else el.innerHTML = icon(el.dataset.i); });

$('#trust').innerHTML = [['shield', `Desde ${SITE.since}`], ['wa', 'Atendimento pelo WhatsApp'], ['truck', 'Retirada ou entrega']]
  .map(([i, t]) => `<span>${icon(i)}${t}</span>`).join('');

$('#cats').innerHTML = CATEGORIES.map((c) => `
  <div class="cat">
    <a href="produtos.html?cat=${c.id}" class="cat-img" style="background-image:url(${c.img})" aria-label="${c.label}"></a>
    <div class="cat-body">
      <h3><a href="produtos.html?cat=${c.id}">${c.label}</a></h3>
      <p>${c.desc}</p>
      <ul>${productsIn(c.id).slice(0, 5).map((p) => `<li><a href="produto.html?id=${p.id}">${p.name}</a></li>`).join('')}</ul>
    </div>
  </div>`).join('');

$('#featured').innerHTML = ['camisas-personalizadas', 'cartao-visita', 'canecas', 'banners-lonas']
  .map((id) => productCard(productById(id))).join('');

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
