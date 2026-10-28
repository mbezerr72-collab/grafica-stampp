// Página inicial: abertura, 3D do topo, catálogo, modal de produto e seções informativas.
import { CATEGORIES, PRODUCTS, MEASURES, brl } from '../data/products.js';
import { cart } from './cart.js';
import { SITE, hoursTable, isOpenNow } from './config.js';
import { ICONS, productImg, toast, openLayer, closeLayers, initHeader, initDrawer, escapeHtml } from './ui.js';

const $ = (s, el = document) => el.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('[data-icon]').forEach((el) => { el.outerHTML = ICONS[el.dataset.icon]; });
document.querySelectorAll('[data-insta]').forEach((a) => { a.href = `https://instagram.com/${SITE.instagram}`; a.target = '_blank'; a.rel = 'noopener'; });
initHeader();
initDrawer();
runIntro();
renderCatalog();
renderSizes();
renderContact();
initReveal();
init3D();

// ===== Abertura =====
function runIntro() {
  const intro = $('#intro');
  const finish = () => {
    if (intro.classList.contains('done')) return;
    intro.classList.add('done');
    document.body.classList.remove('locked');
    document.body.classList.add('ready');
    setTimeout(() => intro.remove(), 950);
  };
  let seen = false;
  try { seen = sessionStorage.getItem('estamp-intro') === '1'; sessionStorage.setItem('estamp-intro', '1'); } catch { /* sem storage */ }
  if (seen || reduced) { intro.remove(); document.body.classList.remove('locked'); document.body.classList.add('ready'); return; }

  // GRÁFICA: uma letra por vez, cada uma "desenhada" pelo contorno
  const g = $('.il-grafica');
  const word = 'GRÁFICA';
  g.innerHTML = [...word].map((ch, i) => `<text x="${166 + i * 112}" y="92" text-anchor="middle" style="letter-spacing:0">${ch}</text>`).join('');
  const letters = g.querySelectorAll('text');
  const T = (ms, fn) => setTimeout(fn, ms);
  document.fonts.ready.then(() => {
    letters.forEach((t, i) => T(150 + i * 120, () => t.classList.add('draw')));
    T(1750, () => $('.il-estamp').classList.add('show'));
    T(2250, () => { $('.il-tri').classList.add('stamp'); });
    T(2600, () => { $('.intro-flash').classList.add('on'); navigator.vibrate?.(20); });
    T(2800, () => $('.intro-tag').classList.add('on'));
    T(4000, finish);
  });
  $('#introSkip').addEventListener('click', finish);
}

