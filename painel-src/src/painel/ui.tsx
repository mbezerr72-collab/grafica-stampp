import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Cabecalho } from './escala/Cabecalho'

// ───────────── Ícones (traço simples, 24×24) ─────────────

const TRACOS: Record<string, ReactNode> = {
  inicio: <path d="M4 11.5 12 5l8 6.5V20h-5.5v-5h-5v5H4z" />,
  produtos: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2.5" />
      <path d="M10.5 18h3" />
    </>
  ),
  vendas: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  mais: (
    <>
      <circle cx="5.5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="18.5" cy="12" r="1.4" />
    </>
  ),
  calendario: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 9.5h16M8.5 3v4M15.5 3v4" />
    </>
  ),
  voltar: <path d="M14.5 5 7.5 12l7 7" />,
  seta: <path d="M9.5 5l7 7-7 7" />,
  somar: <path d="M12 5v14M5 12h14" />,
  busca: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m15.5 15.5 4 4" />
    </>
  ),
  site: (
    <>
      <path d="M14 4h6v6M20 4l-8.5 8.5" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </>
  ),
  foto: (
    <>
      <path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  anuncio: (
    <>
      <path d="M4 10v4l3 .5V9.5zM7 9.5 18 5v14L7 14.5" />
      <path d="M9 15l1 4h3l-1-3.5" />
    </>
  ),
  lixo: <path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13" />,
  copiar: (
    <>
      <rect x="8" y="8" width="11" height="12" rx="1.5" />
      <path d="M5 16V5a1 1 0 0 1 1-1h9" />
    </>
  ),
  arrastar: (
    <>
      <circle cx="9" cy="6" r="1.2" />
      <circle cx="15" cy="6" r="1.2" />
      <circle cx="9" cy="12" r="1.2" />
      <circle cx="15" cy="12" r="1.2" />
      <circle cx="9" cy="18" r="1.2" />
      <circle cx="15" cy="18" r="1.2" />
    </>
  ),
  girar: <path d="M18.5 9A7 7 0 1 0 19 14M19 4v5h-5" />,
  sair: <path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  alerta: (
    <>
      <path d="M12 4 21 20H3z" />
      <path d="M12 10v4.5M12 17.3v.2" />
    </>
  ),
  loja: <path d="M4 9.5 5.5 4h13L20 9.5M4 9.5h16M4 9.5c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 2 3s2-1.3 2-3c0 1.7 1.3 3 3 3s3-1.3 3-3M5.5 12v8h13v-8" />,
  pincel: <path d="M14.5 4.5 19.5 9.5 11 18l-5 1 1-5zM12.5 6.5l5 5" />,
  pdv: (
    <>
      <path d="M3 4h2.5l2.2 10.5h10.6L20.5 7H6.4" />
      <circle cx="9.5" cy="19" r="1.4" />
      <circle cx="17" cy="19" r="1.4" />
    </>
  ),
  caixa: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10.5h18M10 15h4" />
    </>
  ),
  os: <path d="M14.5 5.5a4 4 0 0 0-5.3 5.3L4 16l4 4 5.2-5.2a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.6-.6-.6-2.6z" />,
  troca: <path d="M4 9h13l-3-3M20 15H7l3 3" />,
  estoque: <path d="M5 20v-7M10 20V9M15 20V5M20 20v-11" />,
  compras: (
    <>
      <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" />
      <circle cx="7" cy="18.5" r="1.5" />
      <circle cx="17" cy="18.5" r="1.5" />
    </>
  ),
  etiqueta: <path d="M3 12V4h8l10 10-8 8zM7.5 7.5h.01" />,
  carteira: <path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4zM4 7l11-3v3M16 13.5h.01" />,
  meta: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 12h.01" />
    </>
  ),
  relatorio: <path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5" />,
  cliente: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" />
    </>
  ),
  equipe: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c.8-3 3-4.5 6-4.5s5.2 1.5 6 4.5M16 5.5a3 3 0 0 1 0 5.5M18 14.5c1.6.6 2.6 2 3 4.5" />
    </>
  ),
  vitrine: <path d="M4 9.5 5.5 4h13L20 9.5M4 9.5h16v10.5H4zM9 20v-5h6v5" />,
  grafico: <path d="M4 19h16M7 15l4-4 3 3 5-6" />,
  engrenagem: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
    </>
  ),
  sino: <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />,
  lua: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  sol: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  ajuda: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.4M12 17h.01" />
    </>
  ),
  fechar: <path d="M6 6l12 12M18 6 6 18" />,
  abaixo: <path d="M6 9l6 6 6-6" />,
  assistente: (
    <>
      <path d="M12 3.5l1.8 4.7 4.7 1.8-4.7 1.8L12 16.5l-1.8-4.7L5.5 10l4.7-1.8z" />
      <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </>
  ),
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  cadeado: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  olho: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5v.5" />
    </>
  ),
  relogio: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  cai: <path d="M4 7l6 6 4-4 6 6M20 11v4h-4" />,
  escudo: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />,
  estrela: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />,
  whats: <path d="M4 20l1.5-4A8 8 0 1 1 8 18.5z" />,
  qr: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2zM7 7h.01M17 7h.01M7 17h.01" />,
  mensagem: <path d="M4 5h16v11H8l-4 4zM8 9h8M8 12h5" />,
  camera: (
    <>
      <path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  sobe: <path d="M6 15l6-6 6 6" />,
  desce: <path d="M6 9l6 6 6-6" />,
}

