/**
 * CATÁLOGO DA GRÁFICA ESTAMP (para o painel)
 * ==========================================
 * Cada produto tem opções (no painel, "variações"): cada uma com preço no Pix e custo.
 * Os produtos sob encomenda não controlam estoque (o que a gráfica estoca são os insumos).
 *
 * TODOS OS PREÇOS SÃO DE DEMONSTRAÇÃO. Os do site saem de ../../data/products.js da raiz.
 */

/**
 * Pagamento (o painel do dono troca estes valores). O preço cadastrado é o do Pix; o do cartão é
 * Pix ÷ (1 − desconto). No cartão: sem juros até `semJurosAte` vezes; dali até `maxParcelas`,
 * com `jurosMes` ao mês (parcela pela tabela Price).
 */
export const PAGAMENTO = { descontoPix: 0, semJurosAte: 3, jurosMes: 0.0299, maxParcelas: 6 }
export const PRECOS_DEMO = true

/** Linhas de produto da gráfica (no painel, cada uma é uma aba da lista de produtos). */
export type Marca = 'impressos' | 'camisas' | 'brindes' | 'comunicacao' | 'design'
export type Condicao = 'novo' | 'seminovo'
export type Selo = 'chegou' | 'ultimas' | 'mais' | 'promo'
export type MelhorPara = 'camera' | 'bateria' | 'jogos' | 'primeiro'
export type Cor = { nome: string; hex: string; foto?: { card: string; grande: string } }
export type Opcao = { gb: number; pix: number }
export type AcessorioTipo = 'capa' | 'carregador' | 'cabo' | 'fone' | 'pelicula'
export type Notas = { camera: number; bateria: number; desempenho: number }

export const NOME_MARCA: Record<Marca, string> = {
  impressos: 'Impressos',
  camisas: 'Camisas e uniformes',
  brindes: 'Brindes',
  comunicacao: 'Comunicação visual',
  design: 'Design e criação',
}

/** Grupos dentro de cada linha, na ordem em que aparecem. */
export const LINHAS: Record<Marca, { id: string; nome: string }[]> = {
  impressos: [
    { id: 'balcao', nome: 'Serviços de balcão' },
    { id: 'cartoes', nome: 'Cartões e panfletos' },
    { id: 'papelaria', nome: 'Papelaria e adesivos' },
  ],
  camisas: [
    { id: 'camisas', nome: 'Camisas' },
    { id: 'uniformes', nome: 'Uniformes' },
  ],
  brindes: [
    { id: 'canecas', nome: 'Canecas' },
    { id: 'premiacao', nome: 'Troféus e medalhas' },
    { id: 'brindes', nome: 'Brindes' },
  ],
  comunicacao: [
    { id: 'banners', nome: 'Banners e adesivos' },
    { id: 'fachadas', nome: 'Fachadas e placas' },
  ],
  design: [{ id: 'criacao', nome: 'Criação' }],
}

/**
 * Produto da gráfica: opções com preço no Pix e custo em proporção do preço.
 * `estoque`: só os itens de pronta entrega contam unidades; o resto é feito por pedido.
 */
export type ProdutoGrafica = {
  id: string
  marca: Marca
  linha: string
  nome: string
  unidade: string
  descricao: string
  opcoes: [nome: string, pix: number][]
  /** Custo ≈ preço × esta proporção (papel, tinta, camisa lisa, mão de obra). */
  custo: number
  /** Dias para ficar pronto (prazo padrão do pedido). */
  prazoDias: number
  /** Setor da produção onde o pedido é feito. */
  setor: Setor
  /** Pronta entrega: tem estoque contado (os demais são sob encomenda). */
  estoque?: number
  selo?: Selo
}

/** Setores (máquinas) da produção. */
export type Setor = 'impressao' | 'sublimacao' | 'dtf' | 'silk' | 'bordado' | 'plotter' | 'acabamento' | 'arte' | 'instalacao'
export const NOME_SETOR: Record<Setor, string> = {
  impressao: 'Impressão digital',
  sublimacao: 'Sublimação',
  dtf: 'DTF',
  silk: 'Silk',
  bordado: 'Bordado',
  plotter: 'Plotter e recorte',
  acabamento: 'Acabamento',
  arte: 'Criação de arte',
  instalacao: 'Instalação',
}

