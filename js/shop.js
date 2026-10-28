import { CATEGORIES, PRODUCTS } from '../data/products.js';
import { layout, icon, productCard, catById, esc, $ } from './ui.js';

layout('produtos');

const params = new URLSearchParams(location.search);
const cat = catById(params.get('cat')) ? params.get('cat') : null;
const q = (params.get('q') || '').trim().slice(0, 60);

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
let list = PRODUCTS.filter((p) => !cat || p.cat === cat);
if (q) {
  const words = norm(q).split(/\s+/).filter(Boolean);
  list = list.filter((p) => { const hay = norm(`${p.name} ${p.desc} ${catById(p.cat).label}`); return words.every((w) => hay.includes(w)); });
}

const c = catById(cat);
if (c) {
  document.title = `${c.label} — Gráfica Estamp`;
  $('#crumb').outerHTML = `<a href="produtos.html">Produtos</a><span>${c.label}</span>`;
  $('#title').textContent = c.label;
  $('#lead').textContent = c.desc;
}

const link = (id, label, n) => `<a href="produtos.html${id ? `?cat=${id}` : ''}" class="${(id || null) === cat ? 'on' : ''}">${label}<small>${n}</small></a>`;
$('#side').innerHTML = '<h4>Categorias</h4>' + link(null, 'Todos os produtos', PRODUCTS.length)
  + CATEGORIES.map((x) => link(x.id, x.label, PRODUCTS.filter((p) => p.cat === x.id).length)).join('');
$('#chips').innerHTML = [['', 'Todos'], ...CATEGORIES.map((x) => [x.id, x.label])]
  .map(([id, l]) => `<a class="chip${(id || null) === cat ? ' on' : ''}" href="produtos.html${id ? `?cat=${id}` : ''}">${l}</a>`).join('');

$('#count').textContent = `${list.length} ${list.length === 1 ? 'produto' : 'produtos'}`;
if (q) $('#qinfo').innerHTML = `Busca por “${esc(q)}” · <a href="produtos.html${cat ? `?cat=${cat}` : ''}" style="text-decoration:underline">limpar</a>`;

$('#grid').innerHTML = list.length
  ? list.map((p) => productCard(p, { showCat: !cat })).join('')
  : `<div class="empty" style="grid-column:1/-1">${icon('search')}<p>Não encontramos “${esc(q)}”. Talvez a gente faça mesmo assim.</p>
     <a class="btn btn-dark" href="index.html#orcamento">Pedir orçamento personalizado</a></div>`;
