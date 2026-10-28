/**
 * Formato dos dados do painel do dono, e a conversão para o formato que o site já usa.
 * Este arquivo é leve de propósito: o site público importa só ele (e não o painel).
 */
import type { AcessorioTipo, Condicao, Marca, MelhorPara, Notas, Selo, Setor } from './produtos'
import type { HorarioDia } from '../lib/config'

/** Uma cor do aparelho. `foto`: 'idb:…' (foto do painel, card e grande) ou nada (usa a oficial). */
export type PCor = { nome: string; hex: string; foto?: { card: string; grande: string; original?: string } }

/** Cada combinação de cor e armazenamento: preço no Pix, custo (só o dono vê) e estoque. */
export type PVariacao = { cor: string; gb: number; pix: number; custo: number; estoque: number }

export type QuandoEsgota = 'avisar' | 'ocultar'

export type PProduto = {
  id: string
  marca: Marca
  linha: string
  nome: string
  condicao: Condicao
  bateria?: number
  descricao: string
  specs: string[]
  selos: Selo[]
  cores: PCor[]
  /** Armazenamentos em GB, na ordem (acessório usa [0]). */
  gbs: number[]
  variacoes: PVariacao[]
  ativo: boolean
  quandoEsgota: QuandoEsgota
  lancamento: string
  parcelas?: number
  melhorPara?: MelhorPara[]
  acessorio?: AcessorioTipo
  notas?: Notas
  /** Foto única da loja (produto antigo do site). */
  foto?: string
  /** Gráfica: unidade de venda (un, pacote, m²…), setor da produção e prazo padrão em dias. */
  unidade: string
  setor: Setor
  prazoDias: number
  /** Pronta entrega (conta unidades). Sob encomenda não tem estoque: é feito por pedido. */
  controlaEstoque: boolean
  /** Promoção em andamento: até quando e o preço no Pix de antes, por variação (para voltar no fim). Só o painel lê. */
  promo?: { ate: string; desconto: number; antes: Record<string, number> }
  atualizadoEm: string
}

export type Linha = { id: string; nome: string }
export type Destaque = { id: string; rotulo: string }
export type Pagamento = { descontoPix: number; semJurosAte: number; jurosMes: number; maxParcelas: number }
export type Loja = {
  nome: string
  whatsapp: string
  instagram: string
  endereco: string[]
  horarios: HorarioDia[]
  prazoEntrega: string
}

/** Tudo o que o site público lê do painel (uma chave só, pequena). */
export type Catalogo = {
  produtos: PProduto[]
  linhas: Record<Marca, Linha[]>
  destaques: Destaque[]
  pagamento: Pagamento
  loja: Loja
}

export const CHAVE_CATALOGO = 'estamp:painel:catalogo'

export const chaveVar = (cor: string, gb: number) => `${cor}|${gb}`

/** Unidades em estoque. Produto sob encomenda não tem estoque: conta como sempre disponível. */
export const estoqueTotal = (p: PProduto) => (p.controlaEstoque ? p.variacoes.reduce((s, v) => s + Math.max(0, v.estoque), 0) : Infinity)
/** Variação disponível para vender (sob encomenda está sempre). */
export const disponivel = (p: PProduto, v: PVariacao) => !p.controlaEstoque || v.estoque > 0

/** Variação da cor e do armazenamento (cria uma zerada se faltar). */
export function variacao(p: PProduto, cor: string, gb: number): PVariacao {
  return p.variacoes.find((v) => v.cor === cor && v.gb === gb) ?? { cor, gb, pix: 0, custo: 0, estoque: 0 }
}
