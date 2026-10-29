/**
 * O NEGÓCIO DA GRÁFICA: pedidos de produção, orçamentos, vendas de balcão, clientes, equipe,
 * insumos, caixa, compras e metas. Formatos dos dados + o gerador dos 6 meses de exemplo.
 *
 * O gerador usa sorteio com semente fixa: a mesma data de hoje dá sempre os mesmos números.
 * Ele é chamado uma vez (no primeiro acesso) e o resultado fica salvo neste aparelho.
 * Tudo o que ele cria leva `exemplo: true`, para o "Começar do zero" apagar só isso.
 */
import type { PProduto } from './modelo'
import type { Marca, Setor } from './produtos'
import { sorteio } from './semente'

// ───────────── Formatos ─────────────

export type Origem = 'instagram' | 'indicacao' | 'site' | 'loja' | 'whatsapp' | 'outro'
export type Cliente = {
  id: string
  nome: string
  telefone: string
  /** Empresa, time, escola, igreja… (pessoa jurídica ou grupo). */
  empresa?: boolean
  cpf?: string
  /** 'MM-DD' (o ano não importa para o parabéns). */
  aniversario?: string
  cidade: string
  origem: Origem
  obs: string
  criadoEm: string
  exemplo?: boolean
}

export type PapelEquipe = 'dono' | 'atendimento' | 'designer' | 'producao'
/** Categorias da comissão e dos relatórios: as linhas de produto da gráfica. */
export type Categoria = Marca
export const NOME_CATEGORIA: Record<Categoria, string> = { impressos: 'Impressos', camisas: 'Camisas', brindes: 'Brindes', comunicacao: 'Comunicação visual', design: 'Design' }
export const CATEGORIAS = Object.keys(NOME_CATEGORIA) as Categoria[]
export type Membro = {
  id: string
  nome: string
  papel: PapelEquipe
  /** Meta de faturamento do mês, em reais. */
  metaMes: number
  /** Comissão em % do valor vendido, por categoria. */
  comissao: Record<Categoria, number>
  ativo: boolean
  exemplo?: boolean
}

export type Fornecedor = { id: string; nome: string; cnpj?: string; telefone: string; cidade: string; prazoDias: number; obs: string; exemplo?: boolean }

// ───────────── Insumos (o estoque da gráfica) ─────────────

export type GrupoInsumo = 'camisas' | 'papel' | 'tinta' | 'midia' | 'brindes' | 'outros'
export const NOME_GRUPO_INSUMO: Record<GrupoInsumo, string> = {
  camisas: 'Camisas lisas',
  papel: 'Papéis',
  tinta: 'Tintas e toner',
  midia: 'Lona, vinil e filme',
  brindes: 'Brindes para personalizar',
  outros: 'Outros',
}
export type Insumo = {
  id: string
  nome: string
  grupo: GrupoInsumo
  /** Como se conta: un, folha, resma, litro, metro, m²… */
  unidade: string
  estoque: number
  /** Abaixo disto, o painel avisa para comprar. */
  minimo: number
  custo: number
  fornecedorId?: string
  exemplo?: boolean
}

export type Compra = {
  id: string
  fornecedorId: string
  data: string
  itens: { insumoId: string; qtd: number; custo: number }[]
  total: number
  contaId?: string
  exemplo?: boolean
}

// ───────────── Vendas (balcão e pedidos entregues) ─────────────

export type FormaPag = 'pix' | 'debito' | 'credito' | 'dinheiro'
/** `cor` é a opção escolhida do produto (ex.: "100 un · frente e verso"); `gb` fica 0. */
export type ItemVenda = { produtoId: string; nome: string; cor: string; gb: number; qtd: number; preco: number; custo: number; desconto: number; categoria: Categoria }
export type Venda = {
  id: string
  numero: number
  /** ISO com hora. */
  data: string
  clienteId?: string
  vendedorId: string
  itens: ItemVenda[]
  desconto: number
  /** Pedido de produção que gerou a venda (na entrega). */
  pedidoId?: string
  /** Entrada paga antes no pedido (já entrou no caixa no dia em que foi pago). */
  troca: number
  pagamentos: { forma: FormaPag; valor: number; parcelas?: number }[]
  garantiaAte: string
  status: 'concluida' | 'cancelada' | 'devolvida'
  exemplo?: boolean
}

// ───────────── Pedidos de produção ─────────────

