import { useState, type CSSProperties } from 'react'
import { hoje, negocio, useDados, type Meta, type Sessao } from '../../data/store'
import { CampoDinheiro, Topo, avisar } from '../ui'
import { link } from '../rota'
import { nomeMes, somaDias } from '../escala/periodo'
import { resumo } from '../escala/numeros'
import { brl, pct } from '../escala/componentes'

/** Metas: a do mês com a projeção de fechamento, as próximas e como foram as anteriores. */
export default function Metas(_: { s: Sessao }) {
  const metas = useDados('metas')
  const vendas = useDados('vendas')
  const despesas = useDados('despesas')
  const h = hoje()
  const mes = h.slice(0, 7)
  const prox = somaDias(mes + '-01', 32).slice(0, 7)
  const atual = metas.find((m) => m.mes === mes)
  const diasMes = new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0).getDate()
  const passou = Number(h.slice(8)) / diasMes
  const feito = resumo(vendas, despesas, mes + '-01', h)
  const proj = { faturamento: feito.faturamento / passou, lucro: feito.lucro / passou, vendas: feito.vendas / passou }
  const fimMes = (m: string) => somaDias(somaDias(m + '-01', 32).slice(0, 7) + '-01', -1)
  // O mês em que os dados começam pela metade não entra (a comparação ficaria injusta).
  const inicio = vendas.reduce((m, v) => (v.data < m ? v.data : m), '9999').slice(0, 10)
  const passadas = metas.filter((m) => m.mes < mes && !(inicio.slice(0, 7) === m.mes && inicio.slice(8) !== '01')).reverse()
  const nome = (m: string) => nomeMes(m)[0].toUpperCase() + nomeMes(m).slice(1)

  return (
    <>
      <Topo titulo="Metas" sub={`Hoje ${pct(passou, 0)} de ${nomeMes(mes)} passou. A projeção segue o ritmo do mês até aqui.`} />
      {atual && (
        <section className="metas-3">
          {(
            [
              ['faturamento', 'Faturamento', true],
              ['lucro', 'Lucro', true],
              ['vendas', 'Vendas', false],
            ] as const
          ).map(([k, rot, din]) => {
            const v = feito[k]
            const alvo = atual[k]
            const f = alvo ? v / alvo : 0
            const pf = alvo ? proj[k] / alvo : 0
            return (
              <article key={k} className="painel meta-c">
                <div className="painel-t">
                  <h3>{rot}</h3>
                  <span className={'pill ' + (pf >= 1 ? 'ent' : pf >= 0.9 ? 'ate' : 'sai')}>{pf >= 1 ? 'no ritmo' : pf >= 0.9 ? 'perto' : 'abaixo'}</span>
                </div>
                <p className="meta-valor num">
                  {din && <small>R$</small>}
                  {brl(v)} <span className="mut">de {din ? 'R$ ' : ''}{brl(alvo)}</span>
                </p>
                <div className="meta-barra" role="img" aria-label={`${pct(f, 0)} da meta`}>
                  <i style={{ width: `${Math.min(100, Math.max(0, f) * 100)}%`, ...(k === 'lucro' ? { background: 'var(--grad-lucro)' } : {}) } as CSSProperties} />
                  <em style={{ left: `${passou * 100}%` }} />
                </div>
                <div className="meta-num">
                  <span>
                    <b>{pct(f, 0)}</b> da meta
                  </span>
                  <span>{pct(passou, 0)} do mês</span>
                </div>
                <p className={'meta-frase' + (pf < 1 ? ' abaixo' : '')}>
                  No ritmo atual, fecha em {din ? 'R$ ' : ''}
                  {brl(proj[k])} ({pct(pf, 0)} da meta).
                  {pf < 1 && ` Faltam ${din ? 'R$ ' : ''}${brl((alvo - v) / Math.max(1, diasMes - Number(h.slice(8))))} por dia.`}
                </p>
              </article>
            )
          })}
        </section>
      )}
      <div className="grade-2">
        <section className="painel">
          <div className="painel-t">
            <h3>Definir metas</h3>
            <a href={link('equipe')}>Metas de cada vendedor</a>
          </div>
          <EditarMeta mes={mes} m={atual} rotulo={`${nome(mes)} (agora)`} />
          <EditarMeta mes={prox} m={metas.find((x) => x.mes === prox)} rotulo={nome(prox)} sugestao={atual} />
        </section>
        <section className="painel">
          <div className="painel-t">
            <h3>Meses anteriores</h3>
            <span className="mut">meta de faturamento</span>
          </div>
          <ul className="det-itens">
            {passadas.map((m) => {
              const r = resumo(vendas, despesas, m.mes + '-01', fimMes(m.mes))
              const f = m.faturamento ? r.faturamento / m.faturamento : 0
              return (
                <li key={m.mes}>
                  <span>
                    <b>{nome(m.mes)}</b>
                    <small>
                      R$ {brl(r.faturamento)} de R$ {brl(m.faturamento)}
                    </small>
                  </span>
                  <span className={'pill ' + (f >= 1 ? 'ent' : f >= 0.9 ? 'ate' : 'sai')}>{pct(f, 0)}</span>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </>
  )
}

function EditarMeta({ mes, m, rotulo, sugestao }: { mes: string; m?: Meta; rotulo: string; sugestao?: Meta }) {
  const [x, setX] = useState<Meta>(m ?? { mes, faturamento: sugestao?.faturamento ?? 250000, lucro: sugestao?.lucro ?? 45000, vendas: sugestao?.vendas ?? 80 })
  const mudou = JSON.stringify(x) !== JSON.stringify(m)
  return (
    <div className="meta-edit">
      <p className="det-rot">{rotulo}</p>
      <div className="form-g form-g--3">
        <label className="campo">
          Faturamento
          <CampoDinheiro rotulo={`Meta de faturamento de ${rotulo}`} valor={x.faturamento} mudar={(v) => setX({ ...x, faturamento: v })} />
        </label>
        <label className="campo">
          Lucro
          <CampoDinheiro rotulo={`Meta de lucro de ${rotulo}`} valor={x.lucro} mudar={(v) => setX({ ...x, lucro: v })} />
        </label>
        <label className="campo">
          Vendas
          <input type="number" min={0} value={x.vendas} onChange={(e) => setX({ ...x, vendas: Number(e.target.value) })} />
        </label>
      </div>
      {mudou && (
        <button
          type="button"
          className="btn btn-p"
          onClick={() => {
            negocio.salvarMeta(x)
            avisar(`Meta de ${rotulo.replace(' (agora)', '')} salva.`)
          }}
        >
          Salvar meta
        </button>
      )}
    </div>
  )
}