export function Icone({ nome, tamanho = 22 }: { nome: keyof typeof TRACOS | string; tamanho?: number }) {
  return (
    <svg className="ic" width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden="true">
      {TRACOS[nome]}
    </svg>
  )
}

// ───────────── Cabeçalho de cada tela ─────────────

/** Título da tela, voltar (quando tem) e as ações: vira o cabeçalho em degradê da Escala. */
export function Topo({ titulo, voltar, children, sub, periodo }: { titulo: string; voltar?: string; children?: ReactNode; site?: string; sub?: ReactNode; periodo?: boolean }) {
  return (
    <Cabecalho titulo={titulo} voltar={voltar} sub={sub} periodo={periodo}>
      {children}
    </Cabecalho>
  )
}

// ───────────── Confirmação (antes de apagar) ─────────────

type Pedido = { titulo: string; texto?: string; botao: string; perigo?: boolean; responder: (ok: boolean) => void }
let pedidoAtual: Pedido | null = null
const ouvintesPedido = new Set<() => void>()

/** Pergunta antes de fazer algo que não volta. Responde true se a pessoa confirmou. */
export function confirmar(o: Omit<Pedido, 'responder'>): Promise<boolean> {
  return new Promise((responder) => {
    pedidoAtual = { ...o, responder }
    ouvintesPedido.forEach((f) => f())
  })
}

export function Confirmacao() {
  const p = useSyncExternalStore(
    (f) => {
      ouvintesPedido.add(f)
      return () => ouvintesPedido.delete(f)
    },
    () => pedidoAtual,
  )
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (p && !ref.current?.open) ref.current?.showModal()
  }, [p])
  const fim = (ok: boolean) => {
    p?.responder(ok)
    pedidoAtual = null
    ref.current?.close()
    ouvintesPedido.forEach((f) => f())
  }
  return (
    <dialog ref={ref} className="confirma" onCancel={() => fim(false)} aria-labelledby="confirma-t">
      {p && (
        <>
          <h2 id="confirma-t">{p.titulo}</h2>
          {p.texto && <p>{p.texto}</p>}
          <div className="confirma-acoes">
            <button type="button" className="bt bt-leve" onClick={() => fim(false)}>
              Cancelar
            </button>
            <button type="button" className={p.perigo ? 'bt bt-perigo' : 'bt bt-forte'} onClick={() => fim(true)} autoFocus>
              {p.botao}
            </button>
          </div>
        </>
      )}
    </dialog>
  )
}

// ───────────── Aviso rápido (embaixo da tela) ─────────────

type Aviso = { id: number; texto: string; acao?: { nome: string; fazer: () => void } }
let aviso: Aviso | null = null
const ouvintesAviso = new Set<() => void>()
let timer = 0

export function avisar(texto: string, acao?: Aviso['acao']) {
  aviso = { id: Date.now(), texto, acao }
  ouvintesAviso.forEach((f) => f())
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    aviso = null
    ouvintesAviso.forEach((f) => f())
  }, acao ? 6000 : 3200)
}

