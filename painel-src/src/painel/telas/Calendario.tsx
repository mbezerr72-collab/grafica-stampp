import { useMemo, useState, type CSSProperties } from 'react'
import { hoje, useDados, type Sessao } from '../../data/store'
import { custoVenda, faturamentoVenda } from '../../data/negocio'
import { Icone, Topo } from '../ui'
import { link } from '../rota'
import { pedir } from '../escala/pedido'
import { cadaDia, diasEntre, nomeMes, somaDias } from '../escala/periodo'
import { formaDaVenda, NOME_FORMA_RESUMO, variacao } from '../escala/numeros'
import { MiniKpi, brl, pct } from '../escala/componentes'

const SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const SEMANA_LONGA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const curto = (v: number) => (Math.abs(v) >= 10000 ? `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil` : Math.abs(v) >= 1000 ? `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : brl(v))

type Dia = { dia: string; fat: number; lucro: number; vendas: number; despesas: number; pagar: number; atrasada: boolean; aVencer: boolean; pago: boolean }

/** Calendário do mês: cada dia com o faturamento e a cor do resultado, e o detalhe do dia escolhido. */
export default function Calendario(_: { s: Sessao }) {
  const h = hoje()
  const [mes, setMes] = useState(h.slice(0, 7))
  const [sel, setSel] = useState(h)
  const vendas = useDados('vendas')
  const despesas = useDados('despesas')
  const contas = useDados('contas')
  const equipe = useDados('equipe')

  const de = mes + '-01'
  const ate = somaDias(somaDias(de, 32).slice(0, 7) + '-01', -1)

  const { dias, porDia } = useMemo(() => {
    const porDia = new Map<string, Dia>()
    for (const d of cadaDia(somaDias(de, -40), somaDias(ate, 40))) porDia.set(d, { dia: d, fat: 0, lucro: 0, vendas: 0, despesas: 0, pagar: 0, atrasada: false, aVencer: false, pago: false })
    for (const v of vendas) {
      const x = porDia.get(v.data.slice(0, 10))
      if (!x || v.status !== 'concluida') continue
      const f = faturamentoVenda(v)
      x.fat += f
      x.lucro += f - custoVenda(v)
      x.vendas++
    }
    for (const d of despesas) {
      const x = porDia.get(d.data)
      if (!x) continue
      x.pago = true
      if (d.categoria !== 'estoque') {
        x.despesas += d.valor
        x.lucro -= d.valor
      }
    }
    for (const c of contas) {
      const x = porDia.get(c.vencimento)
      if (!x || c.pagaEm || c.tipo !== 'pagar') continue
      x.pagar += c.valor
      if (c.vencimento < h) x.atrasada = true
      else x.aVencer = true
    }
    return { dias: cadaDia(de, ate).map((d) => porDia.get(d)!), porDia }
  }, [vendas, despesas, contas, de, ate, h])

  // Totais do mês e comparação com o mês anterior no mesmo ponto.
  const passados = dias.filter((d) => d.dia <= h)
  const fat = passados.reduce((t, d) => t + d.fat, 0)
  const lucro = passados.reduce((t, d) => t + d.lucro, 0)
  const antDe = somaDias(de, -1).slice(0, 7) + '-01'
  const fatAnt = cadaDia(antDe, somaDias(antDe, Math.max(0, passados.length - 1))).reduce((t, d) => t + (porDia.get(d)?.fat ?? 0), 0)
  const comLucro = passados.filter((d) => d.vendas && d.lucro > 0).length
  const noVermelho = passados.filter((d) => d.lucro < 0).length
  const melhor = passados.reduce((m, d) => (d.fat > m.fat ? d : m), passados[0] ?? dias[0])
  const aPagar = contas.filter((c) => c.tipo === 'pagar' && !c.pagaEm && c.vencimento <= ate && c.vencimento >= de).reduce((t, c) => t + c.valor, 0)
  const maxAbs = Math.max(1, ...passados.map((d) => Math.abs(d.lucro)))
  const vazios = (new Date(de + 'T12:00:00Z').getUTCDay() + 6) % 7
  const diaSel = porDia.get(sel)
  const vendasDia = vendas.filter((v) => v.data.startsWith(sel) && v.status === 'concluida').sort((m, n) => n.data.localeCompare(m.data))
  const despDia = despesas.filter((d) => d.data === sel)
  const nomeVend = (id: string) => equipe.find((e) => e.id === id)?.nome.split(' ')[0] ?? ''
  const mudarMes = (n: number) => {
    const novo = somaDias(de, n > 0 ? 32 : -1).slice(0, 7)
    setMes(novo)
    setSel(novo === h.slice(0, 7) ? h : novo + '-01')
  }
  const mostrarSel = (d: string) => `${SEMANA_LONGA[new Date(d + 'T12:00:00Z').getUTCDay()]}, ${Number(d.slice(8))} de ${nomeMes(d)}`

  return (
    <>
      <Topo titulo="Calendário" sub={`${nomeMes(mes)[0].toUpperCase() + nomeMes(mes).slice(1)} de ${mes.slice(0, 4)}. Toque num dia para ver o detalhe.`}>
        <div className="cal-nav">
          <button type="button" className="icone-bt" aria-label="Mês anterior" onClick={() => mudarMes(-1)}>
            <Icone nome="voltar" />
          </button>
          <button type="button" className="icone-bt" aria-label="Próximo mês" onClick={() => mudarMes(1)}>
            <Icone nome="seta" />
          </button>
        </div>
      </Topo>

      <section className="kpis-menores" aria-label="Totais do mês">
        <MiniKpi rotulo="Faturamento" valor={'R$ ' + brl(fat)} nota={fatAnt ? `${fat >= fatAnt ? '+' : '−'}${pct(Math.abs(variacao(fat, fatAnt) ?? 0))} que ${nomeMes(antDe)}` : undefined} classe={fat >= fatAnt ? 'sobe' : 'desce'} />
        <MiniKpi rotulo="Lucro" valor={(lucro < 0 ? '−R$ ' : 'R$ ') + brl(Math.abs(lucro))} nota={`${comLucro} dias com lucro, ${noVermelho} no vermelho`} />
        <MiniKpi rotulo="Melhor dia" valor={melhor && melhor.fat ? `${SEMANA_LONGA[new Date(melhor.dia + 'T12:00:00Z').getUTCDay()].slice(0, 3)}, ${Number(melhor.dia.slice(8))}` : '—'} nota={melhor && melhor.fat ? `R$ ${brl(melhor.fat)} em ${melhor.vendas} vendas` : undefined} />
      </section>

      <div className="cal-wrap">
        <section className="painel">
          <div className="semana" aria-hidden="true">
            {SEMANA.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
          <div className="mes" role="group" aria-label={`Dias de ${nomeMes(mes)}`}>
            {Array.from({ length: vazios }, (_, i) => (
              <span key={'v' + i} className="dia vazio" aria-hidden="true" />
            ))}
            {dias.map((d) => {
              const futuro = d.dia > h
              const tem = d.vendas || d.despesas
              const cor = d.lucro >= 0 ? 'var(--ent)' : 'var(--sai)'
              const forca = futuro || !tem ? 0 : 0.06 + (Math.abs(d.lucro) / maxAbs) * 0.2
              const cls = ['dia', d.dia === h && 'hoje', d.dia === sel && 'sel', futuro && 'futuro'].filter(Boolean).join(' ')
              return (
                <button
                  key={d.dia}
                  type="button"
                  className={cls}
                  style={{ '--hc': cor, '--ho': forca } as CSSProperties}
                  aria-pressed={d.dia === sel}
                  aria-label={`${mostrarSel(d.dia)}: ${d.fat ? `R$ ${brl(d.fat)} de faturamento` : 'sem vendas'}${d.pagar ? `, R$ ${brl(d.pagar)} a pagar` : ''}`}
                  onClick={() => setSel(d.dia)}
                >
                  <span className="n">{Number(d.dia.slice(8))}</span>
                  <span className="fat">{d.fat ? curto(d.fat) : futuro ? '' : '0'}</span>
                  {!futuro && tem ? <span className={'res ' + (d.lucro >= 0 ? 'pos' : 'neg')}>{(d.lucro >= 0 ? '+' : '−') + curto(Math.abs(d.lucro))}</span> : null}
                  <span className="marc">
                    {d.vendas > 0 && <i style={{ '--c': 'var(--teal)' } as CSSProperties} />}
                    {d.pago && <i style={{ '--c': 'var(--mut)' } as CSSProperties} />}
                    {d.aVencer && <i className="ab" style={{ '--c': 'var(--ate)' } as CSSProperties} />}
                    {d.atrasada && <i style={{ '--c': 'var(--sai)' } as CSSProperties} />}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="leg-marc">
            <span>
              <i style={{ '--c': 'var(--teal)' } as CSSProperties} />
              Venda
            </span>
            <span>
              <i style={{ '--c': 'var(--mut)' } as CSSProperties} />
              Despesa paga
            </span>
            <span>
              <i className="ab" style={{ '--c': 'var(--ate)' } as CSSProperties} />
              Conta a vencer
            </span>
            <span>
              <i style={{ '--c': 'var(--sai)' } as CSSProperties} />
              Atrasada
            </span>
            <span>Cor do dia: verde deu lucro, vermelho deu prejuízo</span>
          </div>
        </section>

        <section className="painel" aria-live="polite">
          <div className="painel-t">
            <h3>{mostrarSel(sel)}</h3>
            {melhor && sel === melhor.dia && melhor.fat > 0 && <span className="pill ent">melhor dia</span>}
            {sel === h && <span className="pill teal">hoje</span>}
          </div>
          <div className="det-num">
            <div>
              <p>Faturamento</p>
              <b>R$ {brl(diaSel?.fat ?? 0)}</b>
            </div>
            <div>
              <p>Lucro</p>
              <b style={{ color: (diaSel?.lucro ?? 0) >= 0 ? 'var(--ent)' : 'var(--sai)' }}>
                {(diaSel?.lucro ?? 0) < 0 ? '−' : ''}R$ {brl(Math.abs(diaSel?.lucro ?? 0))}
              </b>
            </div>
            <div>
              <p>Vendas</p>
              <b>{diaSel?.vendas ?? 0}</b>
            </div>
            <div>
              <p>Despesas</p>
              <b>R$ {brl(despDia.reduce((t, d) => t + d.valor, 0))}</b>
            </div>
          </div>
          <ul className="agenda agenda--valor">
            {vendasDia.slice(0, 4).map((v) => {
              const it = v.itens[0]
              return (
                <li key={v.id}>
                  <span className="agenda-dia">
                    <b>{v.data.slice(11, 13)}h</b>
                    <small>{nomeVend(v.vendedorId)}</small>
                  </span>
                  <span className="agenda-txt">
                    <strong>
                      {it.qtd > 1 ? `${it.qtd} × ` : ''}
                      {it.nome} ({it.cor})
                      {v.itens.length > 1 ? ` e mais ${v.itens.length - 1}` : ''}
                    </strong>
                    <span>{formaDaVenda(v) === 'credito' ? `Crédito ${v.pagamentos[0].parcelas ?? 1}x` : NOME_FORMA_RESUMO[formaDaVenda(v)]}</span>
                  </span>
                  <span className="val ent">R$ {brl(faturamentoVenda(v))}</span>
                </li>
              )
            })}
            {vendasDia.length > 4 && (
              <li>
                <span className="agenda-dia">
                  <b>+{vendasDia.length - 4}</b>
                  <small>vendas</small>
                </span>
                <a className="agenda-txt" href={link('vendas')}>
                  <strong>Outras vendas do dia</strong>
                  <span>Ver todas</span>
                </a>
                <span className="val ent">R$ {brl(vendasDia.slice(4).reduce((t, v) => t + faturamentoVenda(v), 0))}</span>
              </li>
            )}
            {despDia.map((d) => (
              <li key={d.id}>
                <span className="agenda-dia">
                  <b>
                    <Icone nome="carteira" tamanho={16} />
                  </b>
                  <small>pago</small>
                </span>
                <span className="agenda-txt">
                  <strong>{d.descricao}</strong>
                  <span>{d.categoria === 'estoque' ? 'Compra de estoque (fica fora do lucro)' : 'Despesa da loja'}</span>
                </span>
                <span className="val sai">− R$ {brl(d.valor)}</span>
              </li>
            ))}
            {!vendasDia.length && !despDia.length && <li className="mut">Nada neste dia.</li>}
          </ul>
          <div className="det-acoes">
            {diaSel && (diaSel.atrasada || diaSel.aVencer) && (
              <a className="link-bt" href={link('despesas')}>
                {diaSel.atrasada ? 'Conta atrasada' : 'Conta vence'} neste dia: R$ {brl(diaSel.pagar)}. Ver em Contas e despesas →
              </a>
            )}
            <button type="button" className="btn btn-p" onClick={() => pedir({ tela: 'pdv' })}>
              Registrar venda
            </button>
            <div className="det-duas">
              <button type="button" className="btn btn-o" onClick={() => pedir({ tela: 'despesas', modo: 'pago', data: sel })}>
                Registrar despesa
              </button>
              <button type="button" className="btn btn-o" onClick={() => pedir({ tela: 'despesas', modo: 'pagar', data: sel })}>
                Agendar conta
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
