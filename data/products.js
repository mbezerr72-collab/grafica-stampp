// Catálogo da Gráfica Estamp. Usado no site e no servidor (api/checkout.js), que recalcula os preços.
//
// Dois fluxos:
//   flow 'compra'    → Tipo A: preço definido. O cliente escolhe as opções, o preço é calculado e vai para o carrinho.
//   flow 'orcamento' → Tipo B: sob encomenda. O cliente preenche o formulário e a equipe responde com preço e prazo.
//
// Preços do catálogo da Estamp (WhatsApp Business) quando conhecidos; os demais são de DEMONSTRAÇÃO.

export const CATEGORIES = [
  { id: 'impressos', label: 'Impressos gráficos', desc: 'Produtos com formatos e acabamentos definidos.', img: 'img/cat/impressos.jpg' },
  { id: 'camisas', label: 'Camisas e uniformes', desc: 'Para empresas, eventos, times e grupos.', img: 'img/cat/camisas.jpg' },
  { id: 'brindes', label: 'Brindes personalizados', desc: 'Você escolhe o objeto e como quer personalizá-lo.', img: 'img/cat/brindes.jpg' },
  { id: 'comunicacao', label: 'Comunicação visual', desc: 'Produtos sob medida, com orçamento conforme o projeto.', img: 'img/cat/comunicacao.jpg' },
  { id: 'design', label: 'Design e criação', desc: 'Serviços em que você pode precisar da ajuda da equipe.', img: 'img/cat/design.jpg' },
];

// Opção comum aos produtos com preço: arte pronta ou criação pela equipe
const ARTE = { key: 'arte', label: 'Arte', choices: [
  { v: 'pronta', label: 'Tenho a arte pronta', add: 0 },
  { v: 'criar', label: 'Quero que criem a arte', add: 30, note: '+ R$ 30,00' },
] };

