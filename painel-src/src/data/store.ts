/**
 * CAMADA DE DADOS DO PAINEL
 * =========================
 * Tudo o que o painel lê ou grava passa por aqui. Na demonstração, texto e números ficam no
 * localStorage deste navegador e as fotos no IndexedDB (src/data/fotosDb.ts). Para a versão de
 * verdade (Neon + API + login), troca-se só este arquivo: as telas chamam as mesmas funções.
 */
import { useSyncExternalStore } from 'react'
import { PAGAMENTO, type Selo } from './produtos'
import { CHAVE_CATALOGO, chaveVar, type Catalogo, type PProduto } from './modelo'
import { catalogoInicial } from './semente'
import { apagarFoto, apagarTodasFotos } from './fotosDb'
import { gerarExemplo, type Categoria, type Caixa, type Cliente, type Compra, type Conta, type Despesa, type Exemplo, type Fornecedor, type FormaPag, type Insumo, type Membro, type Meta, type Orcamento, type Pedido, type StatusPedido, type Venda } from './negocio'

// ───────────── Formatos ─────────────

export type Papel = 'dono' | 'funcionario'
export type Sessao = { papel: Papel; nome: string; email: string }

export type { Venda, ItemVenda, Despesa, Conta, CategoriaDespesa, Cliente, Membro, Fornecedor, Compra, Caixa, Meta, Pedido, Orcamento, Insumo } from './negocio'

export type Historico = { id: string; quando: string; quem: string; acao: string; produtoId?: string; antes?: PProduto | null; depois?: PProduto | null; desfeito?: boolean }

export type Usuario = { id: string; nome: string; email: string; papel: Papel; ativo: boolean }

export type Config = {
  manutencao: boolean
  tituloGoogle: string
  descricaoGoogle: string
  /** Desconto máximo (% do item) que o funcionário dá sem a senha do dono. */
  descontoMax: number
  /** Senha do dono para liberar desconto maior (na demonstração, 1234). */
  senhaDono: string
  /** Margem padrão de cada categoria (preço sugerido = custo + margem). */
  margens: Record<Categoria, number>
  /** Sinal pedido na aprovação do pedido, em % do total. */
  sinalPct: number
  /** Chave Pix da loja (o QR do PDV usa ela). */
  chavePix: string
}

type Colecoes = {
  catalogo: Catalogo
  vendas: Venda[]
  despesas: Despesa[]
  contas: Conta[]
  clientes: Cliente[]
  equipe: Membro[]
  fornecedores: Fornecedor[]
  insumos: Insumo[]
  compras: Compra[]
  pedidos: Pedido[]
  orcamentos: Orcamento[]
  caixas: Caixa[]
  metas: Meta[]
  /** Mensagens da fila do dia já enviadas (id → dia em que saiu). */
  enviadas: Record<string, string>
  /** Pedidos do site já trazidos para o painel (número do pedido). */
  importados: string[]
  historico: Historico[]
  usuarios: Usuario[]
  config: Config
  sessao: Sessao | null
}
type Nome = keyof Colecoes

// ───────────── Gravação no navegador ─────────────

const chave = (n: Nome) => (n === 'catalogo' ? CHAVE_CATALOGO : `estamp:painel:${n}`)


const PADRAO: { [K in Nome]: () => Colecoes[K] } = {
  catalogo: catalogoInicial,
  vendas: () => exemplo().vendas,
  despesas: () => exemplo().despesas,
  contas: () => exemplo().contas,
  clientes: () => exemplo().clientes,
  equipe: () => exemplo().equipe,
  fornecedores: () => exemplo().fornecedores,
  insumos: () => exemplo().insumos,
  compras: () => exemplo().compras,
  pedidos: () => exemplo().pedidos,
  orcamentos: () => exemplo().orcamentos,
  caixas: () => exemplo().caixas,
  metas: () => exemplo().metas,
  enviadas: () => ({}),
  importados: () => [],
  historico: () => [],
  usuarios: () => [
    { id: 'u-dono', nome: 'Márcio Lima', email: 'dono@graficaestamp.demo', papel: 'dono', ativo: true },
    { id: 'u-func', nome: 'Késia Rocha', email: 'atendimento@graficaestamp.demo', papel: 'funcionario', ativo: true },
  ],
  config: () => ({
    manutencao: false,
    tituloGoogle: 'Gráfica Estamp | Impressos, camisas e comunicação visual em Cruzeiro do Sul',
    descricaoGoogle: 'Cartões, panfletos, camisas personalizadas, uniformes, brindes, banners e fachadas em Cruzeiro do Sul. Peça seu orçamento pelo site.',
    ...CONFIG_AUTOMATICO,
  }),
  sessao: () => null,
}