export const PRODUTOS: ProdutoGrafica[] = [
  // ── Serviços de balcão (vendidos na hora) ──
  { id: 'xerox-pb', marca: 'impressos', linha: 'balcao', nome: 'Cópia preto e branco', unidade: 'folha', descricao: 'Cópia ou impressão A4 em preto e branco.', opcoes: [['A4 só frente', 0.5], ['A4 frente e verso', 0.8]], custo: 0.3, prazoDias: 0, setor: 'impressao', estoque: 9999 },
  { id: 'impressao-cor', marca: 'impressos', linha: 'balcao', nome: 'Impressão colorida', unidade: 'folha', descricao: 'Impressão colorida A4 em papel comum ou fotográfico.', opcoes: [['A4 papel comum', 2], ['A4 papel fotográfico', 5]], custo: 0.35, prazoDias: 0, setor: 'impressao', estoque: 9999, selo: 'mais' },
  { id: 'plastificacao', marca: 'impressos', linha: 'balcao', nome: 'Plastificação', unidade: 'un', descricao: 'Plastificação de documentos e crachás.', opcoes: [['Tamanho RG', 3], ['A4', 8]], custo: 0.3, prazoDias: 0, setor: 'acabamento', estoque: 9999 },
  { id: 'encadernacao', marca: 'impressos', linha: 'balcao', nome: 'Encadernação', unidade: 'un', descricao: 'Espiral com capa transparente e contracapa.', opcoes: [['Até 50 folhas', 8], ['Até 100 folhas', 12], ['Até 200 folhas', 18]], custo: 0.35, prazoDias: 0, setor: 'acabamento', estoque: 9999 },
  // ── Cartões e panfletos ──
  { id: 'cartao-visita', marca: 'impressos', linha: 'cartoes', nome: 'Cartões de visita', unidade: 'pacote', descricao: 'Couché 300g, cores vivas e corte reto.', opcoes: [['100 un · só frente', 35], ['100 un · frente e verso', 45], ['250 un · frente e verso', 98], ['500 un · frente e verso', 156], ['1.000 un · frente e verso', 247]], custo: 0.3, prazoDias: 3, setor: 'impressao', selo: 'mais' },
  { id: 'cartao-fotografico', marca: 'impressos', linha: 'cartoes', nome: 'Cartões fotográficos', unidade: 'pacote', descricao: 'Papel fotográfico com acabamento brilhante.', opcoes: [['100 un', 40], ['250 un', 90], ['500 un', 150]], custo: 0.32, prazoDias: 3, setor: 'impressao' },
  { id: 'panfletos', marca: 'impressos', linha: 'cartoes', nome: 'Panfletos e flyers', unidade: 'milheiro', descricao: 'Coloridos, prontos para distribuir.', opcoes: [['1.000 A6', 126], ['1.000 A5', 180], ['2.500 A5', 390], ['5.000 A5', 690]], custo: 0.34, prazoDias: 4, setor: 'impressao' },
  { id: 'cartazes-folders', marca: 'impressos', linha: 'cartoes', nome: 'Cartazes e folders', unidade: 'un', descricao: 'Cartazes para eventos e folders dobrados.', opcoes: [['Cartaz A3', 25], ['Folder A4 (100 un)', 160]], custo: 0.32, prazoDias: 4, setor: 'impressao' },
  // ── Papelaria e adesivos ──
  { id: 'adesivos-etiquetas', marca: 'impressos', linha: 'papelaria', nome: 'Adesivos e etiquetas', unidade: 'pacote', descricao: 'Vinil com recorte no formato da arte.', opcoes: [['50 un até 5 cm', 30], ['100 un até 5 cm', 55], ['100 un até 8 cm', 82], ['250 un até 5 cm', 120]], custo: 0.35, prazoDias: 3, setor: 'plotter' },
  { id: 'blocos-receituarios', marca: 'impressos', linha: 'papelaria', nome: 'Blocos e receituários', unidade: 'bloco', descricao: 'Blocos de pedido, receituários e comandas.', opcoes: [['Bloco 50 folhas', 45], ['Bloco 100 folhas numerado', 75]], custo: 0.32, prazoDias: 5, setor: 'impressao' },
  // ── Camisas e uniformes ──
  { id: 'camisas-personalizadas', marca: 'camisas', linha: 'camisas', nome: 'Camisas personalizadas', unidade: 'un', descricao: 'Para empresas, eventos, equipes e marcas.', opcoes: [['Algodão · DTF', 40], ['Poliéster · sublimação', 45], ['Dry fit · sublimação', 55]], custo: 0.4, prazoDias: 7, setor: 'sublimacao', selo: 'mais' },
  { id: 'camisas-polo', marca: 'camisas', linha: 'camisas', nome: 'Camisas polo', unidade: 'un', descricao: 'Polo com bordado ou estampa.', opcoes: [['Piquet · bordado', 75], ['Piquet · DTF', 60]], custo: 0.42, prazoDias: 10, setor: 'bordado' },
  { id: 'camisas-eventos', marca: 'camisas', linha: 'camisas', nome: 'Camisas para eventos', unidade: 'un', descricao: 'Aniversários, formaturas, igrejas e corridas.', opcoes: [['Algodão · silk 1 cor', 32], ['Poliéster · sublimação', 40]], custo: 0.38, prazoDias: 7, setor: 'silk' },
  { id: 'abadas', marca: 'camisas', linha: 'camisas', nome: 'Abadás', unidade: 'un', descricao: 'Leves e coloridos para blocos e festas.', opcoes: [['Poliéster · sublimação', 40]], custo: 0.37, prazoDias: 7, setor: 'sublimacao' },
  { id: 'uniformes-profissionais', marca: 'camisas', linha: 'uniformes', nome: 'Uniformes profissionais', unidade: 'un', descricao: 'Camisas e polos com a identidade da empresa.', opcoes: [['Camiseta · DTF', 40], ['Camisa social · bordado', 89]], custo: 0.42, prazoDias: 10, setor: 'dtf' },
  { id: 'uniformes-esportivos', marca: 'camisas', linha: 'uniformes', nome: 'Uniformes esportivos', unidade: 'conjunto', descricao: 'Camisa e short sublimados com nome e número.', opcoes: [['Camisa + short', 80], ['Só camisa', 55], ['Colete', 30]], custo: 0.39, prazoDias: 10, setor: 'sublimacao' },
  // ── Brindes ──
  { id: 'canecas', marca: 'brindes', linha: 'canecas', nome: 'Canecas personalizadas', unidade: 'un', descricao: 'Cerâmica 325 ml com foto, logo ou frase.', opcoes: [['Cerâmica branca', 35], ['Mágica', 55]], custo: 0.32, prazoDias: 2, setor: 'sublimacao', selo: 'mais' },
  { id: 'trofeus-medalhas', marca: 'brindes', linha: 'premiacao', nome: 'Troféus e medalhas', unidade: 'un', descricao: 'Para campeonatos e premiações.', opcoes: [['Medalha com fita', 12], ['Troféu 35 cm', 50], ['Troféu 55 cm', 80]], custo: 0.47, prazoDias: 5, setor: 'acabamento' },
  { id: 'chaveiros', marca: 'brindes', linha: 'brindes', nome: 'Chaveiros', unidade: 'un', descricao: 'Acrílico ou MDF com a arte do cliente.', opcoes: [['Acrílico', 6], ['MDF', 8]], custo: 0.32, prazoDias: 5, setor: 'plotter' },
  { id: 'canetas', marca: 'brindes', linha: 'brindes', nome: 'Canetas personalizadas', unidade: 'un', descricao: 'Canetas com o nome e o contato da empresa.', opcoes: [['Plástica', 3], ['Metal gravada', 15]], custo: 0.42, prazoDias: 7, setor: 'impressao' },
  { id: 'ecobags', marca: 'brindes', linha: 'brindes', nome: 'Ecobags', unidade: 'un', descricao: 'Sacolas de tecido personalizadas.', opcoes: [['Algodão cru · DTF', 18], ['Algodão cru · silk', 15]], custo: 0.37, prazoDias: 7, setor: 'dtf' },
  { id: 'kits-empresas', marca: 'brindes', linha: 'brindes', nome: 'Kits para empresas', unidade: 'kit', descricao: 'Caderno, caneta e caneca com a marca.', opcoes: [['Kit boas-vindas', 60]], custo: 0.42, prazoDias: 10, setor: 'acabamento' },
  // ── Comunicação visual ──
  { id: 'banners-lonas', marca: 'comunicacao', linha: 'banners', nome: 'Banners e lonas', unidade: 'm²', descricao: 'Banner com bastão, lona com ilhós e faixas.', opcoes: [['Lona com ilhós (m²)', 60], ['Banner 60×90 com bastão', 65], ['Wind banner', 280]], custo: 0.32, prazoDias: 3, setor: 'impressao' },
  { id: 'adesivos-vitrine', marca: 'comunicacao', linha: 'banners', nome: 'Adesivos para vitrine', unidade: 'm²', descricao: 'Vidros, paredes e veículos.', opcoes: [['Vinil impresso (m²)', 50], ['Vinil recortado (m²)', 70]], custo: 0.32, prazoDias: 3, setor: 'plotter' },
  { id: 'placas-personalizadas', marca: 'comunicacao', linha: 'fachadas', nome: 'Placas personalizadas', unidade: 'un', descricao: 'Acrílico, PVC ou ACM para sinalização.', opcoes: [['PVC 30×20', 35], ['Acrílico 40×30', 120], ['ACM 60×40', 160]], custo: 0.37, prazoDias: 5, setor: 'plotter' },
  { id: 'fachadas-letreiros', marca: 'comunicacao', linha: 'fachadas', nome: 'Fachadas e letreiros', unidade: 'projeto', descricao: 'ACM, letra caixa e luminosos, com instalação.', opcoes: [['Fachada em ACM (a partir de)', 1800], ['Letreiro em letra caixa', 2400], ['Luminoso redondo', 650]], custo: 0.47, prazoDias: 15, setor: 'instalacao' },
  // ── Design ──
  { id: 'criacao-logotipo', marca: 'design', linha: 'criacao', nome: 'Criação de logotipo', unidade: 'logo', descricao: 'Logo com arquivos para impressão.', opcoes: [['Logo simples', 150], ['Logo + manual básico', 350]], custo: 0.15, prazoDias: 5, setor: 'arte' },
  { id: 'arte-divulgacao', marca: 'design', linha: 'criacao', nome: 'Arte para divulgação', unidade: 'arte', descricao: 'Posts, panfletos e banners.', opcoes: [['Post para redes', 30], ['Arte de panfleto', 50]], custo: 0.15, prazoDias: 2, setor: 'arte' },
  { id: 'arte-camisas', marca: 'design', linha: 'criacao', nome: 'Arte para camisas', unidade: 'arte', descricao: 'Estampa ou uniforme completo.', opcoes: [['Estampa', 50], ['Uniforme completo', 90]], custo: 0.15, prazoDias: 3, setor: 'arte' },
  { id: 'ajustes-arquivos', marca: 'design', linha: 'criacao', nome: 'Ajustes em arquivos para impressão', unidade: 'arquivo', descricao: 'Tamanho, sangria e cores ajustados para imprimir sem erro.', opcoes: [['Ajuste simples', 20], ['Vetorização', 45]], custo: 0.15, prazoDias: 1, setor: 'arte' },
  { id: 'identidade-visual', marca: 'design', linha: 'criacao', nome: 'Identidade visual', unidade: 'projeto', descricao: 'Logo, cores, fontes e aplicações.', opcoes: [['Projeto completo', 400]], custo: 0.15, prazoDias: 10, setor: 'arte' },
]

export const DESTAQUES: { id: string; rotulo: string }[] = []

export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Preço no cartão (com o desconto do Pix, se houver). */
export const precoCartao = (pix: number) => {
  const d = PAGAMENTO.descontoPix
  return d > 0 ? Math.round((pix / (1 - d)) * 100) / 100 : pix
}
export function valorParcela(pix: number, n: number) {
  const total = precoCartao(pix)
  const i = PAGAMENTO.jurosMes
  if (n <= PAGAMENTO.semJurosAte || i <= 0) return Math.round((total / n) * 100) / 100
  return Math.ceil((total * i) / (1 - Math.pow(1 + i, -n)))
}
/** Produtos de gráfica não têm armazenamento: o rótulo fica vazio. */
export const gbLabel = (gb: number) => (gb ? `${gb}` : '')

export const SELO_LABEL: Record<Selo, string> = { chegou: 'Novidade', ultimas: 'Últimas unidades', mais: 'Mais vendido', promo: 'Promoção' }
export const produtoPorId = (id: string) => PRODUTOS.find((p) => p.id === id)
