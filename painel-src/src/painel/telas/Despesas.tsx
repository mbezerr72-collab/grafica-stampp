import { useEffect, useState } from 'react'
import { pegarPedido } from '../escala/pedido'
import { Baixar } from '../escala/Baixar'
import { relDespesas } from '../escala/relatorios'
import { hoje, negocio, useDados, type Conta, type Sessao } from '../../data/store'
import type { CategoriaDespesa } from '../../data/negocio'
import { CampoDinheiro, Icone, Topo, avisar, confirmar } from '../ui'
import { MiniKpi, brl, pct } from '../escala/componentes'
import { Gaveta } from '../escala/Gaveta'
import { intervalo, usePeriodo, diasEntre, somaDias } from '../escala/periodo'

const CAT: Record<CategoriaDespesa, string> = { estoque: 'Compra de material', aluguel: 'Aluguel', anuncios: 'Anúncios', salarios: 'Salários', contas: 'Contas', outros: 'Outros' }
const COR: Record<CategoriaDespesa, string> = { estoque: 'var(--mut)', aluguel: 'var(--roxo)', anuncios: 'var(--inf)', salarios: 'var(--teal)', contas: 'var(--ate)', outros: 'var(--sai)' }
type Aba = 'pagar' | 'pagas'
const dataBr = (d: string) => d.split('-').reverse().join('/')

