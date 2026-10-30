import { useState, type CSSProperties } from 'react'
import { hoje, negocio, useDados, type Pedido, type Sessao } from '../../data/store'
import { NOMES_STATUS_PEDIDO, pecasPedido, tituloPedido } from '../../data/negocio'
import { NOME_SETOR, type Setor } from '../../data/produtos'
import { Icone, Topo, avisar } from '../ui'
import { MiniKpi } from '../escala/componentes'
import { diasEntre } from '../escala/periodo'
import { fichaProducaoPdf, gradeTexto } from '../escala/documentos'
import { link } from '../rota'

const COLUNAS = [
  { id: 'arte', nome: 'Arte para fazer', cor: 'var(--roxo)', status: ['novo', 'arte'] },
  { id: 'producao', nome: 'Na máquina', cor: 'var(--teal)', status: ['producao'] },
] as const

/** A fila de cada setor (arte, sublimação, DTF, impressão…): o que fazer primeiro, pelo prazo. */
export default function Producao(_: { s: Sessao }) {
  const pedidos = useDados('pedidos')
  const clientes = useDados('clientes')
  const equipe = useDados('equipe')
  const h = hoje()
  const [setor, setSetor] = useState<Setor | ''>('')
  const [aba, setAba] = useState<'arte' | 'producao'>('producao')
  const naFila = pedidos.filter((o) => o.status === 'novo' || o.status === 'arte' || o.status === 'producao')
  const setores = (Object.keys(NOME_SETOR) as Setor[]).filter((x) => naFila.some((o) => o.setor === x))
  const daqui = naFila.filter((o) => !setor || o.setor === setor).sort((a, b) => a.prazo.localeCompare(b.prazo) || a.numero - b.numero)
  const atrasado = (o: Pedido) => o.prazo < h
  const pecas = daqui.filter((o) => o.status === 'producao').reduce((t, o) => t + pecasPedido(o), 0)
  const nomeDe = (id: string) => equipe.find((e) => e.id === id)?.nome ?? '—'

  const andar = (o: Pedido) => {
    const s = o.status === 'producao' ? 'pronto' : o.status === 'novo' ? 'arte' : 'aprovacao'
    negocio.mudarStatusPedido(o.id, s)
    avisar(`Pedido ${o.numero}: ${NOMES_STATUS_PEDIDO[s]}. Avise o cliente em Pedidos.`)
  }

  return (
    <>
      <Topo titulo="O que produzir" sub="O que tem para fazer, do mais urgente para o menos urgente. Imprima a ficha e marque quando terminar." />
      <section className="kpis-menores">
        <MiniKpi rotulo="Arte para fazer" valor={daqui.filter((o) => o.status !== 'producao').length} nota="antes de ir para aprovação" />
        <MiniKpi rotulo="Na máquina" valor={daqui.filter((o) => o.status === 'producao').length} nota={`${pecas} peças/unidades`} />
        <MiniKpi rotulo="Vencem hoje" valor={daqui.filter((o) => o.prazo === h).length} nota="prioridade do dia" />
        <MiniKpi rotulo="Atrasados" valor={daqui.filter(atrasado).length} nota="passaram do prazo" classe={daqui.some(atrasado) ? 'desce' : undefined} />
      </section>

      <div className="fichas" role="group" aria-label="Setor">
        <button type="button" className="ficha" aria-pressed={!setor} onClick={() => setSetor('')}>
          Todos os setores <b>{naFila.length}</b>
        </button>
        {setores.map((x) => (
          <button key={x} type="button" className="ficha" aria-pressed={setor === x} onClick={() => setSetor(x)}>
            {NOME_SETOR[x]} <b>{naFila.filter((o) => o.setor === x).length}</b>
          </button>
        ))}
      </div>

      <div className="fichas os-abas" role="tablist" aria-label="Etapa">
        {COLUNAS.map((c) => (
          <button key={c.id} type="button" role="tab" className="ficha" aria-selected={aba === c.id} onClick={() => setAba(c.id)}>
            <i className="ponto-c" style={{ '--c': c.cor } as CSSProperties} />
            {c.nome} <b>{daqui.filter((o) => (c.status as readonly string[]).includes(o.status)).length}</b>
          </button>
        ))}
      </div>

      <section className="quadro quadro--2" aria-label="Fila por etapa">
        {COLUNAS.map((c) => {
          const da = daqui.filter((o) => (c.status as readonly string[]).includes(o.status))
          return (
            <div key={c.id} className={'coluna' + (aba === c.id ? ' ativa' : '')}>
              <p className="col-t" style={{ '--c': c.cor } as CSSProperties}>
                <i />
                {c.nome}
                <span>{da.length}</span>
              </p>
              {da.map((o) => {
                const cli = clientes.find((x) => x.id === o.clienteId)
                const dias = diasEntre(h, o.prazo) - 1
                return (
                  <article key={o.id} className={'os-c' + (atrasado(o) ? ' atrasada' : '')}>
                    <a className="os-abrir" href={link('pedidos', String(o.numero))}>
                      <span className="os-cab">
                        <b className="n">Pedido {o.numero}</b>
                        <span>{NOME_SETOR[o.setor]}</span>
                        <span className={'pill ' + (atrasado(o) ? 'sai' : dias === 0 ? 'ate' : 'neu')}>{atrasado(o) ? `${-dias} dia${-dias > 1 ? 's' : ''} atrasado` : dias === 0 ? 'vence hoje' : `${dias} dia${dias > 1 ? 's' : ''}`}</span>
                      </span>
                      <b className="os-ap">{tituloPedido(o)}</b>
                      <span className="os-cli">{o.itens.map((i) => i.opcao).join(' + ')}</span>
                      <span className="os-cli">
                        {cli?.nome ?? 'Cliente'} · {nomeDe(o.responsavelId)}
                      </span>
                      {o.fora && !o.fora.voltouEm && (
                        <span className={'pill ' + (o.fora.previsao < h ? 'sai' : 'ate')}>
                          No fornecedor: {o.fora.fornecedor}, volta {o.fora.previsao.slice(8)}/{o.fora.previsao.slice(5, 7)}
                        </span>
                      )}
                      {o.grade && <span className="os-cli">{gradeTexto(o.grade)}</span>}
                      {(o.lista?.length ?? 0) > 0 && <span className="os-cli">Lista de nomes: {o.lista!.length} peças</span>}
                      {o.cores.length > 0 && <span className="os-cli">Cores: {o.cores.join(', ')}</span>}
                      {o.descricao && <span className="os-cli">{o.descricao}</span>}
                    </a>
                    <div className="det-desfazer">
                      <button type="button" className="bt bt-leve bt-pequeno" onClick={() => fichaProducaoPdf(o, cli, nomeDe(o.responsavelId))}>
                        <Icone nome="relatorio" tamanho={16} />
                        Ficha
                      </button>
                      <button type="button" className="os-prox" onClick={() => andar(o)}>
                        {o.status === 'producao' ? 'Terminei: pronto' : o.status === 'novo' ? 'Começar a arte' : 'Arte pronta: mandar'}
                        <Icone nome="seta" tamanho={14} />
                      </button>
                    </div>
                  </article>
                )
              })}
              {!da.length && <p className="mut pequeno col-vazia">Nada na fila.</p>}
            </div>
          )
        })}
      </section>
    </>
  )
}
