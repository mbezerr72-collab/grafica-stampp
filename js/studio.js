// Estúdio 3D: o cliente monta camisa + short, define o time e manda para o carrinho.
import { FABRICS, SIZES, customUnitPrice, brl } from '../data/products.js';
import { cart } from './cart.js';
import { ICONS, toast, initHeader, initDrawer, escapeHtml } from './ui.js';

const $ = (s, el = document) => el.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('[data-icon]').forEach((el) => { el.outerHTML = ICONS[el.dataset.icon]; });
initHeader();
initDrawer();

const DRAFT = 'estamp-studio-v1';
const PATTERNS = [
  ['liso', 'Liso', 'var(--b)'],
  ['listras', 'Listras', 'repeating-linear-gradient(90deg,var(--b) 0 7px,var(--p) 7px 12px)'],
  ['horizontal', 'Faixas', 'repeating-linear-gradient(0deg,var(--b) 0 8px,var(--p) 8px 12px)'],
  ['diagonal', 'Diagonal', 'linear-gradient(120deg,var(--b) 40%,var(--p) 40% 60%,var(--b) 60%)'],
  ['degrade', 'Degradê', 'linear-gradient(180deg,var(--b),var(--p))'],
  ['lateral', 'Lateral', 'linear-gradient(90deg,var(--p) 14%,var(--b) 14% 86%,var(--p) 86%)'],
  ['geometrico', 'Geométrico', 'conic-gradient(from 45deg,var(--b) 25%,var(--p) 25% 50%,var(--b) 50% 75%,var(--p) 75%)'],
  ['camuflado', 'Camuflado', 'radial-gradient(circle at 30% 30%,var(--p) 18%,transparent 19%),radial-gradient(circle at 70% 65%,var(--p) 22%,transparent 23%),var(--b)'],
];
const COLOR_FIELDS = [
  ['body', 'Corpo'], ['sleeve', 'Mangas'], ['collar', 'Gola'], ['detail', 'Punhos e barra'],
  ['patternColor', 'Cor da estampa'], ['textColor', 'Nome e número'],
  ['shortsColor', 'Short', true], ['shortsDetail', 'Faixa do short', true],
];
const PALETTE = ['#111111', '#ffffff', '#ff6a00', '#c8102e', '#ffd400', '#16a34a', '#0b2a6b', '#1fa2ff', '#5b0fa8', '#e91e63', '#8a8a8a', '#7a4f22'];
const FONTS = [['Teko', 'Esportiva'], ['Krona One', 'Larga'], ['Bebas Neue', 'Clássica'], ['Michroma', 'Moderna']];
const LOGO_POS = [['peito', 'Peito'], ['centro', 'Centro'], ['costas', 'Costas']];
const PRESETS = [
  { n: 'Estamp', body: '#111111', sleeve: '#111111', collar: '#ff6a00', detail: '#ff6a00', pattern: 'diagonal', patternColor: '#ff6a00', textColor: '#ffffff', shortsColor: '#111111', shortsDetail: '#ff6a00' },
  { n: 'Rubro-negro', body: '#c8102e', sleeve: '#111111', collar: '#111111', detail: '#111111', pattern: 'horizontal', patternColor: '#111111', textColor: '#ffffff', shortsColor: '#ffffff', shortsDetail: '#c8102e' },
  { n: 'Alviverde', body: '#16a34a', sleeve: '#ffffff', collar: '#ffffff', detail: '#ffffff', pattern: 'lateral', patternColor: '#ffffff', textColor: '#ffffff', shortsColor: '#ffffff', shortsDetail: '#16a34a' },
  { n: 'Celeste', body: '#ffffff', sleeve: '#1fa2ff', collar: '#1fa2ff', detail: '#1fa2ff', pattern: 'listras', patternColor: '#1fa2ff', textColor: '#0b2a6b', shortsColor: '#0b2a6b', shortsDetail: '#1fa2ff' },
  { n: 'Noite', body: '#0b2a6b', sleeve: '#0b2a6b', collar: '#ffd400', detail: '#ffd400', pattern: 'degrade', patternColor: '#5b0fa8', textColor: '#ffd400', shortsColor: '#0b2a6b', shortsDetail: '#ffd400' },
  { n: 'Militar', body: '#1f3b1a', sleeve: '#1f3b1a', collar: '#e8e1c8', detail: '#e8e1c8', pattern: 'camuflado', patternColor: '#4f6b2a', textColor: '#e8e1c8', shortsColor: '#1f3b1a', shortsDetail: '#e8e1c8' },
];

