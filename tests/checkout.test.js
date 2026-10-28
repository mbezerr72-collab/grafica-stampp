import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildItems, buildPayer } from '../api/checkout.js';
import { PRODUCTS, defaultSelection, unitPrice } from '../data/products.js';

test('recalcula o preço no servidor, ignorando o que vier do navegador', () => {
  const [i] = buildItems([{ id: 'cartao-visita', qty: 2, sel: { qtd: '100', impressao: '4x0', acabamento: 'fosco', arte: 'pronta' }, price: 0.01 }]);
  assert.equal(i.unit_price, 35);
  assert.equal(i.quantity, 2);
});

test('opções mudam o preço: frente e verso, verniz e criação de arte', () => {
  const [i] = buildItems([{ id: 'cartao-visita', qty: 1, sel: { qtd: '500', impressao: '4x4', acabamento: 'verniz', arte: 'criar' } }]);
  assert.equal(i.unit_price, Math.round((120 * 1.3 * 1.25 + 30) * 100) / 100);
});

test('todo produto de compra direta tem preço válido nas opções padrão', () => {
  for (const p of PRODUCTS.filter((x) => x.flow === 'compra')) assert.ok(unitPrice(p, defaultSelection(p)) > 0, p.id);
});

test('rejeita entradas inválidas', () => {
  assert.throws(() => buildItems([]));
  assert.throws(() => buildItems([{ id: 'nao-existe', qty: 1 }]));
  assert.throws(() => buildItems([{ id: 'camisas-personalizadas', qty: 1 }]), /Produto inválido/);
  assert.throws(() => buildItems([{ id: 'canecas', qty: 0, sel: { modelo: 'ceramica', arte: 'pronta' } }]));
  assert.throws(() => buildItems([{ id: 'canecas', qty: 1.5, sel: { modelo: 'ceramica', arte: 'pronta' } }]));
  assert.throws(() => buildItems([{ id: 'canecas', qty: 1, sel: { modelo: 'ouro', arte: 'pronta' } }]));
  assert.throws(() => buildItems([{ id: 'canecas', qty: 1 }]));
});

test('dados do comprador são limpos', () => {
  assert.deepEqual(buildPayer({ nome: 'Ana <script>', whatsapp: '(68) 99999-0000' }), { name: 'Ana script', phone: { area_code: '68', number: '999990000' } });
  assert.equal(buildPayer({}), undefined);
});
