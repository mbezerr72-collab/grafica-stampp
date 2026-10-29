import { useState } from 'react'
import { hoje, negocio, pode, useDados, type Caixa as TCaixa, type Sessao, type Venda } from '../../data/store'
import { NOMES_FORMA, sinaisDoDia, type FormaPag, type Pedido } from '../../data/negocio'
import { CampoDinheiro, Icone, Topo, avisar, confirmar } from '../ui'
import { MiniKpi, brl } from '../escala/componentes'
import { Baixar } from '../escala/Baixar'
import type { Relatorio } from '../escala/exportar'

const CEDULAS = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.25, 0.1, 0.05]

/** Calculadora de cédulas: quantas de cada nota e moeda; a soma vai sozinha para o "contado". */
function Cedulas({ mudar }: { mudar: (v: number) => void }) {
  const [q, setQ] = useState<Record<number, number>>({})
  const total = CEDULAS.reduce((t, c) => t + c * (q[c] ?? 0), 0)
  const por = (c: number, n: number) => {
    const novo = { ...q, [c]: Math.max(0, n) }
    setQ(novo)
    mudar(Math.round(CEDULAS.reduce((t, x) => t + x * (novo[x] ?? 0), 0) * 100) / 100)
  }
  return (
    <div className="cedulas">
      <p className="det-rot">Conte a gaveta: quantas de cada?</p>
      <ul>
        {CEDULAS.map((c) => (
          <li key={c}>
            <span className="ced-v">{c >= 1 ? `R$ ${c}` : `${Math.round(c * 100)} ¢`}</span>
            <button type="button" className="ced-bt" aria-label={`Menos uma de ${c}`} onClick={() => por(c, (q[c] ?? 0) - 1)}>
              −
            </button>
            <input inputMode="numeric" aria-label={`Quantidade de ${c}`} value={q[c] ?? 0} onChange={(e) => por(c, Number(e.target.value.replace(/D/g, '')) || 0)} />
            <button type="button" className="ced-bt" aria-label={`Mais uma de ${c}`} onClick={() => por(c, (q[c] ?? 0) + 1)}>
              +
            </button>
          </li>
        ))}
      </ul>
      <p className="ced-total num">Na gaveta: R$ {brl(total, total % 1 > 0)}</p>
    </div>
  )
}

const FORMAS: FormaPag[] = ['dinheiro', 'pix', 'debito', 'credito']
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

/** O que o caixa do dia deveria ter, forma por forma (o dinheiro conta o troco, a sangria e o suprimento). */
export function esperadoDo(c: TCaixa, vendas: Venda[], pedidos: Pedido[]): Record<FormaPag, number> {
  const t: Record<FormaPag, number> = { dinheiro: c.abertura.valor, pix: 0, debito: 0, credito: 0 }
  for (const v of vendas) if (v.status === 'concluida' && v.data.startsWith(c.data)) for (const p of v.pagamentos) t[p.forma] += p.valor
  const sinais = sinaisDoDia(pedidos, c.data)
  for (const f of FORMAS) t[f] += sinais[f]
  for (const m of c.movimentos) t.dinheiro += m.tipo === 'suprimento' ? m.valor : -m.valor
  return t
}
const soma = (r: Record<FormaPag, number>) => FORMAS.reduce((t, f) => t + r[f], 0)
const sinal = (v: number) => (Math.abs(v) < 0.01 ? 'R$ 0' : `${v > 0 ? '+' : '−'} R$ ${brl(Math.abs(v), Math.abs(v) % 1 > 0)}`)

