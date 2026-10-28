// Carrinho salvo no navegador (localStorage). Preços exibidos são só visuais: o servidor recalcula.
import { PRODUCTS, customUnitPrice, FABRICS, brl } from '../data/products.js';

const KEY = 'estamp-cart-v1';
const listeners = new Set();

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function write(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* armazenamento cheio/bloqueado */ }
  listeners.forEach((fn) => fn(items));
}

export const cart = {
  items: read,
  onChange(fn) { listeners.add(fn); fn(read()); },
  add(item) {
    const items = read();
    const same = item.id !== 'custom' && items.find((i) => i.id === item.id && i.size === item.size);
    if (same) same.qty += item.qty;
    else items.push({ ...item, key: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) });
    write(items);
  },
  setQty(key, qty) {
    const items = read().map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(500, qty)) } : i));
    write(items);
  },
  remove(key) { write(read().filter((i) => i.key !== key)); },
  clear() { write([]); },
};

export function lineInfo(item) {
  if (item.id === 'custom') {
    const c = item.config || {};
    const unit = customUnitPrice(c.fabric, c.shorts, item.qty);
    const who = c.roster?.length ? `${c.roster.length} jogador${c.roster.length > 1 ? 'es' : ''}` : `${c.name || ''} ${c.number || ''}`.trim();
    return { title: `Uniforme personalizado 3D`, sub: `${FABRICS[c.fabric]?.label || ''}${c.shorts ? ' + short' : ''} · ${who}`, unit, total: unit * item.qty, thumb: item.thumb };
  }
  const p = PRODUCTS.find((x) => x.id === item.id);
  if (!p) return null;
  return { title: p.name, sub: [item.size && `Tam. ${item.size}`, p.unit].filter(Boolean).join(' · '), unit: p.price, total: p.price * item.qty, thumb: `img/produtos/${p.id}.png`, cat: p.cat };
}

export function totals(items = read()) {
  const subtotal = items.reduce((s, i) => s + (lineInfo(i)?.total || 0), 0);
  return { subtotal, count: items.reduce((s, i) => s + i.qty, 0), label: brl(subtotal) };
}