// ===== Catálogo =====
function renderCatalog() {
  const chips = $('#chips');
  const grid = $('#grid');
  let current = 'todos';
  chips.innerHTML = CATEGORIES.map((c) => `<button class="chip${c.id === current ? ' on' : ''}" data-cat="${c.id}" role="tab">${c.label}</button>`).join('');
  const draw = () => {
    const list = PRODUCTS.filter((p) => current === 'todos' || p.cat === current);
    grid.innerHTML = list.map((p) => `
      <article class="card reveal" data-id="${p.id}" tabindex="0">
        <div class="card-media">${p.badge ? `<span class="card-badge">${p.badge}</span>` : ''}${productImg(`img/produtos/${p.id}.png`, p.cat, p.name)}</div>
        <div class="card-body">
          <h3>${p.name}</h3><p>${p.desc}</p>
          <div class="card-foot"><span class="price">${brl(p.price)}<small>/${p.unit}</small></span>
            <button class="add-btn" aria-label="Adicionar ${p.name}">${ICONS.plus}</button></div>
        </div>
      </article>`).join('');
    requestAnimationFrame(() => grid.querySelectorAll('.reveal').forEach((el, i) => setTimeout(() => el.classList.add('in'), i * 40)));
  };
  chips.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    current = b.dataset.cat;
    chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === b));
    draw();
  });
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (card) openProduct(card.dataset.id);
  });
  grid.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.card')) openProduct(e.target.dataset.id); });

  // inclinação 3D dos cards seguindo o mouse
  if (!reduced && matchMedia('(hover: hover)').matches) {
    grid.addEventListener('pointermove', (e) => {
      const card = e.target.closest('.card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    });
    grid.addEventListener('pointerout', (e) => {
      const card = e.target.closest('.card');
      if (card && !card.contains(e.relatedTarget)) card.style.transform = '';
    });
  }
  draw();
}

function openProduct(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;
  if (p.custom) { location.href = 'personalizar.html'; return; }
  const modal = $('#modal');
  const box = $('.modal-box', modal);
  let size = p.sizes ? 'M' : null;
  let qty = 1;
  box.innerHTML = `
    <div class="modal-media">${productImg(`img/produtos/${p.id}.png`, p.cat, p.name)}</div>
    <div class="modal-body">
      <button class="modal-close" aria-label="Fechar">${ICONS.close}</button>
      <span class="eyebrow">${CATEGORIES.find((c) => c.id === p.cat)?.label || ''}</span>
      <h3>${p.name}</h3>
      <p style="color:var(--muted)">${p.desc}</p>
      <div class="price" style="font-size:26px">${brl(p.price)}<small>/${p.unit}</small></div>
      ${p.sizes ? `<div><div class="opt-label">Tamanho</div><div class="size-row" style="margin-top:8px">${['PP', 'P', 'M', 'G', 'GG', 'EXG'].map((s) => `<button data-size="${s}" class="${s === size ? 'on' : ''}">${s}</button>`).join('')}</div>
        <small style="color:var(--muted)"><a href="#medidas" data-close style="text-decoration:underline">Ver tabela de medidas</a> · baby look sob consulta</small></div>` : ''}
      <div><div class="opt-label">Quantidade</div><div class="qty" style="margin-top:8px"><button data-q="-1" aria-label="Diminuir">−</button><span id="mQty">1</span><button data-q="1" aria-label="Aumentar">+</button></div></div>
      <div class="opt-label" style="margin-top:4px">A arte</div>
      <p style="color:var(--muted);font-size:14px;margin-top:-10px">Depois do pedido você envia sua arte ou ideia pelo WhatsApp. Se precisar, a gente cria.</p>
      <button class="btn btn-primary" id="mAdd">${ICONS.cart}Adicionar · <span id="mTotal">${brl(p.price)}</span></button>
    </div>`;
  const upd = () => { $('#mQty').textContent = qty; $('#mTotal').textContent = brl(p.price * qty); };
  box.addEventListener('click', (e) => {
    const s = e.target.closest('[data-size]');
    if (s) { size = s.dataset.size; box.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('on', b === s)); }
    const q = e.target.closest('[data-q]');
    if (q) { qty = Math.max(1, Math.min(500, qty + Number(q.dataset.q))); upd(); }
    if (e.target.closest('.modal-close') || e.target.closest('[data-close]')) closeLayers();
  });
  $('#mAdd').addEventListener('click', () => {
    cart.add({ id: p.id, qty, size });
    closeLayers();
    toast(`${escapeHtml(p.name)} no carrinho`);
  });
  openLayer(modal);
}

// ===== Medidas =====
function renderSizes() {
  $('#sizes').innerHTML = Object.entries(MEASURES).map(([title, rows]) => `
    <div class="table-card reveal"><h3>${title.toUpperCase()}</h3>
      <table><thead><tr><th>Tam.</th><th>Largura</th><th>Altura</th></tr></thead>
      <tbody>${rows.map(([s, w, h]) => `<tr><td>${s}</td><td>${w} cm</td><td>${h} cm</td></tr>`).join('')}</tbody></table>
    </div>`).join('');
}

// ===== Contato =====
function renderContact() {
  $('#cPhone').textContent = SITE.phone;
  $('#cAddr').textContent = SITE.address;
  $('#cCity').textContent = SITE.city;
  $('#year').textContent = new Date().getFullYear();
  $('#hours').innerHTML = hoursTable().map(([d, h]) => `<span>${d}</span><span>${h}</span>`).join('');
  const dot = $('#openDot');
  const open = isOpenNow();
  dot.textContent = open ? 'Aberta agora' : 'Fechada agora';
  dot.style.color = open ? '#3ddc84' : '#ff5a4f';
  // o mapa só carrega quando a seção aparece (economiza dados no celular)
  const map = $('#map');
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    map.innerHTML = `<iframe title="Mapa da Gráfica Estamp" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
      src="https://www.google.com/maps?q=${encodeURIComponent(SITE.mapsQuery)}&output=embed"></iframe>`;
    obs.disconnect();
  }, { rootMargin: '300px' }).observe(map);
}

