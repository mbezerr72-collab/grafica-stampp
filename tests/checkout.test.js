import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildItems } from '../api/checkout.js';

test('recalcula o preço no servidor, ignorando o que vier do navegador', () => {
  const [i] = buildItems([{ id: 'caneca-ceramica', qty: 2, price: 0.01 }]);
  assert.equal(i.unit_price, 35);
  assert.equal(i.quantity, 2);
});

test('uniforme 3D: desconto de 10% acima de 10 unidades', () => {
  const [a] = buildItems([{ id: 'custom', qty: 9, config: { fabric: 'poliester', shorts: true } }]);
  const [b] = buildItems([{ id: 'custom', qty: 10, config: { fabric: 'poliester', shorts: true } }]);
  assert.equal(a.unit_price, 95);
  assert.equal(b.unit_price, 85.5);
});

test('rejeita entradas inválidas', () => {
  assert.throws(() => buildItems([]));
  assert.throws(() => buildItems([{ id: 'nao-existe', qty: 1 }]));
  assert.throws(() => buildItems([{ id: 'caneca-ceramica', qty: 0 }]));
  assert.throws(() => buildItems([{ id: 'caneca-ceramica', qty: 1.5 }]));
  assert.throws(() => buildItems([{ id: 'caneca-ceramica', qty: 9999 }]));
  assert.throws(() => buildItems([{ id: 'camisa-polo', qty: 1, size: 'XXXL' }]));
  assert.throws(() => buildItems([{ id: 'custom', qty: 1, config: { fabric: 'seda' } }]));
  assert.throws(() => buildItems([{ id: 'custom', qty: 3, config: { fabric: 'dryfit', roster: [{}, {}] } }]));
  assert.throws(() => buildItems([{ id: 'uniforme-completo', qty: 1 }]));
});