export function Avisos() {
  const a = useSyncExternalStore(
    (f) => {
      ouvintesAviso.add(f)
      return () => ouvintesAviso.delete(f)
    },
    () => aviso,
  )
  return (
    <div className="aviso" role="status" aria-live="polite" data-on={!!a}>
      {a && (
        <>
          <span>{a.texto}</span>
          {a.acao && (
            <button
              type="button"
              onClick={() => {
                a.acao!.fazer()
                aviso = null
                ouvintesAviso.forEach((f) => f())
              }}
            >
              {a.acao.nome}
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ───────────── Campos ─────────────

export const brl0 = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: v % 1 ? 2 : 0, minimumFractionDigits: v % 1 ? 2 : 0 })

/** Lê "1.234,56", "1234.5" ou "1234" como número. */
export function lerNumero(t: string): number {
  const limpo = t.replace(/[^\d,.-]/g, '')
  if (!limpo) return 0
  const n = limpo.includes(',') ? Number(limpo.replace(/\./g, '').replace(',', '.')) : Number(limpo.replace(/\.(?=\d{3}(\D|$))/g, ''))
  return Number.isFinite(n) ? n : 0
}

const mostrarNumero = (v: number, casas: boolean) =>
  v ? v.toLocaleString('pt-BR', { minimumFractionDigits: casas && v % 1 ? 2 : 0, maximumFractionDigits: 2 }) : ''

/** Campo de dinheiro: digita do jeito que quiser; ao sair do campo, fica no formato 1.234,56. */
export function CampoDinheiro({ valor, mudar, rotulo, id, compacto }: { valor: number; mudar: (v: number) => void; rotulo: string; id?: string; compacto?: boolean }) {
  const [texto, setTexto] = useState(mostrarNumero(valor, true))
  const [foco, setFoco] = useState(false)
  useEffect(() => {
    if (!foco) setTexto(mostrarNumero(valor, true))
  }, [valor, foco])
  return (
    <span className={compacto ? 'dinheiro dinheiro-compacto' : 'dinheiro'}>
      <span aria-hidden="true">R$</span>
      <input
        id={id}
        inputMode="decimal"
        aria-label={rotulo}
        value={texto}
        onFocus={(e) => {
          setFoco(true)
          e.currentTarget.select()
        }}
        onBlur={() => {
          setFoco(false)
          setTexto(mostrarNumero(valor, true))
        }}
        onChange={(e) => {
          setTexto(e.target.value)
          mudar(Math.round(lerNumero(e.target.value) * 100) / 100)
        }}
      />
    </span>
  )
}

/** Número inteiro com − e + (estoque, quantidade). */
export function Contador({ valor, mudar, rotulo, min = 0 }: { valor: number; mudar: (v: number) => void; rotulo: string; min?: number }) {
  return (
    <span className="contador">
      <button type="button" aria-label={`Menos 1 em ${rotulo}`} onClick={() => mudar(Math.max(min, valor - 1))}>
        −
      </button>
      <input
        inputMode="numeric"
        aria-label={rotulo}
        value={valor}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => mudar(Math.max(min, Math.floor(lerNumero(e.target.value))))}
      />
      <button type="button" aria-label={`Mais 1 em ${rotulo}`} onClick={() => mudar(valor + 1)}>
        +
      </button>
    </span>
  )
}

export function Interruptor({ ligado, mudar, rotulo, children }: { ligado: boolean; mudar: (v: boolean) => void; rotulo?: string; children?: ReactNode }) {
  return (
    <label className="interruptor">
      <input type="checkbox" role="switch" checked={ligado} onChange={(e) => mudar(e.target.checked)} aria-label={rotulo} />
      <span className="interruptor-trilho" aria-hidden="true" />
      {children}
    </label>
  )
}

/** Valor resumido para cartões de número: R$ 1,8 mi, R$ 182 mil, R$ 9.450. Nunca quebra. */
export function brlCurto(v: number) {
  const a = Math.abs(v)
  const s = v < 0 ? '−' : ''
  const n = (x: number, casas: number) => x.toLocaleString('pt-BR', { maximumFractionDigits: casas })
  if (a >= 1e6) return `${s}R$ ${n(a / 1e6, a >= 1e7 ? 0 : 1)} mi`
  if (a >= 1e4) return `${s}R$ ${n(a / 1e3, 0)} mil`
  return `${s}${brl0(a)}`
}
