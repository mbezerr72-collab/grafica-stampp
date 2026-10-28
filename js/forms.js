// Formulários de orçamento (produtos do Tipo B). Cada formulário é uma lista de etapas com campos.
// Tipos de campo: cards, radios, colors, multi, sizes, uploads, text, number, tel, email, date, textarea.
import { SITE } from './config.js';

// Descrição + imagens de referência, presente em todos os formulários
const REF_SLOTS_CAMISA = [
  { k: 'frente', l: 'Imagem da frente', i: 'front' },
  { k: 'costas', l: 'Imagem das costas', i: 'back' },
  { k: 'conjunto', l: 'Frente e costas juntas ou uniforme completo', i: 'both' },
];
const REF_SLOTS = [{ k: 'referencias', l: 'Imagens de referência', i: 'image' }];
const descricao = (label, placeholder) => ({ key: 'descricao', type: 'textarea', label, req: true, placeholder });
const imagens = (slots = REF_SLOTS) => ({ key: 'imagens', type: 'uploads', label: 'Imagens (opcional)', hint: 'Tem uma foto, logo ou modelo do que você quer? Envie aqui. Cada imagem no seu lugar.', slots });
const PRAZO = [
  { key: 'prazo', type: 'radios', label: 'Prazo desejado', hint: 'Para a equipe confirmar a viabilidade.', req: true, choices: [
    { v: 'normal', l: 'Prazo normal', s: 'Conforme disponibilidade' }, { v: 'urgente', l: 'Preciso com urgência' }, { v: 'data', l: 'Tenho uma data específica' }] },
  { key: 'data', type: 'date', label: 'Data em que precisa receber', req: true, when: (d) => d.prazo === 'data' },
];
const CONTATO = {
  title: 'Entrega e contato', sub: 'Para a equipe enviar o orçamento.',
  fields: [
    { key: 'entrega', type: 'radios', label: 'Como você quer receber?', req: true, choices: [
      { v: 'retirada', l: 'Retirada na gráfica', s: SITE.address }, { v: 'entrega', l: 'Entrega', s: 'Em Cruzeiro do Sul, valor a combinar' }] },
    { key: 'endereco', type: 'text', label: 'Endereço de entrega', req: true, when: (d) => d.entrega === 'entrega', placeholder: 'Rua, número, bairro' },
    { key: 'nome', type: 'text', label: 'Nome completo', req: true, autocomplete: 'name' },
    { key: 'whatsapp', type: 'tel', label: 'WhatsApp', req: true, placeholder: '(68) 99999-9999', autocomplete: 'tel' },
    { key: 'empresa', type: 'text', label: 'Empresa (opcional)', autocomplete: 'organization' },
    { key: 'email', type: 'email', label: 'E-mail (opcional)', autocomplete: 'email' },
    { key: 'obs', type: 'textarea', label: 'Observações finais (opcional)', placeholder: 'Algo que não coube nas opções acima', rows: 3 },
  ],
};

