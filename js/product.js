// Página de um produto: compra direta (Tipo A) ou formulário de orçamento em etapas (Tipo B).
import { productById, defaultSelection, unitPrice, selectionLabel, SIZES, BABY_SIZES, brl } from '../data/products.js?v=2610282008';
import { cart, MAX_QTY } from './cart.js?v=2610282008';
import { SITE, waLink } from './config.js?v=2610282008';
import { FORMS, initialData, sizeTotal, faixa, cores as coresField } from './forms.js?v=2610282008';
import { layout, icon, esc, catById, productCard, productsIn, shopCard, priceLine, toast, openLightbox, $ } from './ui.js?v=2610282008';
import { worksOf } from './works.js?v=2610282008';

layout('produtos');
const root = $('#prod');
const params = new URLSearchParams(location.search);
const p = productById(params.get('id'));
const models = p ? worksOf(p.id) : [];
const model = models[Number(params.get('m'))] || null; // modelo escolhido nas fileiras da página inicial


// Ficha técnica por categoria
const SPECS = {
  impressos: [['Impressão', 'Digital ou offset, em cores (CMYK)'], ['Papel', 'Couché, offset ou fotográfico, conforme o produto'], ['Acabamento', 'Corte reto; laminação, verniz, dobra ou numeração sob consulta']],
  camisas: [['Tecidos', 'Algodão, poliéster, dry fit e misto'], ['Personalização', 'Sublimação, serigrafia, DTF ou bordado'], ['Tamanhos', 'PP ao EXG e baby look (PPBL ao EXGBL)'], ['Nome e número', 'Individuais por peça, sem custo de arte extra na lista do time']],
  brindes: [['Personalização', 'Impressão colorida, sublimação ou gravação a laser'], ['Quantidade', 'A partir de 1 unidade em canecas; demais itens sob consulta'], ['Embalagem', 'Individual sob consulta']],
  comunicacao: [['Materiais', 'Lona, vinil adesivo, ACM, acrílico, PVC e MDF'], ['Medidas', 'Sob medida; visita técnica se precisar'], ['Instalação', 'Feita pela equipe, sob consulta']],
  design: [['Entrega', 'Arquivos prontos para impressão e para redes sociais'], ['Ajustes', 'Revisões combinadas no orçamento'], ['Formatos', 'PDF, PNG e vetor (AI/SVG)']],
};

function render() {
  const cat = catById(p.cat);
  const title = model ? model.cap : p.name;
  document.title = `${title} — Gráfica Estamp`;
  document.querySelector('meta[name="description"]').content = p.desc;
  // galeria: só a imagem deste produto (o modelo escolhido ou a foto do produto)
  const shots = model ? [model] : [{ src: p.img, cap: p.name, fit: p.fit || 'cover', id: p.id }];
  const first = shots[0];

  root.innerHTML = `
    <nav class="crumbs" aria-label="Você está em" style="padding-top:24px"><a href="index.html">Início</a><span><a href="produtos.html?cat=${cat.id}">${cat.label}</a></span>${model ? `<span><a href="produto.html?id=${p.id}">${esc(p.name)}</a></span>` : ''}<span>${esc(title)}</span></nav>
    <div class="prod">
      <div class="gallery">
        <button class="g-main fit-${first.fit}" id="gMain" aria-label="Ampliar foto"><img src="${first.src}" alt="${esc(first.cap)}" width="900" height="900"><span class="g-zoom">${icon('search')}</span></button>
        ${shots.length > 1 ? `<div class="g-thumbs">${shots.map((w, i) => `<button class="fit-${w.fit}${i ? '' : ' on'}" data-i="${i}" aria-label="Foto ${i + 1}: ${esc(w.cap)}"><img src="${w.src}" alt=""></button>`).join('')}</div>` : ''}
      </div>
      <div class="prod-info">
        <span class="eyebrow">${model ? `<a href="produto.html?id=${p.id}">${esc(p.name)}</a>` : cat.label}</span>
        <h1>${esc(title)}</h1>
        <p>${esc(p.desc)}</p>
        ${model ? `<p class="model-note">${icon('image')}Modelo de referência. Fazemos igual ou adaptamos com a sua marca, cores e textos.</p>` : ''}
        <div class="facts" id="facts"></div>
        <div id="action"></div>
      </div>
    </div>
    <section class="spec-wrap"><h2 class="h2" style="font-size:24px">Detalhes do produto</h2>
      <dl class="spec">${[['Produto', p.name], ...(model ? [['Modelo', model.cap]] : []), ['Categoria', cat.label],
        ['Como comprar', p.flow === 'compra' ? 'Compra direta: escolha as opções e pague online ou pelo WhatsApp' : 'Sob encomenda: envie o pedido e receba o orçamento antes de pagar'],
        ['Preço', priceLine(p)], ...(SPECS[p.cat] || []), ['Arte', 'Envie a sua ou peça para a equipe criar; você aprova antes de produzir'],
        ['Recebimento', `Retirada na gráfica (${SITE.address}) ou entrega em Cruzeiro do Sul`]].map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>
    <div class="details" id="details"></div>
    <div style="padding-bottom:60px"></div>`;

  let cur = 0;
  const show = (i) => {
    cur = i; const w = shots[i];
    const main = $('#gMain'); main.className = `g-main fit-${w.fit}`; main.querySelector('img').src = w.src; main.querySelector('img').alt = w.cap;
    root.querySelectorAll('.g-thumbs button').forEach((x, k) => x.classList.toggle('on', k === i));
  };
  root.querySelector('.g-thumbs')?.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) show(Number(b.dataset.i)); });
  $('#gMain').addEventListener('click', () => openLightbox(shots, cur));

  renderDetails();
  if (p.flow === 'compra') renderBuy(); else renderQuote();
}

