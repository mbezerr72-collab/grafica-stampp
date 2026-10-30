import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { hoje, negocio, useDados, type Sessao } from '../../data/store'
import { NOME_ORIGEM_PEDIDO, NOMES_STATUS_ORC, type Orcamento, type OrigemPedido, type StatusOrcamento } from '../../data/negocio'
import { CampoDinheiro, Icone, Topo, avisar } from '../ui'
import { MiniKpi, brl } from '../escala/componentes'
import { Gaveta } from '../escala/Gaveta'
import { diasEntre, somaDias } from '../escala/periodo'
import { linkWhats, mensagemOrcamento } from '../escala/documentos'
import { link } from '../rota'

const ETAPAS: StatusOrcamento[] = ['novo', 'respondido', 'aprovado', 'recusado']
const COR: Record<StatusOrcamento, string> = { novo: 'var(--inf)', respondido: 'var(--ate)', aprovado: 'var(--ent)', recusado: 'var(--mut)' }
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const quando = (d: string, h: string) => (d === h ? 'hoje' : d === somaDias(h, -1) ? 'ontem' : diasEntre(d, h) < 7 ? SEMANA[new Date(d + 'T12:00:00Z').getUTCDay()] : `${d.slice(8)}/${d.slice(5, 7)}`)

/** Orçamentos: o que chega pelo site e pelo WhatsApp. Responde com valor e prazo; quando o cliente fecha, vira pedido. */
export default function Orcamentos({ id }: { s: Sessao; id?: string }) {
  const orcamentos = useDados('orcamentos')
  const { produtos } = useDados('catalogo')
  const h = hoje()
  const [busca, setBusca] = useState('')
  const [aba, setAba] = useState<StatusOrcamento>('novo')
  const [aberto, setAberto] = useState<string>()
  const [novo, setNovo] = useState(false)
  useEffect(() => {
    const o = id ? orcamentos.find((x) => x.numero === id || x.id === id) : undefined
    if (o) setAberto(o.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])
  const nomeProduto = (pid: string) => produtos.find((p) => p.id === pid)?.nome ?? 'Produto'
  const mes = h.slice(0, 7)
  const doMes = orcamentos.filter((o) => o.data.startsWith(mes))
  const fechados = doMes.filter((o) => o.status === 'aprovado')
  const decididos = doMes.filter((o) => o.status === 'aprovado' || o.status === 'recusado')
  const esperando = orcamentos.filter((o) => o.status === 'respondido')
  const lista = useMemo(() => {
    const q = semAcento(busca.trim())
    return orcamentos
      .filter((o) => o.status === 'novo' || o.status === 'respondido' || o.data >= somaDias(h, -30))
      .filter((o) => !q || semAcento(`${o.numero} ${o.nome} ${nomeProduto(o.produtoId)}`).includes(q))
      .sort((a, b) => a.data.localeCompare(b.data) * (a.status === 'novo' ? 1 : -1))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orcamentos, busca, h, produtos])
  const o = orcamentos.find((x) => x.id === aberto)

  return (
    <>
      <Topo titulo="Orçamentos" sub="Clientes pedindo preço, pelo site e pelo WhatsApp. Responda com valor e prazo; quando o cliente topar, vira pedido.">
        <button type="button" className="bt bt-forte acao-principal" onClick={() => setNovo(true)}>
          <Icone nome="somar" tamanho={18} />
          <span>Novo orçamento</span>
        </button>
      </Topo>
      <section className="kpis-menores">
        <MiniKpi rotulo="Para responder" valor={orcamentos.filter((x) => x.status === 'novo').length} nota="o cliente está esperando" classe={orcamentos.some((x) => x.status === 'novo') ? 'desce' : undefined} />
        <MiniKpi rotulo="Esperando o cliente" valor={esperando.length} nota={`R$ ${brl(esperando.reduce((t, x) => t + (x.valor ?? 0), 0))} esperando resposta`} />
        <MiniKpi rotulo="Fechados no mês" valor={fechados.length} nota={`R$ ${brl(fechados.reduce((t, x) => t + (x.valor ?? 0), 0))}`} />
        <MiniKpi rotulo="Quantos fecharam" valor={decididos.length ? `${Math.round((fechados.length / decididos.length) * 100)}%` : '—'} nota="dos que já decidiram no mês" />
      </section>

      <div className="os-barra">
        <label className="entrada entrada--p">
          <Icone nome="busca" tamanho={18} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, produto ou número" aria-label="Buscar orçamento" />
        </label>
      </div>

      <div className="fichas os-abas" role="tablist" aria-label="Etapa">
        {ETAPAS.map((e) => (
          <button key={e} type="button" role="tab" className="ficha" aria-selected={aba === e} onClick={() => setAba(e)}>
            <i className="ponto-c" style={{ '--c': COR[e] } as CSSProperties} />
            {NOMES_STATUS_ORC[e]} <b>{lista.filter((x) => x.status === e).length}</b>
          </button>
        ))}
      </div>

      <section className="quadro quadro--4" aria-label="Orçamentos por etapa">
        {ETAPAS.map((e) => {
          const da = lista.filter((x) => x.status === e)
          return (
            <div key={e} className={'coluna' + (aba === e ? ' ativa' : '')}>
              <p className="col-t" style={{ '--c': COR[e] } as CSSProperties}>
                <i />
                {NOMES_STATUS_ORC[e]}
                <span>{da.length}</span>
              </p>
              {da.map((x) => (
                <article key={x.id} className={'os-c' + (x.status === 'novo' && diasEntre(x.data.slice(0, 10), h) > 2 ? ' atrasada' : '')}>
                  <button type="button" className="os-abrir" onClick={() => setAberto(x.id)}>
                    <span className="os-cab">
                      <b className="n">{x.numero}</b>
                      <span>{quando(x.data.slice(0, 10), h)}</span>
                      <span className={'pill ' + (x.origem === 'site' ? 'inf' : 'neu')}>{NOME_ORIGEM_PEDIDO[x.origem]}</span>
                    </span>
                    <b className="os-ap">
                      {x.qtd > 1 ? `${x.qtd} × ` : ''}
                      {nomeProduto(x.produtoId)}
                    </b>
                    <span className="os-cli">{x.nome}</span>
                    <span className="os-val num">{x.valor ? `R$ ${brl(x.valor)}` : 'sem valor ainda'}</span>
                  </button>
                  {x.status === 'novo' && (
                    <button type="button" className="os-prox" onClick={() => setAberto(x.id)}>
                      Responder
                      <Icone nome="seta" tamanho={14} />
                    </button>
                  )}
                </article>
              ))}
              {!da.length && <p className="mut pequeno col-vazia">Nenhum orçamento aqui.</p>}
            </div>
          )
        })}
      </section>

      {o && <Detalhe o={o} nomeProduto={nomeProduto(o.produtoId)} fechar={() => setAberto(undefined)} />}
      {novo && (
        <NovoOrcamento
          fechar={(id) => {
            setNovo(false)
            if (id) setAberto(id)
          }}
        />
      )}
    </>
  )
}

function Detalhe({ o, nomeProduto, fechar }: { o: Orcamento; nomeProduto: string; fechar: () => void }) {
  const equipe = useDados('equipe')
  const { produtos } = useDados('catalogo')
  const p = produtos.find((x) => x.id === o.produtoId)
  const sugestao = p ? Math.round(Math.min(...p.variacoes.map((v) => v.pix)) * o.qtd * 100) / 100 : 0
  const [valor, setValor] = useState(o.valor ?? sugestao)
  const [prazo, setPrazo] = useState(o.prazoDias ?? p?.prazoDias ?? 5)
  const quemFaz = equipe.filter((e) => e.ativo && e.papel !== 'atendimento')
  const [responsavelId, setResponsavelId] = useState(quemFaz.find((e) => e.papel === 'designer')?.id ?? quemFaz[0]?.id ?? '')
  const atual = { ...o, valor, prazoDias: prazo }
  const texto = mensagemOrcamento(atual, nomeProduto)
  const aberto = o.status === 'novo' || o.status === 'respondido'
  return (
    <Gaveta
      titulo={`Orçamento ${o.numero}`}
      sub={`${o.qtd > 1 ? o.qtd + ' × ' : ''}${nomeProduto}. ${NOMES_STATUS_ORC[o.status]}.`}
      fechar={fechar}
      pe={
        aberto ? (
          <>
            <a
              className="btn btn-o"
              href={linkWhats(o.telefone, texto)}
              target="_blank"
              rel="noopener"
              onClick={() => {
                negocio.salvarOrcamento({ ...atual, status: 'respondido' })
                avisar('Orçamento respondido.')
              }}
            >
              <Icone nome="whats" tamanho={18} />
              Responder no WhatsApp
            </a>
            <button
              type="button"
              className="btn btn-p"
              onClick={() => {
                negocio.salvarOrcamento(atual)
                const ped = negocio.aprovarOrcamento(o.id, responsavelId)
                if (ped) {
                  avisar(`Fechado! Virou o pedido ${ped.numero}.`)
                  location.hash = link('pedidos', String(ped.numero))
                }
              }}
            >
              <Icone nome="check" tamanho={18} />
              Cliente fechou
            </button>
          </>
        ) : o.pedidoId ? (
          <a className="btn btn-p" href={link('pedidos')}>
            Ver o pedido
          </a>
        ) : undefined
      }
    >
      <div className="det-bloco">
        <p className="det-rot">Cliente</p>
        <p>
          {o.nome}, {o.telefone} · veio pelo {NOME_ORIGEM_PEDIDO[o.origem].toLowerCase()}
        </p>
      </div>
      <div className="det-bloco">
        <p className="det-rot">O que o cliente pediu</p>
        <ul className="det-itens">
          <li>
            <span>Quantidade</span>
            <span className="num">{o.qtd}</span>
          </li>
          {o.respostas.map(([k, v], i) => (
            <li key={i}>
              <span>
                <b>{k}</b>
                <small>{v}</small>
              </span>
            </li>
          ))}
        </ul>
      </div>
      {aberto && (
        <>
          <div className="form-g form-g--3">
            <CampoDinheiro rotulo="Valor total" valor={valor} mudar={setValor} />
            <label className="campo">
              Prazo (dias úteis)
              <input inputMode="numeric" value={prazo} onChange={(e) => setPrazo(Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1))} />
            </label>
            <label className="campo">
              Quem cuida se fechar
              <select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
                {quemFaz.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {sugestao > 0 && (
            <p className="mut pequeno">
              Pela tabela, {o.qtd} × {nomeProduto.toLowerCase()} sai a partir de R$ {brl(sugestao)}.
            </p>
          )}
          {p && (p.unidade === 'm²' || p.variacoes.some((v) => v.cor.includes('m²'))) && <CalculaM2 o={o} variacoes={p.variacoes} usar={setValor} />}
          <p className="det-rot">Mensagem que vai para o cliente</p>
          <pre className="msg-previa">{texto}</pre>
          <div className="det-desfazer">
            <button
              type="button"
              className="bt bt-leve bt-pequeno"
              onClick={() => {
                negocio.salvarOrcamento({ ...atual, status: 'recusado' })
                avisar('Marcado como não fechou.')
                fechar()
              }}
            >
              Cliente não fechou
            </button>
          </div>
        </>
      )}
    </Gaveta>
  )
}

/** Orçamento que chegou por fora do site (WhatsApp, Instagram, balcão). */
function NovoOrcamento({ fechar }: { fechar: (id?: string) => void }) {
  const { produtos } = useDados('catalogo')
  const orcamentos = useDados('orcamentos')
  const ativos = produtos.filter((p) => p.ativo)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [produtoId, setProdutoId] = useState(ativos[0]?.id ?? '')
  const [qtd, setQtd] = useState(1)
  const [pedido, setPedido] = useState('')
  const [origem, setOrigem] = useState<OrigemPedido>('whatsapp')
  const ok = nome.trim().length > 1 && telefone.replace(/\D/g, '').length >= 10 && !!produtoId
  return (
    <Gaveta
      titulo="Novo orçamento"
      sub="Para o que chegou pelo WhatsApp, Instagram ou balcão. O do site entra sozinho."
      fechar={() => fechar()}
      pe={
        <button
          type="button"
          className="btn btn-p"
          disabled={!ok}
          onClick={() => {
            const n = orcamentos.filter((x) => x.numero.startsWith('ORC-')).length + 1
            const id = 'orc-' + Date.now().toString(36)
            negocio.salvarOrcamento({ id, numero: `ORC-${String(n).padStart(4, '0')}`, data: new Date().toISOString(), origem, nome: nome.trim(), telefone: telefone.trim(), produtoId, respostas: pedido.trim() ? [['Como o cliente quer', pedido.trim()]] : [], qtd, status: 'novo' })
            avisar('Orçamento registrado.')
            fechar(id)
          }}
        >
          Registrar
        </button>
      }
    >
      <div className="form-g form-g--3">
        <label className="campo">
          Nome do cliente
          <input value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>
        <label className="campo">
          WhatsApp
          <input inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(68) 99999-9999" />
        </label>
        <label className="campo">
          Veio pelo
          <select value={origem} onChange={(e) => setOrigem(e.target.value as OrigemPedido)}>
            {(Object.keys(NOME_ORIGEM_PEDIDO) as OrigemPedido[])
              .filter((x) => x !== 'site')
              .map((x) => (
                <option key={x} value={x}>
                  {NOME_ORIGEM_PEDIDO[x]}
                </option>
              ))}
          </select>
        </label>
      </div>
      <div className="form-g form-g--3">
        <label className="campo">
          Produto
          <select value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
            {ativos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          Quantidade
          <input inputMode="numeric" value={qtd} onChange={(e) => setQtd(Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1))} />
        </label>
      </div>
      <label className="campo">
        Como o cliente quer
        <textarea rows={3} value={pedido} onChange={(e) => setPedido(e.target.value)} placeholder="Ex.: 30 camisas brancas, logo no peito e nome nas costas" />
      </label>
    </Gaveta>
  )
}

/** Lê a medida que o cliente escreveu ("200 × 100 cm", "2x1 m"): largura e altura em metros. Acima de 20 entende como cm. */
export function lerMedida(texto: string): [number, number] | null {
  const m = texto.replace(/,/g, '.').match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(cm|m)?/i)
  if (!m) return null
  const emCm = m[3]?.toLowerCase() === 'cm' || (!m[3] && (Number(m[1]) > 20 || Number(m[2]) > 20))
  const f = emCm ? 100 : 1
  return [Number(m[1]) / f, Number(m[2]) / f]
}