export const FORMS = {
  camisa: [
    { title: 'Modelo e tecido', sub: 'As características básicas da camisa.', fields: [
      { key: 'tipo', type: 'cards', label: 'Escolha o tipo de camisa', req: true, choices: [
        { v: 'tradicional', l: 'Tradicional', s: 'Camiseta comum, gola redonda', i: 'tee' }, { v: 'polo', l: 'Polo', s: 'Gola com botões', i: 'polo' },
        { v: 'dryfit', l: 'Dry fit', s: 'Esportiva, seca rápido', i: 'dryfit' }, { v: 'oversized', l: 'Oversized', s: 'Mais larga e solta', i: 'oversized' }] },
      { key: 'tecido', type: 'radios', label: 'Tecido', req: true, choices: [
        { v: 'algodao', l: 'Algodão', s: 'Macio e fresco' }, { v: 'poliester', l: 'Poliéster', s: 'Cores vivas, não amassa' }, { v: 'misto', l: 'Misto', s: 'Algodão + poliéster' }, { v: 'nao-sei', l: 'Não sei', s: 'A gráfica indica' }] },
      { key: 'cores', type: 'colors', label: 'Cores da camisa', hint: 'Toque em quantas cores quiser. Se a cor não estiver aqui, escreva em "Outra cor".', req: true, choices: [
        { v: 'Preta', c: '#141414' }, { v: 'Branca', c: '#ffffff' }, { v: 'Cinza', c: '#8a8a8a' }, { v: 'Azul-marinho', c: '#1b2a4a' },
        { v: 'Azul', c: '#1f6fd1' }, { v: 'Azul-claro', c: '#7cc4f2' }, { v: 'Vermelha', c: '#d22f2f' }, { v: 'Vinho', c: '#6d1a2a' },
        { v: 'Verde', c: '#178a4c' }, { v: 'Verde-limão', c: '#9be22d' }, { v: 'Amarela', c: '#f5c518' }, { v: 'Laranja', c: '#ff6a00' },
        { v: 'Roxa', c: '#6b3fa0' }, { v: 'Rosa', c: '#ef7fb0' }, { v: 'Bege', c: '#e6d8bd' }, { v: 'Marrom', c: '#6b4226' }] },
      { key: 'gola', type: 'radios', label: 'Tipo de gola', req: true, choices: [
        { v: 'redonda', l: 'Redonda' }, { v: 'v', l: 'Gola V' }, { v: 'polo', l: 'Gola polo' }] },
    ] },
    { title: 'Estampa', sub: 'Onde vai a estampa e como ela é feita.', fields: [
      { key: 'local', type: 'cards', label: 'Onde será aplicada a estampa?', req: true, choices: [
        { v: 'frente', l: 'Somente frente', i: 'front' }, { v: 'costas', l: 'Somente costas', i: 'back' }, { v: 'frente-costas', l: 'Frente e costas', i: 'both' },
        { v: 'completa', l: 'Frente, costas e mangas', i: 'sleeves' }] },
      { key: 'tecnica', type: 'radios', wide: true, label: 'Como a estampa é feita?', hint: 'Escolha pelo resultado que você quer. Se ficar em dúvida, deixe a gráfica escolher.', req: true, choices: [
        { v: 'recomendar', l: 'Não sei, a gráfica escolhe', s: 'Indicamos a melhor opção para o seu tecido e a sua arte.' },
        { v: 'sublimacao', l: 'Sublimação', s: 'A arte fica dentro do tecido: não descasca e aceita fotos e degradês. Para camisas claras de poliéster e dry fit.' },
        { v: 'serigrafia', l: 'Silk (serigrafia)', s: 'Tinta aplicada com tela. Bom para muitas peças com logo de poucas cores.' },
        { v: 'dtf', l: 'DTF', s: 'Estampa colorida colada com calor. Serve em qualquer tecido e cor, ótima para poucas peças.' },
        { v: 'bordado', l: 'Bordado', s: 'Desenho feito com linha. Mais elegante, para logos pequenos em polos e uniformes.' }] },
    ] },
    { title: 'Quantidade', sub: 'Quantas peças de cada tamanho.', fields: [
      { key: 'genero', type: 'radios', label: 'Para quem são as camisas?', req: true, choices: [
        { v: 'masc', l: 'Todas masculinas' }, { v: 'fem', l: 'Todas femininas', s: 'Baby look' }, { v: 'misto', l: 'Masculinas e femininas' }] },
      { key: 'tamanhos', type: 'sizes', label: 'Tamanhos', req: true, when: (d) => !!d.genero },
    ] },
    { title: 'Como você quer', sub: 'Descreva a camisa e envie suas imagens.', fields: [
      descricao('Como você quer a camisa?', 'Ex.: logo pequeno no lado esquerdo do peito, nome da empresa nas costas, letras brancas…'),
      imagens(REF_SLOTS_CAMISA),
      ...PRAZO,
    ] },
    CONTATO,
  ],

  impresso: [
    { title: 'Formato e acabamento', sub: 'O que você precisa imprimir.', fields: [
      { key: 'formato', type: 'radios', label: 'Formato', req: true, choices: [
        { v: 'a5', l: 'A5', s: '15 × 21 cm' }, { v: 'a4', l: 'A4', s: '21 × 30 cm' }, { v: 'a3', l: 'A3', s: '30 × 42 cm' }, { v: 'outro', l: 'Outro tamanho' }] },
      { key: 'medida', type: 'text', label: 'Qual tamanho?', req: true, when: (d) => d.formato === 'outro', placeholder: 'Ex.: 10 × 20 cm' },
      { key: 'quantidade', type: 'number', label: 'Quantidade', req: true, min: 1, placeholder: 'Ex.: 500' },
      { key: 'papel', type: 'radios', label: 'Papel', req: true, choices: [
        { v: 'couche-brilho', l: 'Couché brilho' }, { v: 'couche-fosco', l: 'Couché fosco' }, { v: 'offset', l: 'Offset', s: 'Bom para escrever' }, { v: 'nao-sei', l: 'Não sei', s: 'A equipe recomenda' }] },
      { key: 'impressao', type: 'radios', label: 'Impressão', req: true, choices: [
        { v: 'cor-frente', l: 'Colorida, só frente' }, { v: 'cor-fv', l: 'Colorida, frente e verso' }, { v: 'pb', l: 'Preto e branco' }] },
      { key: 'acabamento', type: 'radios', label: 'Acabamento', req: true, choices: [
        { v: 'nenhum', l: 'Nenhum' }, { v: 'dobra', l: 'Dobra', s: 'Folder' }, { v: 'numeracao', l: 'Numeração' }, { v: 'bloco', l: 'Bloco colado' }, { v: 'nao-sei', l: 'Não sei' }] },
    ] },
    { title: 'Como você quer', sub: 'Descreva o pedido e envie suas imagens.', fields: [
      descricao('Como você quer o impresso?', 'Ex.: folder com 3 dobras, fotos dos produtos e mapa da loja no verso…'),
      imagens(),
      ...PRAZO,
    ] },
    CONTATO,
  ],

  medida: [
    { title: 'Medidas e material', sub: 'Se não souber as medidas, a equipe pode fazer uma visita técnica.', fields: [
      { key: 'semMedida', type: 'multi', label: 'Medidas', choices: [{ v: 'visita', l: 'Não sei as medidas, preciso de visita técnica' }] },
      { key: 'largura', type: 'number', label: 'Largura (cm)', req: true, min: 1, when: (d) => !d.semMedida?.length, half: true },
      { key: 'altura', type: 'number', label: 'Altura (cm)', req: true, min: 1, when: (d) => !d.semMedida?.length, half: true },
      { key: 'quantidade', type: 'number', label: 'Quantidade', req: true, min: 1 },
      { key: 'material', type: 'radios', label: 'Material', req: true, choices: [
        { v: 'lona', l: 'Lona' }, { v: 'vinil', l: 'Vinil adesivo' }, { v: 'acm', l: 'ACM' }, { v: 'acrilico', l: 'Acrílico' },
        { v: 'pvc', l: 'PVC' }, { v: 'mdf', l: 'MDF' }, { v: 'nao-sei', l: 'Não sei', s: 'A equipe recomenda' }] },
      { key: 'acabamento', type: 'radios', label: 'Acabamento', req: true, choices: [
        { v: 'ilhos', l: 'Ilhós' }, { v: 'bastao', l: 'Bastão e corda' }, { v: 'estrutura', l: 'Estrutura/moldura' }, { v: 'recorte', l: 'Recorte no formato' }, { v: 'nenhum', l: 'Nenhum' }, { v: 'nao-sei', l: 'Não sei' }] },
      { key: 'instalacao', type: 'radios', label: 'Precisa de instalação?', req: true, choices: [{ v: 'sim', l: 'Sim, preciso de instalação' }, { v: 'nao', l: 'Não, eu instalo' }] },
    ] },
    { title: 'Como você quer', sub: 'Descreva o pedido e envie suas imagens.', fields: [
      descricao('Como você quer?', 'Ex.: fachada com o logo da loja e telefone, fundo preto, letras em relevo…'),
      imagens(),
      ...PRAZO,
    ] },
    CONTATO,
  ],

  brinde: [
    { title: 'Quantidade e personalização', sub: 'Quantas unidades e como personalizar.', fields: [
      { key: 'quantidade', type: 'number', label: 'Quantidade', req: true, min: 1, placeholder: 'Ex.: 100' },
      { key: 'modelo', type: 'text', label: 'Modelo ou cor preferida (opcional)', placeholder: 'Ex.: cor natural, alça longa' },
      { key: 'tecnica', type: 'radios', label: 'Tipo de personalização', req: true, choices: [
        { v: 'impressao', l: 'Impressão colorida' }, { v: 'laser', l: 'Gravação a laser' }, { v: 'bordado', l: 'Bordado' }, { v: 'nao-sei', l: 'Não sei', s: 'A equipe recomenda' }] },
    ] },
    { title: 'Como você quer', sub: 'Descreva o pedido e envie suas imagens.', fields: [
      descricao('Como você quer o brinde?', 'Ex.: logo da empresa em uma cor, para brinde de fim de ano…'),
      imagens(),
      ...PRAZO,
    ] },
    CONTATO,
  ],

  design: [
    { title: 'Sobre o projeto', sub: 'Quanto mais você contar, mais certeira fica a criação.', fields: [
      { key: 'marca', type: 'text', label: 'Nome da marca ou empresa', req: true },
      { key: 'segmento', type: 'text', label: 'Ramo de atividade', placeholder: 'Ex.: açaiteria, oficina, igreja, time de futebol' },
      { key: 'uso', type: 'multi', label: 'Onde a arte vai ser usada?', choices: [
        { v: 'redes', l: 'Redes sociais' }, { v: 'impressos', l: 'Impressos' }, { v: 'camisas', l: 'Camisas' }, { v: 'fachada', l: 'Fachada' }, { v: 'outro', l: 'Outro' }] },
      { key: 'estilo', type: 'textarea', label: 'Cores e estilo', placeholder: 'Cores, o que você gosta e o que não gosta, marcas que admira…', rows: 3 },
    ] },
    { title: 'Como você quer', sub: 'A equipe cria do zero a partir do que você contar.', fields: [
      descricao('Descreva o que você precisa', 'Ex.: logo novo para minha loja de roupas, versão colorida e uma só em preto…'),
      imagens(),
      ...PRAZO,
    ] },
    CONTATO,
  ],
};

// valores iniciais de cada formulário
export function initialData(form, preset = {}) {
  const d = { prazo: 'normal', entrega: 'retirada' };
  if (form === 'camisa') Object.assign(d, { tipo: 'tradicional', tecido: 'nao-sei', cores: [], gola: 'redonda', tecnica: 'recomendar', tamanhos: {} });
  if (form === 'impresso') Object.assign(d, { papel: 'nao-sei', impressao: 'cor-frente', acabamento: 'nenhum' });
  if (form === 'medida') Object.assign(d, { quantidade: '1', instalacao: 'nao' });
  if (form === 'brinde') Object.assign(d, { tecnica: 'nao-sei' });
  return { ...d, ...preset };
}

export const sizeTotal = (t = {}) => Object.values(t).reduce((s, n) => s + (Number(n) || 0), 0);
export const faixa = (n) => (n < 10 ? '1 a 9 unidades' : n < 20 ? '10 a 19 unidades' : n < 50 ? '20 a 49 unidades' : '50 ou mais unidades');
