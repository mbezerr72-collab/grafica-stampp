import { brl } from '../data/products.js?v=2610282113';
import { cart, lineInfo, totals, MAX_QTY } from './cart.js?v=2610282113';
import { SITE, waLink } from './config.js?v=2610282113';
import { layout, icon, esc, toast, $ } from './ui.js?v=2610282113';
import { protocolo, registrarNoPainel } from './painel-ponte.js?v=2610282113';

layout('');
const root = $('#cartPage');
const CUST = 'estamp-cliente';
let cust = { entrega: 'retirada', nome: '', whatsapp: '', endereco: '' };
try { Object.assign(cust, JSON.parse(localStorage.getItem(CUST)) || {}); } catch { /* sem dados salvos */ }

cart.onChange(draw);

function draw(items) {
  if (!items.length) {
    root.innerHTML = `<div class="empty" style="padding:80px 0">${icon('cart')}<h2 class="h2">Seu carrinho está vazio</h2>
      <p>Produtos sob encomenda, como camisas e fachadas, são pedidos direto na página do produto.</p>
      <a class="btn btn-dark" href="produtos.html">Ver produtos</a></div>`;
    return;
  }
  const t = totals(items);
  root.innerHTML = `<div class="cart">
    <div class="cart-list">${items.map((i) => {
      const l = lineInfo(i);
      return `<div class="line" data-key="${i.key}">
        <a href="produto.html?id=${l.p.id}"><img src="${l.p.img}" alt="${esc(l.p.name)}" width="88" height="88"></a>
        <div><h3>${esc(l.p.name)}</h3><small>${esc(l.label)}</small>
          <div class="qty"><button data-q="-1" aria-label="Diminuir">−</button><input type="number" value="${i.qty}" min="1" max="${MAX_QTY}" aria-label="Quantidade" data-qty><button data-q="1" aria-label="Aumentar">+</button></div></div>
        <div class="line-end"><b>${brl(l.total)}</b><button class="rm">Remover</button></div>
      </div>`;
    }).join('')}</div>

    <aside class="summary">
      <div class="box" style="display:grid;gap:14px">
        <h2 style="font-size:18px">Resumo</h2>
        <div class="sum-row"><span>Subtotal (${t.count} ${t.count === 1 ? 'item' : 'itens'})</span><span>${brl(t.subtotal)}</span></div>
        <div class="sum-row"><span>Entrega</span><span>${cust.entrega === 'entrega' ? 'A combinar' : 'Grátis (retirada)'}</span></div>
        <div class="sum-row total"><span>Total</span><span>${brl(t.subtotal)}</span></div>
      </div>
      <form class="box" id="checkout" style="display:grid;gap:14px" novalidate>
        <div class="field"><div class="label">Como você quer receber?</div><div class="radios" style="grid-template-columns:1fr 1fr">
          <label class="radio"><input type="radio" name="entrega" value="retirada"${cust.entrega === 'retirada' ? ' checked' : ''}><span>Retirada<small>Na gráfica</small></span></label>
          <label class="radio"><input type="radio" name="entrega" value="entrega"${cust.entrega === 'entrega' ? ' checked' : ''}><span>Entrega<small>Valor a combinar</small></span></label></div></div>
        ${cust.entrega === 'entrega' ? `<div class="field"><label for="c-end">Endereço <span class="req">*</span></label><input class="input" id="c-end" name="endereco" value="${esc(cust.endereco)}" placeholder="Rua, número, bairro" autocomplete="street-address" maxlength="200"></div>`
          : `<p class="muted" style="font-size:13px">${icon('pin')} ${SITE.address}</p>`}
        <div class="field"><label for="c-nome">Nome <span class="req">*</span></label><input class="input" id="c-nome" name="nome" value="${esc(cust.nome)}" autocomplete="name" maxlength="120"></div>
        <div class="field"><label for="c-wa">WhatsApp <span class="req">*</span></label><input class="input" id="c-wa" name="whatsapp" type="tel" value="${esc(cust.whatsapp)}" placeholder="(68) 99999-9999" autocomplete="tel" maxlength="20"></div>
        <div class="err-msg" id="cErr" hidden></div>
        <button type="button" class="btn btn-brand btn-block" id="pay">Pagar com Pix ou cartão</button>
        <button type="button" class="btn btn-wa btn-block" id="wa">${icon('wa')}Finalizar pelo WhatsApp</button>
        <small class="muted" style="text-align:center">Depois do pedido, envie sua arte pelo WhatsApp. Mandamos a prova antes de imprimir.</small>
      </form>
    </aside></div>`;
}

