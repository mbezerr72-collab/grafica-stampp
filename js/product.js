// Página de um produto: compra direta (Tipo A) ou formulário de orçamento em etapas (Tipo B).
import { productById, defaultSelection, unitPrice, selectionLabel, MEASURES, SIZES, BABY_SIZES, brl } from '../data/products.js';
import { cart, MAX_QTY } from './cart.js';
import { SITE, waLink } from './config.js';
import { FORMS, initialData, sizeTotal, faixa } from './forms.js';
import { layout, icon, esc, catById, productCard, productsIn, toast, $ } from './ui.js';

layout('produtos');
const root = $('#prod');
const p = productById(new URLSearchParams(location.search).get('id'));

if (!p) {
  root.innerHTML = `<div class="empty" style="padding:100px 0">${icon('search')}<h1 class="h2">Produto não encontrado</h1>
    <a class="btn btn-dark" href="produtos.html">Ver todos os produtos</a></div>`;
} else {
  render();
}

function render() {
  const cat = catById(p.cat);
  document.title = `${p.name} — Gráfica Estamp`;
  document.querySelector('meta[name="description"]').content = p.desc;
  const imgs = [p.img, ...(p.gallery || [])];

  root.innerHTML = `
    <nav class="crumbs" aria-label="Você está em" style="padding-top:24px"><a href="index.html">Início</a><span><a href="produtos.html?cat=${cat.id}">${cat.label}</a></span><span>${esc(p.name)}</span></nav>
    <div class="prod">
      <div class="gallery">
        <div class="g-main"><img id="gMain" src="${imgs[0]}" alt="${esc(p.name)}" width="900" height="900"></div>
        ${imgs.length > 1 ? `<div class="g-thumbs">${imgs.map((src, i) => `<button class="${i ? '' : 'on'}" data-src="${src}" aria-label="Foto ${i + 1}"><img src="${src}" alt=""></button>`).join('')}</div>` : ''}
      </div>
      <div class="prod-info">
        <span class="eyebrow">${cat.label}</span>
        <h1>${esc(p.name)}</h1>
        <p>${esc(p.desc)}</p>
        <div class="facts" id="facts"></div>
        <div id="action"></div>
      </div>
    </div>
    <div class="details" id="details"></div>
    <section style="padding-bottom:80px"><div class="sec-head"><div><h2>Outros produtos de ${cat.label.toLowerCase()}</h2></div></div>
      <div class="grid">${productsIn(p.cat).filter((x) => x.id !== p.id).slice(0, 4).map((x) => productCard(x, { showCat: false })).join('')}</div></section>`;

  root.querySelector('.g-thumbs')?.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $('#gMain').src = b.dataset.src;
    root.querySelectorAll('.g-thumbs button').forEach((x) => x.classList.toggle('on', x === b));
  });

  renderDetails();
  if (p.flow === 'compra') renderBuy(); else renderQuote();
}

function renderDetails() {
  const boxes = [
    ['approve', 'Arte aprovada antes', 'Nada vai para a produção sem você conferir e aprovar a arte final.'],
    ['truck', 'Retirada ou entrega', `Retire na gráfica (${SITE.address}) ou receba em Cruzeiro do Sul.`],
    ['wa', 'Atendimento pelo WhatsApp', `Dúvidas? Fale com a equipe no ${SITE.phone}.`],
  ];
  let html = boxes.map(([i, t, d]) => `<div class="box">${icon(i)}<h3>${t}</h3><p>${d}</p></div>`).join('');
  if (p.cat === 'camisas') {
    html = `<div class="box" style="grid-column:1/-1"><div style="display:flex;gap:10px;align-items:center">${icon('ruler')}<h3 style="margin:0">Tabela de medidas</h3></div>
      <p style="margin:6px 0 14px">Largura de axila a axila e altura do ombro até a barra, em centímetros.</p>
      <div class="two">${Object.entries(MEASURES).map(([t, rows]) => `<table class="measures"><thead><tr><th>${t}</th><th>Largura</th><th>Altura</th></tr></thead>
        <tbody>${rows.map(([s, w, h]) => `<tr><td><b>${s}</b></td><td>${w}</td><td>${h}</td></tr>`).join('')}</tbody></table>`).join('')}</div></div>` + html;
  }
  $('#details').innerHTML = html;
}

