/**
 * Os números do painel, sempre pelas mesmas regras:
 *  - Faturamento: o valor dos produtos vendidos (a troca conta como pagamento).
 *  - Lucro: faturamento − custo dos vendidos − despesas da gráfica. Compra de material não entra.
 *  - Caixa: tudo o que entrou − tudo o que saiu, contando a compra de estoque.
 */
import type { Despesa, Membro, Venda } from '../../data/store'
import { custoVenda, faturamentoVenda, totalVenda } from '../../data/negocio'
import { cadaDia } from './periodo'

export type Resumo = {
  faturamento: number
  custo: number
  despesasLoja: number
  estoque: number
  lucro: number
  entrou: number
  saiu: number
  caixa: number
  vendas: number
  ticket: number
  margem: number
}

const dia = (iso: string) => iso.slice(0, 10)
const valida = (v: Venda) => v.status === 'concluida'

export function resumo(vendas: Venda[], despesas: Despesa[], de: string, ate: string): Resumo {
  let faturamento = 0
  let custo = 0
  let entrou = 0
  let n = 0
  for (const v of vendas) {
    const d = dia(v.data)
    if (d < de || d > ate || !valida(v)) continue
    faturamento += faturamentoVenda(v)
    custo += custoVenda(v)
    // O sinal do pedido também é dinheiro que entrou (conta no dia da entrega).
    entrou += totalVenda(v) + (v.troca || 0)
    n++
  }
  let despesasLoja = 0
  let estoque = 0
  for (const x of despesas) {
    if (x.data < de || x.data > ate) continue
    if (x.categoria === 'estoque') estoque += x.valor
    else despesasLoja += x.valor
  }
  const lucro = faturamento - custo - despesasLoja
  const saiu = despesasLoja + estoque
  return {
    faturamento,
    custo,
    despesasLoja,
    estoque,
    lucro,
    entrou,
    saiu,
    caixa: entrou - saiu,
    vendas: n,
    ticket: n ? faturamento / n : 0,
    margem: faturamento ? (faturamento - custo) / faturamento : 0,
  }
}

/** Variação em relação ao anterior (0,124 = +12,4%). Sem base, não compara. */
export const variacao = (agora: number, antes: number) => (antes ? (agora - antes) / Math.abs(antes) : null)

/** Faturamento e lucro bruto (sem despesas) dia a dia. Períodos longos viram semanas ou meses. */
export function serie(vendas: Venda[], de: string, ate: string) {
  const dias = cadaDia(de, ate)
  const fat = new Map<string, number>()
  const luc = new Map<string, number>()
  for (const v of vendas) {
    const d = dia(v.data)
    if (d < de || d > ate || !valida(v)) continue
    const f = faturamentoVenda(v)
    fat.set(d, (fat.get(d) ?? 0) + f)
    luc.set(d, (luc.get(d) ?? 0) + f - custoVenda(v))
  }
  const passo = dias.length > 120 ? 30 : dias.length > 45 ? 7 : 1
  const pontos: { dia: string; fat: number; lucro: number }[] = []
  for (let i = 0; i < dias.length; i += passo) {
    const grupo = dias.slice(i, i + passo)
    pontos.push({ dia: grupo[0], fat: grupo.reduce((t, d) => t + (fat.get(d) ?? 0), 0), lucro: grupo.reduce((t, d) => t + (luc.get(d) ?? 0), 0) })
  }
  return { pontos, passo }
}

// ───────────── Recortes usados no Início, na Equipe e nos Relatórios ─────────────

export const noPeriodo = (vendas: Venda[], de: string, ate: string) =>
  vendas.filter((v) => v.status === 'concluida' && v.data.slice(0, 10) >= de && v.data.slice(0, 10) <= ate)

/** Unidades, faturamento e lucro bruto por produto. */
export function porProduto(vendas: Venda[]) {
  const m = new Map<string, { id: string; nome: string; un: number; fat: number; custo: number; categoria: string }>()
  for (const v of vendas)
    for (const i of v.itens) {
      const x = m.get(i.produtoId) ?? { id: i.produtoId, nome: i.nome, un: 0, fat: 0, custo: 0, categoria: i.categoria }
      x.un += i.qtd
      x.fat += (i.preco - i.desconto) * i.qtd
      x.custo += i.custo * i.qtd
      m.set(i.produtoId, x)
    }
  return [...m.values()]
}

/** Vendido, número de vendas e comissão por vendedor (a comissão sai do % de cada categoria). */
export function porVendedor(vendas: Venda[], equipe: Membro[]) {
  return equipe
    .filter((e) => e.papel === 'dono' || e.papel === 'atendimento')
    .map((e) => {
      const dele = vendas.filter((v) => v.vendedorId === e.id)
      let fat = 0
      let comissao = 0
      for (const v of dele)
        for (const i of v.itens) {
          const val = (i.preco - i.desconto) * i.qtd
          fat += val
          comissao += (val * (e.comissao[i.categoria] ?? 0)) / 100
        }
      return { membro: e, fat, vendas: dele.length, comissao }
    })
    .filter((x) => x.vendas > 0 || x.membro.metaMes > 0)
    .sort((a, b) => b.fat - a.fat)
}

export type FormaResumo = 'pix' | 'credito' | 'debito' | 'dinheiro' | 'misto'
export const NOME_FORMA_RESUMO: Record<FormaResumo, string> = { pix: 'Pix', credito: 'Cartão de crédito', debito: 'Débito', dinheiro: 'Dinheiro', misto: 'Mais de uma forma' }
export const formaDaVenda = (v: Venda): FormaResumo => (v.pagamentos.length > 1 || v.troca > 0 ? 'misto' : (v.pagamentos[0]?.forma ?? 'pix'))

/** Faturamento por forma de pagamento (venda com troca ou duas formas conta como "misto"). */
export function porForma(vendas: Venda[]) {
  const t: Record<FormaResumo, number> = { pix: 0, credito: 0, debito: 0, dinheiro: 0, misto: 0 }
  for (const v of vendas) t[formaDaVenda(v)] += faturamentoVenda(v)
  return t
}

export const iniciais = (nome: string) =>
  nome
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
