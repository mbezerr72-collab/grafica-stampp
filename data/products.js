// Catálogo da Gráfica Estamp — preços de DEMONSTRAÇÃO.
// Usado no site e no servidor (api/checkout.js), que recalcula tudo: o preço nunca vem do navegador.

export const CATEGORIES = [
  { id: 'todos', label: 'Todos' },
  { id: 'camisas', label: 'Camisas' },
  { id: 'uniformes', label: 'Uniformes' },
  { id: 'canecas', label: 'Canecas' },
  { id: 'trofeus', label: 'Troféus' },
  { id: 'coletes', label: 'Coletes' },
  { id: 'impressos', label: 'Impressos' },
  { id: 'comunicacao', label: 'Placas & Adesivos' },
];

export const PRODUCTS = [
  { id: 'camisa-cacharrel', cat: 'camisas', name: 'Camisa Cacharrel', desc: 'Malha macia e resistente, sublimação total ou silk.', price: 40, unit: 'un', sizes: true, badge: 'Mais vendida' },
  { id: 'camisa-poliester', cat: 'camisas', name: 'Camisa Poliéster', desc: 'Cores vivas que não desbotam, ideal para eventos.', price: 55, unit: 'un', sizes: true },
  { id: 'camisa-dryfit', cat: 'camisas', name: 'Camisa Dry-Fit', desc: 'Tecido esportivo que seca rápido. Perfeita para treino.', price: 55, unit: 'un', sizes: true },
  { id: 'camisa-polo', cat: 'camisas', name: 'Camisa Gola Polo', desc: 'Uniforme corporativo com bordado ou sublimação.', price: 65, unit: 'un', sizes: true },
  { id: 'camisa-manga-longa', cat: 'camisas', name: 'Camisa Manga Longa', desc: 'Proteção UV para trabalho externo e trilhas.', price: 60, unit: 'un', sizes: true },
  { id: 'uniforme-completo', cat: 'uniformes', name: 'Uniforme Completo', desc: 'Camisa + short sublimados com nome e número.', price: 89, unit: 'conjunto', sizes: true, badge: 'Monte em 3D', custom: true },
  { id: 'uniforme-goleiro', cat: 'uniformes', name: 'Kit Goleiro', desc: 'Manga longa acolchoada + short. Personalizado.', price: 99, unit: 'conjunto', sizes: true },
  { id: 'caneca-ceramica', cat: 'canecas', name: 'Caneca Cerâmica', desc: '325ml, sublimação com sua foto ou arte.', price: 35, unit: 'un', badge: 'Presente' },
  { id: 'caneca-magica', cat: 'canecas', name: 'Caneca Mágica', desc: 'A arte aparece com a bebida quente.', price: 55, unit: 'un' },
  { id: 'trofeu-55', cat: 'trofeus', name: 'Troféu 55cm', desc: 'Campeonatos e premiações, com placa personalizada.', price: 80, unit: 'un' },
  { id: 'medalha', cat: 'trofeus', name: 'Medalha Personalizada', desc: 'Com fita e adesivo resinado do seu evento.', price: 12, unit: 'un' },
  { id: 'colete', cat: 'coletes', name: 'Colete Personalizado', desc: 'Para equipes, eventos, igrejas e empresas.', price: 45, unit: 'un', sizes: true },
  { id: 'cartao-visita', cat: 'impressos', name: 'Cartão de Visita', desc: 'Pacote com 100 unidades, couché 300g.', price: 35, unit: 'pct 100' },
  { id: 'cartao-foto', cat: 'impressos', name: 'Cartão Fotográfico', desc: 'Pacote com 100 unidades, acabamento brilho.', price: 40, unit: 'pct 100' },
  { id: 'panfleto', cat: 'impressos', name: 'Panfletos', desc: '1.000 unidades A5 coloridos frente e verso.', price: 180, unit: 'mil' },
  { id: 'adesivo-recortado', cat: 'comunicacao', name: 'Adesivos Recortados', desc: '50 adesivos em vinil com recorte eletrônico.', price: 30, unit: 'pct 50' },
  { id: 'placa-acrilico', cat: 'comunicacao', name: 'Placa em Acrílico', desc: 'Fachadas, recepções e decoração de festas.', price: 120, unit: 'un' },
  { id: 'letreiro-mdf', cat: 'comunicacao', name: 'Letreiro MDF', desc: 'Logo recortado em MDF pintado para parede.', price: 150, unit: 'un' },
];

// Personalizador 3D
export const FABRICS = {
  cacharrel: { label: 'Cacharrel', price: 40 },
  poliester: { label: 'Poliéster', price: 55 },
  dryfit: { label: 'Dry-Fit', price: 55 },
};
export const SHORTS_PRICE = 25;
export const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'EXG'];

export function customUnitPrice(fabric, withShorts, qty) {
  const f = FABRICS[fabric] || FABRICS.poliester;
  const base = f.price + (withShorts ? SHORTS_PRICE : 0);
  return qty >= 10 ? Math.round(base * 0.9 * 100) / 100 : base; // 10% acima de 10 unidades
}

export const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
