import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { hoje, negocio, somaDiaUtil, useDados, type Pedido, type Sessao } from '../../data/store'
import { tituloPedido, ETAPAS_PEDIDO, NOME_ORIGEM_PEDIDO, NOMES_FORMA, NOMES_STATUS_PEDIDO, pecasPedido, totalPedido, type FormaPag, type ItemPedido, type OrigemPedido, type StatusPedido } from '../../data/negocio'
import { NOME_SETOR, type Setor } from '../../data/produtos'
import { CampoDinheiro, Contador, Icone, Topo, avisar } from '../ui'
import { MiniKpi, brl } from '../escala/componentes'
import { Gaveta } from '../escala/Gaveta'
import { EscolherCliente } from '../escala/EscolherCliente'
import { diasEntre, nomeMes, somaDias } from '../escala/periodo'
import { fichaProducaoPdf, gradeTexto, linkAprovacao, linkWhats, mensagemPedido } from '../escala/documentos'
import { Baixar } from '../escala/Baixar'
import { relPedidos } from '../escala/relatorios'
import { pegarPedido } from '../escala/pedido'
import { FeitoFora, ListaNomes } from './PedidoExtras'

const COR: Record<StatusPedido, string> = { novo: 'var(--inf)', arte: 'var(--roxo)', aprovacao: 'var(--ate)', producao: 'var(--teal)', pronto: 'var(--ent)', entregue: 'var(--mut)' }
const PROXIMO: Partial<Record<StatusPedido, [StatusPedido, string]>> = {
  novo: ['arte', 'Começar a arte'],
  arte: ['aprovacao', 'Mandar a arte'],
  aprovacao: ['producao', 'Cliente aprovou'],
  producao: ['pronto', 'Marcar pronto'],
  pronto: ['entregue', 'Entregar'],
}
export const TAMANHOS_MASC = ['PP', 'P', 'M', 'G', 'GG', 'EXG']
export const TAMANHOS_FEM = ['PPBL', 'PBL', 'MBL', 'GBL', 'GGBL', 'EXGBL']
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const quando = (d: string, h: string) => (d === h ? 'hoje' : d === somaDias(h, -1) ? 'ontem' : diasEntre(d, h) < 7 ? SEMANA[new Date(d + 'T12:00:00Z').getUTCDay()] : `${d.slice(8)}/${d.slice(5, 7)}`)
const titulo = tituloPedido