const state = Object.assign({
  fabric: 'poliester', shorts: true, ...PRESETS[0], pattern: 'diagonal',
  name: 'SEU NOME', number: '10', sponsor: '', font: 'Teko', logoPos: 'peito', logoData: null,
  roster: [], qty: 1,
}, loadDraft());
let logoImg = null;
let kit = null, kitShorts = null, kitNoShorts = null, preview = null; // preview = jogador selecionado da lista

function loadDraft() { try { return JSON.parse(localStorage.getItem(DRAFT)) || {}; } catch { return {}; } }
function saveDraft() { try { localStorage.setItem(DRAFT, JSON.stringify(state)); } catch { /* sem espaço: segue sem rascunho */ } }

// ===== Abas =====
$('.st-tabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (!b) return;
  document.querySelectorAll('.st-tabs button').forEach((x) => x.classList.toggle('on', x === b));
  document.querySelectorAll('.st-pane').forEach((p) => p.classList.toggle('on', p.dataset.pane === b.dataset.tab));
  if (b.dataset.tab === 'textos' || b.dataset.tab === 'time') view('back');
  if (b.dataset.tab === 'escudo') view(state.logoPos === 'costas' ? 'back' : 'front');
});

// ===== Controles =====
function seg(el, items, key, onPick) {
  el.innerHTML = items.map(([v, l]) => `<button data-v="${v}" class="${state[key] === v ? 'on' : ''}">${l}</button>`).join('');
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-v]');
    if (!b) return;
    state[key] = b.dataset.v;
    el.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    onPick?.(b.dataset.v);
    update();
  });
}
seg($('#fabric'), Object.entries(FABRICS).map(([k, f]) => [k, `${f.label}<small>${brl(f.price)}</small>`]), 'fabric');
seg($('#fonts'), FONTS.map(([f, l]) => [f, `<span style="font-family:'${f}';font-size:18px">${l}</span>`]), 'font');
seg($('#logoPos'), LOGO_POS, 'logoPos', (v) => view(v === 'costas' ? 'back' : 'front'));

$('#withShorts').checked = state.shorts;
$('#withShorts').addEventListener('change', (e) => { state.shorts = e.target.checked; swapKit(); update(); });

function drawPatterns() {
  const el = $('#patterns');
  el.style.setProperty('--b', state.body); el.style.setProperty('--p', state.patternColor);
  el.innerHTML = PATTERNS.map(([v, l, bg]) => `<button data-v="${v}" class="${state.pattern === v ? 'on' : ''}"><i style="background:${bg}"></i>${l}</button>`).join('');
}
$('#patterns').addEventListener('click', (e) => {
  const b = e.target.closest('[data-v]');
  if (!b) return;
  state.pattern = b.dataset.v; drawPatterns(); update();
});
$('#presets').innerHTML = PRESETS.map((p, i) => `<button data-i="${i}" title="${p.n}"><i style="background:linear-gradient(135deg,${p.body} 50%,${p.patternColor} 50%)"></i>${p.n}</button>`).join('');
$('#presets').addEventListener('click', (e) => {
  const b = e.target.closest('[data-i]');
  if (!b) return;
  const { n, ...colors } = PRESETS[b.dataset.i];
  Object.assign(state, colors); drawPatterns(); drawColors(); update();
});

function drawColors() {
  $('#colorRows').innerHTML = COLOR_FIELDS.filter(([, , sh]) => !sh || state.shorts).map(([k, l]) => `
    <div class="color-row" data-k="${k}">
      <div class="color-head"><span>${l}</span><label class="color-custom" title="Outra cor"><input type="color" value="${state[k]}"><i style="background:${state[k]}"></i></label></div>
      <div class="pal">${PALETTE.map((c) => `<button style="background:${c}" data-c="${c}" class="${c === state[k] ? 'on' : ''}" aria-label="${l} ${c}"></button>`).join('')}</div>
    </div>`).join('');
}
$('#colorRows').addEventListener('click', (e) => {
  const b = e.target.closest('[data-c]');
  if (b) setColor(b.closest('.color-row').dataset.k, b.dataset.c);
});
$('#colorRows').addEventListener('input', (e) => {
  if (e.target.type === 'color') setColor(e.target.closest('.color-row').dataset.k, e.target.value, false);
});
function setColor(k, c, redraw = true) {
  state[k] = c;
  if (redraw) drawColors();
  else { const row = $(`.color-row[data-k="${k}"]`); $('.color-custom i', row).style.background = c; row.querySelectorAll('[data-c]').forEach((x) => x.classList.toggle('on', x.dataset.c === c)); }
  drawPatterns(); update();
}

