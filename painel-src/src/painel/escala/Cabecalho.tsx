/**
 * Cabeçalho de toda tela: o degradê da Escala com o título, as ações e, nas telas com números,
 * o seletor de período e a curva do faturamento do período desenhada embaixo (a marca do painel).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useDados, useFalhaGravar, type Sessao } from '../../data/store'
import { link, useRota } from '../rota'
import { modulo } from '../modulos'
import { Icone } from '../ui'
import { trocarTema, useTema, SinalEmpresa, MARCA } from './marca'
import { OPCOES, intervalo, mudarPeriodo, usePeriodo, somaDias, type Periodo } from './periodo'
import { serie } from './numeros'
import { caminhoCurva } from './componentes'
import { useAvisos } from './avisos'
import { abrirPaleta } from './Paleta'
import { abrirAcoes } from './Acoes'
import { abrirAssistente } from './Assistente'
import { GUIAS, mostrarGuia, verGuiaDeNovo } from './Guia'
import { createPortal } from 'react-dom'

export function Cabecalho({
  titulo,
  sub,
  voltar,
  children,
  periodo,
  s,
}: {
  titulo: string
  sub?: ReactNode
  voltar?: string
  children?: ReactNode
  periodo?: boolean
  s?: Sessao
}) {
  const [id] = useRota()
  const m = modulo(id)
  const comPeriodo = periodo ?? (!voltar && !!m?.periodo)
  return (
    <header className={'topo' + (comPeriodo ? '' : ' topo--baixo')}>
      <CelTopo voltar={voltar} />
      <div className="topo-linha">
        {voltar && (
          <a className="topo-voltar so-pc-flex" href={link(...voltar.split('/'))} aria-label="Voltar">
            <Icone nome="voltar" />
          </a>
        )}
        <div className="topo-titulo">
          <h1>{titulo}</h1>
          {sub && <p className="sub">{sub}</p>}
        </div>
        <div className="topo-acoes">
          {children}
          <AcoesGlobais s={s} />
        </div>
      </div>
      {comPeriodo && <Seletor />}
      {comPeriodo && <Curva />}
    </header>
  )
}

/** No celular: voltar ou a empresa, a busca e o sino (o resto fica no "Mais"). */
function CelTopo({ voltar }: { voltar?: string }) {
  return (
    <div className="cel-topo so-cel-flex">
      {voltar ? (
        <a className="icone-bt" href={link(...voltar.split('/'))} aria-label="Voltar">
          <Icone nome="voltar" />
        </a>
      ) : null}
      <span className="empresa">
        <SinalEmpresa />
        <span>
          <b>
            {MARCA.empresa.nome}
            <i>.</i>
          </b>
          <small>{MARCA.empresa.local}</small>
        </span>
      </span>
      <button type="button" className="icone-bt" aria-label="Buscar ou fazer algo" onClick={abrirPaleta}>
        <Icone nome="busca" />
      </button>
    </div>
  )
}

function AcoesGlobais({ s: s0 }: { s?: Sessao }) {
  const tema = useTema()
  const s = useDados('sessao') ?? s0
  return (
    <>
      <a className="btn btn-vidro so-pc" href="/" target="_blank" rel="noopener">
        <Icone nome="site" tamanho={18} />
        Ver no site
      </a>
      <button type="button" className="icone-bt" aria-label="Assistente" onClick={() => abrirAssistente()} data-tour="assistente">
        <Icone nome="assistente" />
      </button>
      <Ajuda />
      <button type="button" className="icone-bt so-pc" aria-label={tema === 'escuro' ? 'Usar o tema claro' : 'Usar o tema escuro'} onClick={() => trocarTema()}>
        <Icone nome={tema === 'escuro' ? 'sol' : 'lua'} />
      </button>
      {s && <Sino s={s} />}
      <button type="button" className="icone-bt so-pc novo-global" aria-label="Novo: pedido, venda, orçamento…" title="Novo" onClick={abrirAcoes} data-tour="mais">
        <Icone nome="somar" tamanho={18} />
        <span className="sr-only">Novo</span>
      </button>
    </>
  )
}

