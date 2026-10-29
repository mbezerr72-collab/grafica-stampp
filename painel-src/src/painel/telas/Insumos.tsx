import { useMemo, useState, type CSSProperties } from 'react'
import { negocio, pode, useDados, type Sessao } from '../../data/store'
import { NOME_GRUPO_INSUMO, type GrupoInsumo, type Insumo } from '../../data/negocio'
import { CampoDinheiro, Icone, Topo, avisar } from '../ui'
import { brl } from '../escala/componentes'
import { Gaveta } from '../escala/Gaveta'
import { linkWhats } from '../escala/documentos'
import { Baixar } from '../escala/Baixar'
import { relInsumos } from '../escala/relatorios'
import { nomeFornecedor } from '../escala/estoque'
import { pedir } from '../escala/pedido'
import { LOJA } from '../../lib/config'

type Aba = 'todos' | 'comprar'
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const num = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
const situacao = (x: Insumo): [string, string] => (x.estoque <= 0 ? ['acabou', 'sai'] : x.estoque < x.minimo ? ['comprar', 'ate'] : ['tem', 'ent'])
/** Quanto pedir: o dobro do mínimo, menos o que já tem. */
const sugerido = (x: Insumo) => Math.max(1, Math.ceil(x.minimo * 2 - x.estoque))

