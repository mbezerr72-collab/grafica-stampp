/**
 * Relatórios que moram na própria aba (cada uma tem o botão "Baixar PDF/Excel"):
 * Equipe (por vendedor), Contas e despesas (por categoria), Insumos e Pedidos.
 */
import { hoje, type Cliente, type Despesa, type Membro, type Venda } from '../../data/store'
import { itensFrase, NOME_GRUPO_INSUMO, NOMES_STATUS_PEDIDO, totalPedido, type Fornecedor, type Insumo, type Pedido } from '../../data/negocio'
import { NOME_SETOR } from '../../data/produtos'
import { porVendedor } from './numeros'
import { diasEntre } from './periodo'
import type { Relatorio } from './exportar'

const CAT: Record<string, string> = { estoque: 'Compra de material', aluguel: 'Aluguel', anuncios: 'Anúncios', salarios: 'Salários', contas: 'Contas (luz, internet, sistema)', outros: 'Outros' }

export function relVendedores(doPer: Venda[], equipe: Membro[], dias: number, sub: string): Relatorio {
  const l = porVendedor(doPer, equipe).map((x) => {
    const meta = x.membro.metaMes * (dias / 30)
    return [x.membro.nome, x.vendas, x.fat, x.vendas ? x.fat / x.vendas : 0, meta, meta ? x.fat / meta : 0, x.comissao]
  })
  return {
    titulo: 'Vendas por vendedor',
    sub,
    colunas: [
      { nome: 'Vendedor', tipo: 'texto' },
      { nome: 'Vendas', tipo: 'numero' },
      { nome: 'Vendido', tipo: 'dinheiro' },
      { nome: 'Valor médio por venda', tipo: 'dinheiro' },
      { nome: 'Meta do período', tipo: 'dinheiro' },
      { nome: 'Da meta', tipo: 'pct' },
      { nome: 'Comissão', tipo: 'dinheiro' },
    ],
    linhas: l,
    total: ['Total', l.reduce((t, x) => t + (x[1] as number), 0), l.reduce((t, x) => t + (x[2] as number), 0), '', l.reduce((t, x) => t + (x[4] as number), 0), '', l.reduce((t, x) => t + (x[6] as number), 0)],
  }
}

export function relDespesas(despesas: Despesa[], de: string, ate: string, sub: string): Relatorio {
  const dp = despesas.filter((d) => d.data >= de && d.data <= ate)
  const cats = [...new Set(dp.map((d) => d.categoria))]
  const tot = dp.reduce((t, d) => t + d.valor, 0)
  return {
    titulo: 'Despesas por categoria',
    sub: sub + ' Compra de material aparece separada: ela não entra no lucro.',
    colunas: [
      { nome: 'Categoria', tipo: 'texto' },
      { nome: 'Lançamentos', tipo: 'numero' },
      { nome: 'Valor', tipo: 'dinheiro' },
      { nome: 'Do total', tipo: 'pct' },
    ],
    linhas: cats.map((c) => {
      const v = dp.filter((d) => d.categoria === c)
      const s = v.reduce((t, d) => t + d.valor, 0)
      return [CAT[c] ?? c, v.length, s, tot ? s / tot : 0]
    }),
    total: ['Total', dp.length, tot, 1],
  }
}

export function relInsumos(insumos: Insumo[], fornecedores: Fornecedor[], dono: boolean): Relatorio {
  const l = [...insumos].sort((a, b) => a.grupo.localeCompare(b.grupo) || a.nome.localeCompare(b.nome))
  return {
    titulo: 'Material em estoque',
    sub: `Posição de hoje, ${hoje().split('-').reverse().join('/')}.`,
    colunas: [
      { nome: 'Material', tipo: 'texto' },
      { nome: 'Grupo', tipo: 'texto' },
      { nome: 'Estoque', tipo: 'numero' },
      { nome: 'Avisar com', tipo: 'numero' },
      ...(dono ? [{ nome: 'Valor em estoque', tipo: 'dinheiro' as const }] : []),
      { nome: 'Fornecedor', tipo: 'texto' },
      { nome: 'Situação', tipo: 'texto' },
    ],
    linhas: l.map((x) => [`${x.nome} (${x.unidade})`, NOME_GRUPO_INSUMO[x.grupo], x.estoque, x.minimo, ...(dono ? [x.estoque * x.custo] : []), fornecedores.find((f) => f.id === x.fornecedorId)?.nome ?? '—', x.estoque <= 0 ? 'acabou' : x.estoque < x.minimo ? 'comprar' : 'ok']),
  }
}

export function relPedidos(pedidos: Pedido[], clientes: Cliente[], de: string, ate: string, sub: string): Relatorio {
  const l = pedidos.filter((o) => o.criadoEm >= de && o.criadoEm <= ate).sort((a, b) => b.numero - a.numero)
  return {
    titulo: 'Pedidos',
    sub,
    colunas: [
      { nome: 'Pedido', tipo: 'texto' },
      { nome: 'Aberto', tipo: 'texto' },
      { nome: 'Cliente e produto', tipo: 'texto' },
      { nome: 'Setor', tipo: 'texto' },
      { nome: 'Etapa', tipo: 'texto' },
      { nome: 'Valor', tipo: 'dinheiro' },
      { nome: 'Dias', tipo: 'numero' },
    ],
    linhas: l.map((o) => [
      String(o.numero),
      o.criadoEm.split('-').reverse().join('/'),
      `${clientes.find((c) => c.id === o.clienteId)?.nome ?? ''}, ${itensFrase(o)}`,
      NOME_SETOR[o.setor],
      NOMES_STATUS_PEDIDO[o.status],
      totalPedido(o),
      diasEntre(o.criadoEm, o.entregueEm ?? hoje()) - 1,
    ]),
    total: [`${l.length} pedidos`, '', '', '', '', l.reduce((t, o) => t + totalPedido(o), 0), ''],
  }
}