/** Os 6 meses de exemplo: gerados uma vez (do catálogo de fábrica e da data de hoje) e salvos. */
let cacheExemplo: Exemplo | null = null
const exemplo = () => (cacheExemplo ??= gerarExemplo(catalogoInicial().produtos, hoje()))

/** Os campos novos da configuração (quem já tinha a configuração salva recebe estes valores). */
const CONFIG_AUTOMATICO = { descontoMax: 10, senhaDono: '1234', margens: { impressos: 60, camisas: 52, brindes: 60, comunicacao: 55, design: 80 }, sinalPct: 50, chavePix: 'pix@graficaestamp.demo' }

const memoria: Partial<Colecoes> = {}
const ouvintes = new Map<Nome, Set<() => void>>()
/** Se o navegador recusar gravar (modo privado, espaço cheio), o painel avisa; os dados valem até fechar. */
let falhouGravar = false
const avisos = new Set<() => void>()

function ler<K extends Nome>(n: K): Colecoes[K] {
  if (n in memoria) return memoria[n] as Colecoes[K]
  let valor: Colecoes[K] | undefined
  try {
    const bruto = localStorage.getItem(chave(n))
    if (bruto) valor = JSON.parse(bruto) as Colecoes[K]
  } catch {
    valor = undefined
  }
  if (valor === undefined) {
    valor = PADRAO[n]()
    // O catálogo de fábrica já fica salvo: a partir daqui, o site deste navegador lê o painel.
    // O catálogo e os exemplos já ficam salvos: o site lê o painel e os números não mudam no dia seguinte.
    if (n !== 'sessao') gravarBruto(n, valor)
  }
  if (n === 'config') valor = { ...CONFIG_AUTOMATICO, ...(valor as Config) } as Colecoes[K]
  memoria[n] = valor
  if (n === 'catalogo') sincronizar(valor as Catalogo)
  return valor
}

function gravarBruto<K extends Nome>(n: K, valor: Colecoes[K]) {
  try {
    localStorage.setItem(chave(n), JSON.stringify(valor))
    if (falhouGravar) {
      falhouGravar = false
      avisos.forEach((f) => f())
    }
  } catch {
    falhouGravar = true
    avisos.forEach((f) => f())
  }
}

function gravar<K extends Nome>(n: K, valor: Colecoes[K]) {
  memoria[n] = valor
  gravarBruto(n, valor)
  if (n === 'catalogo') sincronizar(valor as Catalogo)
  ouvintes.get(n)?.forEach((f) => f())
}

/** O painel usa os cálculos do site (parcela, preço no cartão): eles leem estes objetos. */
function sincronizar(c: Catalogo) {
  Object.assign(PAGAMENTO, c.pagamento)
}

/** Outra aba mudou os dados (o painel aberto em duas abas): relê. */
if (typeof window !== 'undefined')
  window.addEventListener('storage', (e) => {
    const n = (Object.keys(PADRAO) as Nome[]).find((k) => chave(k) === e.key)
    if (!n) return
    delete memoria[n]
    ouvintes.get(n)?.forEach((f) => f())
  })

/** Hook: a coleção, sempre atual (a tela redesenha quando ela muda). */
export function useDados<K extends Nome>(n: K): Colecoes[K] {
  return useSyncExternalStore(
    (f) => {
      if (!ouvintes.has(n)) ouvintes.set(n, new Set())
      ouvintes.get(n)!.add(f)
      return () => ouvintes.get(n)!.delete(f)
    },
    () => ler(n),
  )
}

export function useFalhaGravar() {
  return useSyncExternalStore(
    (f) => {
      avisos.add(f)
      return () => avisos.delete(f)
    },
    () => falhouGravar,
  )
}

export const dados = { ler, gravar }

// ───────────── Ajudantes ─────────────