export const PRODUCTS = [
  // ===== Impressos gráficos =====
  {
    id: 'cartao-visita', cat: 'impressos', flow: 'compra', name: 'Cartões de visita',
    desc: 'Couché 300g, cores vivas e corte reto. O cartão que a sua marca merece entregar.',
    img: 'img/p/cartao-visita.jpg', badge: 'Mais pedido',
    options: [
      { key: 'qtd', label: 'Quantidade', choices: [
        { v: '100', label: '100 unidades', price: 35 }, { v: '250', label: '250 unidades', price: 75 },
        { v: '500', label: '500 unidades', price: 120 }, { v: '1000', label: '1.000 unidades', price: 190 }] },
      { key: 'impressao', label: 'Impressão', choices: [
        { v: '4x0', label: 'Só frente', mult: 1 }, { v: '4x4', label: 'Frente e verso', mult: 1.3, note: '+30%' }] },
      { key: 'acabamento', label: 'Acabamento', choices: [
        { v: 'fosco', label: 'Laminação fosca', mult: 1 }, { v: 'brilho', label: 'Brilho', mult: 1 },
        { v: 'verniz', label: 'Verniz localizado', mult: 1.25, note: '+25%' }] },
      ARTE,
    ],
  },
  {
    id: 'cartao-fotografico', cat: 'impressos', flow: 'compra', name: 'Cartões fotográficos',
    desc: 'Papel fotográfico com acabamento brilhante. Ideal para lembranças e convites.',
    img: 'img/p/cartao-fotografico.jpg',
    options: [
      { key: 'qtd', label: 'Quantidade', choices: [
        { v: '100', label: '100 unidades', price: 40 }, { v: '250', label: '250 unidades', price: 90 }, { v: '500', label: '500 unidades', price: 150 }] },
      ARTE,
    ],
  },
  {
    id: 'panfletos', cat: 'impressos', flow: 'compra', name: 'Panfletos e flyers',
    desc: 'Divulgação de baixo custo, coloridos e prontos para distribuir.',
    img: 'img/p/panfletos.jpg',
    options: [
      { key: 'formato', label: 'Formato', choices: [
        { v: 'a6', label: 'A6 (10×15 cm)', mult: 0.7 }, { v: 'a5', label: 'A5 (15×21 cm)', mult: 1 }, { v: 'a4', label: 'A4 (21×30 cm)', mult: 1.6 }] },
      { key: 'qtd', label: 'Quantidade', choices: [
        { v: '1000', label: '1.000 unidades', price: 180 }, { v: '2500', label: '2.500 unidades', price: 390 }, { v: '5000', label: '5.000 unidades', price: 690 }] },
      { key: 'impressao', label: 'Impressão', choices: [
        { v: '4x0', label: 'Só frente', mult: 1 }, { v: '4x4', label: 'Frente e verso', mult: 1.25, note: '+25%' }] },
      ARTE,
    ],
  },
  {
    id: 'cartazes-folders', cat: 'impressos', flow: 'orcamento', form: 'impresso', name: 'Cartazes e folders',
    desc: 'Cartazes para eventos e folders dobrados para apresentar sua empresa.',
    img: 'img/p/cartazes-folders.jpg',
  },
  {
    id: 'adesivos-etiquetas', cat: 'impressos', flow: 'compra', name: 'Adesivos e etiquetas',
    desc: 'Vinil com recorte eletrônico no formato da sua arte. Para embalagens, produtos e brindes.',
    img: 'img/p/adesivos-etiquetas.jpg',
    options: [
      { key: 'qtd', label: 'Quantidade', choices: [
        { v: '50', label: '50 unidades', price: 30 }, { v: '100', label: '100 unidades', price: 55 }, { v: '250', label: '250 unidades', price: 120 }] },
      { key: 'tamanho', label: 'Tamanho', choices: [
        { v: '5', label: 'Até 5 cm', mult: 1 }, { v: '8', label: 'Até 8 cm', mult: 1.5 }, { v: '10', label: 'Até 10 cm', mult: 2 }] },
      ARTE,
    ],
  },
  {
    id: 'blocos-receituarios', cat: 'impressos', flow: 'orcamento', form: 'impresso', name: 'Blocos e receituários',
    desc: 'Blocos de pedido, receituários e comandas com a sua marca, numerados se precisar.',
    img: 'img/p/blocos-receituarios.jpg',
  },

  // ===== Camisas e uniformes =====
  {
    id: 'camisas-personalizadas', cat: 'camisas', flow: 'orcamento', form: 'camisa', name: 'Camisas personalizadas',
    desc: 'Crie camisas para sua empresa, evento, equipe ou marca. Você escolhe o modelo e conta para nossa equipe como deseja a personalização.',
    img: 'img/p/camisas-personalizadas.jpg', gallery: ['img/p/camisas-personalizadas-2.jpg', 'img/p/camisas-personalizadas-3.jpg'],
    from: 40, unit: 'un', badge: 'Mais vendida',
  },
  {
    id: 'camisas-polo', cat: 'camisas', flow: 'orcamento', form: 'camisa', preset: { tipo: 'polo', gola: 'polo' }, name: 'Camisas polo',
    desc: 'Polo com bordado ou estampa para uniformes de empresa e equipes de atendimento.',
    img: 'img/p/camisas-polo.jpg', from: 60, unit: 'un',
  },
  {
    id: 'uniformes-profissionais', cat: 'camisas', flow: 'orcamento', form: 'camisa', name: 'Uniformes profissionais',
    desc: 'Camisas e polos com a identidade da sua empresa, para o dia a dia da equipe.',
    img: 'img/p/uniformes-profissionais.jpg', from: 40, unit: 'un',
  },
  {
    id: 'uniformes-esportivos', cat: 'camisas', flow: 'orcamento', form: 'camisa', preset: { tipo: 'dryfit', tecido: 'poliester' }, name: 'Uniformes esportivos',
    desc: 'Camisa e short sublimados com nome e número de cada jogador. Também fazemos coletes.',
    img: 'img/p/uniformes-esportivos.jpg', from: 80, unit: 'conjunto',
  },
  {
    id: 'camisas-eventos', cat: 'camisas', flow: 'orcamento', form: 'camisa', name: 'Camisas para eventos',
    desc: 'Aniversários, formaturas, igrejas, corridas e encontros de família.',
    img: 'img/p/camisas-eventos.jpg', from: 40, unit: 'un',
  },
  {
    id: 'abadas', cat: 'camisas', flow: 'orcamento', form: 'camisa', preset: { tipo: 'tradicional', tecido: 'poliester' }, name: 'Abadás personalizados',
    desc: 'Abadás leves e coloridos para blocos, festas e eventos.',
    img: 'img/p/abadas.jpg', from: 40, unit: 'un',
  },

  // ===== Brindes personalizados =====
  {
    id: 'canecas', cat: 'brindes', flow: 'compra', name: 'Canecas personalizadas',
    desc: 'Cerâmica 325 ml com a sua foto, logo ou frase. Um presente que dura.',
    img: 'img/p/canecas.jpg', gallery: ['img/p/canecas-2.jpg'], badge: 'Presente',
    options: [
      { key: 'modelo', label: 'Modelo', choices: [
        { v: 'ceramica', label: 'Cerâmica branca', price: 35 }, { v: 'magica', label: 'Mágica (a arte aparece com calor)', price: 55 }] },
      ARTE,
    ],
  },
  {
    id: 'trofeus-medalhas', cat: 'brindes', flow: 'compra', name: 'Troféus e medalhas',
    desc: 'Para campeonatos e premiações, com placa ou adesivo personalizado.',
    img: 'img/p/trofeus-medalhas.jpg',
    options: [
      { key: 'modelo', label: 'Modelo', choices: [
        { v: 'trofeu-35', label: 'Troféu 35 cm', price: 50 }, { v: 'trofeu-55', label: 'Troféu 55 cm', price: 80 },
        { v: 'medalha', label: 'Medalha com fita', price: 12 }] },
    ],
  },
  {
    id: 'chaveiros', cat: 'brindes', flow: 'orcamento', form: 'brinde', name: 'Chaveiros',
    desc: 'Chaveiros em acrílico ou MDF com a sua arte. Ótimos para lembrancinhas e times.',
    img: 'img/p/chaveiros.jpg',
  },
  {
    id: 'canetas', cat: 'brindes', flow: 'orcamento', form: 'brinde', name: 'Canetas personalizadas',
    desc: 'Canetas com o nome e o contato da sua empresa para distribuir aos clientes.',
    img: 'img/p/canetas.jpg',
  },
  {
    id: 'ecobags', cat: 'brindes', flow: 'orcamento', form: 'brinde', name: 'Ecobags',
    desc: 'Sacolas de tecido personalizadas para lojas, eventos e brindes.',
    img: 'img/p/ecobags.jpg',
  },
  {
    id: 'kits-empresas', cat: 'brindes', flow: 'orcamento', form: 'brinde', name: 'Kits para empresas',
    desc: 'Kits de boas-vindas e de fim de ano com vários itens personalizados.',
    img: 'img/p/kits-empresas.jpg',
  },

  // ===== Comunicação visual =====
  {
    id: 'banners-lonas', cat: 'comunicacao', flow: 'orcamento', form: 'medida', name: 'Banners e lonas',
    desc: 'Banners com bastão, lonas para fachada e faixas para eventos.',
    img: 'img/p/banners-lonas.jpg',
  },
  {
    id: 'fachadas-letreiros', cat: 'comunicacao', flow: 'orcamento', form: 'medida', name: 'Fachadas e letreiros',
    desc: 'Letreiros em ACM, MDF e acrílico. Fazemos a medição e a instalação.',
    img: 'img/p/fachadas-letreiros.jpg',
  },
  {
    id: 'adesivos-vitrine', cat: 'comunicacao', flow: 'orcamento', form: 'medida', name: 'Adesivos para vitrines e adesivação',
    desc: 'Promoções, horários e adesivação de vidros, paredes e veículos.',
    img: 'img/p/adesivos-vitrine.jpg',
  },
  {
    id: 'placas-personalizadas', cat: 'comunicacao', flow: 'orcamento', form: 'medida', name: 'Placas personalizadas',
    desc: 'Placas em acrílico, PVC ou ACM para recepções, salas e sinalização.',
    img: 'img/p/placas-personalizadas.jpg',
  },

  // ===== Design e criação =====
  {
    id: 'criacao-logotipo', cat: 'design', flow: 'orcamento', form: 'design', name: 'Criação de logotipo',
    desc: 'Um logo profissional para a sua marca, com arquivos prontos para impressão.',
    img: 'img/p/criacao-logotipo.jpg',
  },
  {
    id: 'arte-divulgacao', cat: 'design', flow: 'orcamento', form: 'design', name: 'Arte para divulgação',
    desc: 'Posts, panfletos e banners criados para vender mais.',
    img: 'img/p/arte-divulgacao.jpg',
  },
  {
    id: 'arte-camisas', cat: 'design', flow: 'orcamento', form: 'design', name: 'Arte para camisas',
    desc: 'Criamos a estampa ou o uniforme completo a partir da sua ideia.',
    img: 'img/p/arte-camisas.jpg',
  },
  {
    id: 'identidade-visual', cat: 'design', flow: 'orcamento', form: 'design', name: 'Identidade visual',
    desc: 'Logo, cores, fontes e aplicações para a sua marca ficar reconhecível.',
    img: 'img/p/identidade-visual.jpg',
  },
  {
    id: 'ajustes-arquivos', cat: 'design', flow: 'orcamento', form: 'design', name: 'Ajustes em arquivos para impressão',
    desc: 'Já tem a arte? Ajustamos tamanho, sangria e cores para imprimir sem erro.',
    img: 'img/p/ajustes-arquivos.jpg',
  },
];