export type StatusPedido = 'novo' | 'arte' | 'aprovacao' | 'producao' | 'pronto' | 'entregue'
export const ETAPAS_PEDIDO: StatusPedido[] = ['novo', 'arte', 'aprovacao', 'producao', 'pronto', 'entregue']
export const NOMES_STATUS_PEDIDO: Record<StatusPedido, string> = {
  novo: 'Novo pedido',
  arte: 'Fazendo a arte',
  aprovacao: 'Cliente aprovando',
  producao: 'Produzindo',
  pronto: 'Pronto',
  entregue: 'Entregue',
}
export type OrigemPedido = 'site' | 'balcao' | 'whatsapp' | 'instagram'
export const NOME_ORIGEM_PEDIDO: Record<OrigemPedido, string> = { site: 'Site', balcao: 'Balcão', whatsapp: 'WhatsApp', instagram: 'Instagram' }
export type ItemPedido = { produtoId: string; nome: string; opcao: string; qtd: number; preco: number; custo: number }
export type Pedido = {
  id: string
  numero: number
  clienteId: string
  origem: OrigemPedido
  itens: ItemPedido[]
  /** Como o cliente quer (texto do pedido). */
  descricao: string
  /** Cores escolhidas. */
  cores: string[]
  /** Quantidade por tamanho (camisas): 'M' → 8, 'GBL' → 3. */
  grade?: Record<string, number>
  /** Nomes das imagens que o cliente mandou (frente, costas…). */
  arquivos: string[]
  setor: Setor
  responsavelId: string
  prazo: string
  status: StatusPedido
  /** Valor pago adiantado (sinal). O resto é cobrado na entrega. */
  sinal: number
  /** Cada pagamento do sinal, com o dia (entra no caixa daquele dia). */
  sinais?: { data: string; valor: number; forma: FormaPag }[]
  formaSinal?: FormaPag
  criadoEm: string
  aprovadoEm?: string
  entregueEm?: string
  vendaId?: string
  /** Orçamento que virou este pedido. */
  orcamentoId?: string
  historico: { quando: string; status: StatusPedido; quem: string }[]
  /** Etapas em que o cliente já foi avisado pelo WhatsApp. */
  avisados?: StatusPedido[]
  exemplo?: boolean
}
/** O que foi pedido, para títulos: "37 × Camisas personalizadas" (com 1, só o nome). */
export const tituloPedido = (o: { itens: { qtd: number; nome: string }[] }) => o.itens.map((i) => (i.qtd > 1 ? `${i.qtd} × ${i.nome}` : i.nome)).join(' + ')
/** O mesmo, para frases: "37 camisas personalizadas" (com 1, "placas personalizadas"). */
export const itensFrase = (o: { itens: { qtd: number; nome: string }[] }) => o.itens.map((i) => (i.qtd > 1 ? `${i.qtd} ${i.nome.toLowerCase()}` : i.nome.toLowerCase())).join(' + ')
export const totalPedido = (p: Pedido) => p.itens.reduce((t, i) => t + i.preco * i.qtd, 0)
export const custoPedido = (p: Pedido) => p.itens.reduce((t, i) => t + i.custo * i.qtd, 0)
export const pecasPedido = (p: Pedido) => p.itens.reduce((t, i) => t + i.qtd, 0)

// ───────────── Orçamentos ─────────────

export type StatusOrcamento = 'novo' | 'respondido' | 'aprovado' | 'recusado'
export const NOMES_STATUS_ORC: Record<StatusOrcamento, string> = { novo: 'Para responder', respondido: 'Esperando o cliente', aprovado: 'Virou pedido', recusado: 'Não fechou' }
export type Orcamento = {
  id: string
  numero: string
  data: string
  origem: OrigemPedido
  nome: string
  telefone: string
  clienteId?: string
  produtoId: string
  /** O que o cliente preencheu (campo → resposta), na ordem do formulário. */
  respostas: [string, string][]
  qtd: number
  /** Valor que a gráfica respondeu. */
  valor?: number
  prazoDias?: number
  status: StatusOrcamento
  pedidoId?: string
  exemplo?: boolean
}

// ───────────── Caixa, metas e contas ─────────────

export type Caixa = {
  id: string
  data: string
  abertura: { valor: number; quem: string; hora: string }
  movimentos: { tipo: 'sangria' | 'suprimento'; valor: number; motivo: string; hora: string; quem: string }[]
  fechamento?: { contado: Record<FormaPag, number>; quem: string; hora: string }
  exemplo?: boolean
}

export type Meta = { mes: string; faturamento: number; lucro: number; vendas: number }

export type CategoriaDespesa = 'estoque' | 'aluguel' | 'anuncios' | 'salarios' | 'contas' | 'outros'
export type Despesa = { id: string; data: string; valor: number; categoria: CategoriaDespesa; descricao: string; contaId?: string; exemplo?: boolean }
export type Conta = {
  id: string
  tipo: 'pagar' | 'receber'
  descricao: string
  valor: number
  vencimento: string
  categoria: CategoriaDespesa
  recorrencia: 'nenhuma' | 'mensal'
  pagaEm?: string
  exemplo?: boolean
}

export const NOMES_FORMA: Record<FormaPag, string> = { pix: 'Pix', debito: 'Débito', credito: 'Crédito', dinheiro: 'Dinheiro' }

// ───────────── Contas de cada venda ─────────────

/** O que o cliente pagou nesta venda (o sinal do pedido já entrou antes). */
export const totalVenda = (v: Venda) => v.pagamentos.reduce((t, p) => t + p.valor, 0)
/** Faturamento da venda: o valor dos produtos (o sinal do pedido também é faturamento). */
export const faturamentoVenda = (v: Venda) => v.itens.reduce((t, i) => t + (i.preco - i.desconto) * i.qtd, 0) - v.desconto
export const custoVenda = (v: Venda) => v.itens.reduce((t, i) => t + i.custo * i.qtd, 0)

/** Sinais de pedido recebidos num dia, por forma (entram na conferência do caixa daquele dia). */
export function sinaisDoDia(pedidos: Pedido[], dia: string): Record<FormaPag, number> {
  const t: Record<FormaPag, number> = { dinheiro: 0, pix: 0, debito: 0, credito: 0 }
  for (const o of pedidos) for (const x of o.sinais ?? []) if (x.data === dia) t[x.forma] += x.valor
  return t
}

// ───────────── Gerador dos 6 meses de exemplo ─────────────

export type Exemplo = {
  clientes: Cliente[]
  equipe: Membro[]
  fornecedores: Fornecedor[]
  insumos: Insumo[]
  compras: Compra[]
  vendas: Venda[]
  pedidos: Pedido[]
  orcamentos: Orcamento[]
  caixas: Caixa[]
  metas: Meta[]
  despesas: Despesa[]
  contas: Conta[]
}