// ===================== Tipo A: compra direta =====================
function renderBuy() {
  const sel = defaultSelection(p);
  let qty = 1;
  $('#facts').innerHTML = `<span class="fact toggle">${icon('check')}Compra direta</span><span class="fact">${icon('store')}Retirada ou entrega</span>`;
  $('#action').innerHTML = `
    ${p.options.map((o) => `<fieldset class="opt" style="border:0"><legend class="opt-title">${o.label}</legend><div class="radios">
      ${o.choices.map((c) => `<label class="radio"><input type="radio" name="${o.key}" value="${c.v}"${sel[o.key] === c.v ? ' checked' : ''}>
        <span>${c.label}${c.price != null ? `<small>${brl(c.price)}</small>` : c.note ? `<small>${c.note}</small>` : ''}</span></label>`).join('')}
    </div></fieldset>`).join('')}
    <div class="buy">
      <div class="buy-row">
        <div><small>Total</small><div class="price-lg" id="total"></div><small id="unit"></small></div>
        <div class="qty" aria-label="Quantidade"><button type="button" data-q="-1" aria-label="Diminuir">−</button><input id="qty" type="number" min="1" max="${MAX_QTY}" value="1" aria-label="Quantidade"><button type="button" data-q="1" aria-label="Aumentar">+</button></div>
      </div>
      <div class="buy-btns">
        <button class="btn btn-dark" id="add">${icon('cart')}Adicionar ao carrinho</button>
        <a class="btn btn-wa" id="buyWa" target="_blank" rel="noopener">${icon('wa')}Pedir pelo WhatsApp</a>
      </div>
      <small>Depois do pedido, envie a sua arte pelo WhatsApp. Antes de imprimir, mandamos a prova para você aprovar.</small>
    </div>`;

  const update = () => {
    const unit = unitPrice(p, sel);
    $('#total').textContent = brl(unit * qty);
    $('#unit').textContent = qty > 1 ? `${qty} × ${brl(unit)}` : selectionLabel(p, sel);
    $('#qty').value = qty;
    $('#buyWa').href = waLink(`Olá! Quero pedir pelo site:\n\n${qty}× ${p.name}\n${selectionLabel(p, sel)}\nTotal: ${brl(unit * qty)}`);
  };
  $('#action').addEventListener('change', (e) => {
    if (e.target.type === 'radio') { sel[e.target.name] = e.target.value; update(); }
    if (e.target.id === 'qty') { qty = Math.max(1, Math.min(MAX_QTY, parseInt(e.target.value, 10) || 1)); update(); }
  });
  $('#action').addEventListener('click', (e) => {
    const q = e.target.closest('[data-q]');
    if (q) { qty = Math.max(1, Math.min(MAX_QTY, qty + Number(q.dataset.q))); update(); }
  });
  $('#add').addEventListener('click', () => {
    cart.add(p.id, { ...sel }, qty);
    toast(`${icon('check')}<span>${esc(p.name)} no carrinho</span><a href="carrinho.html">Ver carrinho</a>`);
  });
  update();
}

