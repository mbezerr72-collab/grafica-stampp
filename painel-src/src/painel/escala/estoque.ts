/**
 * Análise dos produtos: giro, curva ABC e sugestão de reposição (só do que tem estoque controlado).
 *  - Giro: unidades vendidas nos últimos 30 dias ÷ estoque médio (aproximado pelo estoque de hoje + o vendido).
 *  - Vende em: quantos dias o estoque de hoje dura no ritmo dos últimos 30 dias.
 *  - Curva ABC: os produtos que somam 80% do faturamento dos últimos 90 dias são A; até 95%, B; o resto, C.
 *  - Reposição: o que acaba em menos de 14 dias, para cobrir 21 dias de venda.
 */
import type { Fornecedor, Venda } from '../../data/store'
import { estoqueTotal, type PProduto } from '../../data/modelo'
import { somaDias } from './periodo'

export type Curva = 'A' | 'B' | 'C'
export type LinhaEstoque = {
  p: PProduto
  estoque: number
  vendidos30: number
  fat90: number
  custoEstoque: number
  vendeEm: number | null
  giro: number
  curva: Curva
  margem: number
  minPix: number
  parados: number
}
export type Sugestao = { p: PProduto; cor: string; gb: number; estoque: number; sugerido: number; custo: number; fornecedorId: string }

export const fornecedorPadrao = (p: PProduto) => (p.marca === 'camisas' ? 'for-camisas' : p.marca === 'brindes' ? 'for-brindes' : 'for-papel')

export function analisar(produtos: PProduto[], vendas: Venda[], hoje: string) {
  const d30 = somaDias(hoje, -29)
  const d90 = somaDias(hoje, -89)
  const un30 = new Map<string, number>()
  const unVar30 = new Map<string, number>()
  const fat90 = new Map<string, number>()
  for (const v of vendas) {
    if (v.status !== 'concluida') continue
    const d = v.data.slice(0, 10)
    if (d < d90) continue
    for (const i of v.itens) {
      fat90.set(i.produtoId, (fat90.get(i.produtoId) ?? 0) + (i.preco - i.desconto) * i.qtd)
      if (d >= d30) {
        un30.set(i.produtoId, (un30.get(i.produtoId) ?? 0) + i.qtd)
        const k = `${i.produtoId}|${i.cor}|${i.gb}`
        unVar30.set(k, (unVar30.get(k) ?? 0) + i.qtd)
      }
    }
  }
  // Curva ABC pelo faturamento de 90 dias.
  const ordem = [...produtos].sort((a, b) => (fat90.get(b.id) ?? 0) - (fat90.get(a.id) ?? 0))
  const totalFat = ordem.reduce((t, p) => t + (fat90.get(p.id) ?? 0), 0) || 1
  const curva = new Map<string, Curva>()
  let acc = 0
  for (const p of ordem) {
    const f = fat90.get(p.id) ?? 0
    curva.set(p.id, f && acc / totalFat < 0.8 ? 'A' : f && acc / totalFat < 0.95 ? 'B' : 'C')
    acc += f
  }
  const linhas: LinhaEstoque[] = produtos.map((p) => {
    const estoque = p.controlaEstoque ? estoqueTotal(p) : 0
    const v30 = un30.get(p.id) ?? 0
    const vendaPix = p.variacoes.filter((v) => v.estoque > 0).map((v) => v.pix)
    const custoEstoque = p.variacoes.reduce((t, v) => t + v.custo * v.estoque, 0)
    const pixEstoque = p.variacoes.reduce((t, v) => t + v.pix * v.estoque, 0)
    return {
      p,
      estoque,
      vendidos30: v30,
      fat90: fat90.get(p.id) ?? 0,
      custoEstoque,
      vendeEm: v30 ? Math.round(estoque / (v30 / 30)) : null,
      giro: v30 / Math.max(1, estoque + v30 / 2),
      curva: curva.get(p.id) ?? 'C',
      margem: pixEstoque ? (pixEstoque - custoEstoque) / pixEstoque : p.variacoes[0] ? (p.variacoes[0].pix - p.variacoes[0].custo) / (p.variacoes[0].pix || 1) : 0,
      minPix: vendaPix.length ? Math.min(...vendaPix) : Math.min(...p.variacoes.map((v) => v.pix)),
      parados: 0,
    }
  })
  // Reposição por variação.
  const sugestoes: Sugestao[] = []
  for (const p of produtos) {
    if (!p.ativo || !p.controlaEstoque) continue
    for (const v of p.variacoes) {
      const vendidos = unVar30.get(`${p.id}|${v.cor}|${v.gb}`) ?? 0
      if (!vendidos) continue
      const porDia = vendidos / 30
      if (v.estoque / porDia >= 14) continue
      const sugerido = Math.max(1, Math.ceil(porDia * 21 - v.estoque))
      sugestoes.push({ p, cor: v.cor, gb: v.gb, estoque: v.estoque, sugerido, custo: v.custo, fornecedorId: fornecedorPadrao(p) })
    }
  }
  return { linhas, sugestoes }
}

export const nomeFornecedor = (fs: Fornecedor[], id?: string) => fs.find((f) => f.id === id)?.nome ?? '—'