const NOMES = ['Ana', 'João', 'Maria', 'Pedro', 'Juliana', 'Carlos', 'Fernanda', 'Lucas', 'Camila', 'Rafael', 'Larissa', 'Mateus', 'Beatriz', 'Gabriel', 'Letícia', 'Thiago', 'Amanda', 'Felipe', 'Bruna', 'Gustavo', 'Paula', 'Diego', 'Natália', 'Rodrigo', 'Joana', 'Vinícius', 'Aline', 'Marcelo', 'Priscila', 'André', 'Débora', 'Wesley', 'Raimunda', 'Francisco', 'Kelly', 'Antônio', 'Cláudia', 'Eduardo', 'Sabrina', 'Leandro']
const SOBRENOMES = ['Silva', 'Souza', 'Lima', 'Oliveira', 'Costa', 'Pereira', 'Rodrigues', 'Almeida', 'Nascimento', 'Ferreira', 'Araújo', 'Mendes', 'Barbosa', 'Cavalcante', 'Rocha', 'Moura', 'Farias', 'Brito', 'Melo', 'Castro', 'Pinheiro', 'Freitas', 'Monteiro', 'Teixeira']
/** Clientes que são grupos (os nomes são inventados para a demonstração). */
const GRUPOS = [
  'Esporte Clube Vale Verde', 'Escola Pequeno Saber', 'Igreja Nova Aliança', 'Açaí da Praça', 'Oficina Dois Irmãos', 'Clínica Sorriso Feliz',
  'Academia Força Total', 'Mercadinho Bom Preço', 'Associação dos Mototaxistas', 'Time Unidos da Várzea', 'Ótica Visão Clara', 'Construtora Juruá Obras',
  'Pizzaria Forno a Lenha', 'Corrida Solidária CZS', 'Formatura 3º Ano B', 'Barbearia Navalha', 'Pet Shop Amigo Fiel', 'Farmácia Vida Boa',
]
const CIDADES = [
  ['Cruzeiro do Sul', 78],
  ['Mâncio Lima', 9],
  ['Rodrigues Alves', 7],
  ['Guajará', 4],
  ['Tarauacá', 2],
] as const
const ORIGENS: [Origem, number][] = [
  ['whatsapp', 34],
  ['instagram', 24],
  ['indicacao', 18],
  ['loja', 14],
  ['site', 10],
]

/** Pedidos de produção: produto, opção, faixa de quantidade e o que o cliente escreveu. */
const PEDIDOS_TIPO: [produtoId: string, qtd: [number, number], peso: number, descricoes: string[]][] = [
  ['uniformes-esportivos', [10, 22], 5, ['Uniforme do time com nome e número nas costas, escudo no peito', 'Camisa listrada com patrocinador na frente e número no short']],
  ['camisas-personalizadas', [10, 40], 6, ['Logo da empresa no peito esquerdo e site nas costas', 'Camisa do evento com a arte na frente toda']],
  ['camisas-eventos', [20, 80], 4, ['Camisa do aniversário de 15 anos com foto e nome', 'Camisa da corrida com patrocinadores nas costas', 'Camisa do encontro de jovens da igreja']],
  ['uniformes-profissionais', [6, 20], 3, ['Uniforme da equipe com logo bordado', 'Camiseta da loja com o logo e o Instagram']],
  ['camisas-polo', [5, 15], 2, ['Polo com logo bordado no peito']],
  ['canecas', [6, 40], 4, ['Canecas de lembrança do aniversário com foto', 'Caneca com o logo da empresa para os clientes']],
  ['cartao-visita', [1, 2], 5, ['Cartão com logo na frente e contato no verso', 'Cartão preto com letras douradas']],
  ['panfletos', [1, 2], 3, ['Panfleto da promoção do mês', 'Panfleto de inauguração com mapa']],
  ['banners-lonas', [1, 4], 3, ['Banner da loja para a fachada', 'Faixa de parabéns para a formatura']],
  ['adesivos-etiquetas', [1, 3], 3, ['Adesivo redondo com logo para embalagem', 'Etiquetas para os potes de açaí']],
  ['trofeus-medalhas', [10, 40], 2, ['Medalhas do campeonato com fita azul', 'Troféus de 1º, 2º e 3º lugar']],
  ['placas-personalizadas', [1, 4], 2, ['Placa de identificação das salas', 'Placa de PVC com horário de funcionamento']],
  ['fachadas-letreiros', [1, 1], 1, ['Fachada em ACM com letras em relevo e iluminação']],
  ['chaveiros', [30, 100], 1, ['Chaveiros de lembrança da formatura']],
  ['criacao-logotipo', [1, 1], 1, ['Logo para a hamburgueria nova, estilo moderno']],
]
const CORES_PEDIDO = ['Preta', 'Branca', 'Azul-marinho', 'Vermelha', 'Verde', 'Amarela', 'Laranja', 'Azul', 'Cinza', 'Roxa']
const GRADE_MASC = ['P', 'M', 'G', 'GG', 'EXG']
const GRADE_FEM = ['PBL', 'MBL', 'GBL']

/** Vendas de balcão: o que sai todo dia (cópia, impressão, plastificação, caneca pronta…). */
const BALCAO: [produtoId: string, qtd: [number, number], peso: number][] = [
  ['xerox-pb', [2, 40], 10],
  ['impressao-cor', [1, 15], 8],
  ['plastificacao', [1, 4], 4],
  ['encadernacao', [1, 2], 3],
  ['canecas', [1, 2], 2],
  ['cartao-visita', [1, 1], 1],
  ['arte-divulgacao', [1, 2], 1],
]