// Tamanhos da tabela de medidas da Estamp
export const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'EXG'];
export const BABY_SIZES = ['PPBL', 'PBL', 'MBL', 'GBL', 'GGBL', 'EXGBL'];

// Tabela de medidas do catálogo da Estamp (largura × altura, em cm)
export const MEASURES = {
  Masculino: [['PP', 46, 66], ['P', 50, 70], ['M', 53, 75], ['G', 57, 80], ['GG', 61, 82], ['EXG', 67, 87]],
  'Baby look': [['PPBL', 41, 56], ['PBL', 43, 59], ['MBL', 47, 64], ['GBL', 50, 67], ['GGBL', 54, 74], ['EXGBL', 58, 76]],
};

export const productById = (id) => PRODUCTS.find((p) => p.id === id);

// Opções padrão (primeira escolha de cada grupo)
export function defaultSelection(p) {
  return Object.fromEntries((p.options || []).map((o) => [o.key, o.choices[0].v]));
}

// Preço unitário de um produto do Tipo A. Lança erro se alguma opção for inválida.
export function unitPrice(p, sel = {}) {
  if (!p || p.flow !== 'compra') throw new Error('Produto sem preço definido');
  let base = 0, mult = 1, add = 0;
  for (const o of p.options) {
    const c = o.choices.find((x) => x.v === sel[o.key]);
    if (!c) throw new Error(`Opção inválida: ${o.label}`);
    if (c.price != null) base = c.price;
    if (c.mult != null) mult *= c.mult;
    if (c.add != null) add += c.add;
  }
  return Math.round((base * mult + add) * 100) / 100;
}

export function selectionLabel(p, sel = {}) {
  return (p.options || []).map((o) => o.choices.find((c) => c.v === sel[o.key])?.label).filter(Boolean).join(' · ');
}

export const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