// Tamanhos por altura e peso (referência aproximada; a equipe confirma no atendimento)
const FIT = {
  masc: [['PP', 1.50, 1.60, 45, 55], ['P', 1.60, 1.68, 55, 65], ['M', 1.68, 1.75, 65, 75], ['G', 1.75, 1.82, 75, 85], ['GG', 1.80, 1.88, 85, 98], ['EXG', 1.85, 1.95, 98, 115]],
  fem: [['PPBL', 1.45, 1.55, 40, 48], ['PBL', 1.55, 1.62, 48, 55], ['MBL', 1.60, 1.67, 55, 63], ['GBL', 1.65, 1.72, 63, 72], ['GGBL', 1.68, 1.76, 72, 82], ['EXGBL', 1.70, 1.80, 82, 95]],
};
// o peso pesa mais que a altura no caimento: escolhe pela faixa de peso e sobe um número se a altura passar da faixa
function suggest(rows, alt, peso) {
  let i = rows.findIndex(([, , , , w2]) => peso <= w2);
  if (i < 0) i = rows.length - 1;
  if (alt > rows[i][2] && i < rows.length - 1) i++;
  return rows[i][0];
}

function renderDetails() {
  const boxes = [
    ['approve', 'Arte aprovada antes', 'Nada vai para a produção sem você conferir e aprovar a arte final.'],
    ['truck', 'Retirada ou entrega', `Retire na gráfica (${SITE.address}) ou receba em Cruzeiro do Sul.`],
    ['wa', 'Atendimento pelo WhatsApp', `Dúvidas? Fale com a equipe no ${SITE.phone}.`],
  ];
  let html = boxes.map(([i, t, d]) => `<div class="box">${icon(i)}<h3>${t}</h3><p>${d}</p></div>`).join('');
  if (p.cat === 'camisas') {
    const table = (t, rows) => `<table class="measures"><thead><tr><th>${t}</th><th>Altura</th><th>Peso</th></tr></thead>
      <tbody>${rows.map(([sz, h1, h2, w1, w2]) => `<tr><td><b>${sz}</b></td><td>${h1.toFixed(2).replace('.', ',')} a ${h2.toFixed(2).replace('.', ',')} m</td><td>${w1} a ${w2} kg</td></tr>`).join('')}</tbody></table>`;
    html = `<div class="box" style="grid-column:1/-1"><div style="display:flex;gap:10px;align-items:center">${icon('ruler')}<h3 style="margin:0">Qual é o meu tamanho?</h3></div>
      <p style="margin:6px 0 14px">Informe altura e peso para ver o tamanho indicado. A tabela é uma referência; em caso de dúvida, a equipe confirma com você.</p>
      <div class="fit-calc"><label>Altura (m)<input class="input" id="calcH" inputmode="decimal" placeholder="1,70"></label>
        <label>Peso (kg)<input class="input" id="calcW" inputmode="numeric" placeholder="70"></label>
        <div class="fit-out" id="calcOut">Seu tamanho aparece aqui</div></div>
      <div class="two" style="margin-top:16px">${table('Masculino', FIT.masc)}${table('Feminino (baby look)', FIT.fem)}</div></div>` + html;
  }
  $('#details').innerHTML = html;
  const h = $('#calcH'), w = $('#calcW');
  if (h) {
    const calc = () => {
      const alt = parseFloat(h.value.replace(',', '.')), peso = parseFloat(w.value.replace(',', '.'));
      if (!(alt > 1 && alt < 2.3 && peso > 25 && peso < 250)) { $('#calcOut').textContent = 'Seu tamanho aparece aqui'; return; }
      $('#calcOut').innerHTML = `Masculino: <b>${suggest(FIT.masc, alt, peso)}</b> · Feminino: <b>${suggest(FIT.fem, alt, peso)}</b>`;
    };
    h.addEventListener('input', calc); w.addEventListener('input', calc);
  }
}