const isoDia = (d: Date) => d.toISOString().slice(0, 10)
const somaDias = (dia: string, n: number) => {
  const d = new Date(dia + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return isoDia(d)
}
const doisDig = (n: number) => String(n).padStart(2, '0')

export function gerarExemplo(produtos: PProduto[], hojeIso: string): Exemplo {
  const r = sorteio(20261028)
  const ent = (a: number, b: number) => a + Math.floor(r() * (b - a + 1))
  const um = <T,>(l: readonly T[]) => l[Math.floor(r() * l.length)]
  const pesado = <T,>(l: readonly (readonly [T, number])[]) => {
    const t = l.reduce((s, [, p]) => s + p, 0)
    let x = r() * t
    for (const [v, p] of l) if ((x -= p) < 0) return v
    return l[0][0]
  }
  const id = (p: string, n: number) => `${p}-ex${n}`
  const prod = (pid: string) => produtos.find((p) => p.id === pid)!

  const inicio = somaDias(hojeIso, -182)
  const dias: string[] = []
  for (let d = inicio; d <= hojeIso; d = somaDias(d, 1)) dias.push(d)
  /** A gráfica não abre no domingo; sábado é meio período. */
  const abre = (dia: string) => new Date(dia + 'T12:00:00Z').getUTCDay() !== 0

  const zero = { impressos: 0, camisas: 0, brindes: 0, comunicacao: 0, design: 0 }
  const equipe: Membro[] = [
    { id: 'eq-dono', nome: 'Márcio Lima', papel: 'dono', metaMes: 0, comissao: { ...zero }, ativo: true, exemplo: true },
    { id: 'eq-kesia', nome: 'Késia Rocha', papel: 'atendimento', metaMes: 22000, comissao: { impressos: 2, camisas: 2, brindes: 3, comunicacao: 2, design: 5 }, ativo: true, exemplo: true },
    { id: 'eq-jonas', nome: 'Jonas Freitas', papel: 'designer', metaMes: 0, comissao: { impressos: 0, camisas: 0, brindes: 0, comunicacao: 0, design: 15 }, ativo: true, exemplo: true },
    { id: 'eq-paulo', nome: 'Paulo Sena', papel: 'producao', metaMes: 0, comissao: { ...zero }, ativo: true, exemplo: true },
    { id: 'eq-talita', nome: 'Talita Moura', papel: 'producao', metaMes: 0, comissao: { ...zero }, ativo: true, exemplo: true },
  ]
  const atendentes: [string, number][] = [
    ['eq-kesia', 70],
    ['eq-dono', 30],
  ]

  // Clientes: pessoas e grupos (empresas, times, escolas, igrejas).
  const clientes: Cliente[] = []
  const usados = new Set<string>()
  const telefone = () => `(68) 9${ent(8100, 9999)}-${doisDig(ent(0, 99))}${doisDig(ent(0, 99))}`
  for (const nome of GRUPOS)
    clientes.push({ id: id('cli', clientes.length), nome, telefone: telefone(), empresa: true, cidade: 'Cruzeiro do Sul', origem: pesado(ORIGENS), obs: '', criadoEm: somaDias(inicio, -ent(0, 600)), exemplo: true })
  while (clientes.length < 110) {
    const nome = `${um(NOMES)} ${um(SOBRENOMES)}`
    if (usados.has(nome)) continue
    usados.add(nome)
    clientes.push({
      id: id('cli', clientes.length),
      nome,
      telefone: telefone(),
      aniversario: `${doisDig(ent(1, 12))}-${doisDig(ent(1, 28))}`,
      cidade: pesado(CIDADES),
      origem: pesado(ORIGENS),
      obs: '',
      criadoEm: somaDias(inicio, -ent(0, 500)),
      exemplo: true,
    })
  }
  clientes[GRUPOS.length + 3].aniversario = somaDias(hojeIso, 2).slice(5)
  const grupos = clientes.filter((c) => c.empresa)
  const pessoas = clientes.filter((c) => !c.empresa)

  const fornecedores: Fornecedor[] = [
    { id: 'for-camisas', nome: 'Malhas Norte Atacado', telefone: '(68) 3224-5100', cidade: 'Rio Branco', prazoDias: 21, obs: 'Camisas lisas de algodão, poliéster e dry fit. Entrega em 6 dias.', exemplo: true },
    { id: 'for-papel', nome: 'Papelaria Central Distribuidora', telefone: '(92) 3631-4400', cidade: 'Manaus', prazoDias: 28, obs: 'Papéis, couché, adesivo e fotográfico.', exemplo: true },
    { id: 'for-tinta', nome: 'Sublima Brasil Suprimentos', telefone: '(11) 3229-7700', cidade: 'São Paulo', prazoDias: 30, obs: 'Tinta de sublimação, papel transfer e filme DTF.', exemplo: true },
    { id: 'for-midia', nome: 'Comvisual Lonas e Vinis', telefone: '(69) 3224-6060', cidade: 'Porto Velho', prazoDias: 28, obs: 'Lona, vinil, ACM e acrílico.', exemplo: true },
    { id: 'for-brindes', nome: 'Brindes & Cia', telefone: '(11) 3333-1200', cidade: 'São Paulo', prazoDias: 21, obs: 'Canecas brancas, chaveiros, medalhas e troféus.', exemplo: true },
  ]

  // Insumos de hoje (uns já abaixo do mínimo, para o aviso aparecer).
  const insumos: Insumo[] = []
  const ins = (nome: string, grupo: GrupoInsumo, unidade: string, estoque: number, minimo: number, custo: number, fornecedorId: string) =>
    insumos.push({ id: id('ins', insumos.length), nome, grupo, unidade, estoque, minimo, custo, fornecedorId, exemplo: true })
  for (const [cor, base] of [['branca', 1], ['preta', 0.7], ['azul-marinho', 0.4]] as const)
    for (const t of ['P', 'M', 'G', 'GG']) ins(`Camisa algodão ${cor} ${t}`, 'camisas', 'un', Math.round((t === 'M' || t === 'G' ? 34 : 14) * base + ent(-4, 6)), 10, cor === 'branca' ? 14.5 : 16.9, 'for-camisas')
  for (const t of ['P', 'M', 'G', 'GG']) ins(`Camisa poliéster branca ${t}`, 'camisas', 'un', ent(8, 40), 12, 11.9, 'for-camisas')
  for (const t of ['M', 'G']) ins(`Camisa dry fit branca ${t}`, 'camisas', 'un', t === 'G' ? 6 : ent(14, 30), 10, 15.8, 'for-camisas')
  for (const t of ['PBL', 'MBL', 'GBL']) ins(`Baby look algodão branca ${t}`, 'camisas', 'un', ent(5, 18), 6, 13.9, 'for-camisas')
  ins('Papel A4 75g (resma 500 fl.)', 'papel', 'resma', 14, 6, 32, 'for-papel')
  ins('Couché 300g A3 (pct. 100 fl.)', 'papel', 'pacote', 3, 4, 96, 'for-papel')
  ins('Papel fotográfico A4 (pct. 100 fl.)', 'papel', 'pacote', 5, 3, 58, 'for-papel')
  ins('Papel adesivo A4 (pct. 100 fl.)', 'papel', 'pacote', 6, 3, 64, 'for-papel')
  ins('Papel sublimático A4 (pct. 100 fl.)', 'papel', 'pacote', 2, 4, 39, 'for-tinta')
  ins('Tinta sublimática (kit 4 cores)', 'tinta', 'kit', 3, 2, 260, 'for-tinta')
  ins('Toner preto da copiadora', 'tinta', 'un', 1, 2, 189, 'for-papel')
  ins('Filme DTF (rolo 60 cm × 100 m)', 'midia', 'rolo', 1, 1, 420, 'for-tinta')
  ins('Lona 440g (rolo 1,40 × 50 m)', 'midia', 'm²', 48, 20, 9.8, 'for-midia')
  ins('Vinil adesivo branco (rolo 1,22 × 50 m)', 'midia', 'm²', 36, 15, 11.5, 'for-midia')
  ins('Caneca branca 325 ml (cx. 36)', 'brindes', 'un', 58, 36, 7.9, 'for-brindes')
  ins('Caneca mágica (cx. 12)', 'brindes', 'un', 8, 12, 15.9, 'for-brindes')
  ins('Medalha 50 mm com fita', 'brindes', 'un', 64, 40, 4.6, 'for-brindes')
  ins('Chaveiro acrílico em branco', 'brindes', 'un', 120, 50, 1.6, 'for-brindes')
  ins('Espiral para encadernação (pct.)', 'outros', 'pacote', 4, 2, 28, 'for-papel')
  ins('Plástico para plastificação A4 (cx. 100)', 'outros', 'caixa', 2, 1, 74, 'for-papel')

  // Vendas de balcão: todo dia que abre.
  const vendas: Venda[] = []
  const pagFormas = [
    ['pix', 58],
    ['dinheiro', 22],
    ['debito', 12],
    ['credito', 8],
  ] as const
  dias.forEach((dia, di) => {
    if (!abre(dia)) return
    const sab = new Date(dia + 'T12:00:00Z').getUTCDay() === 6
    const tendencia = 0.85 + (di / dias.length) * 0.35
    const quantas = Math.max(1, Math.round((sab ? 4 : 9) * tendencia + (r() - 0.5) * 4))
    for (let k = 0; k < quantas; k++) {
      const hora = `${doisDig(ent(7, sab ? 11 : 17))}:${doisDig(ent(0, 59))}`
      const [pid, [q1, q2]] = pesado(BALCAO.map((b) => [b, b[2]] as const))
      const p = prod(pid)
      const v = um(p.variacoes)
      const itens: ItemVenda[] = [{ produtoId: p.id, nome: p.nome, cor: v.cor, gb: 0, qtd: ent(q1, q2), preco: v.pix, custo: v.custo, desconto: 0, categoria: p.marca }]
      const total = itens[0].qtd * itens[0].preco
      const forma = pesado(pagFormas)
      vendas.push({
        id: '',
        numero: 0,
        data: `${dia}T${hora}:00-05:00`,
        clienteId: r() < 0.25 ? um(pessoas).id : undefined,
        vendedorId: pesado(atendentes),
        itens,
        desconto: 0,
        troca: 0,
        pagamentos: [{ forma, valor: Math.round(total * 100) / 100, ...(forma === 'credito' ? { parcelas: 1 } : {}) }],
        garantiaAte: dia,
        status: 'concluida',
        exemplo: true,
      })
    }
  })

  // Pedidos de produção, do atendimento à entrega.
  const pedidos: Pedido[] = []
  const tiposPeso = PEDIDOS_TIPO.map((t) => [t, t[2]] as const)
  let np = 2000
  // O movimento cresce aos poucos (a gráfica está crescendo): de ~1,7 para ~2,3 pedidos por dia útil.
  const diasPedido = dias
    .filter(abre)
    .flatMap((dia) => {
      const t = (Date.parse(dia) - Date.parse(inicio)) / (Date.parse(hojeIso) - Date.parse(inicio) || 1)
      const n = new Date(dia + 'T12:00:00Z').getUTCDay() === 6 ? ent(0, 1) : 1 + (r() < 0.55 + 0.3 * t ? 1 : 0) + (r() < 0.15 + 0.25 * t ? 1 : 0)
      return Array.from({ length: n }, () => dia)
    })
  for (const d of diasPedido) {
    const [pid, [q1, q2], , descricoes] = pesado(tiposPeso)
    const p = prod(pid)
    const v = um(p.variacoes)
    const ehCamisa = p.marca === 'camisas'
    const qtd = ent(q1, q2)
    const grade: Record<string, number> | undefined = ehCamisa ? {} : undefined
    if (grade) {
      let falta = qtd
      const fem = r() < 0.4 ? ent(2, Math.max(2, Math.floor(qtd / 3))) : 0
      for (let i = 0; i < fem; i++) grade[um(GRADE_FEM)] = (grade[um(GRADE_FEM)] ?? 0) + 1
      falta -= Object.values(grade).reduce((a, b) => a + b, 0)
      for (let i = 0; i < falta; i++) {
        const t = pesado([['P', 2], ['M', 5], ['G', 5], ['GG', 3], ['EXG', 1]] as const)
        grade[t] = (grade[t] ?? 0) + 1
      }
    }
    const qtdFinal = grade ? Object.values(grade).reduce((a, b) => a + b, 0) : qtd
    const cliente = ehCamisa || r() < 0.6 ? um(grupos) : um(pessoas)
    const idade = (Date.parse(hojeIso) - Date.parse(d)) / 864e5
    const ciclo = p.prazoDias + 2
    const k = idade > ciclo + 2 ? 5 : Math.min(5, Math.floor((idade / Math.max(1, ciclo)) * 6))
    const status = ETAPAS_PEDIDO[k]
    const historico = ETAPAS_PEDIDO.slice(0, k + 1).map((st, j) => ({ quando: somaDias(d, Math.min(Math.floor(idade), Math.round((j * ciclo) / 6))), status: st, quem: j === 0 ? 'Késia Rocha' : j <= 2 ? 'Jonas Freitas' : 'Paulo Sena' }))
    const itens: ItemPedido[] = [{ produtoId: p.id, nome: p.nome, opcao: v.cor, qtd: qtdFinal, preco: v.pix, custo: v.custo }]
    const total = qtdFinal * v.pix
    const sinal = total >= 150 ? Math.round(total * 0.5) : 0
    pedidos.push({
      id: id('ped', np),
      numero: np++,
      clienteId: cliente.id,
      origem: pesado([['whatsapp', 46], ['balcao', 24], ['instagram', 16], ['site', 14]] as const),
      itens,
      descricao: um(descricoes),
      cores: ehCamisa || pid === 'canecas' ? [um(CORES_PEDIDO), ...(r() < 0.5 ? [um(CORES_PEDIDO)] : [])].filter((c, i, l) => l.indexOf(c) === i) : [],
      ...(grade ? { grade } : {}),
      arquivos: r() < 0.7 ? (ehCamisa ? ['frente.png', 'costas.png'] : ['arte.pdf']) : [],
      setor: p.setor,
      responsavelId: p.setor === 'arte' ? 'eq-jonas' : r() < 0.5 ? 'eq-paulo' : 'eq-talita',
      prazo: somaDias(d, p.prazoDias + 1),
      status,
      sinal,
      ...(sinal ? (() => {
        const forma = pesado(pagFormas)
        // O sinal entra quando o cliente aprova a arte (ou no dia do pedido, se ainda não chegou lá).
        return { formaSinal: forma, sinais: [{ data: historico[Math.min(2, historico.length - 1)].quando, valor: sinal, forma }] }
      })() : {}),
      criadoEm: d,
      ...(k >= 3 ? { aprovadoEm: historico[3].quando } : {}),
      ...(status === 'entregue' ? { entregueEm: historico[5].quando } : {}),
      historico,
      exemplo: true,
    })
  }
  // Os mais novos cobrem todas as etapas do quadro (a demonstração mostra o quadro cheio).
  const ETAPAS: StatusPedido[] = ['novo', 'novo', 'novo', 'arte', 'arte', 'arte', 'aprovacao', 'aprovacao', 'aprovacao', 'producao', 'producao', 'producao', 'producao', 'pronto', 'pronto', 'pronto', 'entregue', 'entregue']
  pedidos.slice(-ETAPAS.length).reverse().forEach((o, i) => {
    const s = ETAPAS[i]
    const k = ETAPAS_PEDIDO.indexOf(s)
    o.status = s
    o.criadoEm = somaDias(hojeIso, -Math.max(0, Math.floor(i / 2)) - (k >= 3 ? 2 : 0))
    o.prazo = somaDias(o.criadoEm, prod(o.itens[0].produtoId).prazoDias + 1)
    o.historico = ETAPAS_PEDIDO.slice(0, k + 1).map((st, j) => ({ quando: o.criadoEm, status: st, quem: j === 0 ? 'Késia Rocha' : j <= 2 ? 'Jonas Freitas' : 'Paulo Sena' }))
    if (k >= 3) o.aprovadoEm = o.criadoEm
    else delete o.aprovadoEm
    if (s === 'entregue') o.entregueEm = hojeIso
    else delete o.entregueEm
  })
  // Dois pedidos em produção com prazo vencido (para o aviso de atraso aparecer).
  pedidos.filter((o) => o.status === 'producao').slice(0, 2).forEach((o) => (o.prazo = somaDias(hojeIso, -1)))

  // Pedido entregue vira venda (o sinal já tinha sido pago na aprovação).
  for (const o of pedidos) {
    if (o.status !== 'entregue' || !o.entregueEm) continue
    const total = totalPedido(o)
    const resto = Math.round((total - o.sinal) * 100) / 100
    const forma = pesado(pagFormas)
    const itens: ItemVenda[] = o.itens.map((i) => ({ produtoId: i.produtoId, nome: i.nome, cor: i.opcao, gb: 0, qtd: i.qtd, preco: i.preco, custo: i.custo, desconto: 0, categoria: prod(i.produtoId).marca }))
    vendas.push({
      id: '',
      numero: 0,
      data: `${o.entregueEm}T${doisDig(ent(8, 17))}:${doisDig(ent(0, 59))}:00-05:00`,
      clienteId: o.clienteId,
      vendedorId: pesado(atendentes),
      itens,
      desconto: 0,
      pedidoId: o.id,
      troca: o.sinal,
      pagamentos: resto > 0 ? [{ forma, valor: resto, ...(forma === 'credito' ? { parcelas: resto > 500 ? ent(2, 3) : 1 } : {}) }] : [],
      garantiaAte: o.entregueEm,
      status: 'concluida',
      exemplo: true,
    })
  }
  vendas.sort((a, b) => a.data.localeCompare(b.data))
  vendas.forEach((v, i) => {
    v.numero = 1000 + i
    v.id = id('v', v.numero)
  })
  for (const v of vendas) if (v.pedidoId) pedidos.find((o) => o.id === v.pedidoId)!.vendaId = v.id

  // Orçamentos: os últimos 12 dias (os do site trazem as respostas do formulário).
  const orcamentos: Orcamento[] = []
  const ORC: [string, number, [string, string][]][] = [
    ['uniformes-esportivos', 18, [['Tipo de camisa', 'Dry fit'], ['Cores da camisa', 'Azul, Branca'], ['Onde será aplicada a estampa', 'Frente, costas e mangas'], ['Como a estampa é feita', 'Sublimação'], ['Para quem são as camisas', 'Todas masculinas'], ['Tamanhos', 'M: 6 · G: 8 · GG: 4 (total 18)'], ['Como você quer a camisa', 'Escudo no peito, nome e número nas costas'], ['Imagens', 'Imagem da frente: escudo.png']]],
    ['camisas-eventos', 45, [['Tipo de camisa', 'Tradicional'], ['Tecido', 'Algodão'], ['Cores da camisa', 'Branca'], ['Onde será aplicada a estampa', 'Frente e costas'], ['Como a estampa é feita', 'Silk (serigrafia)'], ['Para quem são as camisas', 'Masculinas e femininas'], ['Tamanhos', 'P: 6 · M: 14 · G: 10 · PBL: 5 · MBL: 10 (total 45)'], ['Como você quer a camisa', 'Camisa do encontro de família com a árvore e o sobrenome']]],
    ['banners-lonas', 2, [['Medidas', '200 × 100 cm'], ['Material', 'Lona'], ['Acabamento', 'Ilhós'], ['Cores da arte', 'Laranja, Preta'], ['Como você quer', 'Banner de inauguração com logo e telefone']]],
    ['cartazes-folders', 200, [['Formato', 'A4'], ['Papel', 'Couché brilho'], ['Impressão', 'Colorida, frente e verso'], ['Acabamento', 'Dobra'], ['Como você quer o impresso', 'Folder com os serviços da clínica e mapa no verso']]],
    ['chaveiros', 60, [['Cores do produto e da arte', 'Dourada, Preta'], ['Como a personalização é feita', 'Gravação a laser'], ['Como você quer o brinde', 'Chaveiro de MDF com o nome dos formandos']]],
    ['criacao-logotipo', 1, [['Nome da marca ou empresa', 'Hamburgueria Brasa'], ['Ramo de atividade', 'Lanchonete'], ['Cores da marca', 'Vermelha, Preta'], ['Descreva o que você precisa', 'Logo moderno para a fachada e o Instagram']]],
    ['fachadas-letreiros', 1, [['Medidas', 'Visita técnica'], ['Material', 'ACM'], ['Precisa de instalação', 'Sim'], ['Como você quer', 'Fachada da loja de roupas com letra caixa iluminada']]],
    ['camisas-personalizadas', 25, [['Tipo de camisa', 'Polo'], ['Cores da camisa', 'Azul-marinho'], ['Onde será aplicada a estampa', 'Somente frente'], ['Como a estampa é feita', 'Bordado'], ['Tamanhos', 'M: 10 · G: 10 · GG: 5 (total 25)']]],
  ]
  ORC.forEach(([pid, qtd, respostas], i) => {
    const c = i % 3 === 2 ? undefined : um(clientes)
    const status: StatusOrcamento = i < 3 ? 'novo' : i < 6 ? 'respondido' : i === 6 ? 'recusado' : 'aprovado'
    const p = prod(pid)
    const dia = somaDias(hojeIso, -Math.floor(i * 1.6))
    orcamentos.push({
      id: id('orc', i),
      numero: `EST-${dia.slice(2).replace(/-/g, '')}-${(1000 + i * 37).toString(36).toUpperCase()}`,
      data: `${dia}T${doisDig(ent(8, 20))}:${doisDig(ent(0, 59))}:00-05:00`,
      origem: i % 2 ? 'whatsapp' : 'site',
      nome: c?.nome ?? `${um(NOMES)} ${um(SOBRENOMES)}`,
      telefone: c?.telefone ?? telefone(),
      ...(c ? { clienteId: c.id } : {}),
      produtoId: pid,
      respostas,
      qtd,
      ...(status !== 'novo' ? { valor: Math.round(qtd * p.variacoes[0].pix), prazoDias: p.prazoDias } : {}),
      status,
      exemplo: true,
    })
  })

  // Compras de insumos: a cada 2 semanas de cada fornecedor, com conta a pagar no prazo dele.
  const compras: Compra[] = []
  const despesas: Despesa[] = []
  const contas: Conta[] = []
  let nc = 0
  for (const f of fornecedores) {
    const desses = insumos.filter((x) => x.fornecedorId === f.id)
    for (let d = somaDias(inicio, ent(0, 10)); d <= hojeIso; d = somaDias(d, ent(12, 20))) {
      const itens = desses.filter(() => r() < 0.5).map((x) => ({ insumoId: x.id, qtd: Math.max(1, Math.round(x.minimo * (1 + r()))), custo: x.custo }))
      if (!itens.length) continue
      const total = Math.round(itens.reduce((t, i) => t + i.qtd * i.custo, 0) * 100) / 100
      const venc = somaDias(d, f.prazoDias)
      const contaId = id('ct', nc)
      compras.push({ id: id('cp', nc++), fornecedorId: f.id, data: d, itens, total, contaId, exemplo: true })
      const paga = venc <= hojeIso
      contas.push({ id: contaId, tipo: 'pagar', descricao: `${f.nome}, compra de material`, valor: total, vencimento: venc, categoria: 'estoque', recorrencia: 'nenhuma', ...(paga ? { pagaEm: venc } : {}), exemplo: true })
      if (paga) despesas.push({ id: id('dp', despesas.length), data: venc, valor: total, categoria: 'estoque', descricao: `${f.nome}, compra de material`, contaId, exemplo: true })
    }
  }

  // Despesas fixas do mês.
  const FIXAS: [string, CategoriaDespesa, number, number, number][] = [
    ['Aluguel do ponto', 'aluguel', 2800, 5, 0],
    ['Salários e encargos', 'salarios', 8400, 5, 0],
    ['Conta de energia', 'contas', 1350, 15, 220],
    ['Internet e telefone', 'contas', 159, 10, 0],
    ['Anúncios no Instagram', 'anuncios', 600, 1, 200],
    ['Contador', 'outros', 450, 10, 0],
    ['Manutenção das máquinas', 'outros', 380, 20, 150],
    ['Sistema e maquininha', 'contas', 210, 20, 40],
  ]
  const meses = [...new Set(dias.map((d) => d.slice(0, 7)))]
  for (const mes of meses)
    for (const [desc, cat, valor, dia, varia] of FIXAS) {
      const venc = `${mes}-${doisDig(dia)}`
      if (venc < inicio) continue
      const v = valor + (varia ? ent(-varia, varia) : 0)
      const contaId = id('ct', nc++)
      // A energia deste mês fica atrasada (para o aviso aparecer).
      const atrasada = desc === 'Conta de energia' && mes === hojeIso.slice(0, 7)
      const paga = venc <= hojeIso && !atrasada
      contas.push({ id: contaId, tipo: 'pagar', descricao: desc, valor: v, vencimento: venc, categoria: cat, recorrencia: 'mensal', ...(paga ? { pagaEm: venc } : {}), exemplo: true })
      if (paga) despesas.push({ id: id('dp', despesas.length), data: venc, valor: v, categoria: cat, descricao: desc, contaId, exemplo: true })
    }
  const proximo = somaDias(hojeIso.slice(0, 7) + '-01', 32).slice(0, 7)
  for (const [desc, cat, valor, dia] of FIXAS)
    contas.push({ id: id('ct', nc++), tipo: 'pagar', descricao: desc, valor, vencimento: `${proximo}-${doisDig(dia)}`, categoria: cat, recorrencia: 'mensal', exemplo: true })

  // Caixa de cada dia aberto (com algumas diferenças pequenas na conferência).
  const caixas: Caixa[] = dias
    .filter((d) => d < hojeIso && abre(d))
    .map((d, i) => {
      const doDia = vendas.filter((v) => v.data.startsWith(d) && v.status === 'concluida')
      const sinais = sinaisDoDia(pedidos, d)
      const soma = (f: FormaPag) => doDia.reduce((t, v) => t + v.pagamentos.filter((p) => p.forma === f).reduce((a, p) => a + p.valor, 0), 0) + sinais[f]
      const diferenca = r() < 0.1 ? um([-10, -5, -2, 2, 5]) : 0
      const sangria = soma('dinheiro') > 600 ? 500 : 0
      return {
        id: id('cx', i),
        data: d,
        abertura: { valor: 100, quem: 'Késia Rocha', hora: '07:28' },
        movimentos: sangria ? [{ tipo: 'sangria' as const, valor: sangria, motivo: 'Depósito no banco', hora: '16:40', quem: 'Márcio Lima' }] : [],
        fechamento: { contado: { dinheiro: Math.round((100 + soma('dinheiro') - sangria + diferenca) * 100) / 100, pix: soma('pix'), debito: soma('debito'), credito: soma('credito') }, quem: 'Késia Rocha', hora: '17:35' },
        exemplo: true,
      }
    })
  if (abre(hojeIso)) caixas.push({ id: id('cx', caixas.length), data: hojeIso, abertura: { valor: 100, quem: 'Késia Rocha', hora: '07:31' }, movimentos: [], exemplo: true })

  // Metas: o mês anterior + 8%.
  const fatMes = (mes: string) => vendas.filter((v) => v.data.startsWith(mes)).reduce((t, v) => t + faturamentoVenda(v), 0)
  const nMes = (mes: string) => vendas.filter((v) => v.data.startsWith(mes)).length
  const metas: Meta[] = meses.map((mes, i) => {
    const ref = i >= 2 ? meses[i - 1] : meses[Math.min(1, meses.length - 1)]
    const fat = Math.round((fatMes(ref) * 1.08) / 1000) * 1000
    return { mes, faturamento: fat, lucro: Math.round((fat * 0.28) / 500) * 500, vendas: Math.round((nMes(ref) * 1.08) / 5) * 5 }
  })

  return { clientes, equipe, fornecedores, insumos, compras, vendas, pedidos, orcamentos, caixas, metas, despesas, contas }
}