/** Banner, lona e adesivo: largura × altura × quantidade × preço do m². Cobra no mínimo 1 m² por peça. */
function CalculaM2({ o, variacoes, usar }: { o: Orcamento; variacoes: { cor: string; pix: number }[]; usar: (v: number) => void }) {
  const doM2 = variacoes.filter((v) => v.cor.includes('m²'))
  const opcoes = doM2.length ? doM2 : variacoes
  const lida = o.respostas.map(([, v]) => lerMedida(v)).find(Boolean)
  const [largura, setLargura] = useState(lida ? String(lida[0]).replace('.', ',') : '')
  const [altura, setAltura] = useState(lida ? String(lida[1]).replace('.', ',') : '')
  const [qtd, setQtd] = useState(o.qtd || 1)
  const [preco, setPreco] = useState(opcoes[0]?.pix ?? 0)
  const num = (s: string) => Number(s.replace(',', '.')) || 0
  const area = num(largura) * num(altura)
  const cobrada = Math.max(1, area) * qtd
  const total = Math.round(cobrada * preco * 100) / 100
  return (
    <div className="det-bloco">
      <p className="det-rot">Calcular por m²{lida ? ' · medida lida do pedido do cliente' : ''}</p>
      <div className="form-g form-g--3">
        <label className="campo">
          Largura (m)
          <input inputMode="decimal" placeholder="Ex.: 2" value={largura} onChange={(e) => setLargura(e.target.value.replace(/[^\d,.]/g, ''))} />
        </label>
        <label className="campo">
          Altura (m)
          <input inputMode="decimal" placeholder="Ex.: 1" value={altura} onChange={(e) => setAltura(e.target.value.replace(/[^\d,.]/g, ''))} />
        </label>
        <label className="campo">
          Quantidade
          <input inputMode="numeric" value={qtd} onChange={(e) => setQtd(Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1))} />
        </label>
        <label className="campo">
          Material
          <select value={preco} onChange={(e) => setPreco(Number(e.target.value))}>
            {opcoes.map((v) => (
              <option key={v.cor} value={v.pix}>
                {v.cor}: R$ {brl(v.pix)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {area > 0 && (
        <div className="cli-novo-acoes" style={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <p className="pequeno">
            {area.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m² por peça
            {area < 1 ? ' (cobra 1 m², o mínimo)' : ''} × {qtd} = <b>{cobrada.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m²</b> × R$ {brl(preco)} = <b className="num">R$ {brl(total)}</b>
          </p>
          <button type="button" className="bt bt-forte bt-pequeno" onClick={() => { usar(total); avisar(`Valor do orçamento: R$ ${brl(total)}.`) }}>
            Usar este valor
          </button>
        </div>
      )}
    </div>
  )
}
