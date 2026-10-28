// Carrinho salvo no navegador (só produtos do Tipo A). Os preços mostrados são calculados a partir
// do catálogo; o servidor recalcula tudo no pagamento.
import { productById, unitPrice, selectionLabel } from '../data/products.js';

const KEY = 'estamp-cart-v2';
const listeners = new Set();
export const MAX_QTY = 50;

function read() {
  try {
    const items = JSON.parse(localStorage.getItem(KEY)) || [];
    return items.filter((i) => lineInfo(i)); // descarta itens de versões antigas do catálogo
  } catch { return []; }
}
function write(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* armazenamento bloqueado */ }
  listeners.forEach((fn) => fn(items));
}
const same = (a, b) => a.id === b.id && JSON.stringify(a.sel) === JSON.stringify(b.sel);

export const cart = {
  items: read,
  onChange(fn) { listeners.add(fn); fn(read()); },
  add(id, sel, qty = 1) {
    const items = read();
    const hit = items.find((i) => same(i, { id, sel }));
    if (hit) hit.qty = Math.min(MAX_QTY, hit.qty + qty);
    else items.push({ key: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), id, sel, qty });
    write(items);
  },
  setQty(key, qty) { write(read().map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : i))); },
  remove(key) { write(read().filter((i) => i.key !== key)); },
  clear() { write([]); },
};

export function lineInfo(item) {
  const p = productById(item?.id);
  if (!p || p.flow !== 'compra') return null;
  try {
    const unit = unitPrice(p, item.sel);
    return { p, unit, total: unit * item.qty, label: selectionLabel(p, item.sel) };
  } catch { return null; }
}

export function totals(items = read()) {
  return {
    subtotal: items.reduce((s, i) => s + (lineInfo(i)?.total || 0), 0),
    count: items.reduce((s, i) => s + i.qty, 0),
  };
}