// ===== Imagens do cliente, separadas por posição (frente, costas…) =====
// files: { [slot]: [{ name, size, url }] } — ficam só no navegador; o cliente anexa no WhatsApp ao final
function uploadsField(slots, files) {
  return `<div class="uploads">${slots.map((s) => `<div class="up-slot" data-slot="${s.k}">
      <label class="files">${icon(s.i || 'image')}<b>${s.l}</b><small>Toque para escolher · PNG, JPG ou PDF</small>
        <input type="file" data-up="${s.k}" multiple accept=".png,.jpg,.jpeg,.webp,.pdf,.ai,.cdr,.eps,.svg,.psd" hidden></label>
      <ul class="file-list">${fileItems(s.k, files)}</ul></div>`).join('')}</div>`;
}
function fileItems(slot, files) {
  return (files[slot] || []).map((f, i) => `<li>${f.url ? `<img src="${f.url}" alt="">` : icon('doc')}<span>${esc(f.name)} <small class="muted">${(f.size / 1024 / 1024).toFixed(1)} MB</small></span><button type="button" data-rm="${slot}:${i}">remover</button></li>`).join('');
}
function wireUploads(container, files, onChange = () => {}) {
  container.addEventListener('change', (e) => {
    const slot = e.target.dataset?.up;
    if (!slot) return;
    const list = (files[slot] ||= []);
    for (const f of e.target.files) {
      if (list.length >= 6) { toast('Máximo de 6 arquivos por campo'); break; }
      if (f.size > 25 * 1024 * 1024) { toast(`${esc(f.name)} passa de 25 MB`); continue; }
      list.push({ name: f.name, size: f.size, url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null });
    }
    e.target.value = '';
    container.querySelector(`[data-slot="${slot}"] .file-list`).innerHTML = fileItems(slot, files);
    onChange();
  });
  container.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rm]');
    if (!rm) return;
    const [slot, i] = rm.dataset.rm.split(':');
    const [f] = files[slot].splice(Number(i), 1);
    if (f?.url) URL.revokeObjectURL(f.url);
    container.querySelector(`[data-slot="${slot}"] .file-list`).innerHTML = fileItems(slot, files);
    onChange();
  });
}
const fileCount = (files) => Object.values(files).reduce((n, l) => n + l.length, 0);
const fileSummary = (slots, files) => slots.filter((s) => files[s.k]?.length).map((s) => `${s.l}: ${files[s.k].map((f) => f.name).join(', ')}`).join(' | ');

