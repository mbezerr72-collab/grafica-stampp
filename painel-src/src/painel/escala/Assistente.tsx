/** Assistente: conversa na gaveta lateral. Responde com os dados; muda algo só depois de confirmar. */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useDados } from '../../data/store'
import { ir } from '../rota'
import { Icone, avisar } from '../ui'
import { Gaveta } from './Gaveta'
import { motorAtual, SUGESTOES, type Resposta } from './motorAssistente'

let aberto = false
let pendente = ''
const ouvintes = new Set<() => void>()
/** Abre o Assistente; com uma pergunta, ela já chega respondida. */
export const abrirAssistente = (pergunta = '') => {
  aberto = true
  pendente = pergunta
  ouvintes.forEach((f) => f())
}
const fechar = () => {
  aberto = false
  ouvintes.forEach((f) => f())
}

type Msg = { de: 'eu' | 'ass'; texto: string; r?: Resposta; feita?: boolean }

export function Assistente() {
  const on = useSyncExternalStore(
    (f) => {
      ouvintes.add(f)
      return () => ouvintes.delete(f)
    },
    () => aberto,
  )
  if (!on) return null
  return <Conversa />
}

function Conversa() {
  const s = useDados('sessao')
  const [msgs, setMsgs] = useState<Msg[]>([{ de: 'ass', texto: `Oi, ${s?.nome.split(' ')[0] ?? ''}! Pergunte sobre vendas, lucro, estoque, contas, OS ou metas. Se pedir para mudar algo, eu mostro antes.`, r: { texto: '', itens: SUGESTOES } }])
  const [q, setQ] = useState('')
  const [pensando, setPensando] = useState(false)
  const fim = useRef<HTMLDivElement>(null)
  useEffect(() => {
    fim.current?.scrollIntoView({ block: 'end' })
  }, [msgs, pensando])
  useEffect(() => {
    if (pendente) {
      const p = pendente
      pendente = ''
      perguntar(p)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const perguntar = async (texto: string) => {
    if (!texto.trim() || !s) return
    setMsgs((m) => [...m, { de: 'eu', texto }])
    setQ('')
    setPensando(true)
    const r = await motorAtual(texto, s)
    setPensando(false)
    setMsgs((m) => [...m, { de: 'ass', texto: r.texto, r }])
  }
  return (
    <Gaveta titulo="Assistente" sub="Responde com os números da gráfica. Funciona sem internet." fechar={fechar}>
      <div className="chat" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={'msg msg--' + m.de}>
            {m.texto && <p>{m.texto}</p>}
            {m.r?.itens && m.r.itens.length > 0 && (
              <ul className={m.r.itens === SUGESTOES ? 'sugestoes' : 'msg-itens'}>
                {m.r.itens.map((x) =>
                  m.r!.itens === SUGESTOES ? (
                    <li key={x}>
                      <button type="button" className="ficha" onClick={() => perguntar(x)}>
                        {x}
                      </button>
                    </li>
                  ) : (
                    <li key={x}>{x}</li>
                  ),
                )}
              </ul>
            )}
            {m.r?.proposta && (
              <div className="proposta">
                <b>{m.r.proposta.titulo}</b>
                <ul>
                  {m.r.proposta.detalhes.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                {m.feita ? (
                  <p className="pag-falta ate">Feito.</p>
                ) : (
                  <div className="cli-novo-acoes">
                    <button type="button" className="bt bt-leve bt-pequeno" onClick={() => setMsgs((l) => l.map((x, j) => (j === i ? { ...x, feita: true, r: { ...x.r!, proposta: undefined } } : x)))}>
                      Deixa como está
                    </button>
                    <button
                      type="button"
                      className="bt bt-forte bt-pequeno"
                      onClick={() => {
                        const t = m.r!.proposta!.executar()
                        avisar(t)
                        setMsgs((l) => [...l.map((x, j) => (j === i ? { ...x, feita: true } : x)), { de: 'ass', texto: t }])
                      }}
                    >
                      {m.r.proposta.botao}
                    </button>
                  </div>
                )}
              </div>
            )}
            {m.r?.link && (
              <button
                type="button"
                className="link-bt"
                onClick={() => {
                  fechar()
                  ir(...m.r!.link!.rota.split('/'))
                }}
              >
                {m.r.link.rotulo} ›
              </button>
            )}
          </div>
        ))}
        {pensando && <div className="msg msg--ass pensando">…</div>}
        <div ref={fim} />
      </div>
      <form
        className="chat-campo"
        onSubmit={(e) => {
          e.preventDefault()
          perguntar(q)
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pergunte ou peça algo" aria-label="Pergunta para o Assistente" autoFocus />
        <button type="submit" className="icone-bt icone-bt--envia" aria-label="Enviar" disabled={!q.trim()}>
          <Icone nome="seta" />
        </button>
      </form>
    </Gaveta>
  )
}