/** Pedidos de produção: quadro do pedido novo à entrega, WhatsApp a cada etapa e a ficha de produção em PDF. */
export default function Pedidos({ id }: { s: Sessao; id?: string }) {
  const pedidos = useDados('pedidos')
  const clientes = useDados('clientes')
  const equipe = useDados('equipe')
  const h = hoje()
  const [busca, setBusca] = useState('')
  const [soAtrasados, setSoAtrasados] = useState(false)
  const [aba, setAba] = useState<StatusPedido>('novo')
  const [aberto_, setAberto] = useState<string>()
  const [pedidoTela] = useState(() => pegarPedido('pedidos'))
  const [novo, setNovo] = useState<false | { clienteId?: string }>(() => (pedidoTela?.nova ? { clienteId: pedidoTela.clienteId } : false))
  const [entregando, setEntregando] = useState<string>()
  // Abriu o link #/pedidos/2041: o pedido abre direto.
  useEffect(() => {
    const n = Number(id ?? (pedidoTela && !pedidoTela.nova ? pedidoTela.abrir : 0))
    const o = n ? pedidos.find((x) => x.numero === n) : undefined
    if (o) setAberto(o.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])
  // Depois de mudar a etapa, oferece mandar a mensagem ao cliente.
  const [avisar_, setAvisar] = useState<string>()

  const atrasado = (o: Pedido) => o.status !== 'entregue' && o.status !== 'pronto' && o.prazo < h
  const andamento = pedidos.filter((o) => o.status !== 'entregue')
  const prontos = pedidos.filter((o) => o.status === 'pronto')
  const mes = h.slice(0, 7)
  const entreguesMes = pedidos.filter((o) => o.entregueEm?.startsWith(mes))
  const entreguesAnt = pedidos.filter((o) => o.entregueEm?.startsWith(somaDias(mes + '-01', -1).slice(0, 7)))
  const tempos = pedidos.filter((o) => o.entregueEm && o.entregueEm >= somaDias(h, -60)).map((o) => diasEntre(o.criadoEm, o.entregueEm!) - 1)
  const lista = useMemo(() => {
    const q = semAcento(busca.trim())
    return pedidos
      .filter((o) => o.status !== 'entregue' || (o.entregueEm ?? '') >= somaDias(h, -7))
      .filter((o) => !soAtrasados || atrasado(o))
      .filter((o) => {
        if (!q) return true
        const c = clientes.find((x) => x.id === o.clienteId)
        return semAcento(`${o.numero} ${titulo(o)} ${o.descricao} ${c?.nome ?? ''}`).includes(q)
      })
      // Os atrasados sobem; depois, o prazo mais curto.
      .sort((a, b) => Number(atrasado(b)) - Number(atrasado(a)) || a.prazo.localeCompare(b.prazo) || b.numero - a.numero)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidos, busca, soAtrasados, clientes, h])
  const aberto = pedidos.find((o) => o.id === aberto_)
  const paraAvisar = pedidos.find((o) => o.id === avisar_)
  const paraEntregar = pedidos.find((o) => o.id === entregando)
  const mudar = (o: Pedido, s: StatusPedido) => {
    if (s === 'entregue' && !o.vendaId) return setEntregando(o.id)
    negocio.mudarStatusPedido(o.id, s)
    avisar(`Pedido ${o.numero}: ${NOMES_STATUS_PEDIDO[s]}.`)
    setAvisar(o.id)
  }
  const nomeDe = (id: string) => equipe.find((e) => e.id === id)?.nome ?? '—'

  const cartao = (o: Pedido) => {
    const c = clientes.find((x) => x.id === o.clienteId)
    const prox = PROXIMO[o.status]
    const avisado = o.avisados?.includes(o.status)
    return (
      <article key={o.id} className={'os-c' + (atrasado(o) ? ' atrasada' : '')}>
        <button type="button" className="os-abrir" onClick={() => setAberto(o.id)}>
          <span className="os-cab">
            <b className="n">Pedido {o.numero}</b>
            <span>{quando(o.historico[o.historico.length - 1]?.quando ?? o.criadoEm, h)}</span>
            {atrasado(o) ? (
              <span className="pill sai">
                {diasEntre(o.prazo, h) - 1 || 1} dia{diasEntre(o.prazo, h) - 1 > 1 ? 's' : ''} atrasado
              </span>
            ) : o.status === 'pronto' || o.status === 'aprovacao' ? (
              <span className={'pill ' + (avisado ? 'ent' : 'ate')}>{avisado ? 'cliente avisado' : 'falta avisar'}</span>
            ) : o.status !== 'entregue' ? (
              <span className="pill neu">prazo {quando(o.prazo, h) === 'hoje' ? 'hoje' : `${o.prazo.slice(8)}/${o.prazo.slice(5, 7)}`}</span>
            ) : null}
          </span>
          <b className="os-ap">{titulo(o)}</b>
          <span className="os-cli">
            {c?.nome ?? 'Cliente'} · {NOME_SETOR[o.setor]}
          </span>
          <span className="os-val num">
            R$ {brl(totalPedido(o))}
            {o.sinal > 0 && o.status !== 'entregue' ? ` · entrada R$ ${brl(o.sinal)}` : ''}
          </span>
        </button>
        {prox && (
          <button type="button" className="os-prox" onClick={() => mudar(o, prox[0])}>
            {prox[1]}
            <Icone nome="seta" tamanho={14} />
          </button>
        )}
      </article>
    )
  }

  return (
    <>
      <Topo titulo="Pedidos" sub="Encomendas, do pedido novo até a entrega. Cada vez que o pedido anda, a mensagem do WhatsApp já fica pronta.">
        <Baixar rel={() => relPedidos(pedidos, clientes, somaDias(h, -89), h, 'Últimos 90 dias. Gráfica Estamp.')} />
        <button type="button" className="bt bt-forte acao-principal" onClick={() => setNovo({})}>
          <Icone nome="somar" tamanho={18} />
          <span>Novo pedido</span>
        </button>
      </Topo>
      <section className="kpis-menores">
        <MiniKpi rotulo="Em andamento" valor={andamento.length} nota={`${andamento.filter(atrasado).length} atrasados`} classe={andamento.some(atrasado) ? 'desce' : undefined} />
        <MiniKpi rotulo="Prontos para entregar" valor={prontos.length} nota={`R$ ${brl(prontos.reduce((t, o) => t + totalPedido(o) - o.sinal, 0))} a receber`} />
        <MiniKpi rotulo={`Entregue em ${nomeMes(h)}`} valor={'R$ ' + brl(entreguesMes.reduce((t, o) => t + totalPedido(o), 0))} nota={`${entreguesMes.length} pedidos (${entreguesAnt.length} no mês passado)`} />
        <MiniKpi rotulo="Tempo médio" valor={`${tempos.length ? (tempos.reduce((t, x) => t + x, 0) / tempos.length).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : 0} dias`} nota="do pedido à entrega" />
      </section>

      <div className="os-barra">
        <label className="entrada entrada--p">
          <Icone nome="busca" tamanho={18} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por cliente, produto ou nº do pedido" aria-label="Buscar pedido" />
        </label>
        <button type="button" className="ficha" aria-pressed={soAtrasados} onClick={() => setSoAtrasados(!soAtrasados)}>
          Só atrasados ({andamento.filter(atrasado).length})
        </button>
      </div>

      <div className="fichas os-abas" role="tablist" aria-label="Etapa">
        {ETAPAS_PEDIDO.map((e) => (
          <button key={e} type="button" role="tab" className="ficha" aria-selected={aba === e} onClick={() => setAba(e)}>
            <i className="ponto-c" style={{ '--c': COR[e] } as CSSProperties} />
            {NOMES_STATUS_PEDIDO[e]} <b>{lista.filter((o) => o.status === e).length}</b>
          </button>
        ))}
      </div>

      <section className="quadro" aria-label="Quadro dos pedidos por etapa">
        {ETAPAS_PEDIDO.map((e) => {
          const da = lista.filter((o) => o.status === e)
          return (
            <div key={e} className={'coluna' + (aba === e ? ' ativa' : '')}>
              <p className="col-t" style={{ '--c': COR[e] } as CSSProperties}>
                <i />
                {NOMES_STATUS_PEDIDO[e]}
                <span>{da.length}</span>
              </p>
              {da.map(cartao)}
              {!da.length && <p className="mut pequeno col-vazia">Nenhum pedido aqui.</p>}
            </div>
          )
        })}
      </section>

      {aberto && <DetalhePedido o={aberto} fechar={() => setAberto(undefined)} mudar={mudar} responsavel={nomeDe(aberto.responsavelId)} />}
      {novo && (
        <NovoPedido
          inicial={novo}
          fechar={(id) => {
            setNovo(false)
            if (id) {
              setAvisar(id)
              setAba('novo')
            }
          }}
        />
      )}
      {paraEntregar && (
        <Entregar
          o={paraEntregar}
          fechar={(ok) => {
            setEntregando(undefined)
            if (ok) setAvisar(paraEntregar.id)
          }}
        />
      )}
      {paraAvisar && !aberto && !paraEntregar && <AvisarCliente o={paraAvisar} fechar={() => setAvisar(undefined)} responsavel={nomeDe(paraAvisar.responsavelId)} />}
    </>
  )
}

/** Depois de mudar a etapa: a mensagem pronta para o cliente, com o botão do WhatsApp. */
function AvisarCliente({ o, fechar, responsavel }: { o: Pedido; fechar: () => void; responsavel: string }) {
  const clientes = useDados('clientes')
  const c = clientes.find((x) => x.id === o.clienteId)
  const texto = mensagemPedido(o, c)
  return (
    <Gaveta
      titulo={`Avisar ${c?.nome.split(' ')[0] ?? 'o cliente'}?`}
      sub={`Pedido ${o.numero} agora está em “${NOMES_STATUS_PEDIDO[o.status]}”.`}
      fechar={fechar}
      pe={
        <>
          {(o.status === 'novo' || o.status === 'producao') && (
            <button type="button" className="btn btn-o" onClick={() => fichaProducaoPdf(o, c, responsavel)}>
              <Icone nome="relatorio" tamanho={18} />
              Ficha de produção
            </button>
          )}
          <a
            className="btn btn-p"
            href={linkWhats(c?.telefone, texto)}
            target="_blank"
            rel="noopener"
            onClick={() => {
              negocio.avisouPedido(o.id)
              fechar()
            }}
          >
            <Icone nome="whats" tamanho={18} />
            Mandar no WhatsApp
          </a>
        </>
      }
    >
      <pre className="msg-previa">{texto}</pre>
      <p className="mut pequeno">A mensagem abre no WhatsApp pronta para enviar. Você pode mudar antes de mandar.</p>
    </Gaveta>
  )
}

/** Entrega: cobra o que falta (o sinal já foi pago) e o pedido vira venda. */
function Entregar({ o, fechar }: { o: Pedido; fechar: (ok?: boolean) => void }) {
  const equipe = useDados('equipe')
  const s = useDados('sessao')
  const falta = Math.max(0, Math.round((totalPedido(o) - o.sinal) * 100) / 100)
  const [forma, setForma] = useState<FormaPag>('pix')
  const [parcelas, setParcelas] = useState(1)
  const vendedor = equipe.find((e) => e.nome === s?.nome)?.id ?? equipe.find((e) => e.papel === 'atendimento')?.id ?? equipe[0]?.id ?? ''
  const entregar = () => {
    const v = negocio.entregarPedido(o.id, falta > 0 ? [{ forma, valor: falta, ...(forma === 'credito' ? { parcelas } : {}) }] : [], vendedor)
    if (v) avisar(`Pedido ${o.numero} entregue. Venda nº ${v.numero} registrada.`)
    fechar(!!v)
  }
  return (
    <Gaveta
      titulo={`Entregar o pedido ${o.numero}`}
      sub={`${titulo(o)}. Total R$ ${brl(totalPedido(o))}${o.sinal ? `, entrada de R$ ${brl(o.sinal)} já paga` : ''}.`}
      fechar={() => fechar()}
      pe={
        <button type="button" className="btn btn-p" onClick={entregar}>
          <Icone nome="check" tamanho={18} />
          {falta > 0 ? `Recebi R$ ${brl(falta)} e entreguei` : 'Entreguei'}
        </button>
      }
    >
      <ul className="det-itens">
        {o.itens.map((i, k) => (
          <li key={k}>
            <span>
              {i.qtd}× {i.nome} ({i.opcao})
            </span>
            <span className="num">R$ {brl(i.qtd * i.preco)}</span>
          </li>
        ))}
        {o.sinal > 0 && (
          <li>
            <span>Entrada já paga</span>
            <span className="num">− R$ {brl(o.sinal)}</span>
          </li>
        )}
        <li className="det-total">
          <span>Falta receber</span>
          <span className="num">R$ {brl(falta)}</span>
        </li>
      </ul>
      {falta > 0 && (
        <div className="esc-grupo">
          <span>Como o cliente pagou</span>
          <div className="fichas" role="radiogroup" aria-label="Forma de pagamento">
            {(Object.keys(NOMES_FORMA) as FormaPag[]).map((f) => (
              <button key={f} type="button" role="radio" className="ficha" aria-checked={forma === f} onClick={() => setForma(f)}>
                {NOMES_FORMA[f]}
              </button>
            ))}
          </div>
          {forma === 'credito' && (
            <div className="grade-t">
              Parcelas
              <Contador rotulo="Parcelas" valor={parcelas} mudar={(n) => setParcelas(Math.max(1, Math.min(6, n)))} min={1} />
            </div>
          )}
        </div>
      )}
      <p className="mut pequeno">O pedido entra nas vendas e nos relatórios.</p>
    </Gaveta>
  )
}

function DetalhePedido({ o, fechar, mudar, responsavel }: { o: Pedido; fechar: () => void; mudar: (o: Pedido, s: StatusPedido) => void; responsavel: string }) {
  const clientes = useDados('clientes')
  const c = clientes.find((x) => x.id === o.clienteId)
  const [itens, setItens] = useState(o.itens)
  const [sinal, setSinal] = useState(0)
  const pct = useDados('config').sinalPct ?? 50
  const [forma, setForma] = useState<FormaPag>('pix')
  useEffect(() => setItens(o.itens), [o.itens])
  const mudouItens = JSON.stringify(itens) !== JSON.stringify(o.itens)
  const prox = PROXIMO[o.status]
  const total = totalPedido(o)
  const grade = o.grade ? Object.entries(o.grade).filter(([, n]) => n > 0) : []
  return (
    <Gaveta
      titulo={`Pedido ${o.numero}`}
      sub={`${titulo(o)}. ${NOMES_STATUS_PEDIDO[o.status]}.`}
      fechar={fechar}
      pe={
        <>
          <a className="btn btn-o" href={linkWhats(c?.telefone, mensagemPedido(o, c))} target="_blank" rel="noopener" onClick={() => negocio.avisouPedido(o.id)}>
            <Icone nome="whats" tamanho={18} />
            WhatsApp
          </a>
          {prox ? (
            <button type="button" className="btn btn-p" onClick={() => mudar(o, prox[0])}>
              {prox[1]}
            </button>
          ) : (
            <button type="button" className="btn btn-p" onClick={() => fichaProducaoPdf(o, c, responsavel)}>
              Ficha de produção
            </button>
          )}
        </>
      }
    >
      <div className="os-trilha" aria-label="Etapas">
        {ETAPAS_PEDIDO.map((e, i) => (
          <span key={e} className={ETAPAS_PEDIDO.indexOf(o.status) >= i ? 'feito' : ''} style={{ '--c': COR[e] } as CSSProperties} title={NOMES_STATUS_PEDIDO[e]} />
        ))}
      </div>
      <div className="det-bloco">
        <p className="det-rot">Cliente</p>
        <p>{c ? `${c.nome}, ${c.telefone}` : '—'}</p>
      </div>
      <div className="det-num">
        <div>
          <p>Prazo</p>
          <b>{o.prazo.split('-').reverse().join('/')}</b>
        </div>
        <div>
          <p>Setor</p>
          <b>{NOME_SETOR[o.setor]}</b>
        </div>
        <div>
          <p>Responsável</p>
          <b>{responsavel}</b>
        </div>
        <div>
          <p>Veio pelo</p>
          <b>{NOME_ORIGEM_PEDIDO[o.origem]}</b>
        </div>
      </div>

      <div className="det-bloco">
        <p className="det-rot">Itens</p>
        <ul className="det-itens">
          {itens.map((x, i) => (
            <li key={i} className="orc-lin">
              <input aria-label="Produto e opção" value={`${x.nome} (${x.opcao})`} readOnly />
              <input aria-label="Quantidade" inputMode="numeric" value={x.qtd} onChange={(e) => setItens(itens.map((y, j) => (j === i ? { ...y, qtd: Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1) } : y)))} style={{ maxWidth: 72 }} />
              <CampoDinheiro compacto rotulo="Valor unitário" valor={x.preco} mudar={(v) => setItens(itens.map((y, j) => (j === i ? { ...y, preco: v } : y)))} />
            </li>
          ))}
          <li className="det-total">
            <span>Total</span>
            <span className="num">R$ {brl(itens.reduce((t, x) => t + x.preco * x.qtd, 0))}</span>
          </li>
        </ul>
        {mudouItens && (
          <div className="cli-novo-acoes">
            <button
              type="button"
              className="bt bt-forte bt-pequeno"
              onClick={() => {
                negocio.salvarPedido({ ...o, itens })
                avisar('Pedido salvo.')
              }}
            >
              Salvar valores
            </button>
          </div>
        )}
      </div>

      {grade.length > 0 && (
        <div className="det-bloco">
          <p className="det-rot">Grade de tamanhos · {pecasPedido(o)} peças</p>
          <div className="fichas">
            {grade.map(([t, n]) => (
              <span key={t} className="ficha ficha--dupla" aria-disabled="true">
                {t}
                <small>{n} {n === 1 ? 'peça' : 'peças'}</small>
              </span>
            ))}
          </div>
        </div>
      )}
      {(grade.length > 0 || (o.lista?.length ?? 0) > 0 || ['sublimacao', 'dtf', 'silk', 'bordado'].includes(o.setor)) && <ListaNomes key={o.id + (o.lista?.length ?? 0)} o={o} />}
      {o.cores.length > 0 && (
        <div className="det-bloco">
          <p className="det-rot">Cores</p>
          <p>{o.cores.join(', ')}</p>
        </div>
      )}
      <div className="det-bloco">
        <p className="det-rot">Como o cliente quer</p>
        <p>{o.descricao || '—'}</p>
      </div>
      {o.arquivos.length > 0 && (
        <div className="det-bloco">
          <p className="det-rot">Imagens do cliente</p>
          <ul className="det-itens">
            {o.arquivos.map((a) => (
              <li key={a}>
                <span>{a}</span>
                <span className="mut pequeno">no WhatsApp</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!o.vendaId && <FeitoFora o={o} />}

      <div className="det-bloco">
        <p className="det-rot">Pagamento</p>
        <ul className="det-itens">
          <li>
            <span>Total do pedido</span>
            <span className="num">R$ {brl(total)}</span>
          </li>
          <li>
            <span>Entrada recebida{o.formaSinal ? ` (${NOMES_FORMA[o.formaSinal]})` : ''}</span>
            <span className="num">R$ {brl(o.sinal)}</span>
          </li>
          <li className="det-total">
            <span>{o.vendaId ? 'Pago na entrega' : 'Falta receber'}</span>
            <span className="num">R$ {brl(Math.max(0, total - o.sinal))}</span>
          </li>
        </ul>
        {!o.vendaId && o.sinal < total && (
          <div className="cli-novo-acoes">
            <CampoDinheiro compacto rotulo="Valor da entrada" valor={sinal || Math.round((total * pct) / 100)} mudar={setSinal} />
            <select aria-label="Como pagou a entrada" value={forma} onChange={(e) => setForma(e.target.value as FormaPag)}>
              {(Object.keys(NOMES_FORMA) as FormaPag[]).map((f) => (
                <option key={f} value={f}>
                  {NOMES_FORMA[f]}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="bt bt-forte bt-pequeno"
              onClick={() => {
                const v = sinal || Math.round((total * pct) / 100)
                negocio.receberSinal(o.id, Math.min(v, total - o.sinal), forma)
                avisar(`Entrada de R$ ${brl(v)} recebida.`)
                setSinal(0)
              }}
            >
              Receber entrada
            </button>
          </div>
        )}
      </div>

      {o.status === 'aprovacao' && (
        <div className="aprovar">
          <p className="mut pequeno">
            O cliente recebeu o link para ver a arte: <span className="quebra">{linkAprovacao(o)}</span>. Quando ele aprova, o pedido anda sozinho para “Em produção”.
          </p>
          <button type="button" className="btn btn-o" onClick={() => mudar(o, 'producao')}>
            <Icone nome="check" tamanho={18} />
            Simular: cliente aprovou a arte
          </button>
        </div>
      )}
      <div className="det-bloco">
        <p className="det-rot">O que aconteceu</p>
        <ol className="linha-tempo">
          {o.historico.map((x, i) => (
            <li key={i}>
              <b>{NOMES_STATUS_PEDIDO[x.status]}</b>
              <small>
                {x.quando.split('-').reverse().join('/')}, {x.quem}
              </small>
            </li>
          ))}
        </ol>
      </div>
      <div className="det-desfazer">
        <button type="button" className="bt bt-leve bt-pequeno" onClick={() => fichaProducaoPdf(o, c, responsavel)}>
          Ficha de produção (para imprimir)
        </button>
        <select aria-label="Mudar a etapa" value={o.status} onChange={(e) => mudar(o, e.target.value as StatusPedido)}>
          {ETAPAS_PEDIDO.map((e) => (
            <option key={e} value={e}>
              Mover para: {NOMES_STATUS_PEDIDO[e]}
            </option>
          ))}
        </select>
      </div>
    </Gaveta>
  )
}

const CORES = ['Preta', 'Branca', 'Cinza', 'Azul-marinho', 'Azul', 'Vermelha', 'Verde', 'Amarela', 'Laranja', 'Roxa', 'Rosa', 'Dourada']

/** Novo pedido: cliente, produto e quantidade (grade de tamanhos para camisa), cores, como quer e prazo. */
function NovoPedido({ fechar, inicial }: { fechar: (id?: string) => void; inicial?: { clienteId?: string } }) {
  const clientes = useDados('clientes')
  const equipe = useDados('equipe')
  const catalogo = useDados('catalogo')
  const produtos = catalogo.produtos.filter((p) => p.ativo && p.linha !== 'balcao')
  const [clienteId, setClienteId] = useState<string | undefined>(inicial?.clienteId)
  const [produtoId, setProdutoId] = useState(produtos[0]?.id ?? '')
  const p = produtos.find((x) => x.id === produtoId)
  const [opcao, setOpcao] = useState(p?.variacoes[0]?.cor ?? '')
  const [qtd, setQtd] = useState(1)
  const [grade, setGrade] = useState<Record<string, number>>({})
  const [cores, setCores] = useState<string[]>([])
  const [descricao, setDescricao] = useState('')
  const [origem, setOrigem] = useState<OrigemPedido>('whatsapp')
  const camisa = p?.marca === 'camisas'
  const v = p?.variacoes.find((x) => x.cor === opcao) ?? p?.variacoes[0]
  const pecas = camisa ? Object.values(grade).reduce((a, b) => a + b, 0) : qtd
  const [prazo, setPrazo] = useState('')
  const prazoFinal = prazo || somaDiaUtil(hoje(), p?.prazoDias ?? 5)
  const quemFaz = equipe.filter((e) => e.ativo && e.papel !== 'atendimento')
  const [responsavelId, setResponsavelId] = useState(quemFaz.find((e) => e.papel === 'producao')?.id ?? quemFaz[0]?.id ?? '')
  const ok = !!clienteId && !!p && !!v && pecas > 0
  const salvar = () => {
    if (!ok || !p || !v || !clienteId) return
    const item: ItemPedido = { produtoId: p.id, nome: p.nome, opcao: v.cor, qtd: pecas, preco: v.pix, custo: v.custo }
    const o = negocio.abrirPedido({
      clienteId,
      origem,
      itens: [item],
      descricao: descricao.trim(),
      cores,
      ...(camisa ? { grade } : {}),
      arquivos: [],
      setor: p.setor as Setor,
      responsavelId,
      prazo: prazoFinal,
      sinal: 0,
    })
    avisar(`Pronto! Pedido ${o.numero} aberto.`)
    fechar(o.id)
  }
  const cli = clientes.find((c) => c.id === clienteId)
  return (
    <Gaveta
      titulo="Novo pedido"
      sub="Cliente, produto, quantidade e como ele quer. A arte e a aprovação vêm nas próximas etapas."
      fechar={() => fechar()}
      pe={
        <button type="button" className="btn btn-p" disabled={!ok} onClick={salvar}>
          Abrir pedido{ok && v ? ` (R$ ${brl(v.pix * pecas)})` : ''}
        </button>
      }
    >
      <div className="esc-grupo">
        <span>1. Cliente</span>
        <EscolherCliente clientes={clientes} cliente={cli} mudar={setClienteId} />
      </div>
      <div className="esc-grupo">
        <span>2. Produto</span>
        <select
          aria-label="Produto"
          value={produtoId}
          onChange={(e) => {
            setProdutoId(e.target.value)
            setOpcao(produtos.find((x) => x.id === e.target.value)?.variacoes[0]?.cor ?? '')
          }}
        >
          {produtos.map((x) => (
            <option key={x.id} value={x.id}>
              {x.nome}
            </option>
          ))}
        </select>
        <div className="fichas" role="radiogroup" aria-label="Opção">
          {p?.variacoes.map((x) => (
            <button key={x.cor} type="button" role="radio" className="ficha ficha--dupla" aria-checked={opcao === x.cor} onClick={() => setOpcao(x.cor)}>
              {x.cor}
              <small>R$ {brl(x.pix)}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="esc-grupo">
        <span>3. {camisa ? 'Quantidade por tamanho' : 'Quantidade'}</span>
        {camisa ? (
          <>
            <p className="mut pequeno">Masculino</p>
            <div className="form-g form-g--3">
              {TAMANHOS_MASC.map((t) => (
                <div key={t} className="grade-t">
                  {t}
                  <Contador rotulo={t} valor={grade[t] ?? 0} mudar={(n) => setGrade({ ...grade, [t]: Math.max(0, n) })} />
                </div>
              ))}
            </div>
            <p className="mut pequeno">Feminino (baby look)</p>
            <div className="form-g form-g--3">
              {TAMANHOS_FEM.map((t) => (
                <div key={t} className="grade-t">
                  {t}
                  <Contador rotulo={t} valor={grade[t] ?? 0} mudar={(n) => setGrade({ ...grade, [t]: Math.max(0, n) })} />
                </div>
              ))}
            </div>
            <p className="pag-falta ate">
              {pecas} {pecas === 1 ? 'peça' : 'peças'}
              {pecas ? ` · ${gradeTexto(grade)}` : ''}
            </p>
          </>
        ) : (
          <div className="grade-t">
            Quantidade ({p?.unidade ?? 'un'})
            <Contador rotulo="Quantidade" valor={qtd} mudar={(n) => setQtd(Math.max(1, n))} min={1} />
          </div>
        )}
      </div>
      <div className="esc-grupo">
        <span>4. Cores</span>
        <div className="fichas" role="group" aria-label="Cores">
          {CORES.map((c) => (
            <button key={c} type="button" className="ficha" aria-pressed={cores.includes(c)} onClick={() => setCores(cores.includes(c) ? cores.filter((x) => x !== c) : [...cores, c])}>
              {c}
            </button>
          ))}
        </div>
        {cores.length > 0 && <p className="mut pequeno">{cores.length} {cores.length === 1 ? 'cor' : 'cores'}: {cores.join(', ')}</p>}
      </div>
      <div className="esc-grupo">
        <span>5. Como o cliente quer</span>
        <textarea rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: logo no peito esquerdo, nome e número nas costas, letras brancas" aria-label="Como o cliente quer" />
      </div>
      <div className="form-g form-g--3">
        <label className="campo">
          Prazo
          <input type="date" value={prazoFinal} onChange={(e) => setPrazo(e.target.value)} />
        </label>
        <label className="campo">
          Responsável
          <select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
            {quemFaz.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          Veio pelo
          <select value={origem} onChange={(e) => setOrigem(e.target.value as OrigemPedido)}>
            {(Object.keys(NOME_ORIGEM_PEDIDO) as OrigemPedido[]).map((x) => (
              <option key={x} value={x}>
                {NOME_ORIGEM_PEDIDO[x]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Gaveta>
  )
}
