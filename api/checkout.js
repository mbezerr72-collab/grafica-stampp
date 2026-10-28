// Função serverless (Vercel): cria a preferência de pagamento no Mercado Pago.
// O navegador manda só ids e quantidades; o preço é recalculado aqui a partir do catálogo.
// Variáveis de ambiente: MP_ACCESS_TOKEN (obrigatória) e SITE_URL (opcional).
// Para testar: crie duas contas de teste no painel do Mercado Pago (vendedor e comprador) e use
// o access token da conta de teste VENDEDORA. Pague logado com a compradora, usando cartões de teste.
import { productById, unitPrice, selectionLabel } from '../data/products.js';

const MAX_ITEMS = 30;
const MAX_QTY = 50;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido' });
  }
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return res.status(503).json({ error: 'Pagamento online não configurado' });

  let items;
  try {
    items = buildItems(req.body?.items);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const site = (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/$/, '');
  const ref = `EST-${Date.now().toString(36).toUpperCase()}`;
  const pref = {
    items,
    payer: buildPayer(req.body?.customer),
    external_reference: ref,
    statement_descriptor: 'GRAFICA ESTAMP',
    back_urls: {
      success: `${site}/pedido.html?ref=${ref}`,
      pending: `${site}/pedido.html?ref=${ref}`,
      failure: `${site}/pedido.html?ref=${ref}`,
    },
    auto_return: 'approved',
    payment_methods: { installments: 6 },
  };

  try {
    const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': ref },
      body: JSON.stringify(pref),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('Mercado Pago recusou a preferência', r.status, data?.message);
      return res.status(502).json({ error: 'Não foi possível iniciar o pagamento' });
    }
    const url = token.startsWith('TEST-') ? data.sandbox_init_point || data.init_point : data.init_point;
    return res.status(200).json({ url, ref });
  } catch (err) {
    console.error('Falha ao falar com o Mercado Pago', err);
    return res.status(502).json({ error: 'Não foi possível iniciar o pagamento' });
  }
}

const int = (v) => (Number.isInteger(v) ? v : NaN);
const clean = (s, n) => String(s ?? '').replace(/[^\p{L}\p{N} .,\-]/gu, '').trim().slice(0, n);

// Valida o carrinho e devolve os itens no formato do Mercado Pago, com preços do servidor.
// Só produtos do Tipo A (compra direta) podem ser pagos online.
export function buildItems(raw) {
  if (!Array.isArray(raw) || !raw.length) throw new Error('Carrinho vazio');
  if (raw.length > MAX_ITEMS) throw new Error('Itens demais no carrinho');
  return raw.map((i) => {
    const qty = int(i?.qty);
    if (!(qty >= 1 && qty <= MAX_QTY)) throw new Error('Quantidade inválida');
    const p = productById(i.id);
    if (!p || p.flow !== 'compra') throw new Error('Produto inválido');
    const sel = i.sel && typeof i.sel === 'object' ? i.sel : {};
    const unit = unitPrice(p, sel); // lança erro se alguma opção não existir
    return {
      id: p.id,
      title: p.name,
      description: selectionLabel(p, sel).slice(0, 250),
      quantity: qty,
      unit_price: unit,
      currency_id: 'BRL',
    };
  });
}

export function buildPayer(c = {}) {
  const name = clean(c.nome, 80);
  const phone = String(c.whatsapp || '').replace(/\D/g, '').slice(-11);
  return name ? { name, phone: phone.length >= 10 ? { area_code: phone.slice(0, 2), number: phone.slice(2) } : undefined } : undefined;
}
