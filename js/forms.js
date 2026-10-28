// Formulários de orçamento (produtos do Tipo B). Cada formulário é uma lista de etapas com campos.
// Tipos de campo: cards, radios, swatches, multi, sizes, text, number, tel, email, date, textarea, files.
import { SITE } from './config.js';

const ARTE = [
  { key: 'arte', type: 'cards', label: 'Você já possui a arte?', req: true, choices: [
    { v: 'enviar', l: 'Sim, vou enviar o arquivo', i: 'upload' },
    { v: 'referencia', l: 'Tenho uma imagem de referência', i: 'image' },
    { v: 'criar', l: 'Não, preciso que criem a arte', s: 'Criação pela equipe, preço informado no orçamento', i: 'pen' }] },
  { key: 'arquivos', type: 'files', label: 'Arquivos', hint: 'PNG, JPG ou PDF. Arquivos vetoriais (AI, CDR, EPS) também servem.', when: (d) => d.arte && d.arte !== 'criar' },
];
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
        { v: 'tradicional', l: 'Tradicional', s: 'Modelo básico', i: 'tee' }, { v: 'polo', l: 'Polo', s: 'Gola com botões', i: 'polo' },
        { v: 'dryfit', l: 'Dry fit', s: 'Esportiva', i: 'dryfit' }, { v: 'oversized', l: 'Oversized', s: 'Modelagem ampla', i: 'oversized' }] },
      { key: 'tecido', type: 'radios', label: 'Tecido', req: true, choices: [
        { v: 'algodao', l: 'Algodão' }, { v: 'poliester', l: 'Poliéster' }, { v: 'misto', l: 'Misto' }, { v: 'nao-sei', l: 'Não sei', s: 'Quero orientação' }] },
      { key: 'cor', type: 'swatches', label: 'Cor predominante', hint: 'Escolha a cor principal da camisa.', req: true, choices: [
        { v: 'preta', l: 'Preta', c: '#141414' }, { v: 'branca', l: 'Branca', c: '#ffffff' }, { v: 'cinza', l: 'Cinza', c: '#8a8a8a' },
        { v: 'azul-marinho', l: 'Azul-marinho', c: '#1b2a4a' }, { v: 'azul', l: 'Azul', c: '#1f6fd1' }, { v: 'vermelha', l: 'Vermelha', c: '#d22f2f' },
        { v: 'verde', l: 'Verde', c: '#178a4c' }, { v: 'amarela', l: 'Amarela', c: '#f5c518' }, { v: 'laranja', l: 'Laranja', c: '#ff6a00' },
        { v: 'roxa', l: 'Roxa', c: '#6b3fa0' }, { v: 'rosa', l: 'Rosa', c: '#ef7fb0' }],
        extra: [{ v: 'outra', l: 'Outra cor' }, { v: 'varias', l: 'Mais de uma cor / modelo especial' }] },
      { key: 'corOutra', type: 'text', label: 'Qual cor?', req: true, when: (d) => d.cor === 'outra' },
      { key: 'gola', type: 'radios', label: 'Tipo de gola', req: true, choices: [
        { v: 'redonda', l: 'Redonda' }, { v: 'v', l: 'Gola V' }, { v: 'polo', l: 'Gola polo' }, { v: 'definir', l: 'A definir com a equipe' }] },
    ] },
    { title: 'Personalização da camisa', sub: 'Onde e como a estampa vai ser aplicada.', fields: [
      { key: 'local', type: 'cards', label: 'Onde será aplicada a estampa?', req: true, choices: [
        { v: 'frente', l: 'Somente frente', i: 'front' }, { v: 'costas', l: 'Somente costas', i: 'back' }, { v: 'frente-costas', l: 'Frente e costas', i: 'both' },
        { v: 'completa', l: 'Frente, costas e mangas', i: 'sleeves' }, { v: 'indefinido', l: 'Ainda não decidi', i: 'question' }] },
      { key: 'tecnica', type: 'radios', label: 'Tipo de personalização', hint: 'Se não souber, a equipe indica a melhor técnica para o tecido e a arte.', req: true, choices: [
        { v: 'recomendar', l: 'Não sei', s: 'A equipe recomenda a melhor opção' }, { v: 'serigrafia', l: 'Serigrafia', s: 'Silk-screen' },
        { v: 'sublimacao', l: 'Sublimação' }, { v: 'dtf', l: 'DTF', s: 'Estampa transferida' }, { v: 'bordado', l: 'Bordado', s: 'Se disponível' }] },
      ...ARTE,
    ] },
    { title: 'Quantidade por tamanho', sub: 'Distribua as unidades entre os tamanhos. Os valores abaixo são só uma sugestão.', fields: [
      { key: 'tamanhos', type: 'sizes', label: 'Tamanhos', req: true },
    ] },
    { title: 'Detalhes do projeto', sub: 'Conte como você imagina as camisas.', fields: [
      { key: 'descricao', type: 'textarea', label: 'Como você quer a camisa?', req: true, placeholder: 'Ex.: logotipo pequeno no lado esquerdo do peito, nome da empresa nas costas, letras brancas…' },
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
    { title: 'Arte e detalhes', sub: 'Envie o arquivo ou conte a sua ideia.', fields: [
      ...ARTE,
      { key: 'descricao', type: 'textarea', label: 'Detalhes do projeto', req: true, placeholder: 'Ex.: folder com 3 dobras, fotos dos produtos e mapa da loja no verso…' },
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
    { title: 'Arte e detalhes', sub: 'Envie o arquivo ou conte a sua ideia.', fields: [
      ...ARTE,
      { key: 'descricao', type: 'textarea', label: 'Detalhes do projeto', req: true, placeholder: 'Ex.: fachada com o logo da loja e telefone, fundo preto, letras em relevo…' },
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
    { title: 'Arte e detalhes', sub: 'Envie o arquivo ou conte a sua ideia.', fields: [
      ...ARTE,
      { key: 'descricao', type: 'textarea', label: 'Detalhes do pedido', req: true, placeholder: 'Ex.: logo da empresa em uma cor, para brinde de fim de ano…' },
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
      { key: 'arquivos', type: 'files', label: 'Referências (opcional)', hint: 'Imagens de inspiração, logo atual ou fotos.' },
    ] },
    { title: 'Detalhes e prazo', sub: 'O que exatamente você precisa.', fields: [
      { key: 'descricao', type: 'textarea', label: 'Descreva o que você precisa', req: true, placeholder: 'Ex.: logo novo para minha loja de roupas, versão colorida e uma só em preto…' },
      ...PRAZO,
    ] },
    CONTATO,
  ],
};

// valores iniciais de cada formulário
export function initialData(form, preset = {}) {
  const d = { prazo: 'normal', entrega: 'retirada' };
  if (form === 'camisa') Object.assign(d, { tipo: 'tradicional', tecido: 'nao-sei', gola: 'redonda', tecnica: 'recomendar', tamanhos: { PP: 0, P: 2, M: 6, G: 6, GG: 4, EXG: 2 } });
  if (form === 'impresso') Object.assign(d, { papel: 'nao-sei', impressao: 'cor-frente', acabamento: 'nenhum' });
  if (form === 'medida') Object.assign(d, { quantidade: '1', instalacao: 'nao' });
  if (form === 'brinde') Object.assign(d, { tecnica: 'nao-sei' });
  return { ...d, ...preset };
}

export const sizeTotal = (t = {}) => Object.values(t).reduce((s, n) => s + (Number(n) || 0), 0);
export const faixa = (n) => (n < 10 ? '1 a 9 unidades' : n < 20 ? '10 a 19 unidades' : n < 50 ? '20 a 49 unidades' : '50 ou mais unidades');
