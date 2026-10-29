import { useMemo, useState } from 'react'
import { negocio, pode, useDados, type Sessao, type Venda } from '../../data/store'
import { custoVenda, faturamentoVenda, NOMES_FORMA, totalVenda } from '../../data/negocio'
import { Icone, Topo, avisar, confirmar } from '../ui'
import { link } from '../rota'
import { intervalo, usePeriodo } from '../escala/periodo'
import { formaDaVenda, NOME_FORMA_RESUMO, resumo } from '../escala/numeros'
import { MiniKpi, brl, pct } from '../escala/componentes'
import { Gaveta } from '../escala/Gaveta'
import { linkWhats, mensagemVenda, reciboPdf } from '../escala/documentos'

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const STATUS = { concluida: ['Concluída', 'ent'], cancelada: ['Cancelada', 'neu'], devolvida: ['Devolvida', 'sai'] } as const

/** Vendas do período: busca, detalhe com recibo e garantia, cancelar ou registrar devolução. */
export default function Vendas({ s }: { s: Sessao }) {
  const p = usePeriodo()
  const iv = intervalo(p)
  const vendas = useDados('vendas')
  const despesas = useDados('despesas')
  const clientes = useDados('clientes')
  const equipe = useDados('equipe')
  const [busca, setBusca] = useState('')
  const [vend, setVend] = useState('')
  const [aberta, setAberta] = useState<string>()
  const [mostrar, setMostrar] = useState(40)
  const dono = pode(s, 'custo')

  const doPeriodo = useMemo(() => vendas.filter((v) => v.data.slice(0, 10) >= iv.de && v.data.slice(0, 10) <= iv.ate).reverse(), [vendas, iv.de, iv.ate])
  const lista = useMemo(() => {
    const q = semAcento(busca.trim())
    return doPeriodo.filter((v) => {
      if (vend && v.vendedorId !== vend) return false
      if (!q) return true
      const cli = clientes.find((c) => c.id === v.clienteId)
      const txt = `${v.numero} ${cli?.nome ?? ''} ${cli?.telefone ?? ''} ${v.itens.map((i) => i.nome + ' ' + i.cor).join(' ')}`
      return semAcento(txt).includes(q)
    })
  }, [doPeriodo, busca, vend, clientes])
  const r = resumo(vendas, despesas, iv.de, iv.ate)
  const desfeitas = doPeriodo.filter((v) => v.status !== 'concluida').length
  const nomeVend = (id: string) => equipe.find((e) => e.id === id)?.nome ?? ''
  const venda = vendas.find((v) => v.id === aberta)

  return (
    <>
      <Topo titulo="Vendas feitas" sub={`${iv.rotulo}. Balcão e pedidos entregues. Toque numa venda para ver o recibo.`}>
        <a className="bt bt-forte acao-principal" href={link('pdv')}>
          <Icone nome="somar" tamanho={18} />
          <span>Venda no balcão</span>
        </a>
      </Topo>
      <section className="kpis-menores" aria-label="Resumo">
        <MiniKpi rotulo="Total vendido" valor={'R$ ' + brl(r.faturamento)} nota={`${r.vendas} vendas concluídas`} />
        <MiniKpi rotulo="Valor médio por venda" valor={'R$ ' + brl(r.ticket)} nota="Por venda" />
        {dono ? <MiniKpi rotulo="Lucro nas vendas" valor={'R$ ' + brl(r.faturamento - r.custo)} nota={`${pct(r.margem)} do que vendeu`} /> : <MiniKpi rotulo="Itens" valor={doPeriodo.reduce((t, v) => t + v.itens.length, 0)} nota="Vendidos no período" />}
        <MiniKpi rotulo="Canceladas e devolvidas" valor={desfeitas} nota={desfeitas ? 'Já saíram das vendas' : 'Nenhuma no período'} />
      </section>

      <section className="painel">
        <div className="filtros-linha">
          <label className="entrada entrada--p">
            <Icone nome="busca" tamanho={18} />
            <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Número, cliente ou produto" aria-label="Buscar venda" />
          </label>
          <select value={vend} onChange={(e) => setVend(e.target.value)} aria-label="Atendente">
            <option value="">Todos os atendentes</option>
            {equipe
              .filter((e) => e.papel === 'dono' || e.papel === 'atendimento')
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
          </select>
        </div>
        <p className="contagem">
          {lista.length} {lista.length === 1 ? 'venda' : 'vendas'}
        </p>
        {lista.length ? (
          <ul className="lista-vendas">
            {lista.slice(0, mostrar).map((v) => {
              const cli = clientes.find((c) => c.id === v.clienteId)
              const dia = v.data.slice(0, 10)
              const forma = formaDaVenda(v)
              return (
                <li key={v.id}>
                  <button type="button" className={'lv' + (v.status !== 'concluida' ? ' lv--desfeita' : '')} onClick={() => setAberta(v.id)}>
                    <span className="lv-quando">
                      <b>{v.numero}</b>
                      <small>
                        {SEMANA[new Date(dia + 'T12:00:00Z').getUTCDay()]} {dia.slice(8)}/{dia.slice(5, 7)} {v.data.slice(11, 16)}
                      </small>
                    </span>
                    <span className="lv-txt">
                      <b>
                        {v.pedidoId ? 'Pedido: ' : ''}
                        {v.itens[0].qtd > 1 ? `${v.itens[0].qtd} × ` : ''}
                        {v.itens[0].nome}
                        {v.itens.length > 1 ? ` e mais ${v.itens.length - 1}` : ''}
                      </b>
                      <small>
                        {nomeVend(v.vendedorId).split(' ')[0]}, {cli ? cli.nome : 'cliente sem cadastro'}
                      </small>
                    </span>
                    <span className="lv-pag">
                      <span className={'pill ' + (v.status === 'concluida' ? ({ pix: 'teal', credito: 'neu', debito: 'inf', dinheiro: 'ent', misto: 'ate' } as const)[forma] : STATUS[v.status][1])}>
                        {v.status === 'concluida' ? (forma === 'credito' ? `Crédito ${v.pagamentos[0].parcelas ?? 1}x` : NOME_FORMA_RESUMO[forma]) : STATUS[v.status][0]}
                      </span>
                    </span>
                    <span className="lv-valor num">R$ {brl(faturamentoVenda(v))}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mut vazio-linha">Nenhuma venda com esse filtro no período.</p>
        )}
        {lista.length > mostrar && (
          <button type="button" className="btn btn-o largo" onClick={() => setMostrar(mostrar + 60)}>
            Mostrar mais {Math.min(60, lista.length - mostrar)}
          </button>
        )}
      </section>

      {venda && <DetalheVenda v={venda} fechar={() => setAberta(undefined)} dono={dono} />}
    </>
  )
}

function DetalheVenda({ v, fechar, dono }: { v: Venda; fechar: () => void; dono: boolean }) {
  const clientes = useDados('clientes')
  const equipe = useDados('equipe')
  const cli = clientes.find((c) => c.id === v.clienteId)
  const vendedor = equipe.find((e) => e.id === v.vendedorId)?.nome ?? ''
  const desfazer = async (status: 'cancelada' | 'devolvida') => {
    const ok = await confirmar({
      titulo: status === 'cancelada' ? `Cancelar a venda nº ${v.numero}?` : `Registrar a devolução da venda nº ${v.numero}?`,
      texto: status === 'cancelada' ? 'O que era de pronta entrega volta ao estoque. A venda sai do total vendido.' : 'O dinheiro volta para o cliente e a venda sai do faturamento.',
      botao: status === 'cancelada' ? 'Cancelar venda' : 'Registrar devolução',
      perigo: true,
    })
    if (!ok) return
    negocio.desfazerVenda(v.id, status)
    avisar(status === 'cancelada' ? `Venda nº ${v.numero} cancelada.` : `Devolução da venda nº ${v.numero} registrada.`)
  }
  return (
    <Gaveta
      titulo={`Venda nº ${v.numero}`}
      sub={`${v.data.slice(8, 10)}/${v.data.slice(5, 7)}/${v.data.slice(0, 4)} às ${v.data.slice(11, 16)}, por ${vendedor}`}
      fechar={fechar}
      pe={
        <>
          <button type="button" className="btn btn-o" onClick={() => reciboPdf(v, cli, vendedor)}>
            <Icone nome="relatorio" tamanho={18} />
            Recibo para imprimir
          </button>
          <a className="btn btn-p" href={linkWhats(cli?.telefone, mensagemVenda(v, cli))} target="_blank" rel="noopener">
            <Icone nome="whats" tamanho={18} />
            WhatsApp
          </a>
        </>
      }
    >
      {v.status !== 'concluida' && <p className="pag-falta sai">Esta venda foi {v.status}. Já saiu do total vendido.</p>}
      <div className="det-bloco">
        <p className="det-rot">Cliente</p>
        <p>{cli ? `${cli.nome}, ${cli.telefone}` : 'Sem cadastro'}</p>
      </div>
      <div className="det-bloco">
        <p className="det-rot">Itens</p>
        <ul className="det-itens">
          {v.itens.map((i, k) => (
            <li key={k}>
              <span>
                <b>
                  {i.qtd > 1 ? `${i.qtd}× ` : ''}
                  {i.nome} ({i.cor})
                </b>
                {dono && <small>Custo R$ {brl(i.custo * i.qtd)}</small>}
              </span>
              <span className="num">R$ {brl((i.preco - i.desconto) * i.qtd)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="det-bloco">
        <p className="det-rot">Pagamento</p>
        <ul className="det-itens">
          {v.pagamentos.map((p, k) => (
            <li key={k}>
              <span>
                {NOMES_FORMA[p.forma]}
                {p.parcelas && p.parcelas > 1 ? ` em ${p.parcelas}x` : ''}
              </span>
              <span className="num">R$ {brl(p.valor)}</span>
            </li>
          ))}
          {v.troca > 0 && (
            <li>
              <span>
                Entrada paga antes
              </span>
              <span className="num">R$ {brl(v.troca)}</span>
            </li>
          )}
          <li className="det-total">
            <span>Total da venda</span>
            <span className="num">R$ {brl(faturamentoVenda(v))}</span>
          </li>
          {dono && (
            <li>
              <span className="mut">Lucro</span>
              <span className="num mut">R$ {brl(faturamentoVenda(v) - custoVenda(v))}</span>
            </li>
          )}
          {totalVenda(v) !== faturamentoVenda(v) && (
            <li>
              <span className="mut">Pago nesta venda</span>
              <span className="num mut">R$ {brl(totalVenda(v))}</span>
            </li>
          )}
        </ul>
      </div>
      {v.pedidoId && (
        <div className="det-bloco">
          <p className="det-rot">Pedido</p>
          <p>Esta venda é a entrega de um pedido. O cliente conferiu o material na retirada.</p>
        </div>
      )}
      {v.status === 'concluida' && dono && (
        <div className="det-desfazer">
          <button type="button" className="bt bt-perigo-leve" onClick={() => desfazer('devolvida')}>
            Registrar devolução
          </button>
          <button type="button" className="bt bt-perigo-leve" onClick={() => desfazer('cancelada')}>
            Cancelar venda
          </button>
        </div>
      )}
    </Gaveta>
  )
}