export const novoId = (prefixo: string) => `${prefixo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const agoraIso = () => new Date().toISOString()

/** Data de hoje no fuso da loja (Acre, UTC−5), 'AAAA-MM-DD'. */
export function hoje(): string {
  return diaDe(new Date())
}
export function diaDe(d: Date): string {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Rio_Branco', year: 'numeric', month: '2-digit', day: '2-digit' })
  return f.format(d)
}

// ───────────── Sessão (login de demonstração) ─────────────

export const sessao = {
  entrar(papel: Papel, email: string) {
    const u = ler('usuarios').find((x) => x.papel === papel && x.ativo)
    gravar('sessao', { papel, nome: u?.nome ?? (papel === 'dono' ? 'Dono da gráfica' : 'Funcionário'), email: email || u?.email || '' })
  },
  sair() {
    gravar('sessao', null)
  },
}

/** O que cada papel pode ver ou fazer. O funcionário não vê dinheiro da loja (lucro, custo, despesas). */
export type Permissao = 'financeiro' | 'custo' | 'despesas' | 'configuracoes' | 'usuarios' | 'produtos' | 'vendas' | 'fotos' | 'anuncios'
const DO_FUNCIONARIO: Permissao[] = ['produtos', 'vendas', 'fotos', 'anuncios']
export const pode = (s: Sessao | null, p: Permissao) => !!s && (s.papel === 'dono' || DO_FUNCIONARIO.includes(p))

// ───────────── Histórico ─────────────

function registrar(acao: string, produtoId?: string, antes?: PProduto | null, depois?: PProduto | null) {
  const s = ler('sessao')
  const item: Historico = { id: novoId('h'), quando: agoraIso(), quem: s?.nome ?? '—', acao, produtoId, antes, depois }
  gravar('historico', [item, ...ler('historico')].slice(0, 300))
}

// ───────────── Produtos ─────────────

function trocarProdutos(f: (lista: PProduto[]) => PProduto[]) {
  const c = ler('catalogo')
  gravar('catalogo', { ...c, produtos: f(c.produtos) })
}

export const produtos = {
  lista: () => ler('catalogo').produtos,
  porId: (id: string) => ler('catalogo').produtos.find((p) => p.id === id),

  salvar(p: PProduto, acao = 'Editou') {
    const antes = produtos.porId(p.id) ?? null
    const depois = { ...p, atualizadoEm: agoraIso() }
    trocarProdutos((l) => (antes ? l.map((x) => (x.id === p.id ? depois : x)) : [depois, ...l]))
    registrar(antes ? acao : 'Cadastrou', p.id, antes, depois)
  },

  duplicar(id: string): string | undefined {
    const p = produtos.porId(id)
    if (!p) return
    const nova: PProduto = { ...structuredClone(p), id: novoId(p.id.slice(0, 24)), nome: `${p.nome} (cópia)`, ativo: false, atualizadoEm: agoraIso() }
    trocarProdutos((l) => {
      const i = l.findIndex((x) => x.id === id)
      return [...l.slice(0, i + 1), nova, ...l.slice(i + 1)]
    })
    registrar('Duplicou', nova.id, null, nova)
    return nova.id
  },

  ativar(id: string, ativo: boolean) {
    const p = produtos.porId(id)
    if (p) produtos.salvar({ ...p, ativo }, ativo ? 'Ativou' : 'Desativou')
  },

  excluir(id: string) {
    const p = produtos.porId(id)
    if (!p) return
    trocarProdutos((l) => l.filter((x) => x.id !== id))
    const c = ler('catalogo')
    gravar('catalogo', { ...c, destaques: c.destaques.filter((d) => d.id !== id) })
    registrar('Excluiu', id, p, null)
  },

  /** Nova ordem (arrastar na lista). */
  reordenar(ids: string[]) {
    trocarProdutos((l) => {
      const pos = new Map(ids.map((id, i) => [id, i]))
      return [...l].sort((a, b) => (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9))
    })
  },

  /** Muda o estoque de uma variação (a venda baixa; o cancelamento devolve). */
  mexerEstoque(id: string, cor: string, gb: number, delta: number) {
    trocarProdutos((l) =>
      l.map((p) =>
        p.id !== id || !p.controlaEstoque ? p : { ...p, variacoes: p.variacoes.map((v) => (v.cor === cor && v.gb === gb ? { ...v, estoque: Math.max(0, v.estoque + delta) } : v)) },
      ),
    )
  },
}

/** Desfaz a última mudança de um produto (volta ao "antes" guardado no histórico). */
export function desfazer(h: Historico) {
  if (h.desfeito) return
  const c = ler('catalogo')
  let lista = c.produtos
  if (h.antes && h.depois) lista = lista.map((p) => (p.id === h.antes!.id ? h.antes! : p))
  else if (h.antes && !h.depois) lista = [h.antes, ...lista]
  else if (!h.antes && h.depois) lista = lista.filter((p) => p.id !== h.depois!.id)
  gravar('catalogo', { ...c, produtos: lista })
  gravar(
    'historico',
    ler('historico').map((x) => (x.id === h.id ? { ...x, desfeito: true } : x)),
  )
}

export const catalogo = {
  ler: () => ler('catalogo'),
  mudar(f: (c: Catalogo) => Catalogo) {
    gravar('catalogo', f(ler('catalogo')))
  },
}

export const SELOS: { id: Selo; nome: string }[] = [
  { id: 'chegou', nome: 'Novidade' },
  { id: 'ultimas', nome: 'Últimas unidades' },
  { id: 'mais', nome: 'Mais vendido' },
  { id: 'promo', nome: 'Promoção' },
]

// ───────────── Demonstração ─────────────

const TUDO = Object.keys(PADRAO) as Nome[]

/** Volta tudo como na primeira vez (catálogo de fábrica, dados de exemplo, fotos apagadas). */
export async function restaurarDemonstracao() {
  const s = ler('sessao')
  for (const n of TUDO) {
    try {
      localStorage.removeItem(chave(n))
    } catch {
      /* sem storage */
    }
    delete memoria[n]
  }
  await apagarTodasFotos()
  gravar('sessao', s)
  for (const n of TUDO) ouvintes.get(n)?.forEach((f) => f())
}

/** Apaga só os dados de exemplo (vendas, clientes, pedidos, orçamentos, insumos, caixa, contas); o catálogo, a equipe e as metas ficam. */
export function comecarDoZero() {
  gravar('vendas', ler('vendas').filter((v) => !v.exemplo))
  gravar('despesas', ler('despesas').filter((v) => !v.exemplo))
  gravar('contas', ler('contas').filter((v) => !v.exemplo))
  for (const n of ['clientes', 'fornecedores', 'insumos', 'compras', 'pedidos', 'orcamentos', 'caixas'] as const)
    gravar(n, (ler(n) as { exemplo?: boolean }[]).filter((v) => !v.exemplo) as never)
}

/** Tira a foto de uma cor e apaga o arquivo do aparelho. */
export async function apagarFotosDe(p: PProduto) {
  for (const c of p.cores) if (c.foto) for (const f of [c.foto.card, c.foto.grande, c.foto.original]) if (f) await apagarFoto(f)
}

// ───────────── Negócio: vendas, troca, caixa e clientes ─────────────

const quem = () => ler('sessao')?.nome ?? '—'
const horaAgora = () => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Rio_Branco', hour: '2-digit', minute: '2-digit' }).format(new Date())
/** Data e hora de agora no fuso da loja, no formato das vendas (ISO com -05:00). */
export const agoraLoja = () => `${hoje()}T${horaAgora()}:00-05:00`

export const negocio = {
  /** Registra a venda e baixa o estoque (só dos produtos de pronta entrega). */
  registrarVenda(v: Omit<Venda, 'id' | 'numero'>): Venda {
    const lista = ler('vendas')
    const numero = lista.reduce((m, x) => Math.max(m, x.numero), 1000) + 1
    const venda: Venda = { ...v, id: novoId('v'), numero }
    gravar('vendas', [...lista, venda])
    for (const i of venda.itens) produtos.mexerEstoque(i.produtoId, i.cor, i.gb, -i.qtd)
    return venda
  },

  /** Cancela ou registra a devolução: o estoque volta. */
  desfazerVenda(id: string, status: 'cancelada' | 'devolvida') {
    const v = ler('vendas').find((x) => x.id === id)
    if (!v || v.status !== 'concluida') return
    gravar('vendas', ler('vendas').map((x) => (x.id === id ? { ...x, status } : x)))
    for (const i of v.itens) produtos.mexerEstoque(i.produtoId, i.cor, i.gb, i.qtd)
  },

  caixaDeHoje: () => ler('caixas').find((c) => c.data === hoje()),

  abrirCaixa(valor: number) {
    if (negocio.caixaDeHoje()) return
    gravar('caixas', [...ler('caixas'), { id: novoId('cx'), data: hoje(), abertura: { valor, quem: quem(), hora: horaAgora() }, movimentos: [] }])
  },

  movimentoCaixa(tipo: 'sangria' | 'suprimento', valor: number, motivo: string) {
    const c = negocio.caixaDeHoje()
    if (!c) return
    gravar('caixas', ler('caixas').map((x) => (x.id === c.id ? { ...x, movimentos: [...x.movimentos, { tipo, valor, motivo, hora: horaAgora(), quem: quem() }] } : x)))
  },

  fecharCaixa(contado: Caixa['fechamento'] extends infer F ? (F extends { contado: infer C } ? C : never) : never) {
    const c = negocio.caixaDeHoje()
    if (!c) return
    gravar('caixas', ler('caixas').map((x) => (x.id === c.id ? { ...x, fechamento: { contado, quem: quem(), hora: horaAgora() } } : x)))
  },

  reabrirCaixa() {
    const c = negocio.caixaDeHoje()
    if (!c) return
    gravar('caixas', ler('caixas').map((x) => (x.id === c.id ? { ...x, fechamento: undefined } : x)))
  },

  salvarCliente(c: Omit<Cliente, 'id' | 'criadoEm'> & { id?: string }): string {
    const lista = ler('clientes')
    if (c.id && lista.some((x) => x.id === c.id)) {
      gravar('clientes', lista.map((x) => (x.id === c.id ? { ...x, ...c, id: x.id } : x)))
      return c.id
    }
    const novo: Cliente = { ...c, id: novoId('cli'), criadoEm: hoje() }
    gravar('clientes', [...lista, novo])
    return novo.id
  },

  /** Entrada de insumos: soma o estoque, atualiza o custo médio e cria a conta a pagar no prazo do fornecedor. */
  registrarCompra(fornecedorId: string, itens: Compra['itens'], vencimento: string): Compra {
    const f = ler('fornecedores').find((x) => x.id === fornecedorId)
    const total = Math.round(itens.reduce((t, i) => t + i.qtd * i.custo, 0) * 100) / 100
    const contaId = novoId('ct')
    const compra: Compra = { id: novoId('cp'), fornecedorId, data: hoje(), itens, total, contaId }
    gravar('compras', [...ler('compras'), compra])
    gravar('contas', [
      ...ler('contas'),
      { id: contaId, tipo: 'pagar', descricao: `${f?.nome ?? 'Fornecedor'}, compra de material`, valor: total, vencimento, categoria: 'estoque', recorrencia: 'nenhuma' },
    ])
    gravar(
      'insumos',
      ler('insumos').map((x) => {
        const i = itens.find((y) => y.insumoId === x.id)
        if (!i) return x
        const qtd = x.estoque + i.qtd
        return { ...x, estoque: qtd, custo: Math.round(((Math.max(0, x.estoque) * x.custo + i.qtd * i.custo) / qtd) * 100) / 100 }
      }),
    )
    return compra
  },

  salvarFornecedor(x: Omit<Fornecedor, 'id'> & { id?: string }): string {
    const lista = ler('fornecedores')
    if (x.id && lista.some((y) => y.id === x.id)) {
      gravar('fornecedores', lista.map((y) => (y.id === x.id ? { ...y, ...x, id: y.id } : y)))
      return x.id
    }
    const novo: Fornecedor = { ...x, id: novoId('for') }
    gravar('fornecedores', [...lista, novo])
    return novo.id
  },

  // ───── Insumos ─────

  salvarInsumo(x: Omit<Insumo, 'id'> & { id?: string }): string {
    const lista = ler('insumos')
    if (x.id && lista.some((y) => y.id === x.id)) {
      gravar('insumos', lista.map((y) => (y.id === x.id ? { ...y, ...x, id: y.id } : y)))
      return x.id
    }
    const novo: Insumo = { ...x, id: novoId('ins') }
    gravar('insumos', [...lista, novo])
    return novo.id
  },

  /** Usa (−) ou devolve (+) insumo: a produção dá baixa no que gastou. */
  mexerInsumo(id: string, delta: number) {
    gravar('insumos', ler('insumos').map((x) => (x.id === id ? { ...x, estoque: Math.max(0, Math.round((x.estoque + delta) * 100) / 100) } : x)))
  },

  // ───── Pedidos de produção ─────

  /** Abre um pedido novo (etapa "Novo pedido") e devolve ele. */
  abrirPedido(o: Omit<Pedido, 'id' | 'numero' | 'status' | 'criadoEm' | 'historico'>): Pedido {
    const lista = ler('pedidos')
    const numero = lista.reduce((m, x) => Math.max(m, x.numero), 2000) + 1
    const novo: Pedido = { ...o, id: novoId('ped'), numero, status: 'novo', criadoEm: hoje(), historico: [{ quando: hoje(), status: 'novo', quem: quem() }] }
    gravar('pedidos', [...lista, novo])
    return novo
  },

  salvarPedido(o: Pedido) {
    gravar('pedidos', ler('pedidos').map((x) => (x.id === o.id ? o : x)))
  },

  /** Muda a etapa do pedido e guarda no histórico (aprovação e entrega ganham data). */
  mudarStatusPedido(id: string, status: StatusPedido) {
    gravar(
      'pedidos',
      ler('pedidos').map((o) =>
        o.id !== id
          ? o
          : {
              ...o,
              status,
              ...(status === 'producao' && !o.aprovadoEm ? { aprovadoEm: hoje() } : {}),
              ...(status === 'entregue' ? { entregueEm: hoje() } : {}),
              historico: [...o.historico, { quando: hoje(), status, quem: quem() }],
            },
      ),
    )
  },

  /** Recebe o sinal do pedido (entra no caixa de hoje como venda à parte não; fica no pedido). */
  receberSinal(id: string, valor: number, forma: FormaPag) {
    gravar('pedidos', ler('pedidos').map((o) => (o.id === id ? { ...o, sinal: Math.round((o.sinal + valor) * 100) / 100, formaSinal: forma, sinais: [...(o.sinais ?? []), { data: hoje(), valor, forma }] } : o)))
  },

  /**
   * Entrega o pedido: vira venda (faturamento) com o resto pago agora; o sinal entra como já pago.
   */
  entregarPedido(id: string, pagamentos: Venda['pagamentos'], vendedorId: string): Venda | undefined {
    const o = ler('pedidos').find((x) => x.id === id)
    if (!o || o.vendaId) return
    const cat = (pid: string) => ler('catalogo').produtos.find((p) => p.id === pid)?.marca ?? 'impressos'
    const venda = negocio.registrarVenda({
      data: agoraLoja(),
      clienteId: o.clienteId,
      vendedorId,
      itens: o.itens.map((i) => ({ produtoId: i.produtoId, nome: i.nome, cor: i.opcao, gb: 0, qtd: i.qtd, preco: i.preco, custo: i.custo, desconto: 0, categoria: cat(i.produtoId) })),
      desconto: 0,
      pedidoId: o.id,
      troca: o.sinal,
      pagamentos,
      garantiaAte: hoje(),
      status: 'concluida',
    })
    negocio.mudarStatusPedido(id, 'entregue')
    gravar('pedidos', ler('pedidos').map((x) => (x.id === id ? { ...x, vendaId: venda.id } : x)))
    return venda
  },

  /** Marca que o cliente foi avisado da etapa atual pelo WhatsApp. */
  avisouPedido(id: string) {
    gravar('pedidos', ler('pedidos').map((o) => (o.id === id ? { ...o, avisados: [...new Set([...(o.avisados ?? []), o.status])] } : o)))
  },

  // ───── Orçamentos ─────

  salvarOrcamento(o: Orcamento) {
    const lista = ler('orcamentos')
    gravar('orcamentos', lista.some((x) => x.id === o.id) ? lista.map((x) => (x.id === o.id ? o : x)) : [o, ...lista])
  },

  /** O cliente aprovou: o orçamento vira pedido (e o cliente é cadastrado, se ainda não era). */
  aprovarOrcamento(id: string, responsavelId: string): Pedido | undefined {
    const orc = ler('orcamentos').find((x) => x.id === id)
    if (!orc || orc.pedidoId) return
    const p = ler('catalogo').produtos.find((x) => x.id === orc.produtoId)
    const clienteId = orc.clienteId ?? negocio.salvarCliente({ nome: orc.nome, telefone: orc.telefone, cidade: 'Cruzeiro do Sul', origem: orc.origem === 'site' ? 'site' : 'whatsapp', obs: '' })
    const resposta = (k: string) => orc.respostas.find(([c]) => c.toLowerCase().startsWith(k))?.[1] ?? ''
    const grade = Object.fromEntries([...resposta('tamanhos').matchAll(/([A-Z]+): (\d+)/g)].map((m) => [m[1], Number(m[2])]))
    const valor = orc.valor ?? (p ? p.variacoes[0].pix * orc.qtd : 0)
    const unit = orc.qtd ? Math.round((valor / orc.qtd) * 100) / 100 : valor
    const pedido = negocio.abrirPedido({
      clienteId,
      origem: orc.origem,
      itens: [{ produtoId: orc.produtoId, nome: p?.nome ?? 'Produto', opcao: p?.variacoes[0].cor ?? '', qtd: orc.qtd, preco: unit, custo: Math.round(unit * 0.45 * 100) / 100 }],
      descricao: resposta('como') || resposta('descreva') || orc.respostas.map(([k, v]) => `${k}: ${v}`).join(' · '),
      cores: resposta('cores').split(',').map((c) => c.trim()).filter(Boolean),
      ...(Object.keys(grade).length ? { grade } : {}),
      arquivos: resposta('imagens') ? resposta('imagens').split('|').map((x) => x.trim()) : [],
      setor: p?.setor ?? 'impressao',
      responsavelId,
      prazo: somaDiaUtil(hoje(), orc.prazoDias ?? p?.prazoDias ?? 7),
      sinal: 0,
      orcamentoId: orc.id,
    })
    gravar('orcamentos', ler('orcamentos').map((x) => (x.id === id ? { ...x, status: 'aprovado', pedidoId: pedido.id, clienteId } : x)))
    return pedido
  },

  /**
   * Traz para o painel os pedidos que os clientes enviaram pelo site neste navegador.
   * (Na versão de verdade, chegam pelo servidor; aqui, o site grava e o painel lê.)
   */
  importarDoSite(): number {
    let lista: { numero: string; data: string; produtoId: string; nome: string; telefone: string; qtd: number; respostas: [string, string][]; tipo: 'orcamento' | 'compra'; total?: number }[] = []
    try {
      lista = JSON.parse(localStorage.getItem('estamp:site:pedidos') ?? '[]')
    } catch {
      return 0
    }
    const ja = new Set(ler('importados'))
    const novos = lista.filter((x) => !ja.has(x.numero))
    if (!novos.length) return 0
    const clientes = ler('clientes')
    const digitos = (t: string) => t.replace(/\D/g, '').slice(-9)
    const orcs: Orcamento[] = novos.map((x) => {
      const c = clientes.find((y) => digitos(y.telefone) === digitos(x.telefone))
      return { id: novoId('orc'), numero: x.numero, data: x.data, origem: 'site', nome: x.nome, telefone: x.telefone, ...(c ? { clienteId: c.id } : {}), produtoId: x.produtoId, respostas: x.respostas, qtd: x.qtd || 1, ...(x.total ? { valor: x.total } : {}), status: 'novo' }
    })
    gravar('orcamentos', [...orcs, ...ler('orcamentos')])
    gravar('importados', [...ja, ...novos.map((x) => x.numero)])
    return orcs.length
  },

  /** Despesa que já foi paga hoje (ou numa data), sem conta antes. */
  lancarDespesa(d: Omit<Despesa, 'id'>) {
    gravar('despesas', [...ler('despesas'), { ...d, id: novoId('dp') }])
  },

  salvarConta(c: Omit<Conta, 'id'> & { id?: string }) {
    const lista = ler('contas')
    if (c.id && lista.some((x) => x.id === c.id)) gravar('contas', lista.map((x) => (x.id === c.id ? { ...x, ...c, id: x.id } : x)))
    else gravar('contas', [...lista, { ...c, id: novoId('ct') }])
  },

  /**
   * Dá baixa na conta: a pagar vira despesa paga (a de estoque fica fora do lucro); a receber só marca recebida.
   * Conta mensal cria a do mês seguinte.
   */
  pagarConta(id: string, quando = hoje()) {
    const c = ler('contas').find((x) => x.id === id)
    if (!c || c.pagaEm) return
    let lista = ler('contas').map((x) => (x.id === id ? { ...x, pagaEm: quando } : x))
    if (c.recorrencia === 'mensal') {
      const d = new Date(c.vencimento + 'T12:00:00Z')
      d.setUTCMonth(d.getUTCMonth() + 1)
      const prox = d.toISOString().slice(0, 10)
      if (!lista.some((x) => x.descricao === c.descricao && x.vencimento === prox)) lista = [...lista, { ...c, id: novoId('ct'), vencimento: prox, pagaEm: undefined, exemplo: undefined }]
    }
    gravar('contas', lista)
    if (c.tipo === 'pagar') gravar('despesas', [...ler('despesas'), { id: novoId('dp'), data: quando, valor: c.valor, categoria: c.categoria, descricao: c.descricao, contaId: c.id }])
  },

  excluirConta(id: string) {
    gravar('contas', ler('contas').filter((x) => x.id !== id))
  },

  salvarMeta(m: Meta) {
    const lista = ler('metas')
    gravar('metas', lista.some((x) => x.mes === m.mes) ? lista.map((x) => (x.mes === m.mes ? m : x)) : [...lista, m].sort((a, b) => a.mes.localeCompare(b.mes)))
  },

  salvarMembro(m: Omit<Membro, 'id'> & { id?: string }) {
    const lista = ler('equipe')
    if (m.id && lista.some((x) => x.id === m.id)) gravar('equipe', lista.map((x) => (x.id === m.id ? { ...x, ...m, id: x.id } : x)))
    else gravar('equipe', [...lista, { ...m, id: novoId('eq') }])
  },

  /** Marca uma mensagem da fila do dia como enviada (some da fila). */
  marcarEnviada(id: string) {
    gravar('enviadas', { ...ler('enviadas'), [id]: hoje() })
  },

  /**
   * Despesas fixas automáticas: toda conta mensal ganha a do mês seguinte sozinha, sem ninguém lançar.
   * Roda quando o painel abre. Devolve quantas contas novas criou.
   */
  lancarFixas(): number {
    const lista = ler('contas')
    const ultimas = new Map<string, Conta>()
    for (const c of lista) if (c.tipo === 'pagar' && c.recorrencia === 'mensal' && (!ultimas.has(c.descricao) || ultimas.get(c.descricao)!.vencimento < c.vencimento)) ultimas.set(c.descricao, c)
    const limite = somaMes(hoje().slice(0, 7) + '-01', 1).slice(0, 7)
    const novas: Conta[] = []
    for (const c of ultimas.values()) {
      let venc = c.vencimento
      while (venc.slice(0, 7) < limite) {
        venc = somaMes(venc, 1)
        novas.push({ ...c, id: novoId('ct'), vencimento: venc, pagaEm: undefined, exemplo: undefined })
      }
    }
    if (novas.length) gravar('contas', [...lista, ...novas])
    return novas.length
  },
}

/** Soma dias úteis (pula domingo). */
export function somaDiaUtil(dia: string, n: number) {
  const d = new Date(dia + 'T12:00:00Z')
  let k = 0
  while (k < n) {
    d.setUTCDate(d.getUTCDate() + 1)
    if (d.getUTCDay() !== 0) k++
  }
  return d.toISOString().slice(0, 10)
}

const somaMes = (dia: string, n: number) => {
  const d = new Date(dia + 'T12:00:00Z')
  d.setUTCMonth(d.getUTCMonth() + n)
  return d.toISOString().slice(0, 10)
}


// ───────────── Vitrine: preços em lote e promoções ─────────────

/** Preço "de loja": 6.790, 599, 79. */
/** Preço redondo de gráfica: R$ 0,55; R$ 12,50; R$ 189,90. */
export const arredPreco = (v: number) => (v >= 100 ? Math.round(v / 5) * 5 - 0.1 : v >= 10 ? Math.round(v * 2) / 2 : Math.round(v * 20) / 20)
const arred = arredPreco

export const vitrine = {
  /** Reajusta o preço no Pix das variações escolhidas em % (positivo sobe, negativo desce). Fica no histórico. */
  reajustar(ids: string[], porcento: number) {
    const fator = 1 + porcento / 100
    for (const id of ids) {
      const p = produtos.porId(id)
      if (!p) continue
      produtos.salvar({ ...p, variacoes: p.variacoes.map((v) => ({ ...v, pix: arred(v.pix * fator) })) }, `Reajustou ${porcento > 0 ? '+' : ''}${porcento}%`)
    }
  },

  /** Põe o produto em promoção: desconto em % no Pix, selo "Promoção" e data para acabar. */
  comecarPromo(id: string, desconto: number, ate: string) {
    const p = produtos.porId(id)
    if (!p || p.promo) return
    const antes = Object.fromEntries(p.variacoes.map((v) => [chaveVar(v.cor, v.gb), v.pix]))
    produtos.salvar(
      {
        ...p,
        promo: { ate, desconto, antes },
        selos: [...new Set([...p.selos, 'promo' as const])],
        variacoes: p.variacoes.map((v) => ({ ...v, pix: arred(v.pix * (1 - desconto / 100)) })),
      },
      `Promoção de ${desconto}%`,
    )
  },

  /** Acaba a promoção: volta o preço de antes e tira o selo. */
  encerrarPromo(id: string) {
    const p = produtos.porId(id)
    if (!p?.promo) return
    const antes = p.promo.antes
    const { promo: _p, ...resto } = p
    produtos.salvar({ ...resto, selos: p.selos.filter((s) => s !== 'promo'), variacoes: p.variacoes.map((v) => ({ ...v, pix: antes[chaveVar(v.cor, v.gb)] ?? v.pix })) }, 'Encerrou a promoção')
  },

  /** Promoções vencidas acabam sozinhas quando o painel abre. */
  vencerPromos() {
    for (const p of ler('catalogo').produtos) if (p.promo && p.promo.ate < hoje()) vitrine.encerrarPromo(p.id)
  },
}


// ───────────── Loja: configurações, usuários e cópia de segurança ─────────────

export const loja = {
  salvarConfig(c: Partial<Config>) {
    gravar('config', { ...ler('config'), ...c })
  },
  salvarUsuario(u: Omit<Usuario, 'id'> & { id?: string }) {
    const lista = ler('usuarios')
    if (u.id && lista.some((x) => x.id === u.id)) gravar('usuarios', lista.map((x) => (x.id === u.id ? { ...x, ...u, id: x.id } : x)))
    else gravar('usuarios', [...lista, { ...u, id: novoId('u') }])
  },

  /** Tudo o que o painel guarda (menos o login e as fotos), num arquivo só. */
  copia(): string {
    const tudo = Object.fromEntries(TUDO.filter((n) => n !== 'sessao').map((n) => [n, ler(n)]))
    return JSON.stringify({ sistema: 'Escala Business', empresa: 'Gráfica Estamp', versao: 1, criadaEm: agoraIso(), dados: tudo })
  },

  /** Volta uma cópia de segurança. Devolve o número de partes restauradas (0 se o arquivo não serve). */
  restaurarCopia(texto: string): number {
    let obj: { sistema?: string; dados?: Record<string, unknown> }
    try {
      obj = JSON.parse(texto)
    } catch {
      return 0
    }
    if (obj.sistema !== 'Escala Business' || !obj.dados) return 0
    let n = 0
    for (const k of TUDO) {
      if (k === 'sessao' || !(k in obj.dados)) continue
      gravar(k, obj.dados[k] as never)
      n++
    }
    return n
  },
}