// textos
for (const [id, key, fmt] of [['#tName', 'name', (v) => v.toUpperCase()], ['#tNumber', 'number', (v) => v.replace(/\D/g, '')], ['#tSponsor', 'sponsor', (v) => v.toUpperCase()]]) {
  const inp = $(id);
  inp.value = state[key];
  inp.addEventListener('input', () => { const v = fmt(inp.value); if (v !== inp.value) inp.value = v; state[key] = v; preview = null; markRoster(); update(); });
  inp.addEventListener('focus', () => view(key === 'sponsor' ? 'front' : 'back'));
}

// ===== Escudo =====
const fileInp = $('#logoFile');
$('#drop').addEventListener('dragover', (e) => { e.preventDefault(); e.currentTarget.classList.add('over'); });
$('#drop').addEventListener('dragleave', (e) => e.currentTarget.classList.remove('over'));
$('#drop').addEventListener('drop', (e) => { e.preventDefault(); e.currentTarget.classList.remove('over'); readLogo(e.dataTransfer.files[0]); });
fileInp.addEventListener('change', () => readLogo(fileInp.files[0]));
$('#logoRemove').addEventListener('click', (e) => { e.preventDefault(); state.logoData = null; logoImg = null; drawLogo(); update(); });

function readLogo(file) {
  if (!file) return;
  if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) return toast('Envie uma imagem PNG, JPG, WEBP ou SVG');
  if (file.size > 5 * 1024 * 1024) return toast('Imagem acima de 5 MB');
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    // reduz para 512px: suficiente para a prévia e cabe no armazenamento do navegador
    const s = Math.min(1, 512 / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * s) || 512; c.height = Math.round(img.height * s) || 512;
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    state.logoData = c.toDataURL('image/png');
    loadLogo().then(() => { view(state.logoPos === 'costas' ? 'back' : 'front'); toast('Escudo aplicado'); });
  };
  img.onerror = () => toast('Não consegui abrir essa imagem');
  img.src = url;
}
function loadLogo() {
  return new Promise((res) => {
    if (!state.logoData) { logoImg = null; drawLogo(); update(); return res(); }
    const img = new Image();
    img.onload = () => { logoImg = img; drawLogo(); update(); res(); };
    img.onerror = () => { state.logoData = null; logoImg = null; drawLogo(); res(); };
    img.src = state.logoData;
  });
}
function drawLogo() {
  $('#dropInner').innerHTML = state.logoData
    ? `<img src="${state.logoData}" alt="Escudo enviado"><span>Toque para trocar</span>`
    : '<b>Envie o escudo ou logo</b><span>PNG com fundo transparente fica melhor · até 5 MB</span>';
  $('#logoRemove').hidden = !state.logoData;
}