// ===== Animações ao rolar =====
function initReveal() {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  const watch = () => document.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));
  watch();
  new MutationObserver(watch).observe(document.body, { childList: true, subtree: true });
}

// ===== 3D =====
const PRESETS = [
  { label: 'Sublimação total', body: '#111111', sleeve: '#111111', collar: '#ff6a00', detail: '#ff6a00', pattern: 'diagonal', patternColor: '#ff6a00', shortsColor: '#111111', shortsDetail: '#ff6a00', textColor: '#ffffff', name: 'ESTAMP', number: '10' },
  { label: 'Listras clássicas', body: '#ffffff', sleeve: '#c8102e', collar: '#c8102e', detail: '#c8102e', pattern: 'listras', patternColor: '#c8102e', shortsColor: '#111111', shortsDetail: '#c8102e', textColor: '#111111', name: 'CRUZEIRO', number: '7' },
  { label: 'Degradê', body: '#0b2a6b', sleeve: '#0b2a6b', collar: '#ffd400', detail: '#ffd400', pattern: 'degrade', patternColor: '#1fa2ff', shortsColor: '#0b2a6b', shortsDetail: '#ffd400', textColor: '#ffffff', name: 'JURUÁ', number: '9' },
  { label: 'Camuflado', body: '#1f3b1a', sleeve: '#1f3b1a', collar: '#e8e1c8', detail: '#e8e1c8', pattern: 'camuflado', patternColor: '#4f6b2a', shortsColor: '#1f3b1a', shortsDetail: '#e8e1c8', textColor: '#e8e1c8', name: 'ACRE', number: '22' },
  { label: 'Geométrico', body: '#5b0fa8', sleeve: '#5b0fa8', collar: '#00e0b8', detail: '#00e0b8', pattern: 'geometrico', patternColor: '#00e0b8', shortsColor: '#ffffff', shortsDetail: '#5b0fa8', textColor: '#ffffff', name: 'TIME', number: '5' },
];

async function init3D() {
  let mod;
  try { mod = await import('./kit3d.js'); } catch (err) { console.warn('3D indisponível', err); return; }
  const { createKit, createStage } = mod;
  heroScene(createKit, createStage);
  studioTeaser(createKit, createStage);
  folio(createKit, createStage);
}

// arrastar para girar, com inércia
function spinner(canvas, obj, { auto = 0.004 } = {}) {
  let vel = auto, dragging = false, lastX = 0, idle = 0;
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX;
    vel = dx * 0.006; obj.rotation.y += vel; idle = 0;
  });
  const up = () => { dragging = false; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  return () => {
    if (dragging) return;
    idle++;
    vel += ((idle > 90 ? auto : 0) - vel) * 0.04;
    obj.rotation.y += reduced ? 0 : vel;
  };
}

function visible(el) {
  let on = true;
  new IntersectionObserver((e) => { on = e[0].isIntersecting; }).observe(el);
  return () => on && !document.hidden;
}