// ===================== Tipo A: compra direta =====================
const BUY_SLOTS = [{ k: 'arte', l: 'Sua arte ou logo', i: 'upload' }, { k: 'referencia', l: 'Imagem de referência', i: 'image' }];
const buyFiles = {};
let buyCores = [];
function renderBuy() {
  const sel = defaultSelection(p);
  let qty = 1;
  $('#facts').innerHTML = `<span class="fact toggle">${icon('check')}Compra direta</span><span class="fact">${icon('store')}Retirada ou entrega</span>`;
  $('#action').innerHTML = `
    ${p.options.map((o) => `<fieldset class="opt" style="border:0"><legend class="opt-title">${o.label}</legend><div class="radios">
      ${o.choices.map((c) => `<label class="radio"><input type="radio" name="${o.key}" value="${c.v}"${sel[o.key] === c.v ? ' checked' : ''}>
        <span>${c.label}${c.price != null ? `<small>${brl(c.price)}</small>` : c.note ? `<small>${c.note}</small>` : ''}</span></label>`).join('')}
    </div></fieldset>`).join('')}
    <div class="opt"><div class="opt-title">Cores <small>Toque em quantas quiser</small></div><div id="buyColors"></div></div>
    <div class="opt"><label class="opt-title" for="buyDesc">Como você quer? <small>Opcional</small></label>
      <textarea class="textarea" id="buyDesc" rows="3" maxlength="800" placeholder="Ex.: nome e telefone na frente, logo no verso, fundo preto…"></textarea></div>
    <div class="opt"><div class="opt-title">Imagens <small>Opcional · sua arte, logo ou referência</small></div><div id="buyUp">${uploadsField(BUY_SLOTS, buyFiles)}</div></div>
    <div class="buy">
      <div class="buy-row">
        <div><small>Total</small><div class="price-lg" id="total"></div><small id="unit"></small></div>
        <div class="qty" aria-label="Quantidade"><button type="button" data-q="-1" aria-label="Diminuir">−</button><input id="qty" type="number" min="1" max="${MAX_QTY}" value="1" aria-label="Quantidade"><button type="button" data-q="1" aria-label="Aumentar">+</button></div>
      </div>
      <div class="buy-btns">
        <button class="btn btn-dark" id="add">${icon('cart')}Adicionar ao carrinho</button>
        <a class="btn btn-wa" id="buyWa" target="_blank" rel="noopener">${icon('wa')}Pedir pelo WhatsApp</a>
      </div>
      <small>As imagens vão junto no WhatsApp: anexe-as na conversa. Antes de imprimir, mandamos a prova para você aprovar.</small>
    </div>`;

  const update = () => {
    const unit = unitPrice(p, sel);
    $('#total').textContent = brl(unit * qty);
    $('#unit').textContent = qty > 1 ? `${qty} × ${brl(unit)}` : selectionLabel(p, sel);
    $('#qty').value = qty;
    const desc = $('#buyDesc').value.trim();
    const imgs = fileSummary(BUY_SLOTS, buyFiles);
    $('#buyWa').href = waLink(`Olá! Quero pedir pelo site:\n\n${qty}× ${p.name}${model ? `\nModelo: ${model.cap}` : ''}\n${selectionLabel(p, sel)}\nTotal: ${brl(unit * qty)}`
      + (buyCores.length ? `\n*Cores:* ${buyCores.join(', ')}` : '') + (desc ? `\n\n*Como eu quero:* ${desc}` : '') + (imgs ? `\n📎 Vou anexar: ${imgs}` : ''));
  };
  $('#buyDesc').addEventListener('input', () => update());
  const PAL = coresField().choices;
  const drawColors = () => {
    $('#buyColors').innerHTML = `<div class="swatches">${PAL.map((c) => `<label class="sw" title="${c.v}"><input type="checkbox" value="${c.v}"${buyCores.includes(c.v) ? ' checked' : ''} aria-label="${c.v}"><span style="background:${c.c}"></span><em>${c.v}</em></label>`).join('')}</div>
      <div class="color-add"><input class="input" id="corNova" placeholder="Outra cor (ex.: verde-musgo)" maxlength="30"><button type="button" class="btn btn-line btn-sm" id="corAdd">Adicionar</button></div>
      <div class="color-sum">${buyCores.length ? `<b>${buyCores.length} ${buyCores.length === 1 ? 'cor selecionada' : 'cores selecionadas'}:</b> ${buyCores.map((c) => { const sw = PAL.find((x) => x.v === c); return `<span class="chip-c">${sw ? `<i style="background:${sw.c}"></i>` : ''}${esc(c)}<button type="button" data-cor-rm="${esc(c)}" aria-label="Remover ${esc(c)}">×</button></span>`; }).join('')}` : '<span class="muted">Nenhuma cor selecionada ainda.</span>'}</div>`;
    update();
  };
  const addCor = () => { const c = $('#corNova').value.trim(); if (c && !buyCores.some((x) => x.toLowerCase() === c.toLowerCase())) buyCores.push(c[0].toUpperCase() + c.slice(1)); drawColors(); };
  $('#buyColors').addEventListener('change', (e) => { if (e.target.type !== 'checkbox') return; const v = e.target.value; buyCores = e.target.checked ? [...buyCores, v] : buyCores.filter((x) => x !== v); drawColors(); });
  $('#buyColors').addEventListener('click', (e) => { if (e.target.closest('#corAdd')) addCor(); const rm = e.target.closest('[data-cor-rm]'); if (rm) { buyCores = buyCores.filter((x) => x !== rm.dataset.corRm); drawColors(); } });
  $('#buyColors').addEventListener('keydown', (e) => { if (e.target.id === 'corNova' && e.key === 'Enter') { e.preventDefault(); addCor(); } });
  wireUploads($('#buyUp'), buyFiles, () => update());
  $('#action').addEventListener('change', (e) => {
    if (e.target.type === 'radio') { sel[e.target.name] = e.target.value; update(); }
    if (e.target.id === 'qty') { qty = Math.max(1, Math.min(MAX_QTY, parseInt(e.target.value, 10) || 1)); update(); }
  });
  $('#action').addEventListener('click', (e) => {
    const q = e.target.closest('[data-q]');
    if (q) { qty = Math.max(1, Math.min(MAX_QTY, qty + Number(q.dataset.q))); update(); }
  });
  $('#add').addEventListener('click', () => {
    cart.add(p.id, { ...sel }, qty, model?.cap, [buyCores.length && `Cores: ${buyCores.join(', ')}`, $('#buyDesc').value.trim()].filter(Boolean).join(' · '));
    toast(`${icon('check')}<span>${esc(p.name)} no carrinho</span><a href="carrinho.html">Ver carrinho</a>`);
  });
  drawColors();
}