/** Contas a pagar: o que vence e o que já saiu (a gráfica não vende fiado: não tem conta a receber). */
export default function Despesas(_: { s: Sessao }) {
  const p = usePeriodo()
  const iv = intervalo(p)
  const contas = useDados('contas')
  const despesas = useDados('despesas')
  const h = hoje()
  const [aba, setAba] = useState<Aba>('pagar')
  // O Calendário e o "+" abrem este mesmo formulário, já com a data (sem cópia em outra tela).
  const [form, setForm] = useState<Partial<Conta> & { modo: 'pago' | 'pagar' } | null>(() => {
    const pd = pegarPedido('despesas')
    return pd ? { modo: pd.modo === 'pagar' ? 'pagar' : 'pago', categoria: 'outros', valor: 0, descricao: '', vencimento: pd.data ?? hoje(), recorrencia: 'nenhuma' } : null
  })
  useEffect(() => {
    const f = () => {
      const pd = pegarPedido('despesas')
      if (pd) setForm({ modo: pd.modo === 'pagar' ? 'pagar' : 'pago', categoria: 'outros', valor: 0, descricao: '', vencimento: pd.data ?? hoje(), recorrencia: 'nenhuma' })
    }
    window.addEventListener('escala:pedido', f)
    return () => window.removeEventListener('escala:pedido', f)
  }, [])

  const abertas = contas.filter((c) => !c.pagaEm)
  const pagar = abertas.filter((c) => c.tipo === 'pagar').sort((a, b) => a.vencimento.localeCompare(b.vencimento))
  const atrasadas = pagar.filter((c) => c.vencimento < h)
  const prox30 = pagar.filter((c) => c.vencimento >= h && c.vencimento <= somaDias(h, 30))
  const pagas = despesas.filter((d) => d.data >= iv.de && d.data <= iv.ate).sort((a, b) => b.data.localeCompare(a.data))
  const loja = pagas.filter((d) => d.categoria !== 'estoque')
  const porCat = (Object.keys(CAT) as CategoriaDespesa[]).map((c) => ({ c, v: pagas.filter((d) => d.categoria === c).reduce((t, d) => t + d.valor, 0) })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v)
  const totCat = porCat.reduce((t, x) => t + x.v, 0) || 1

  const pagarConta = async (c: Conta) => {
    const ok = await confirmar({ titulo: `${c.tipo === 'pagar' ? 'Pagar' : 'Receber'} “${c.descricao}”?`, texto: `R$ ${brl(c.valor, c.valor % 1 > 0)} com data de hoje.${c.recorrencia === 'mensal' ? ' A do mês que vem já fica agendada.' : ''}`, botao: c.tipo === 'pagar' ? 'Marcar como paga' : 'Marcar como recebida' })
    if (!ok) return
    negocio.pagarConta(c.id)
    avisar(c.tipo === 'pagar' ? 'Conta paga. Entrou nas despesas.' : 'Recebimento registrado.')
  }

  const linhaConta = (c: Conta) => {
    const atraso = c.vencimento < h
    return (
      <li key={c.id} className="conta">
        <span className={'agenda-dia' + (atraso ? ' atraso' : '')}>
          <b>{c.vencimento.slice(8)}</b>
          <small>{atraso ? 'atraso' : dataBr(c.vencimento).slice(3, 5) + '/' + c.vencimento.slice(2, 4)}</small>
        </span>
        <button type="button" className="conta-txt" onClick={() => setForm({ ...c, modo: 'pagar' })}>
          <b>{c.descricao}</b>
          <small>
            {CAT[c.categoria]}
            {c.recorrencia === 'mensal' ? ', todo mês' : ''}
            {atraso ? `, atrasada há ${diasEntre(c.vencimento, h) - 1} dias` : c.vencimento === h ? ', vence hoje' : ''}
          </small>
        </button>
        <span className={'val num ' + (c.tipo === 'pagar' ? 'sai' : 'ent')}>R$ {brl(c.valor)}</span>
        <button type="button" className="btn btn-o conta-bt" onClick={() => pagarConta(c)}>
          {c.tipo === 'pagar' ? 'Pagar' : 'Recebi'}
        </button>
      </li>
    )
  }

  return (
    <>
      <Topo titulo="Contas a pagar" sub="O que vai vencer e o que já foi pago. Aluguel, energia, internet e salários entram sozinhos todo mês.">
        <Baixar rel={() => relDespesas(despesas, iv.de, iv.ate, `${iv.rotulo}. Gráfica Estamp.`)} />
        <button type="button" className="bt bt-forte acao-principal" onClick={() => setForm({ modo: 'pago', categoria: 'outros', valor: 0, descricao: '', vencimento: h, recorrencia: 'nenhuma' })}>
          <Icone nome="somar" tamanho={18} />
          <span>Lançar despesa</span>
        </button>
      </Topo>
      <section className="kpis-menores">
        <MiniKpi rotulo="Atrasadas" valor={'R$ ' + brl(atrasadas.reduce((t, c) => t + c.valor, 0))} nota={`${atrasadas.length} ${atrasadas.length === 1 ? 'conta' : 'contas'}`} classe={atrasadas.length ? 'desce' : undefined} />
        <MiniKpi rotulo="A pagar em 30 dias" valor={'R$ ' + brl(prox30.reduce((t, c) => t + c.valor, 0))} nota={`${prox30.length} contas`} />
        <MiniKpi rotulo="Já pago" valor={'R$ ' + brl(pagas.reduce((t, d) => t + d.valor, 0))} nota={`${pagas.length} ${pagas.length === 1 ? 'conta paga' : 'contas pagas'} no período`} />
        <MiniKpi rotulo="Gastos da gráfica" valor={'R$ ' + brl(loja.reduce((t, d) => t + d.valor, 0))} nota="sem contar a compra de material" />
      </section>
      <div className="grade-2">
        <section className="painel">
          <div className="fichas" role="tablist" aria-label="Ver">
            {(
              [
                ['pagar', `A pagar (${pagar.length})`],
                ['pagas', `Pagas no período (${pagas.length})`],
              ] as const
            ).map(([id, nome]) => (
              <button key={id} type="button" role="tab" className="ficha" aria-selected={aba === id} onClick={() => setAba(id)}>
                {nome}
              </button>
            ))}
          </div>
          {aba === 'pagar' && <ul className="contas">{pagar.slice(0, 40).map(linhaConta)}</ul>}
          {aba === 'pagas' && (
            <ul className="contas">
              {pagas.slice(0, 60).map((d) => (
                <li key={d.id} className="conta">
                  <span className="agenda-dia">
                    <b>{d.data.slice(8)}</b>
                    <small>{d.data.slice(5, 7)}/{d.data.slice(2, 4)}</small>
                  </span>
                  <span className="conta-txt">
                    <b>{d.descricao}</b>
                    <small>{CAT[d.categoria]}</small>
                  </span>
                  <span className="val num sai">R$ {brl(d.valor)}</span>
                </li>
              ))}
              {!pagas.length && <li className="mut">Nada pago no período.</li>}
            </ul>
          )}
        </section>
        <section className="painel">
          <div className="painel-t">
            <h3>Para onde foi o dinheiro</h3>
            <span className="mut">{iv.rotulo.toLowerCase()}</span>
          </div>
          <ul className="hbar">
            {porCat.map((x) => (
              <li key={x.c}>
                <b>{CAT[x.c]}</b>
                <span className="trilho" style={{ ['--c' as string]: COR[x.c] }}>
                  <i style={{ width: `${(x.v / porCat[0].v) * 100}%` }} />
                </span>
                <span className="v num">R$ {brl(x.v)}</span>
              </li>
            ))}
          </ul>
          {porCat.length > 0 && <p className="mut pequeno">Compra de material foi {pct((porCat.find((x) => x.c === 'estoque')?.v ?? 0) / totCat, 0)} do que saiu. Esse dinheiro volta quando o produto feito com o material é vendido.</p>}
        </section>
      </div>
      {form && <FormConta f={form} fechar={() => setForm(null)} />}
    </>
  )
}

