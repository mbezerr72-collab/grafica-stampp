/**
 * Comandos rápidos da busca (Ctrl+K) e do Assistente:
 *   "vender xerox para Juliana no Pix", "novo pedido para Juliana", "reajustar camisas 5%".
 * O comando vira um pedido: a tela abre preenchida e a pessoa só confirma.
 */
import { dados, pode, type Sessao } from '../../data/store'
import type { FormaPag } from '../../data/negocio'
import { NOME_MARCA, type Marca } from '../../data/produtos'
import type { Pedido } from './pedido'

const norm = (s: string) => ' ' + s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ') + ' '

export type Comando = { titulo: string; detalhes: string[]; pedido: Pedido }

export function interpretarComando(texto: string, s: Sessao): Comando | null {
  const q = norm(texto)
  const { produtos } = dados.ler('catalogo')

  // ── Vender ──
  if (/ (vender|venda|vende) /.test(q)) {
    const p = [...produtos].filter((x) => x.ativo).sort((a, b) => b.nome.length - a.nome.length).find((x) => q.includes(norm(x.nome).trim()))
    if (!p || !pode(s, 'vendas')) return null
    const cor = p.cores.find((c) => q.includes(' ' + norm(c.nome).trim()))?.nome
    const forma: FormaPag | undefined = q.includes(' pix ') ? 'pix' : /debito/.test(q) ? 'debito' : /credito|cartao|\d+ ?x /.test(q) ? 'credito' : /dinheiro|especie/.test(q) ? 'dinheiro' : undefined
    const parcelas = Number(q.match(/ (\d{1,2}) ?x /)?.[1] ?? 0) || undefined
    const nome = q.match(/ (?:para|pra|pro) (?:a |o )?([a-z]+(?: [a-z]+)?)/)?.[1]
    const clientes = dados.ler('clientes')
    const cli = nome ? clientes.find((c) => norm(c.nome).includes(' ' + nome + ' ')) ?? clientes.find((c) => norm(c.nome).includes(' ' + nome.split(' ')[0] + ' ')) : undefined
    return {
      titulo: `Vender ${p.nome}${cor ? ' (' + cor + ')' : ''}`,
      detalhes: [cli ? `Cliente: ${cli.nome}` : nome ? `Cliente “${nome}” não achado: escolha na tela de vender` : 'Sem cliente', forma ? `Pagamento: ${forma === 'credito' ? `crédito${parcelas ? ' ' + parcelas + 'x' : ''}` : forma}` : 'Pagamento: escolha na tela de vender'],
      pedido: { tela: 'pdv', produtoId: p.id, cor, clienteId: cli?.id, forma, parcelas },
    }
  }

  // ── Novo pedido ──
  if (/ (novo|abrir|abre|nova) (pedido|encomenda)/.test(q)) {
    if (!pode(s, 'vendas')) return null
    const nome = q.match(/ (?:para|pra|pro|do|da) (?:a |o )?([a-z]+(?: [a-z]+)?)/)?.[1]
    const clientes = dados.ler('clientes')
    const cli = nome ? clientes.find((c) => norm(c.nome).includes(' ' + nome + ' ')) ?? clientes.find((c) => norm(c.nome).includes(' ' + nome.split(' ')[0] + ' ')) : undefined
    return {
      titulo: `Novo pedido${cli ? ' para ' + cli.nome : ''}`,
      detalhes: [cli ? `Cliente: ${cli.nome}` : 'Cliente: escolha no pedido', 'Produto, quantidade e grade de tamanhos você escolhe no pedido.'],
      pedido: { tela: 'pedidos', nova: true, clienteId: cli?.id },
    }
  }

  // ── Reajustar ──
  const pct = q.match(/(-?\d+(?:[.,]\d+)?) ?%/)
  if (pct && /reajust|aument|subir|baixar|diminu/.test(q) && pode(s, 'configuracoes')) {
    let n = Number(pct[1].replace(',', '.'))
    if (/baixar|diminu/.test(q) && n > 0) n = -n
    const marca: Marca | 'todos' = /camis|uniform|abada/.test(q) ? 'camisas' : /impress|xerox|cartao|panflet|adesiv/.test(q) ? 'impressos' : /brinde|caneca|chaveiro|trofeu/.test(q) ? 'brindes' : /banner|lona|placa|fachada/.test(q) ? 'comunicacao' : /arte|logo|design/.test(q) ? 'design' : 'todos'
    const nome = marca === 'todos' ? 'todos os produtos' : NOME_MARCA[marca].toLowerCase()
    return {
      titulo: `Reajustar ${nome} em ${n > 0 ? '+' : ''}${n}%`,
      detalhes: ['Abre a lista de preços em Produtos com os novos valores para conferir.', 'Nada muda até você salvar.'],
      pedido: { tela: 'produtos', reajuste: { marca, pct: n } },
    }
  }
  return null
}