const saveCust = () => { try { localStorage.setItem(CUST, JSON.stringify(cust)); } catch { /* ok */ } };

root.addEventListener('click', (e) => {
  const line = e.target.closest('.line');
  if (line) {
    const item = cart.items().find((i) => i.key === line.dataset.key);
    if (e.target.closest('.rm')) cart.remove(line.dataset.key);
    const q = e.target.closest('[data-q]');
    if (q && item) cart.setQty(item.key, item.qty + Number(q.dataset.q));
  }
  if (e.target.closest('#wa')) finish('wa');
  if (e.target.closest('#pay')) finish('pay');
});
root.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.qty != null) cart.setQty(t.closest('.line').dataset.key, parseInt(t.value, 10) || 1);
  if (t.name === 'entrega') { cust.entrega = t.value; saveCust(); draw(cart.items()); }
});
root.addEventListener('input', (e) => {
  if (['nome', 'whatsapp', 'endereco'].includes(e.target.name)) { cust[e.target.name] = e.target.value; saveCust(); }
});

function valid() {
  const err = $('#cErr');
  let msg = '';
  if (!cust.nome.trim()) msg = 'Informe o seu nome.';
  else if (cust.whatsapp.replace(/\D/g, '').length < 10) msg = 'Informe o WhatsApp com DDD.';
  else if (cust.entrega === 'entrega' && !cust.endereco.trim()) msg = 'Informe o endereço de entrega.';
  err.hidden = !msg; err.textContent = msg;
  return !msg;
}

function orderText(items, ref) {
  return `*Pedido pelo site — Gráfica Estamp*${ref ? `\nPedido: ${ref}` : ''}\n\n`
    + items.map((i) => { const l = lineInfo(i); return `• ${i.qty}× ${l.p.name}\n   ${l.label}\n   ${brl(l.total)}`; }).join('\n')
    + `\n\n*Total:* ${brl(totals(items).subtotal)}\n*Nome:* ${cust.nome}\n*WhatsApp:* ${cust.whatsapp}\n*Recebimento:* ${cust.entrega === 'entrega' ? `Entrega — ${cust.endereco}` : 'Retirada na gráfica'}`;
}

/** Cada item do carrinho entra no painel como um pedido do site (já com o valor). */
function paraOPainel(items, ref) {
  items.forEach((i, k) => {
    const l = lineInfo(i);
    if (!l) return;
    registrarNoPainel({
      numero: items.length > 1 ? `${ref}-${k + 1}` : ref,
      produtoId: i.id, nome: cust.nome.trim(), telefone: cust.whatsapp, qtd: i.qty,
      respostas: [['Opção', l.label], ['Recebimento', cust.entrega === 'entrega' ? `Entrega: ${cust.endereco}` : 'Retirada na gráfica']],
      tipo: 'compra', total: Math.round(l.total * 100) / 100,
    });
  });
}

async function finish(how) {
  if (!valid()) return;
  const items = cart.items();
  if (how === 'wa') {
    const ref = protocolo();
    paraOPainel(items, ref);
    const url = waLink(orderText(items, ref));
    // alguns navegadores bloqueiam a janela; o link no aviso serve de reserva
    if (!window.open(url, '_blank', 'noopener')) toast(`${icon('wa')}<span>Pedido pronto.</span><a href="${url}" target="_blank" rel="noopener">Abrir WhatsApp</a>`);
    return;
  }
  const btn = $('#pay');
  btn.disabled = true; btn.textContent = 'Abrindo pagamento…';
  try {
    const r = await fetch('/api/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map(({ id, sel, qty }) => ({ id, sel, qty })), customer: cust }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.url) throw new Error(data.error);
    try { sessionStorage.setItem('estamp-ultimo-pedido', orderText(items, data.ref)); } catch { /* ok */ }
    paraOPainel(items, data.ref);
    location.href = data.url;
  } catch {
    toast(`${icon('wa')}<span>Pagamento online indisponível agora. Finalize pelo WhatsApp.</span>`);
    btn.disabled = false; btn.textContent = 'Pagar com Pix ou cartão';
  }
}