function FormConta({ f, fechar }: { f: Partial<Conta> & { modo: 'pago' | 'pagar' }; fechar: () => void }) {
  const [x, setX] = useState(f)
  const editando = !!f.id
  const ok = !!x.descricao?.trim() && (x.valor ?? 0) > 0
  const salvar = () => {
    if (!ok) return
    const base = { descricao: x.descricao!.trim(), valor: x.valor!, categoria: x.categoria ?? 'outros', recorrencia: x.recorrencia ?? 'nenhuma' }
    if (x.modo === 'pago') {
      negocio.lancarDespesa({ data: x.vencimento ?? hoje(), valor: base.valor, categoria: base.categoria, descricao: base.descricao })
      avisar('Despesa lançada.')
    } else {
      negocio.salvarConta({ ...base, id: f.id, tipo: 'pagar', vencimento: x.vencimento ?? hoje() })
      avisar(editando ? 'Conta salva.' : 'Conta agendada.')
    }
    fechar()
  }
  const excluir = async () => {
    if (!f.id) return
    const sim = await confirmar({ titulo: 'Excluir esta conta?', texto: 'Ela some da lista. Se já foi paga, a despesa continua.', botao: 'Excluir', perigo: true })
    if (!sim) return
    negocio.excluirConta(f.id)
    fechar()
  }
  return (
    <Gaveta
      titulo={editando ? 'Editar conta' : 'Lançar'}
      fechar={fechar}
      pe={
        <>
          {editando && (
            <button type="button" className="btn btn-o" onClick={excluir}>
              Excluir
            </button>
          )}
          <button type="button" className="btn btn-p" disabled={!ok} onClick={salvar}>
            Salvar
          </button>
        </>
      }
    >
      {!editando && (
        <div className="fichas" role="radiogroup" aria-label="O que é">
          {(
            [
              ['pago', 'Já paguei'],
              ['pagar', 'Conta a pagar'],
            ] as const
          ).map(([m, nome]) => (
            <button key={m} type="button" role="radio" className="ficha" aria-checked={x.modo === m} onClick={() => setX({ ...x, modo: m })}>
              {nome}
            </button>
          ))}
        </div>
      )}
      <div className="form-g">
        <label className="campo">
          Descrição
          <input value={x.descricao ?? ''} onChange={(e) => setX({ ...x, descricao: e.target.value })} placeholder="Ex.: Conta de energia" />
        </label>
        <label className="campo">
          Valor
          <CampoDinheiro rotulo="Valor" valor={x.valor ?? 0} mudar={(v) => setX({ ...x, valor: v })} />
        </label>
        <label className="campo">
          {x.modo === 'pago' ? 'Data do pagamento' : 'Vencimento'}
          <input type="date" value={x.vencimento ?? hoje()} onChange={(e) => setX({ ...x, vencimento: e.target.value })} />
        </label>
        <label className="campo">
          Categoria
          <select value={x.categoria ?? 'outros'} onChange={(e) => setX({ ...x, categoria: e.target.value as CategoriaDespesa })}>
            {(Object.keys(CAT) as CategoriaDespesa[]).map((c) => (
              <option key={c} value={c}>
                {CAT[c]}
              </option>
            ))}
          </select>
        </label>
        {x.modo !== 'pago' && (
          <label className="check-l">
            <input type="checkbox" checked={x.recorrencia === 'mensal'} onChange={(e) => setX({ ...x, recorrencia: e.target.checked ? 'mensal' : 'nenhuma' })} />
            <span>Repete todo mês</span>
          </label>
        )}
      </div>
    </Gaveta>
  )
}