/** Caixa do dia: abrir, sangria e suprimento, conferência e fechamento, e o histórico. */
export default function Caixa({ s }: { s: Sessao }) {
  const caixas = useDados('caixas')
  const vendas = useDados('vendas')
  const pedidos = useDados('pedidos')
  const h = hoje()
  const c = caixas.find((x) => x.data === h)
  const [troco, setTroco] = useState(200)
  const [mov, setMov] = useState<{ tipo: 'sangria' | 'suprimento'; valor: number; motivo: string } | null>(null)
  const [contado, setContado] = useState<Record<FormaPag, number | null>>({ dinheiro: null, pix: null, debito: null, credito: null })
  const esperado = c ? esperadoDo(c, vendas, pedidos) : null
  const vendasHoje = vendas.filter((v) => v.data.startsWith(h) && v.status === 'concluida')
  const sinaisHoje = soma(sinaisDoDia(pedidos, h))
  const historico = caixas.filter((x) => x.fechamento && x.data < h).slice(-12).reverse()
  const dono = pode(s, 'financeiro')

  const fechar = async () => {
    if (!esperado) return
    const final = Object.fromEntries(FORMAS.map((f) => [f, contado[f] ?? esperado[f]])) as Record<FormaPag, number>
    const dif = soma(final) - soma(esperado)
    const ok = await confirmar({
      titulo: 'Fechar o caixa de hoje?',
      texto: Math.abs(dif) < 0.01 ? 'Tudo confere com o esperado.' : `Ficou uma diferença de ${sinal(dif)}. Ela fica registrada no fechamento.`,
      botao: 'Fechar caixa',
    })
    if (!ok) return
    negocio.fecharCaixa(final)
    avisar('Pronto! Caixa fechado.')
  }

  return (
    <>
      <Topo titulo="Caixa do dia" sub={c ? (c.fechamento ? `Fechado às ${c.fechamento.hora} por ${c.fechamento.quem}.` : `Aberto às ${c.abertura.hora} por ${c.abertura.quem}.`) : 'O caixa de hoje ainda não foi aberto.'}>
        {dono && <Baixar rel={(): Relatorio => ({ titulo: 'Fechamentos de caixa', sub: 'Os últimos fechamentos: esperado, contado e diferença. Gráfica Estamp.', colunas: [{ nome: 'Dia', tipo: 'texto' }, { nome: 'Quem fechou', tipo: 'texto' }, { nome: 'Esperado', tipo: 'dinheiro' }, { nome: 'Contado', tipo: 'dinheiro' }, { nome: 'Diferença', tipo: 'dinheiro' }], linhas: caixas.filter((x) => x.fechamento).slice(-60).reverse().map((x) => { const e = soma(esperadoDo(x, vendas, pedidos)); const k = soma(x.fechamento!.contado); return [x.data.split('-').reverse().join('/'), x.fechamento!.quem, e, k, k - e] }) })} />}
      </Topo>

      {!c && (
        <section className="painel abrir-caixa">
          <span className="vazio-ic">
            <Icone nome="caixa" tamanho={28} />
          </span>
          <h2>Abrir o caixa de hoje</h2>
          <p className="mut">Conte o dinheiro da gaveta (o troco) antes da primeira venda.</p>
          <label className="campo-e">
            <span>Troco na gaveta</span>
            <CampoDinheiro rotulo="Troco na gaveta" valor={troco} mudar={setTroco} />
          </label>
          <button
            type="button"
            className="btn btn-p btn-grande"
            onClick={() => {
              negocio.abrirCaixa(troco)
              avisar('Pronto! Caixa aberto.')
            }}
          >
            Abrir caixa
          </button>
        </section>
      )}

      {c && esperado && (
        <>
          <section className="kpis-menores" aria-label="Hoje">
            <MiniKpi rotulo="Vendas de hoje" valor={vendasHoje.length} nota={sinaisHoje ? `+ R$ ${brl(sinaisHoje)} de sinal de pedidos` : `Troco inicial R$ ${brl(c.abertura.valor)}`} />
            <MiniKpi rotulo="Dinheiro na gaveta" valor={'R$ ' + brl(esperado.dinheiro)} nota="Troco + vendas + sinais − sangrias" />
            <MiniKpi rotulo="Pix e cartões" valor={'R$ ' + brl(esperado.pix + esperado.debito + esperado.credito)} nota="Caem na conta e na maquininha" />
            <MiniKpi rotulo="Total esperado" valor={'R$ ' + brl(soma(esperado))} nota={c.fechamento ? `Contado: R$ ${brl(soma(c.fechamento.contado))}` : 'Ainda aberto'} />
          </section>

          <div className="grade-2">
            <section className="painel">
              <div className="painel-t">
                <h3>{c.fechamento ? 'Fechamento de hoje' : 'Conferência e fechamento'}</h3>
                {c.fechamento && <span className="pill ent">fechado</span>}
              </div>
              <div className="tabela-caixa" tabIndex={0} role="region" aria-label="Tabela">
                <table className="tabela conferencia">
                  <thead>
                    <tr>
                      <th>Forma</th>
                      <th className="dir">Esperado</th>
                      <th className="dir">Contado</th>
                      <th className="dir">Diferença</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FORMAS.map((f) => {
                      const cont = c.fechamento ? c.fechamento.contado[f] : contado[f]
                      const dif = cont === null ? 0 : cont - esperado[f]
                      return (
                        <tr key={f}>
                          <td>
                            <b>{NOMES_FORMA[f]}</b>
                          </td>
                          <td className="dir num">R$ {brl(esperado[f])}</td>
                          <td className="dir">
                            {c.fechamento ? (
                              <span className="num">R$ {brl(cont ?? 0)}</span>
                            ) : f !== 'dinheiro' && cont === null ? (
                              <button type="button" className="conferido" title="Bate com o que foi registrado nas vendas. Toque para corrigir." onClick={() => setContado({ ...contado, [f]: esperado[f] })}>
                                <Icone nome="check" tamanho={14} /> conferido
                              </button>
                            ) : (
                              <CampoDinheiro compacto rotulo={`Contado em ${NOMES_FORMA[f]}`} valor={cont ?? 0} mudar={(v) => setContado({ ...contado, [f]: v })} />
                            )}
                          </td>
                          <td className={'dir num ' + (Math.abs(dif) < 0.01 ? 'mut' : dif > 0 ? 'txt-ent' : 'txt-sai')}>{cont === null ? '—' : sinal(dif)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {!c.fechamento ? (
                <>
                  <p className="mut pequeno">Pix, débito e crédito já vêm conferidos com o que foi registrado nas vendas. Só conte o dinheiro da gaveta.</p>
                  <Cedulas mudar={(v) => setContado((x) => ({ ...x, dinheiro: v }))} />
                  <button type="button" className="btn btn-p btn-grande largo" onClick={fechar}>
                    Fechar caixa
                  </button>
                </>
              ) : (
                dono && (
                  <button
                    type="button"
                    className="btn btn-o largo"
                    onClick={() => {
                      negocio.reabrirCaixa()
                      avisar('Caixa reaberto.')
                    }}
                  >
                    Reabrir o caixa de hoje
                  </button>
                )
              )}
            </section>

            <section className="painel">
              <div className="painel-t">
                <h3>Tirar ou pôr dinheiro no caixa</h3>
              </div>
              {c.movimentos.length ? (
                <ul className="agenda agenda--valor">
                  {c.movimentos.map((m, i) => (
                    <li key={i}>
                      <span className="agenda-dia">
                        <b>{m.hora.slice(0, 2)}h</b>
                        <small>{m.hora.slice(3)}</small>
                      </span>
                      <span className="agenda-txt">
                        <strong>{m.tipo === 'sangria' ? 'Tirou dinheiro do caixa' : 'Pôs dinheiro no caixa'}</strong>
                        <span>
                          {m.motivo || 'Sem motivo'}, {m.quem}
                        </span>
                      </span>
                      <span className={'val ' + (m.tipo === 'sangria' ? 'sai' : 'ent')}>
                        {m.tipo === 'sangria' ? '− ' : '+ '}R$ {brl(m.valor)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mut">Nenhuma retirada nem reforço hoje.</p>
              )}
              {!c.fechamento &&
                (mov ? (
                  <form
                    className="mov-form"
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (!mov.valor) return
                      negocio.movimentoCaixa(mov.tipo, mov.valor, mov.motivo)
                      avisar(mov.tipo === 'sangria' ? 'Pronto! Dinheiro tirado do caixa.' : 'Pronto! Dinheiro posto no caixa.')
                      setMov(null)
                    }}
                  >
                    <div className="fichas" role="radiogroup" aria-label="Tipo">
                      {(['sangria', 'suprimento'] as const).map((t) => (
                        <button key={t} type="button" role="radio" className="ficha" aria-checked={mov.tipo === t} onClick={() => setMov({ ...mov, tipo: t })}>
                          {t === 'sangria' ? 'Tirar dinheiro do caixa' : 'Pôr dinheiro no caixa'}
                        </button>
                      ))}
                    </div>
                    <CampoDinheiro rotulo="Valor" valor={mov.valor} mudar={(v) => setMov({ ...mov, valor: v })} />
                    <input placeholder="Motivo (ex.: depósito no banco)" aria-label="Motivo" value={mov.motivo} onChange={(e) => setMov({ ...mov, motivo: e.target.value })} />
                    <div className="cli-novo-acoes">
                      <button type="button" className="bt bt-leve bt-pequeno" onClick={() => setMov(null)}>
                        Cancelar
                      </button>
                      <button type="submit" className="bt bt-leve bt-pequeno" disabled={!mov.valor}>
                        Registrar
                      </button>
                    </div>
                  </form>
                ) : (
                  <button type="button" className="btn btn-o largo" onClick={() => setMov({ tipo: 'sangria', valor: 0, motivo: '' })}>
                    <Icone nome="somar" tamanho={18} />
                    Registrar sangria ou suprimento
                  </button>
                ))}
            </section>
          </div>
        </>
      )}

      <section className="painel">
        <div className="painel-t">
          <h3>Fechamentos anteriores</h3>
          <span className="mut">diferença entre o contado e o esperado</span>
        </div>
        <ul className="fechamentos">
          {historico.map((x) => {
            const esp = esperadoDo(x, vendas, pedidos)
            const dif = soma(x.fechamento!.contado) - soma(esp)
            const sem = new Date(x.data + 'T12:00:00Z').getUTCDay()
            return (
              <li key={x.id}>
                <span className="fc-dia">
                  <b>
                    {SEMANA[sem]} {x.data.slice(8)}/{x.data.slice(5, 7)}
                  </b>
                  <small>
                    {x.fechamento!.quem.split(' ')[0]}, {x.fechamento!.hora}
                  </small>
                </span>
                <span className="fc-total num">R$ {brl(soma(esp))}</span>
                <span className={'pill ' + (Math.abs(dif) < 0.01 ? 'ent' : dif > 0 ? 'inf' : 'sai')}>{Math.abs(dif) < 0.01 ? 'Bateu' : sinal(dif)}</span>
              </li>
            )
          })}
        </ul>
      </section>
    </>
  )
}
