/** Avisos do sino: calculados na hora a partir dos dados (nada é guardado). */
import { useMemo } from 'react'
import { hoje, pode, useDados, type Sessao } from '../../data/store'
import { somaDias } from './periodo'

export type Aviso = { id: string; tipo: 'sai' | 'ate' | 'ent' | 'inf'; titulo: string; texto: string; link: string }

const brl = (v: number) => 'R$ ' + v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })

export function useAvisos(s: Sessao): Aviso[] {
  const contas = useDados('contas')
  const pedidos = useDados('pedidos')
  const orcamentos = useDados('orcamentos')
  const insumos = useDados('insumos')
  const clientes = useDados('clientes')
  return useMemo(() => {
    const h = hoje()
    const l: Aviso[] = []
    if (pode(s, 'despesas')) {
      for (const c of contas.filter((c) => c.tipo === 'pagar' && !c.pagaEm && c.vencimento < h))
        l.push({ id: 'atr-' + c.id, tipo: 'sai', titulo: `${c.descricao} atrasada`, texto: `${brl(c.valor)}, venceu dia ${Number(c.vencimento.slice(8))}/${c.vencimento.slice(5, 7)}.`, link: 'despesas' })
      const semana = contas.filter((c) => c.tipo === 'pagar' && !c.pagaEm && c.vencimento >= h && c.vencimento <= somaDias(h, 7))
      if (semana.length)
        l.push({ id: 'sem', tipo: 'ate', titulo: `${semana.length} ${semana.length === 1 ? 'conta vence' : 'contas vencem'} nesta semana`, texto: `${brl(semana.reduce((t, c) => t + c.valor, 0))} no total.`, link: 'despesas' })
    }
    const prontos = pedidos.filter((o) => o.status === 'pronto' && !o.avisados?.includes('pronto'))
    if (prontos.length)
      l.push({ id: 'pronto', tipo: 'ent', titulo: `${prontos.length} ${prontos.length === 1 ? 'pedido pronto' : 'pedidos prontos'} sem aviso`, texto: 'Avise o cliente pelo WhatsApp para buscar.', link: 'pedidos' })
    const atrasados = pedidos.filter((o) => o.status !== 'entregue' && o.status !== 'pronto' && o.prazo < h)
    if (atrasados.length)
      l.push({ id: 'atr-ped', tipo: 'sai', titulo: `${atrasados.length} ${atrasados.length === 1 ? 'pedido atrasado' : 'pedidos atrasados'}`, texto: atrasados.slice(0, 3).map((o) => `nº ${o.numero}`).join(', ') + '.', link: 'producao' })
    const vencemHoje = pedidos.filter((o) => o.status !== 'entregue' && o.status !== 'pronto' && o.prazo === h)
    if (vencemHoje.length)
      l.push({ id: 'hoje-ped', tipo: 'ate', titulo: `${vencemHoje.length} ${vencemHoje.length === 1 ? 'pedido vence' : 'pedidos vencem'} hoje`, texto: 'Prioridade na fila de produção.', link: 'producao' })
    const novos = orcamentos.filter((o) => o.status === 'novo')
    if (novos.length)
      l.push({ id: 'orc', tipo: 'inf', titulo: `${novos.length} ${novos.length === 1 ? 'orçamento para responder' : 'orçamentos para responder'}`, texto: 'Quem responde primeiro fecha.', link: 'orcamentos' })
    const faltando = insumos.filter((x) => x.estoque < x.minimo)
    if (faltando.length)
      l.push({ id: 'ins', tipo: 'ate', titulo: `${faltando.length} ${faltando.length === 1 ? 'material acabando' : 'materiais acabando'}`, texto: faltando.slice(0, 3).map((x) => x.nome).join(', ') + '.', link: 'insumos' })
    const mmdd = new Set(Array.from({ length: 7 }, (_, i) => somaDias(h, i).slice(5)))
    const aniv = clientes.filter((c) => c.aniversario && mmdd.has(c.aniversario))
    if (aniv.length)
      l.push({ id: 'aniv', tipo: 'inf', titulo: `${aniv.length} ${aniv.length === 1 ? 'cliente faz' : 'clientes fazem'} aniversário nesta semana`, texto: aniv.slice(0, 2).map((c) => c.nome).join(' e ') + '.', link: 'clientes' })
    return l
  }, [s, contas, pedidos, orcamentos, insumos, clientes])
}
