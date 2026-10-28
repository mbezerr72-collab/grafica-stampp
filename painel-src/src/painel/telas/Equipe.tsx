import { useState, type CSSProperties } from 'react'
import { negocio, useDados, type Membro, type Sessao } from '../../data/store'
import { CATEGORIAS, NOME_CATEGORIA, pecasPedido, totalPedido, type Categoria, type PapelEquipe } from '../../data/negocio'
import { Icone, Topo, avisar } from '../ui'
import { intervalo, usePeriodo } from '../escala/periodo'
import { noPeriodo, porVendedor } from '../escala/numeros'
import { MiniKpi, brl, pct } from '../escala/componentes'
import { Avatar } from '../escala/Avatar'
import { Gaveta } from '../escala/Gaveta'
import { CampoDinheiro } from '../ui'
import { Usuarios } from './Loja'
import { Baixar } from '../escala/Baixar'
import { relVendedores } from '../escala/relatorios'

const CATS = CATEGORIAS.map((id) => ({ id, nome: NOME_CATEGORIA[id] }))
const PAPEL: Record<PapelEquipe, string> = { dono: 'Dono', atendimento: 'Atendimento', designer: 'Designer', producao: 'Produção' }

/** Equipe: quem vendeu quanto, a meta de cada um e a comissão por categoria. */
export default function Equipe({ s }: { s: Sessao }) {
  const p = usePeriodo()
  const iv = intervalo(p)
  const equipe = useDados('equipe')
  const vendas = useDados('vendas')
  const pedidos = useDados('pedidos')
  const [edit, setEdit] = useState<Membro | 'novo' | null>(null)
  const doPer = noPeriodo(vendas, iv.de, iv.ate)
  const ranking = porVendedor(doPer, equipe)
  const totalCom = ranking.reduce((t, x) => t + x.comissao, 0)
  const tecnicos = equipe.filter((e) => e.ativo && (e.papel === 'designer' || e.papel === 'producao'))
  const lider = ranking[0]
  const { produtos } = useDados('catalogo')
  const produtosCat = new Map(produtos.map((x) => [x.id, x.marca]))

  const porCategoria = (id: string) => {
    const t = Object.fromEntries(CATEGORIAS.map((c) => [c, 0])) as Record<Categoria, number>
    for (const v of doPer) if (v.vendedorId === id) for (const i of v.itens) t[i.categoria] += (i.preco - i.desconto) * i.qtd
    return t
  }

  return (
    <>
      <Topo titulo="Equipe e comissões" sub={`${iv.rotulo}. Pessoas, acesso ao painel, meta e comissão de cada um, e o ranking.`}>
        <Baixar rel={() => relVendedores(doPer, equipe, iv.dias, `${iv.rotulo}. Gráfica Estamp.`)} />
        <button type="button" className="bt bt-forte" onClick={() => setEdit('novo')}>
          <Icone nome="somar" tamanho={18} />
          <span>Pessoa nova</span>
        </button>
      </Topo>
      <section className="kpis-menores">
        <MiniKpi rotulo="Vendido pela equipe" valor={'R$ ' + brl(ranking.reduce((t, x) => t + x.fat, 0))} nota={`${doPer.length} vendas`} />
        <MiniKpi rotulo="Comissões do período" valor={'R$ ' + brl(totalCom)} nota="a pagar na folha" />
        <MiniKpi rotulo="Quem está na frente" valor={lider ? lider.membro.nome.split(' ')[0] : '—'} nota={lider ? `R$ ${brl(lider.fat)} em ${lider.vendas} vendas` : ''} />
        <MiniKpi rotulo="Pessoas" valor={equipe.filter((e) => e.ativo).length} nota={`${tecnicos.length} na arte e na produção`} />
      </section>

      <section className="equipe">
        {ranking.map((x, i) => {
          const meta = x.membro.metaMes * (iv.dias / 30)
          const f = meta ? x.fat / meta : 0
          const cat = porCategoria(x.membro.id)
          return (
            <article key={x.membro.id} className="pessoa-c">
              <div className="pessoa-topo">
                <span className="pos">{i + 1}º</span>
                <Avatar nome={x.membro.nome} i={equipe.indexOf(x.membro)} tamanho={42} />
                <span className="pessoa-nome">
                  <b>{x.membro.nome}</b>
                  <small>{PAPEL[x.membro.papel]}</small>
                </span>
                <button type="button" className="icone-bt icone-bt--leve" aria-label={`Editar ${x.membro.nome}`} onClick={() => setEdit(x.membro)}>
                  <Icone nome="pincel" tamanho={18} />
                </button>
              </div>
              <p className="pessoa-val num">
                <small>R$</small>
                {brl(x.fat)}
              </p>
              <p className="mut pequeno">
                {x.vendas} vendas, ticket de R$ {brl(x.vendas ? x.fat / x.vendas : 0)}
              </p>
              {meta > 0 ? (
                <>
                  <div className="barra-trilho" style={{ '--c': f >= 1 ? 'var(--ent)' : f >= 0.6 ? 'var(--teal)' : 'var(--ate)' } as CSSProperties}>
                    <i style={{ width: `${Math.min(100, f * 100)}%` }} />
                  </div>
                  <p className="meta-num">
                    <span>
                      <b>{pct(f, 0)}</b> da meta
                    </span>
                    <span>R$ {brl(meta)}</span>
                  </p>
                </>
              ) : (
                <p className="mut pequeno">Sem meta de venda.</p>
              )}
              <ul className="det-itens">
                {CATS.filter((c) => cat[c.id] > 0 && x.membro.comissao[c.id] > 0).map((c) => (
                  <li key={c.id}>
                    <span>
                      {c.nome} <small>({x.membro.comissao[c.id]}%)</small>
                    </span>
                    <span className="num">R$ {brl((cat[c.id] * x.membro.comissao[c.id]) / 100)}</span>
                  </li>
                ))}
                <li className="det-total">
                  <span>Comissão</span>
                  <span className="num">R$ {brl(x.comissao)}</span>
                </li>
              </ul>
            </article>
          )
        })}
        {tecnicos.map((t) => {
          const dele = pedidos.filter((o) => o.responsavelId === t.id && o.entregueEm && o.entregueEm >= iv.de && o.entregueEm <= iv.ate)
          const fat = dele.reduce((s, o) => s + totalPedido(o), 0)
          const pecas = dele.reduce((s, o) => s + pecasPedido(o), 0)
          const abertas = pedidos.filter((o) => o.responsavelId === t.id && o.status !== 'entregue').length
          const com = dele.reduce((s, o) => s + o.itens.reduce((u, i) => u + (i.preco * i.qtd * (t.comissao[(produtosCat.get(i.produtoId) ?? 'impressos') as Categoria] ?? 0)) / 100, 0), 0)
          return (
            <article key={t.id} className="pessoa-c">
              <div className="pessoa-topo">
                <span className="pos">
                  <Icone nome={t.papel === 'designer' ? 'pincel' : 'os'} tamanho={16} />
                </span>
                <Avatar nome={t.nome} i={equipe.indexOf(t)} tamanho={42} />
                <span className="pessoa-nome">
                  <b>{t.nome}</b>
                  <small>{PAPEL[t.papel]}</small>
                </span>
                <button type="button" className="icone-bt icone-bt--leve" aria-label={`Editar ${t.nome}`} onClick={() => setEdit(t)}>
                  <Icone nome="pincel" tamanho={18} />
                </button>
              </div>
              <p className="pessoa-val num">
                <small>R$</small>
                {brl(fat)}
              </p>
              <p className="mut pequeno">
                {dele.length} pedidos entregues ({pecas} peças/unidades), {abertas} em andamento
              </p>
              <ul className="det-itens">
                <li className="det-total">
                  <span>Comissão de produção</span>
                  <span className="num">R$ {brl(com)}</span>
                </li>
              </ul>
            </article>
          )
        })}
      </section>
      <h2 className="secao-t">Acesso ao painel</h2>
      <Usuarios s={s} />
      {edit && <EditarMembro m={edit === 'novo' ? undefined : edit} fechar={() => setEdit(null)} />}
    </>
  )
}