// ===== Lista do time =====
const SIZE_OPTS = (sel) => SIZES.map((s) => `<option${s === sel ? ' selected' : ''}>${s}</option>`).join('');
function drawRoster() {
  const el = $('#roster');
  el.innerHTML = state.roster.length
    ? `<div class="roster-head"><span>Nome</span><span>Nº</span><span>Tam.</span><span></span></div>` + state.roster.map((r, i) => `
      <div class="roster-row" data-i="${i}">
        <input data-f="name" value="${escapeHtml(r.name)}" maxlength="14" placeholder="Nome" aria-label="Nome do jogador ${i + 1}">
        <input data-f="number" value="${escapeHtml(r.number)}" maxlength="3" inputmode="numeric" placeholder="Nº" aria-label="Número do jogador ${i + 1}">
        <select data-f="size" aria-label="Tamanho do jogador ${i + 1}">${SIZE_OPTS(r.size)}</select>
        <button class="roster-x" aria-label="Remover jogador ${i + 1}">${ICONS.close}</button>
      </div>`).join('')
    : '<p class="st-note">Nenhum jogador ainda.</p>';
  $('#qtyRow').hidden = state.roster.length > 0;
  const count = {};
  state.roster.forEach((r) => { count[r.size] = (count[r.size] || 0) + 1; });
  $('#sizeSummary').innerHTML = Object.entries(count).map(([s, n]) => `<span>${s} <b>${n}</b></span>`).join('');
  markRoster();
}
function markRoster() { document.querySelectorAll('.roster-row').forEach((r) => r.classList.toggle('on', preview === Number(r.dataset.i))); }
$('#addPlayer').addEventListener('click', () => {
  const last = state.roster.at(-1);
  state.roster.push({ name: '', number: last ? String((Number(last.number) || 0) + 1) : state.number || '1', size: last?.size || 'M' });
  drawRoster(); update();
  $('#roster .roster-row:last-child input').focus();
});
$('#roster').addEventListener('input', (e) => {
  const row = e.target.closest('.roster-row');
  if (!row) return;
  const r = state.roster[row.dataset.i];
  let v = e.target.value;
  if (e.target.dataset.f === 'name') v = v.toUpperCase();
  if (e.target.dataset.f === 'number') v = v.replace(/\D/g, '');
  if (v !== e.target.value) e.target.value = v;
  r[e.target.dataset.f] = v;
  preview = Number(row.dataset.i); markRoster();
  if (e.target.dataset.f === 'size') drawRoster();
  update();
});
$('#roster').addEventListener('focusin', (e) => {
  const row = e.target.closest('.roster-row');
  if (row) { preview = Number(row.dataset.i); markRoster(); view('back'); update(); }
});
$('#roster').addEventListener('click', (e) => {
  const x = e.target.closest('.roster-x');
  if (!x) return;
  state.roster.splice(x.closest('.roster-row').dataset.i, 1);
  preview = null; drawRoster(); update();
});
$('#pasteList').addEventListener('click', () => {
  const box = document.createElement('div');
  box.className = 'paste-box';
  box.innerHTML = `<textarea rows="6" placeholder="Um jogador por linha: NOME NÚMERO TAMANHO&#10;JOÃO 10 M&#10;PEDRO 7 G"></textarea>
    <div class="roster-actions"><button class="btn btn-primary sm">Adicionar</button><button class="btn btn-ghost sm">Cancelar</button></div>`;
  $('#pasteList').closest('.roster-actions').after(box);
  const ta = $('textarea', box); ta.focus();
  const [ok, cancel] = box.querySelectorAll('button');
  cancel.onclick = () => box.remove();
  ok.onclick = () => {
    const added = ta.value.split('\n').map(parseLine).filter(Boolean);
    state.roster.push(...added);
    box.remove(); drawRoster(); update();
    toast(`${added.length} jogador${added.length === 1 ? '' : 'es'} adicionado${added.length === 1 ? '' : 's'}`);
  };
});
// aceita "NOME 10 M", "NOME;10;M", "10 NOME G" etc.
function parseLine(line) {
  const parts = line.trim().split(/[\s;,\t-]+/).filter(Boolean);
  if (!parts.length) return null;
  let number = '', size = 'M';
  const rest = [];
  for (const p of parts) {
    const up = p.toUpperCase();
    if (!number && /^\d{1,3}$/.test(p)) number = p;
    else if (SIZES.includes(up)) size = up;
    else rest.push(up);
  }
  return { name: rest.join(' ').slice(0, 14), number, size };
}

$('#qtyRow').addEventListener('click', (e) => {
  const q = e.target.closest('[data-q]');
  if (!q) return;
  state.qty = Math.max(1, Math.min(500, state.qty + Number(q.dataset.q)));
  update();
});

// ===== Preço =====
function qty() { return state.roster.length || state.qty; }
function updatePrice() {
  const n = qty();
  const unit = customUnitPrice(state.fabric, state.shorts, n);
  const base = customUnitPrice(state.fabric, state.shorts, 1);
  $('#stUnit').textContent = brl(unit);
  $('#stFabricLbl').textContent = `${FABRICS[state.fabric].label}${state.shorts ? ' + short' : ''}`;
  $('.st-price span').textContent = state.shorts ? '/conjunto' : '/camisa';
  $('#qty').textContent = state.qty;
  $('#stQtyLbl').textContent = `${n} ${state.shorts ? (n === 1 ? 'conjunto' : 'conjuntos') : (n === 1 ? 'camisa' : 'camisas')} × ${brl(unit)}`;
  $('#stTotal').textContent = brl(unit * n);
  $('#stOff').hidden = unit === base;
}

// ===== 3D =====
let stage = null;
let yaw = 0, targetYaw = 0, pitch = 0.05, zoom = 1, spin = false;
function view(v) {
  spin = v === 'spin';
  if (v === 'front') targetYaw = nearest(0);
  if (v === 'back') targetYaw = nearest(Math.PI);
  document.querySelectorAll('.st-views button').forEach((b) => b.classList.toggle('on', b.dataset.view === v));
}
const nearest = (a) => a + Math.round((yaw - a) / (Math.PI * 2)) * Math.PI * 2;
$('.st-views').addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (b) view(b.dataset.view); });

