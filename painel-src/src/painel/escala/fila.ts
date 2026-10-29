/**
 * FILA DE MENSAGENS DO DIA
 * ========================
 * Todo dia o sistema monta sozinho quem chamar no WhatsApp, com o texto pronto:
 * pedido pronto há 2+ dias e ainda não retirado, orçamento respondido sem retorno do cliente,
 * agradecimento no dia seguinte à entrega (com pedido de avaliação), aniversário e a recompra do ano
 * (quem fez uniforme, camisa de evento ou calendário há uns 11 meses). Um toque envia; a mensagem sai da fila.
 * Na demonstração cada uma abre o WhatsApp; na versão final, o envio pode ser automático.
 */
import { useMemo } from 'react'
import { hoje, pode, useDados, type Sessao } from '../../data/store'
import { itensFrase, totalPedido } from '../../data/negocio'
import { LOJA } from '../../lib/config'
import { somaDias } from './periodo'

export type TipoMsg = 'retirar' | 'orcamento' | 'obrigado' | 'aniversario' | 'recompra'
export type MsgFila = { id: string; tipo: TipoMsg; titulo: string; sub: string; texto: string; telefone: string; clienteId?: string }

export const NOME_TIPO: Record<TipoMsg, string> = { retirar: 'Pedido esperando retirada', orcamento: 'Orçamento sem resposta', obrigado: 'Agradecer o pedido', aniversario: 'Aniversário', recompra: 'Pedido do ano passado' }
/** Link de avaliação no Google (na versão final, o da gráfica). */
export const LINK_AVALIACAO = 'https://g.page/r/graficaestamp/review'

const dataBr = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`
const brl = (v: number) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function useFila(s: Sessao): MsgFila[] {
  const pedidos = useDados('pedidos')
  const orcamentos = useDados('orcamentos')
  const clientes = useDados('clientes')
  const enviadas = useDados('enviadas')
  const { produtos } = useDados('catalogo')
  return useMemo(() => {
    if (!pode(s, 'vendas')) return []
    const h = hoje()
    const ontem = somaDias(h, -1)
    const loja = LOJA.nome || 'Gráfica Estamp'
    const cli = new Map(clientes.map((c) => [c.id, c]))
    const primeiro = (n: string) => n.split(' ')[0]
    const oQue = itensFrase
    const l: MsgFila[] = []

    // Pedido pronto há 2 dias ou mais e o cliente ainda não buscou.
    for (const o of pedidos) {
      if (o.status !== 'pronto') continue
      const quando = [...o.historico].reverse().find((x) => x.status === 'pronto')?.quando ?? o.criadoEm
      const c = cli.get(o.clienteId)
      if (!c || quando > somaDias(h, -2)) continue
      const falta = totalPedido(o) - o.sinal
      l.push({
        id: `ret-${o.id}-${h}`,
        tipo: 'retirar',
        titulo: c.nome,
        sub: `Pedido ${o.numero} pronto desde ${dataBr(quando)}`,
        telefone: c.telefone,
        clienteId: c.id,
        texto: `Oi, ${primeiro(c.nome)}! Aqui é da ${loja}. Seu pedido nº ${o.numero} (${oQue(o)}) está pronto esperando você desde ${dataBr(quando)}.${falta > 0 ? ` Falta ${brl(falta)}, pode pagar na retirada.` : ''} Funcionamos de segunda a sexta, das 7h30 às 17h30, e sábado até 11h30.`,
      })
    }

    // Orçamento respondido há 2 dias ou mais, sem retorno.
    for (const o of orcamentos)
      if (o.status === 'respondido' && o.data.slice(0, 10) <= somaDias(h, -2) && o.data.slice(0, 10) >= somaDias(h, -15)) {
        const p = produtos.find((y) => y.id === o.produtoId)
        l.push({
          id: 'orc-' + o.id,
          tipo: 'orcamento',
          titulo: o.nome,
          sub: `Orçamento ${o.numero}${p ? ` de ${p.nome.toLowerCase()}` : ''} de ${dataBr(o.data)}`,
          telefone: o.telefone,
          clienteId: o.clienteId,
          texto: `Oi, ${primeiro(o.nome)}! Aqui é da ${loja}. Passando para saber se deu para ver o orçamento nº ${o.numero}${o.valor ? ` (${brl(o.valor)})` : ''}. Se quiser ajustar quantidade ou modelo, a gente refaz na hora. Podemos seguir?`,
        })
      }

    // Agradecimento no dia seguinte à entrega, com o pedido de avaliação.
    for (const o of pedidos)
      if (o.entregueEm === ontem && cli.has(o.clienteId)) {
        const c = cli.get(o.clienteId)!
        l.push({
          id: 'obr-' + o.id,
          tipo: 'obrigado',
          titulo: c.nome,
          sub: `Retirou ontem: ${oQue(o)}`,
          telefone: c.telefone,
          clienteId: c.id,
          texto: `Oi, ${primeiro(c.nome)}! Aqui é da ${loja}. Obrigado pelo pedido! Ficou do jeito que você queria? Se puder, conta como foi no Google, ajuda muito a gráfica: ${LINK_AVALIACAO}`,
        })
      }

    // Aniversário hoje.
    for (const c of clientes)
      if (c.aniversario === h.slice(5))
        l.push({ id: `ani-${c.id}-${h.slice(0, 4)}`, tipo: 'aniversario', titulo: c.nome, sub: 'Faz aniversário hoje', telefone: c.telefone, clienteId: c.id, texto: `Feliz aniversário, ${primeiro(c.nome)}! 🎉 A ${loja} preparou um presente: 10% de desconto em canecas e camisas personalizadas até o fim do mês.` })

    // Recompra do ano: uniforme, camisa de evento, calendário e agenda se repetem todo ano.
    const anoPassado = somaDias(h, -335)
    for (const o of pedidos)
      if (o.entregueEm && o.entregueEm >= somaDias(anoPassado, -2) && o.entregueEm <= anoPassado && cli.has(o.clienteId)) {
        const c = cli.get(o.clienteId)!
        l.push({
          id: 'rec-' + o.id,
          tipo: 'recompra',
          titulo: c.nome,
          sub: `Há 11 meses: ${oQue(o)}`,
          telefone: c.telefone,
          clienteId: c.id,
          texto: `Oi, ${primeiro(c.nome)}! Aqui é da ${loja}. Faz quase um ano que fizemos ${oQue(o)} para você. Vai repetir este ano? Já temos a arte guardada, é só confirmar quantidade e tamanhos.`,
        })
      }

    const ordem: TipoMsg[] = ['retirar', 'orcamento', 'obrigado', 'aniversario', 'recompra']
    return l.filter((m) => !enviadas[m.id]).sort((a, b) => ordem.indexOf(a.tipo) - ordem.indexOf(b.tipo))
  }, [s, pedidos, orcamentos, clientes, enviadas, produtos])
}