// ===================== Tipo B: orçamento em etapas =====================
function renderQuote() {
  const steps = FORMS[p.form];
  const DRAFT = `estamp-orc-${p.id}`;
  let data = initialData(p.form, p.preset);
  try { Object.assign(data, JSON.parse(sessionStorage.getItem(DRAFT)) || {}); } catch { /* sem rascunho */ }
  const files = {}; // imagens por posição
  let step = 0;

  $('#facts').innerHTML = `<span class="fact b">${icon('chat')}Solicitação de orçamento</span>`
    + (p.from ? `<span class="fact">A partir de ${brl(p.from)}/${p.unit}</span>` : '<span class="fact">Preço conforme o projeto</span>')
    + '<span class="fact" id="factInfo"></span>';
  $('#action').innerHTML = `<div class="quote" id="quote">
      <div class="quote-head"><b id="qTitle"></b><div class="progress">${steps.map(() => '<i></i>').join('')}<i></i></div></div>
      <form id="qForm" novalidate></form>
      <div class="quote-nav" id="qNav"></div>
    </div>
    <p class="muted" style="font-size:13px;margin-top:10px">Você não paga nada agora. A equipe responde com preço, prazo e condições.</p>`;
  const form = $('#qForm');

  const save = () => { try { sessionStorage.setItem(DRAFT, JSON.stringify(data)); } catch { /* sem espaço */ } };
  const visible = (f) => !f.when || f.when(data);

  function factInfo() {
    if (p.form !== 'camisa') { $('#factInfo').hidden = true; return; }
    const tipo = FORMS.camisa[0].fields[0].choices.find((c) => c.v === data.tipo)?.l;
    $('#factInfo').textContent = `${tipo || ''} · ${sizeTotal(data.tamanhos)} unidades`;
  }

  function field(f) {
    if (!visible(f)) return '';
    const v = data[f.key];
    const req = f.req ? ' <span class="req">*</span>' : '';
    const head = (tag = 'div') => `<${tag === 'label' ? `label for="f-${f.key}"` : 'div class="label"'}>${f.label}${req}</${tag === 'label' ? 'label' : 'div'}>${f.hint ? `<span class="hint">${f.hint}</span>` : ''}`;
    const radio = (c, cls = 'radio') => `<label class="${cls}"><input type="radio" name="${f.key}" value="${c.v}"${v === c.v ? ' checked' : ''}>
      <span>${c.i ? icon(c.i) : ''}${c.l}${c.s ? `<small>${esc(c.s)}</small>` : ''}</span></label>`;
    const wrap = (inner, tag) => `<div class="field" data-field="${f.key}"${f.half ? ' data-half' : ''}>${head(tag)}${inner}<div class="err-msg" hidden></div></div>`;
    switch (f.type) {
      case 'cards': return wrap(`<div class="cards" role="radiogroup">${f.choices.map((c) => radio(c)).join('')}</div>`);
      case 'radios': return wrap(`<div class="radios${f.wide ? ' wide' : ''}" role="radiogroup">${f.choices.map((c) => radio(c)).join('')}</div>`);
      case 'multi': return wrap(`<div class="radios">${f.choices.map((c) => `<label class="radio"><input type="checkbox" name="${f.key}" value="${c.v}"${(v || []).includes(c.v) ? ' checked' : ''}><span>${c.l}${c.s ? `<small>${esc(c.s)}</small>` : ''}</span></label>`).join('')}</div>`);
      case 'colors': {
        const sel = v || [];
        const custom = sel.filter((c) => !f.choices.some((x) => x.v === c));
        return wrap(`<div class="swatches">${f.choices.map((c) => `<label class="sw" title="${c.v}"><input type="checkbox" name="${f.key}" value="${c.v}"${sel.includes(c.v) ? ' checked' : ''} aria-label="${c.v}"><span style="background:${c.c}"></span><em>${c.v}</em></label>`).join('')}</div>
          <div class="color-add"><input class="input" id="corNova" placeholder="Outra cor (ex.: verde-musgo)" maxlength="30"><button type="button" class="btn btn-line btn-sm" id="corAdd">Adicionar</button></div>
          <div class="color-sum">${sel.length ? `<b>${sel.length} ${sel.length === 1 ? 'cor selecionada' : 'cores selecionadas'}:</b> ${sel.map((c) => {
            const sw = f.choices.find((x) => x.v === c);
            return `<span class="chip-c">${sw ? `<i style="background:${sw.c}"></i>` : ''}${esc(c)}<button type="button" data-cor-rm="${esc(c)}" aria-label="Remover ${esc(c)}">×</button></span>`;
          }).join('')}` : '<span class="muted">Nenhuma cor selecionada ainda.</span>'}</div>${custom.length ? '' : ''}`);
      }
      case 'sizes': {
        const t = data.tamanhos || {};
        const box = (sz) => `<div class="size-box"><label for="sz-${sz}">${sz}</label><input id="sz-${sz}" type="number" inputmode="numeric" min="0" max="999" data-size="${sz}" value="${t[sz] || 0}"></div>`;
        const n = sizeTotal(t);
        const masc = data.genero !== 'fem', fem = data.genero !== 'masc';
        const part = (list) => sizeTotal(Object.fromEntries(list.map((k) => [k, t[k]])));
        return wrap(`${masc ? `<div class="size-group"><div class="size-title">Masculino <small id="szM">${part(SIZES)} peças</small></div><div class="sizes-grid">${SIZES.map(box).join('')}</div></div>` : ''}
          ${fem ? `<div class="size-group"><div class="size-title">Feminino (baby look) <small id="szF">${part(BABY_SIZES)} peças</small></div><div class="sizes-grid">${BABY_SIZES.map(box).join('')}</div></div>` : ''}
          <div class="size-total"><span>Total</span><span><span id="szTotal">${n}</span> unidades <small id="szFaixa">· ${n ? faixa(n) : '—'}</small></span></div>
          <small class="muted" style="display:block;margin-top:8px">Não sabe o tamanho? Use a calculadora "Qual é o meu tamanho?" mais abaixo na página.</small>`);
      }
      case 'uploads': return wrap(uploadsField(f.slots, files) + `<small class="muted" style="display:flex;gap:6px;align-items:center;margin-top:10px">${icon('wa')} As imagens vão junto no WhatsApp que abre ao final: é só anexá-las na conversa.</small>`);
      case 'textarea': return wrap(`<textarea class="textarea" id="f-${f.key}" name="${f.key}" rows="${f.rows || 4}" placeholder="${esc(f.placeholder || '')}" maxlength="1500">${esc(v || '')}</textarea>`, 'label');
      default: return wrap(`<input class="input" id="f-${f.key}" name="${f.key}" type="${f.type}" value="${esc(v || '')}"${f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : ''}${f.min ? ` min="${f.min}"` : ''}${f.autocomplete ? ` autocomplete="${f.autocomplete}"` : ''}${f.type === 'number' ? ' inputmode="numeric"' : ''}${f.type === 'date' ? ` min="${new Date().toISOString().slice(0, 10)}"` : ''} maxlength="200">`, 'label');
    }
  }

  function draw() {
    const last = step === steps.length;
    root.querySelectorAll('.progress i').forEach((el, i) => el.classList.toggle('on', i <= step));
    $('#qTitle').textContent = last ? 'Revise e envie' : `Etapa ${step + 1} de ${steps.length} · ${steps[step].title}`;
    if (last) {
      form.innerHTML = `<div class="quote-step on"><h3>Confira o seu pedido</h3><p>Se algo estiver errado, volte e ajuste.</p>${review()}</div>`;
    } else {
      const s = steps[step];
      const fields = s.fields.map(field);
      // campos marcados como "half" ficam lado a lado
      let html = '';
      for (let i = 0; i < s.fields.length; i++) {
        if (s.fields[i].half && s.fields[i + 1]?.half && fields[i] && fields[i + 1]) { html += `<div class="two">${fields[i]}${fields[i + 1]}</div>`; i++; } else html += fields[i];
      }
      form.innerHTML = `<div class="quote-step on"><h3>${step + 1}. ${s.title}</h3><p>${s.sub}</p>${html}</div>`;
    }
    $('#qNav').innerHTML = (step ? '<button type="button" class="btn btn-line" id="back">Voltar</button>' : '')
      + (last ? `<button type="button" class="btn btn-brand" id="send">${icon('wa')}Solicitar orçamento</button>`
        : `<button type="button" class="btn btn-dark" id="next">${step === steps.length - 1 ? 'Revisar pedido' : 'Continuar'} ${icon('arrow')}</button>`);
    factInfo();
  }

  // ----- entrada de dados -----
  form.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.size) {
      data.tamanhos = { ...data.tamanhos, [t.dataset.size]: Math.max(0, Math.min(999, parseInt(t.value, 10) || 0)) };
      const n = sizeTotal(data.tamanhos);
      const part = (list) => list.reduce((x, k) => x + (data.tamanhos[k] || 0), 0);
      $('#szTotal').textContent = n; $('#szFaixa').textContent = `· ${n ? faixa(n) : '—'}`;
      if ($('#szM')) $('#szM').textContent = `${part(SIZES)} peças`;
      if ($('#szF')) $('#szF').textContent = `${part(BABY_SIZES)} peças`;
      factInfo(); save(); return;
    }
    if (t.name && (t.type === 'text' || t.type === 'tel' || t.type === 'email' || t.type === 'number' || t.type === 'date' || t.tagName === 'TEXTAREA')) {
      data[t.name] = t.value; t.classList.remove('err'); t.closest('.field')?.querySelector('.err-msg')?.setAttribute('hidden', '');
      save();
    }
  });
  form.addEventListener('change', (e) => {
    const t = e.target;
    if (t.type === 'radio') {
      data[t.name] = t.value;
      if (t.name === 'genero') { const keep = t.value === 'masc' ? SIZES : t.value === 'fem' ? BABY_SIZES : [...SIZES, ...BABY_SIZES]; data.tamanhos = Object.fromEntries(Object.entries(data.tamanhos || {}).filter(([k]) => keep.includes(k))); }
      if (t.name === 'tipo' && p.form === 'camisa' && (t.value === 'polo' || data.gola === 'polo')) data.gola = t.value === 'polo' ? 'polo' : 'redonda';
      save();
      // redesenha só se algum campo depende deste
      if (steps[step]?.fields.some((f) => f.when) || t.name === 'tipo') { const y = scrollY; draw(); scrollTo(0, y); }
      else factInfo();
      clearErr(t.name);
    }
    if (t.type === 'checkbox' && t.name === 'cores') {
      const list = data.cores || [];
      data.cores = t.checked ? [...list, t.value] : list.filter((c) => c !== t.value);
      save(); const y = scrollY; draw(); scrollTo(0, y); clearErr('cores'); return;
    }
    if (t.type === 'checkbox' && t.name) {
      data[t.name] = [...form.querySelectorAll(`input[name="${t.name}"]:checked`)].map((x) => x.value);
      save(); const y = scrollY; draw(); scrollTo(0, y);
    }
  });
  const clearErr = (key) => { const f = form.querySelector(`[data-field="${key}"] .err-msg`); if (f) f.hidden = true; };

  wireUploads(form, files);
  // cores: adicionar uma cor escrita e remover pelo "×"
  const addColor = () => {
    const inp = $('#corNova'); const c = inp.value.trim().replace(/\s+/g, ' ');
    if (!c) return;
    const name = c[0].toUpperCase() + c.slice(1);
    if (!(data.cores || []).some((x) => x.toLowerCase() === name.toLowerCase())) data.cores = [...(data.cores || []), name];
    save(); const y = scrollY; draw(); scrollTo(0, y); clearErr('cores');
  };
  form.addEventListener('click', (e) => {
    if (e.target.closest('#corAdd')) addColor();
    const rm = e.target.closest('[data-cor-rm]');
    if (rm) { data.cores = (data.cores || []).filter((c) => c !== rm.dataset.corRm); save(); const y = scrollY; draw(); scrollTo(0, y); }
  });
  form.addEventListener('keydown', (e) => { if (e.target.id === 'corNova' && e.key === 'Enter') { e.preventDefault(); addColor(); } });

  // ----- validação -----
  function validate() {
    let first = null;
    for (const f of steps[step].fields) {
      if (!visible(f)) continue;
      const v = data[f.key];
      let msg = '';
      if (f.type === 'sizes') { if (!sizeTotal(v)) msg = 'Informe ao menos 1 unidade.'; }
      else if (f.req && (v == null || String(v).trim() === '' || (Array.isArray(v) && !v.length))) msg = 'Preencha este campo.';
      else if (f.type === 'tel' && v && String(v).replace(/\D/g, '').length < 10) msg = 'Informe o WhatsApp com DDD.';
      else if (f.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = 'E-mail inválido.';
      else if (f.type === 'number' && v && !(Number(v) >= (f.min || 0))) msg = 'Número inválido.';
      const box = form.querySelector(`[data-field="${f.key}"]`);
      if (!box) continue;
      const err = box.querySelector('.err-msg');
      err.hidden = !msg; err.textContent = msg;
      box.querySelector('.input, .textarea')?.classList.toggle('err', !!msg);
      if (msg && !first) first = box;
    }
    if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); first.querySelector('input, textarea')?.focus({ preventScroll: true }); }
    return !first;
  }

  // ----- revisão e envio -----
  function entries() {
    const out = model ? [['Modelo de referência', model.cap]] : [];
    for (const s of steps) {
      for (const f of s.fields) {
        if (!visible(f)) continue;
        const v = data[f.key];
        let txt = '';
        if (f.type === 'sizes') txt = Object.entries(v || {}).filter(([, n]) => n > 0).map(([k, n]) => `${k}: ${n}`).join(' · ') + ` (total ${sizeTotal(v)})`;
        else if (f.type === 'uploads') txt = fileSummary(f.slots, files);
        else if (f.type === 'colors') txt = (v || []).join(', ');
        else if (f.choices) txt = (Array.isArray(v) ? v : [v]).map((x) => f.choices.find((c) => c.v === x)?.l).filter(Boolean).join(', ');
        else if (f.type === 'date' && v) txt = v.split('-').reverse().join('/');
        else txt = (v || '').toString().trim();
        if (txt) out.push([f.label.replace(' (opcional)', '').replace(/\?$/, ''), txt]);
      }
    }
    return out;
  }
  const review = () => `<dl class="review">${entries().map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;

  function send() {
    const proto = `EST-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const msg = `*Solicitação de orçamento — ${p.name}*\nPedido: ${proto}\n\n`
      + entries().map(([k, v]) => `*${k}:* ${v}`).join('\n')
      + (fileCount(files) ? `\n\n📎 Vou anexar ${fileCount(files)} imagem(ns) nesta conversa.` : '');
    const url = waLink(msg);
    try { sessionStorage.removeItem(DRAFT); } catch { /* ok */ }
    $('#quote').innerHTML = `<div class="done">
      <div class="done-ico">${icon('check')}</div>
      <h3>Pedido pronto para envio</h3>
      <span class="proto">${proto}</span>
      <p>Toque no botão para enviar o pedido à equipe pelo WhatsApp.${fileCount(files) ? ' <b>Lembre de anexar as suas imagens na conversa.</b>' : ''} A equipe responde com preço, prazo e condições.</p>
      <a class="btn btn-wa" href="${url}" target="_blank" rel="noopener">${icon('wa')}Enviar para a equipe</a>
      <a class="link-arrow" href="produtos.html" style="margin-top:6px">Ver outros produtos ${icon('arrow')}</a></div>`;
    $('#quote').scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.open(url, '_blank', 'noopener');
  }

  $('#qNav').addEventListener('click', (e) => {
    if (e.target.closest('#next')) { if (validate()) { step++; draw(); $('#quote').scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
    if (e.target.closest('#back')) { step--; draw(); $('#quote').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    if (e.target.closest('#send')) send();
  });
  draw();
}

if (!p) {
  root.innerHTML = `<div class="empty" style="padding:100px 0">${icon('search')}<h1 class="h2">Produto não encontrado</h1>
    <a class="btn btn-dark" href="produtos.html">Ver todos os produtos</a></div>`;
} else {
  render();
}