/** Insumos: camisas lisas, papéis, tintas, lona e brindes em branco. Avisa o que está acabando e monta o pedido do fornecedor. */
export default function Insumos({ s }: { s: Sessao }) {
  const insumos = useDados('insumos')
  const fornecedores = useDados('fornecedores')
  const dono = pode(s, 'custo')
  const [aba, setAba] = useState<Aba>('todos')
  const [grupo, setGrupo] = useState<GrupoInsumo | ''>('')
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState<string | 'novo'>()

  const comprar = insumos.filter((x) => x.estoque < x.minimo)
  const acabou = insumos.filter((x) => x.estoque <= 0)
  const valor = insumos.reduce((t, x) => t + x.estoque * x.custo, 0)
  const custoSug = comprar.reduce((t, x) => t + sugerido(x) * x.custo, 0)
  const grupos = (Object.keys(NOME_GRUPO_INSUMO) as GrupoInsumo[]).filter((g) => insumos.some((x) => x.grupo === g))

  const lista = useMemo(() => {
    const q = semAcento(busca.trim())
    return insumos
      .filter((x) => (!grupo || x.grupo === grupo) && (!q || semAcento(x.nome).includes(q)))
      .sort((a, b) => a.grupo.localeCompare(b.grupo) || Number(b.estoque < b.minimo) - Number(a.estoque < a.minimo) || a.nome.localeCompare(b.nome))
  }, [insumos, grupo, busca])
  const x = aberto && aberto !== 'novo' ? insumos.find((i) => i.id === aberto) : undefined

  return (
    <>
      <Topo titulo="Material em estoque" sub="Camisa lisa, papel, tinta, lona e brindes em branco: o que tem e o que precisa comprar. O painel avisa antes de acabar.">
        <Baixar rel={() => relInsumos(insumos, fornecedores, dono)} />
        {dono && (
          <button type="button" className="bt bt-forte acao-principal" onClick={() => setAberto('novo')}>
            <Icone nome="somar" tamanho={18} />
            <span>Novo material</span>
          </button>
        )}
      </Topo>
      <section className="saude" aria-label="Situação do material">
        <button type="button" className="saude-c" style={{ '--c': 'var(--ate)', '--f': 'var(--ate-fundo)' } as CSSProperties} onClick={() => setAba('comprar')}>
          <span className="saude-ic">
            <Icone nome="alerta" tamanho={18} />
          </span>
          <span>
            <small>Acabando</small>
            <b>
              {comprar.length} {comprar.length === 1 ? 'item' : 'itens'}
            </b>
            <small>hora de comprar</small>
          </span>
        </button>
        <div className="saude-c" style={{ '--c': 'var(--sai)', '--f': 'var(--sai-fundo)' } as CSSProperties}>
          <span className="saude-ic">
            <Icone nome="relogio" tamanho={18} />
          </span>
          <span>
            <small>Acabou</small>
            <b>{acabou.length}</b>
            <small>{acabou.length ? 'pode travar pedido' : 'nada zerado'}</small>
          </span>
        </div>
        <div className="saude-c" style={{ '--c': 'var(--ent)', '--f': 'var(--ent-fundo)' } as CSSProperties}>
          <span className="saude-ic">
            <Icone nome="estoque" tamanho={18} />
          </span>
          <span>
            <small>Itens cadastrados</small>
            <b>{insumos.length}</b>
            {dono && <small>R$ {brl(valor)} parado em material</small>}
          </span>
        </div>
        <button type="button" className="saude-c" style={{ '--c': 'var(--teal-txt)', '--f': 'var(--teal-fundo)' } as CSSProperties} onClick={() => setAba('comprar')}>
          <span className="saude-ic">
            <Icone nome="compras" tamanho={18} />
          </span>
          <span>
            <small>Sugestão de compra</small>
            <b>{comprar.length} itens</b>
            {dono && <small>R$ {brl(custoSug)} no custo</small>}
          </span>
        </button>
      </section>

      <div className="fichas abas" role="tablist" aria-label="Ver">
        {(
          [
            ['todos', 'Todo o material'],
            ['comprar', `Comprar (${comprar.length})`],
          ] as const
        ).map(([id, nome]) => (
          <button key={id} type="button" role="tab" className="ficha" aria-selected={aba === id} onClick={() => setAba(id)}>
            {nome}
          </button>
        ))}
      </div>

      {aba === 'todos' && (
        <section className="painel">
          <div className="filtros-linha">
            <div className="fichas">
              <button type="button" className="ficha" aria-pressed={!grupo} onClick={() => setGrupo('')}>
                Todos
              </button>
              {grupos.map((g) => (
                <button key={g} type="button" className="ficha" aria-pressed={grupo === g} onClick={() => setGrupo(g)}>
                  {NOME_GRUPO_INSUMO[g]}
                </button>
              ))}
            </div>
            <label className="entrada entrada--p">
              <Icone nome="busca" tamanho={18} />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar material" aria-label="Buscar material" />
            </label>
          </div>
          <div className="tabela-caixa" tabIndex={0} role="region" aria-label="Tabela">
            <table className="tabela est-tab">
              <thead>
                <tr>
                  <th>Material</th>
                  <th className="dir">Tem</th>
                  <th className="dir">Avisar com</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((i) => {
                  const [txt, cls] = situacao(i)
                  return (
                    <tr key={i.id} className="tr-clica" onClick={() => setAberto(i.id)}>
                      <td>
                        <button type="button" className="prod-nome" onClick={() => setAberto(i.id)}>
                          <span>
                            <b>{i.nome}</b>
                            <small>
                              {NOME_GRUPO_INSUMO[i.grupo]}
                              {dono ? `, R$ ${brl(i.custo)} por ${i.unidade}` : ''}
                            </small>
                          </span>
                        </button>
                      </td>
                      <td className="dir num">
                        {num(i.estoque)} {i.unidade}
                      </td>
                      <td className="dir num">{num(i.minimo)}</td>
                      <td>
                        <span className={'pill ' + cls}>{txt}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="mut pequeno nota-tab">Toque no material para tirar o que foi usado ou somar o que chegou. O que você registra em “Compras” já soma sozinho.</p>
        </section>
      )}

      {aba === 'comprar' && (
        <section className="painel">
          <div className="painel-t">
            <h3>O que comprar</h3>
            <span className="mut">o que está acabando; a sugestão compra o dobro do aviso</span>
          </div>
          {comprar.length ? (
            fornecedores
              .filter((f) => comprar.some((i) => i.fornecedorId === f.id))
              .map((f) => {
                const dele = comprar.filter((i) => i.fornecedorId === f.id)
                const total = dele.reduce((t, i) => t + sugerido(i) * i.custo, 0)
                const texto = [`Olá, ${f.nome}! Pedido da ${LOJA.nome}:`, ...dele.map((i) => `• ${sugerido(i)} ${i.unidade} de ${i.nome}`), 'Pode confirmar preço e prazo?'].join('\n')
                return (
                  <div key={f.id} className="repor">
                    <div className="repor-topo">
                      <b>{f.nome}</b>
                      <span className="mut pequeno">
                        {dele.length} itens{dono ? `, R$ ${brl(total)} no custo` : ''}, entrega em {f.prazoDias} dias
                      </span>
                    </div>
                    <ul className="det-itens">
                      {dele.map((i) => (
                        <li key={i.id}>
                          <span>
                            <b>{i.nome}</b>
                            <small>
                              Tem {num(i.estoque)} {i.unidade}. Pedir {sugerido(i)}.
                            </small>
                          </span>
                          {dono && <span className="num">R$ {brl(sugerido(i) * i.custo)}</span>}
                        </li>
                      ))}
                    </ul>
                    <div className="repor-acoes">
                      <a className="btn btn-o" href={linkWhats(f.telefone, texto)} target="_blank" rel="noopener">
                        <Icone nome="whats" tamanho={18} />
                        Pedir no WhatsApp
                      </a>
                      {dono && (
                        <button type="button" className="btn btn-p" onClick={() => pedir({ tela: 'compras', entrada: true })}>
                          Registrar a chegada
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
          ) : (
            <p className="mut">Nada para comprar agora: nenhum material está acabando.</p>
          )}
        </section>
      )}

      {x && <MexerInsumo x={x} dono={dono} fornecedor={nomeFornecedor(fornecedores, x.fornecedorId)} editar={() => setAberto('novo:' + x.id)} fechar={() => setAberto(undefined)} />}
      {aberto?.startsWith('novo') && dono && <EditarInsumo x={insumos.find((i) => 'novo:' + i.id === aberto)} fechar={() => setAberto(undefined)} />}
    </>
  )
}

/** Usei (tirar) do que a produção usou ou somar o que chegou. */
function MexerInsumo({ x, dono, fornecedor, editar, fechar }: { x: Insumo; dono: boolean; fornecedor: string; editar: () => void; fechar: () => void }) {
  const [qtd, setQtd] = useState('')
  const n = Number(qtd.replace(',', '.')) || 0
  const mexer = (sinal: 1 | -1) => {
    if (!n) return
    negocio.mexerInsumo(x.id, sinal * n)
    avisar(sinal > 0 ? `Somado: ${num(n)} ${x.unidade}.` : `Baixa de ${num(n)} ${x.unidade}.`)
    setQtd('')
  }
  const [txt, cls] = situacao(x)
  return (
    <Gaveta
      titulo={x.nome}
      sub={`${NOME_GRUPO_INSUMO[x.grupo]}. Tem ${num(x.estoque)} ${x.unidade}; avisa quando tiver menos de ${num(x.minimo)}.`}
      fechar={fechar}
      pe={
        <>
          <button type="button" className="btn btn-o" disabled={!n} onClick={() => mexer(-1)}>
            Usei (tirar)
          </button>
          <button type="button" className="btn btn-p" disabled={!n} onClick={() => mexer(1)}>
            <Icone nome="somar" tamanho={18} />
            Chegou (somar)
          </button>
        </>
      }
    >
      <div className="det-num">
        <div>
          <p>Tem agora</p>
          <b>
            {num(x.estoque)} {x.unidade}
          </b>
        </div>
        <div>
          <p>Situação</p>
          <b>
            <span className={'pill ' + cls}>{txt}</span>
          </b>
        </div>
        {dono && (
          <div>
            <p>Custo</p>
            <b>R$ {brl(x.custo)}</b>
          </div>
        )}
        <div>
          <p>Fornecedor</p>
          <b>{fornecedor}</b>
        </div>
      </div>
      <label className="campo">
        Quantidade ({x.unidade})
        <input inputMode="decimal" value={qtd} onChange={(e) => setQtd(e.target.value.replace(/[^\d,.]/g, ''))} placeholder="Ex.: 12" autoFocus />
      </label>
      <p className="mut pequeno">“Usei”: tira do estoque o que a produção gastou ou perdeu. “Chegou”: soma o que chegou sem passar por “Compras”.</p>
      {dono && (
        <button type="button" className="link-bt" onClick={editar}>
          Editar nome, aviso e custo
        </button>
      )}
    </Gaveta>
  )
}

function EditarInsumo({ x, fechar }: { x?: Insumo; fechar: () => void }) {
  const fornecedores = useDados('fornecedores')
  const [f, setF] = useState<Omit<Insumo, 'id'> & { id?: string }>(
    x ?? { nome: '', grupo: 'camisas', unidade: 'un', estoque: 0, minimo: 1, custo: 0, fornecedorId: fornecedores[0]?.id },
  )
  const ok = f.nome.trim().length > 1 && f.unidade.trim()
  return (
    <Gaveta
      titulo={x ? 'Editar material' : 'Novo material'}
      sub="Quando tiver menos que o número de “Avisar com”, o painel avisa para comprar."
      fechar={fechar}
      pe={
        <button
          type="button"
          className="btn btn-p"
          disabled={!ok}
          onClick={() => {
            negocio.salvarInsumo({ ...f, nome: f.nome.trim() })
            avisar(x ? 'Insumo salvo.' : 'Insumo cadastrado.')
            fechar()
          }}
        >
          Salvar
        </button>
      }
    >
      <label className="campo">
        Nome
        <input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Ex.: Camisa algodão branca M" />
      </label>
      <div className="form-g form-g--3">
        <label className="campo">
          Grupo
          <select value={f.grupo} onChange={(e) => setF({ ...f, grupo: e.target.value as GrupoInsumo })}>
            {(Object.keys(NOME_GRUPO_INSUMO) as GrupoInsumo[]).map((g) => (
              <option key={g} value={g}>
                {NOME_GRUPO_INSUMO[g]}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          Unidade
          <input value={f.unidade} onChange={(e) => setF({ ...f, unidade: e.target.value })} placeholder="un, folha, metro…" />
        </label>
        <label className="campo">
          Fornecedor
          <select value={f.fornecedorId ?? ''} onChange={(e) => setF({ ...f, fornecedorId: e.target.value || undefined })}>
            <option value="">—</option>
            {fornecedores.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nome}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-g form-g--3">
        <label className="campo">
          Tem agora
          <input inputMode="decimal" value={f.estoque} onChange={(e) => setF({ ...f, estoque: Number(e.target.value.replace(',', '.')) || 0 })} />
        </label>
        <label className="campo">
          Avisar quando tiver menos de
          <input inputMode="decimal" value={f.minimo} onChange={(e) => setF({ ...f, minimo: Number(e.target.value.replace(',', '.')) || 0 })} />
        </label>
        <CampoDinheiro rotulo="Custo por unidade" valor={f.custo} mudar={(v) => setF({ ...f, custo: v })} />
      </div>
    </Gaveta>
  )
}