function heroScene(createKit, createStage) {
  const canvas = $('#heroCanvas');
  const { renderer, scene, camera } = createStage(canvas, { z: 9.2 });
  const kit = createKit({ shorts: true });
  kit.group.position.y = 0.75;
  kit.group.rotation.y = -0.5;
  scene.add(kit.group);
  kit.paint(PRESETS[0]);
  const tick = spinner(canvas, kit.group);
  const isOn = visible(canvas);

  // troca de modelo conforme a rolagem (e a cada 4s quando parado no topo)
  let idx = 0, t0 = performance.now();
  const setPreset = (i) => {
    if (i === idx) return;
    idx = i; kit.paint(PRESETS[i]); $('#heroChip').textContent = PRESETS[i].label;
    kit.group.scale.setScalar(0.9);
  };
  addEventListener('scroll', () => {
    const p = Math.min(1, scrollY / (innerHeight * 0.9));
    setPreset(Math.min(PRESETS.length - 1, Math.floor(p * PRESETS.length)));
    t0 = performance.now();
  }, { passive: true });

  renderer.setAnimationLoop((now) => {
    if (!isOn()) return;
    if (scrollY < 10 && now - t0 > 4000) { setPreset((idx + 1) % PRESETS.length); t0 = now; }
    const s = kit.group.scale.x; kit.group.scale.setScalar(s + (1 - s) * 0.12);
    kit.group.position.y = 0.75 + Math.sin(now / 900) * 0.06;
    tick();
    renderer.render(scene, camera);
  });
}

function studioTeaser(createKit, createStage) {
  const canvas = $('#studioCanvas');
  const { renderer, scene, camera } = createStage(canvas, { z: 6.4 });
  const kit = createKit({ shorts: false });
  kit.group.position.y = -0.05;
  scene.add(kit.group);
  kit.paint({ ...PRESETS[0], name: 'SEU NOME', number: '10' });
  const tick = spinner(canvas, kit.group, { auto: 0.007 });
  const isOn = visible(canvas);
  const colors = ['#111111', '#ffffff', '#c8102e', '#0b2a6b', '#1f7a3a', '#ffd400', '#5b0fa8'];
  const sw = $('#swatches');
  sw.innerHTML = colors.map((c, i) => `<button style="background:${c}" class="${i ? '' : 'on'}" data-c="${c}" aria-label="Cor ${c}"></button>`).join('');
  sw.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const light = ['#ffffff', '#ffd400'].includes(b.dataset.c);
    kit.paint({ body: b.dataset.c, sleeve: b.dataset.c, textColor: light ? '#111111' : '#ffffff' });
    sw.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  });
  renderer.setAnimationLoop(() => { if (isOn()) { tick(); renderer.render(scene, camera); } });
}

// Portfólio: fotos reais em img/portfolio/1.jpg…5.jpg; se não houver, mostra modelos gerados em 3D
function folio(createKit, createStage) {
  const el = $('#folio');
  const items = [
    ['Uniformes de futebol', 0], ['Camisas de eventos', 1], ['Uniformes escolares', 2],
    ['Times de várzea', 3], ['Camisas de igreja', 4],
  ];
  el.innerHTML = items.map(([cap], i) => `<figure class="reveal"><img src="img/portfolio/${i + 1}.jpg" alt="${cap}" loading="lazy" data-i="${i}"><figcaption>${cap}</figcaption></figure>`).join('');
  const missing = [];
  el.querySelectorAll('img').forEach((img) => img.addEventListener('error', () => missing.push(img), { once: true }));
  // espera os erros de carregamento e renderiza os que faltaram com um único renderer
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    obs.disconnect();
    setTimeout(() => {
      if (!missing.length) return;
      const c = document.createElement('canvas');
      c.style.cssText = 'position:fixed;left:-9999px;width:600px;height:600px';
      document.body.appendChild(c);
      const { renderer, scene, camera } = createStage(c, { z: 6.2 });
      renderer.setSize(600, 600, false); camera.aspect = 1; camera.updateProjectionMatrix();
      const kit = createKit({ shorts: false });
      scene.add(kit.group);
      missing.forEach((img) => {
        const p = PRESETS[items[img.dataset.i][1]];
        kit.paint({ ...p, name: ['SILVA', 'EVENTO', 'ESCOLA', 'VÁRZEA', 'FÉ'][img.dataset.i] });
        kit.group.rotation.y = Number(img.dataset.i) % 2 ? Math.PI : 0.35;
        renderer.render(scene, camera);
        img.src = c.toDataURL('image/jpeg', 0.85);
        img.style.background = 'radial-gradient(circle at 50% 40%, #232326, #0b0b0c 70%)';
      });
      renderer.dispose(); c.remove();
    }, 600);
  }, { rootMargin: '400px' }).observe(el);
}