function paintState() {
  const p = preview != null && state.roster[preview];
  return {
    ...state, logo: logoImg,
    name: p ? p.name : state.name,
    number: p ? p.number : state.number,
  };
}
let raf = 0;
function update() {
  updatePrice();
  saveDraft();
  if (!kit) return;
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => kit.paint(paintState()));
}

function swapKit() {
  if (!stage) return;
  stage.scene.remove(kit.group);
  kit = state.shorts ? kitShorts : kitNoShorts;
  stage.scene.add(kit.group);
  drawColors();
}

async function init3D() {
  const canvas = $('#stCanvas');
  try {
    const { createKit, createStage } = await import('./kit3d.js');
    await Promise.all(FONTS.map(([f]) => document.fonts.load(`700 40px "${f}"`)));
    stage = createStage(canvas, { z: 9.5 });
    kitShorts = createKit({ shorts: true });
    kitNoShorts = createKit({ shorts: false });
    kitShorts.group.position.y = 0.78;
    kitNoShorts.group.position.y = 0.05;
    kit = state.shorts ? kitShorts : kitNoShorts;
    stage.scene.add(kit.group);
  } catch (err) {
    console.warn(err);
    $('.st-stage').insertAdjacentHTML('beforeend', '<p class="st-note" style="position:absolute;inset:auto 0 50% 0;text-align:center">Seu navegador não conseguiu abrir o 3D. Você ainda pode montar o pedido pelas opções.</p>');
    return;
  }
  update();

  // arrastar = girar; roda/pinça = zoom
  let drag = null;
  const pointers = new Map();
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    drag = { x: e.clientX, y: e.clientY, yaw: targetYaw, pitch, dist: pinchDist() };
    spin = false; document.querySelectorAll('.st-views button').forEach((b) => b.classList.remove('on'));
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size === 2 && drag.dist) { zoom = clamp(zoom * pinchDist() / drag.dist, 0.7, 1.8); drag.dist = pinchDist(); return; }
    targetYaw = drag.yaw + (e.clientX - drag.x) * 0.012;
    pitch = clamp(drag.pitch + (e.clientY - drag.y) * 0.004, -0.35, 0.45);
  });
  const up = (e) => { pointers.delete(e.pointerId); if (!pointers.size) drag = null; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoom = clamp(zoom * (e.deltaY > 0 ? 0.92 : 1.08), 0.7, 1.8); }, { passive: false });
  function pinchDist() { if (pointers.size < 2) return 0; const [a, b] = [...pointers.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]); }

  const { renderer, scene, camera } = stage;
  renderer.setAnimationLoop(() => {
    if (document.hidden) return;
    if (spin && !reduced) targetYaw += 0.01;
    yaw += (targetYaw - yaw) * (reduced ? 1 : 0.12);
    kit.group.rotation.y = yaw;
    kit.group.rotation.x = pitch;
    const z = 9.5 / zoom;
    camera.position.z += (z - camera.position.z) * 0.15;
    renderer.render(scene, camera);
  });
}

// ===== Carrinho =====
function capture(angle) {
  const { renderer, scene, camera } = stage;
  const prev = [kit.group.rotation.y, kit.group.rotation.x, camera.position.z];
  kit.group.rotation.set(0, angle, 0); camera.position.z = 9.5;
  renderer.render(scene, camera);
  const src = renderer.domElement;
  const S = 200, c = document.createElement('canvas'); c.width = c.height = S;
  const side = Math.min(src.width, src.height);
  c.getContext('2d').drawImage(src, (src.width - side) / 2, (src.height - side) / 2, side, side, 0, 0, S, S);
  [kit.group.rotation.y, kit.group.rotation.x, camera.position.z] = prev;
  return c.toDataURL('image/png');
}

$('#addCart').addEventListener('click', () => {
  if (state.roster.some((r) => !r.number && !r.name)) return toast('Preencha nome ou número de todos os jogadores');
  const { logoData, qty: _q, ...rest } = state;
  const config = { ...rest, hasLogo: !!logoData, roster: state.roster.map((r) => ({ ...r })) };
  let thumb = null;
  if (stage) { preview = null; kit.paint(paintState()); thumb = capture(0); }
  cart.add({ id: 'custom', qty: qty(), size: null, config, thumb });
  toast('Uniforme adicionado ao pedido');
  document.querySelector('[data-open-cart]').click();
});

// ===== Início =====
drawPatterns();
drawColors();
drawRoster();
loadLogo();
updatePrice();
init3D();