function EditarMembro({ m, fechar }: { m?: Membro; fechar: () => void }) {
  const [x, setX] = useState<Omit<Membro, 'id'>>(
    m ?? { nome: '', papel: 'atendimento', metaMes: 30000, comissao: Object.fromEntries(CATEGORIAS.map((c) => [c, 2])) as Record<Categoria, number>, ativo: true },
  )
  const ok = x.nome.trim().length > 1
  return (
    <Gaveta
      titulo={m ? m.nome : 'Pessoa nova'}
      sub="A comissão é a % do valor vendido (atendimento) ou produzido (arte e produção) em cada categoria."
      fechar={fechar}
      pe={
        <button
          type="button"
          className="btn btn-p"
          disabled={!ok}
          onClick={() => {
            negocio.salvarMembro({ ...x, nome: x.nome.trim(), id: m?.id })
            avisar('Equipe salva.')
            fechar()
          }}
        >
          Salvar
        </button>
      }
    >
      <div className="form-g">
        <label className="campo">
          Nome
          <input value={x.nome} onChange={(e) => setX({ ...x, nome: e.target.value })} />
        </label>
        <label className="campo">
          Função
          <select value={x.papel} onChange={(e) => setX({ ...x, papel: e.target.value as PapelEquipe })}>
            {(Object.keys(PAPEL) as PapelEquipe[]).map((p) => (
              <option key={p} value={p}>
                {PAPEL[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          Meta do mês
          <CampoDinheiro rotulo="Meta do mês" valor={x.metaMes} mudar={(v) => setX({ ...x, metaMes: v })} />
        </label>
      </div>
      <p className="det-rot">Comissão por categoria</p>
      <div className="form-g form-g--3">
        {CATS.map((c) => (
          <label key={c.id} className="campo">
            {c.nome} (%)
            <input type="number" min={0} max={50} step={0.5} value={x.comissao[c.id]} onChange={(e) => setX({ ...x, comissao: { ...x.comissao, [c.id]: Number(e.target.value) } })} />
          </label>
        ))}
      </div>
      <label className="check-l">
        <input type="checkbox" checked={x.ativo} onChange={(e) => setX({ ...x, ativo: e.target.checked })} />
        <span>Trabalha na gráfica agora</span>
      </label>
    </Gaveta>
  )
}