// ===================== Tipo B: orçamento em etapas =====================
function renderQuote() {
  const steps = FORMS[p.form];
  const DRAFT = `estamp-orc-${p.id}`;
  let data = initialData(p.form, p.preset);
  try { Object.assign(data, JSON.parse(sessionStorage.getItem(DRAFT)) || {}); } catch { /* sem rascunho */ }
  let files = [];
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
      case 'radios': return wrap(`<div class="radios" role="radiogroup">${f.choices.map((c) => radio(c)).join('')}</div>`);
      case 'multi': return wrap(`<div class="radios">${f.choices.map((c) => `<label class="radio"><input type="checkbox" name="${f.key}" value="${c.v}"${(v || []).includes(c.v) ? ' checked' : ''}><span>${c.l}</span></label>`).join('')}</div>`);
      case 'swatches': return wrap(`<div class="swatches" role="radiogroup">${f.choices.map((c) => `<label class="sw" title="${c.l}"><input type="radio" name="${f.key}" value="${c.v}"${v === c.v ? ' checked' : ''} aria-label="${c.l}"><span style="background:${c.c}"></span></label>`).join('')}</div>
        <div class="radios" style="margin-top:10px">${f.extra.map((c) => radio(c)).join('')}</div>
        <small class="muted" id="corLbl" style="display:block;margin-top:8px">${f.choices.find((c) => c.v === v)?.l || ''}</small>`);
      case 'sizes': {
        const t = data.tamanhos || {};
        const baby = BABY_SIZES.some((s) => t[s]) || data.baby;
        const box = (s) => `<div class="size-box"><label for="sz-${s}">${s}</label><input id="sz-${s}" type="number" inputmode="numeric" min="0" max="999" data-size="${s}" value="${t[s] || 0}"></div>`;
        const n = sizeTotal(t);
        return wrap(`<div class="sizes-grid">${SIZES.map(box).join('')}</div>
          <label class="check"><input type="checkbox" id="babyToggle"${baby ? ' checked' : ''}> Incluir tamanhos baby look</label>
          ${baby ? `<div class="sizes-grid" style="margin-top:10px">${BABY_SIZES.map(box).join('')}</div>` : ''}
          <div class="size-total"><span>Total</span><span><span id="szTotal">${n}</span> unidades <small id="szFaixa">· ${n ? faixa(n) : '—'}</small></span></div>`);
      }
      case 'textarea': return wrap(`<textarea class="textarea" id="f-${f.key}" name="${f.key}" rows="${f.rows || 4}" placeholder="${esc(f.placeholder || '')}" maxlength="1500">${esc(v || '')}</textarea>`, 'label');
      case 'files': return wrap(`<label class="files">${icon('upload')}<b>Anexar arquivos</b><small>${f.hint || ''}</small>
          <input type="file" id="fileInput" multiple accept=".png,.jpg,.jpeg,.pdf,.ai,.cdr,.eps,.svg,.psd" hidden></label>
          <ul class="file-list" id="fileList"></ul>
          <small class="muted" style="display:block;margin-top:8px">${icon('wa')} Os arquivos vão junto na conversa do WhatsApp que abre ao final: basta anexá-los lá.</small>`);
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
      drawFiles();
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
      $('#szTotal').textContent = n; $('#szFaixa').textContent = `· ${n ? faixa(n) : '—'}`;
      factInfo(); save(); return;
    }
    if (t.name && (t.type === 'text' || t.type === 'tel' || t.type === 'email' || t.type === 'number' || t.type === 'date' || t.tagName === 'TEXTAREA')) {
      data[t.name] = t.value; t.classList.remove('err'); t.closest('.field')?.querySelector('.err-msg')?.setAttribute('hidden', '');
      save();
    }
  });
  form.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'babyToggle') {
      data.baby = t.checked;
      if (!t.checked) { const s = { ...data.tamanhos }; BABY_SIZES.forEach((k) => delete s[k]); data.tamanhos = s; }
      save(); draw(); return;
    }
    if (t.id === 'fileInput') { addFiles(t.files); t.value = ''; return; }
    if (t.type === 'radio') {
      data[t.name] = t.value;
      if (t.name === 'tipo' && p.form === 'camisa' && (t.value === 'polo' || data.gola === 'polo')) data.gola = t.value === 'polo' ? 'polo' : 'redonda';
      if (t.name === 'cor') { const c = steps[0].fields.find((f) => f.key === 'cor'); const lbl = $('#corLbl'); if (lbl) lbl.textContent = c.choices.find((x) => x.v === t.value)?.l || ''; }
      save();
      // redesenha só se algum campo depende deste
      if (steps[step]?.fields.some((f) => f.when) || t.name === 'tipo') { const y = scrollY; draw(); scrollTo(0, y); }
      else factInfo();
      clearErr(t.name);
    }
    if (t.type === 'checkbox' && t.name) {
      data[t.name] = [...form.querySelectorAll(`input[name="${t.name}"]:checked`)].map((x) => x.value);
      save(); const y = scrollY; draw(); scrollTo(0, y);
    }
  });
  const clearErr = (key) => { const f = form.querySelector(`[data-field="${key}"] .err-msg`); if (f) f.hidden = true; };

  function addFiles(list) {
    for (const f of list) {
      if (files.length >= 10) { toast('Máximo de 10 arquivos'); break; }
      if (f.size > 25 * 1024 * 1024) { toast(`${esc(f.name)} passa de 25 MB`); continue; }
      files.push({ name: f.name, size: f.size, url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null });
    }
    drawFiles();
  }
  function drawFiles() {
    const ul = $('#fileList');
    if (!ul) return;
    ul.innerHTML = files.map((f, i) => `<li>${f.url ? `<img src="${f.url}" alt="">` : icon('doc')}<span>${esc(f.name)} <small class="muted">${(f.size / 1024 / 1024).toFixed(1)} MB</small></span><button type="button" data-rm="${i}">remover</button></li>`).join('');
  }
  form.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { const [f] = files.splice(Number(rm.dataset.rm), 1); if (f.url) URL.revokeObjectURL(f.url); drawFiles(); }
  });

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
    const out = [];
    for (const s of steps) {
      for (const f of s.fields) {
        if (!visible(f)) continue;
        const v = data[f.key];
        let txt = '';
        if (f.type === 'sizes') txt = Object.entries(v || {}).filter(([, n]) => n > 0).map(([k, n]) => `${k}: ${n}`).join(' · ') + ` (total ${sizeTotal(v)})`;
        else if (f.type === 'files') txt = files.length ? files.map((x) => x.name).join(', ') : '';
        else if (f.type === 'swatches') txt = [...f.choices, ...f.extra].find((c) => c.v === v)?.l || '';
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
      + (files.length ? `\n\n📎 Vou anexar ${files.length} arquivo(s) nesta conversa.` : '');
    const url = waLink(msg);
    try { sessionStorage.removeItem(DRAFT); } catch { /* ok */ }
    $('#quote').innerHTML = `<div class="done">
      <div class="done-ico">${icon('check')}</div>
      <h3>Pedido pronto para envio</h3>
      <span class="proto">${proto}</span>
      <p>Toque no botão para enviar o pedido à equipe pelo WhatsApp.${files.length ? ' <b>Lembre de anexar os seus arquivos na conversa.</b>' : ''} A equipe responde com preço, prazo e condições.</p>
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