// ───────────── Popover simples (abre embaixo do botão, fecha com Esc ou clique fora) ─────────────

function usePopover() {
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!aberto) return
    const fora = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setAberto(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    document.addEventListener('pointerdown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberto])
  return { aberto, setAberto, ref }
}

function Sino({ s }: { s: Sessao }) {
  const avisos = useAvisos(s)
  const { aberto, setAberto, ref } = usePopover()
  return (
    <div className="pop-ancora" ref={ref}>
      <button type="button" className="icone-bt" aria-label={`Avisos, ${avisos.length} ${avisos.length === 1 ? 'novo' : 'novos'}`} aria-expanded={aberto} onClick={() => setAberto(!aberto)} data-tour="sino">
        <Icone nome="sino" />
        {avisos.length > 0 && <span className="ponto">{avisos.length}</span>}
      </button>
      {aberto && (
        <div className="pop" role="dialog" aria-label="Avisos">
          <p className="pop-t">Avisos</p>
          {avisos.length ? (
            <ul className="avisos-lista">
              {avisos.map((a) => (
                <li key={a.id}>
                  <a href={link(a.link)} onClick={() => setAberto(false)}>
                    <i className={'pill-ponto ' + a.tipo} />
                    <span>
                      <b>{a.titulo}</b>
                      <small>{a.texto}</small>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="pop-vazio">Tudo em dia. Nenhum aviso agora.</p>
          )}
        </div>
      )}
    </div>
  )
}

function Ajuda() {
  const [rota] = useRota()
  const sessao = useDados('sessao')
  const id = rota === 'inicio' && sessao && sessao.papel !== 'dono' ? 'inicio-vendedor' : rota
  const m = modulo(rota)
  const { aberto, setAberto, ref } = usePopover()
  const [video, setVideo] = useState<{ arquivo: string; nome: string } | null>(null)
  if (!m) return null
  return (
    <div className="pop-ancora" ref={ref}>
      {video &&
        createPortal(
        <div className="video-ajuda" role="dialog" aria-label={`Vídeo: ${video.nome}`} onClick={(e) => e.target === e.currentTarget && setVideo(null)}>
          <div className="video-ajuda-caixa">
            <div className="video-ajuda-topo">
              <b>{video.nome}</b>
              <button type="button" className="btn btn-p" onClick={() => setVideo(null)}>
                Fechar
              </button>
            </div>
            <video src={`/painel/videos/${video.arquivo}.webm`} autoPlay loop muted playsInline controls />
          </div>
        </div>,
          document.body,
        )}
      <button type="button" className="icone-bt" aria-label={`Ajuda: ${m.nome}`} aria-expanded={aberto} onClick={() => setAberto(!aberto)} data-tour="ajuda">
        <Icone nome="ajuda" />
      </button>
      {aberto && (
        <div className="pop" role="dialog" aria-label={`Ajuda: ${m.nome}`}>
          <p className="pop-t">{m.nome}</p>
          <p className="pop-frase">{m.frase}</p>
          {GUIAS[id] && (
            <>
              <p className="pop-sub">Como faço…?</p>
              <ul className="como-faco">
                {GUIAS[id].perguntas.map((q) => (
                  <li key={q.p}>
                    <button type="button" className="link-bt" onClick={() => (setAberto(false), mostrarGuia(q.passos))}>
                      {q.p}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="ajuda-bts">
                <button type="button" className="bt bt-leve bt-pequeno" onClick={() => (setAberto(false), verGuiaDeNovo(id))}>
                  Ver o guia de novo
                </button>
                {GUIAS[id].video && (
                  <button type="button" className="bt bt-leve bt-pequeno" onClick={() => (setAberto(false), setVideo(GUIAS[id].video!))}>
                    <Icone nome="olho" tamanho={16} />
                    Ver vídeo: {GUIAS[id].video!.nome}
                  </button>
                )}
              </div>
              <p className="pop-sub">Dicas</p>
            </>
          )}
          {m.ajuda && (
            <ul className="ajuda-lista">
              {m.ajuda.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
          <p className="pop-pe">
            Dúvida? Fale com a Escala: {MARCA.ajuda}. Atalho: <kbd>Ctrl</kbd> <kbd>K</kbd> busca qualquer coisa.
          </p>
        </div>
      )}
    </div>
  )
}

// ───────────── Período ─────────────

function Seletor() {
  const p = usePeriodo()
  const { aberto, setAberto, ref } = usePopover()
  const iv = intervalo(p)
  const [de, setDe] = useState(iv.de)
  const [ate, setAte] = useState(iv.ate)
  const escolher = (n: Periodo) => mudarPeriodo(n)
  return (
    <div className="periodo-linha" ref={ref}>
      <div className="periodo" role="group" aria-label="Período" data-tour="periodo">
        {OPCOES.map((o) => (
          <button key={o.tipo} type="button" aria-pressed={p.tipo === o.tipo} onClick={() => escolher({ tipo: o.tipo })}>
            {o.nome}
          </button>
        ))}
        <button type="button" className="cal" aria-pressed={p.tipo === 'livre'} aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
          <Icone nome="calendario" tamanho={16} />
          {p.tipo === 'livre' ? iv.rotulo.replace('De ', '') : 'Escolher'}
        </button>
      </div>
      {aberto && (
        <form
          className="pop pop-periodo"
          aria-label="Escolher as datas"
          onSubmit={(e) => {
            e.preventDefault()
            escolher({ tipo: 'livre', de, ate: ate < de ? de : ate })
            setAberto(false)
          }}
        >
          <p className="pop-t">Escolher as datas</p>
          <label className="campo">
            De
            <input type="date" value={de} max={ate} onChange={(e) => setDe(e.target.value)} required />
          </label>
          <label className="campo">
            Até
            <input type="date" value={ate} min={de} onChange={(e) => setAte(e.target.value)} required />
          </label>
          <button type="submit" className="bt bt-forte">
            Ver esse período
          </button>
        </form>
      )}
    </div>
  )
}

function Curva() {
  const p = usePeriodo()
  const vendas = useDados('vendas')
  const { atual, anterior } = useMemo(() => {
    const iv = intervalo(p)
    // Um dia só não faz curva: mostra a semana que termina nele.
    const de = iv.dias < 7 ? somaDias(iv.ate, -6) : iv.de
    const deAnt = iv.dias < 7 ? somaDias(iv.ant.ate, -6) : iv.ant.de
    const a = serie(vendas, de, iv.ate).pontos.map((x) => x.fat)
    const b = p.tipo === 'tudo' ? [] : serie(vendas, deAnt, iv.ant.ate).pontos.map((x) => x.fat)
    const teto = Math.max(1, ...a, ...b) * 1.08
    return { atual: caminhoCurva(a, teto), anterior: b.length > 1 ? caminhoCurva(b, teto) : '' }
  }, [p, vendas])
  return (
    <>
      <svg className="curva" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
        <path className="area" d={atual + 'L100 40L0 40Z'} />
        {anterior && <path className="anterior" d={anterior} />}
        <path className="traco" d={atual} />
      </svg>
      <p className="topo-legenda so-pc-flex" aria-hidden="true">
        <span>
          <i />
          Vendas do período
        </span>
        {anterior && (
          <span>
            <i className="tr" />
            Período anterior
          </span>
        )}
      </p>
    </>
  )
}

/** Faixa de cima: modo demonstração e, se o navegador não deixar salvar, o aviso. */
export function FaixaDemo() {
  const falhou = useFalhaGravar()
  return (
    <>
      <p className="faixa-demo">
        <b>Modo demonstração</b>
        <span>As alterações valem só neste aparelho.</span>
      </p>
      {falhou && (
        <p className="faixa-erro" role="alert">
          Este navegador não deixou salvar (pode ser janela anônima ou falta de espaço). O que mudar agora some ao fechar.
        </p>
      )}
    </>
  )
}
