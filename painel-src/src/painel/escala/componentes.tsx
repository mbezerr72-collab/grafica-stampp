/** Peças da Escala usadas em várias telas: cartão de número, número que conta, gráficos, esqueleto. */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Icone } from '../ui'

export const brl = (v: number, casas = false) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: casas ? 2 : 0, maximumFractionDigits: casas ? 2 : 0 })
export const pct = (v: number, casas = 1) => (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }) + '%'

const reduzido = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Número que conta até o valor quando aparece ou muda (rápido: 600 ms). */
export function NumeroAnimado({ valor, formato = brl }: { valor: number; formato?: (v: number) => string }) {
  const [mostrado, setMostrado] = useState(valor)
  const de = useRef(valor)
  const primeiro = useRef(true)
  useEffect(() => {
    if (reduzido()) {
      setMostrado(valor)
      return
    }
    const inicio = primeiro.current ? 0 : de.current
    primeiro.current = false
    const t0 = performance.now()
    let raf = 0
    const passo = (t: number) => {
      const k = Math.min(1, (t - t0) / 600)
      const e = 1 - Math.pow(1 - k, 3)
      const v = inicio + (valor - inicio) * e
      setMostrado(v)
      de.current = v
      if (k < 1) raf = requestAnimationFrame(passo)
    }
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
  }, [valor])
  return <>{formato(Math.round(mostrado))}</>
}

export function Delta({ v, inverso, texto }: { v: number | null; inverso?: boolean; texto?: string }) {
  if (v === null || !Number.isFinite(v)) return null
  const bom = inverso ? v <= 0 : v >= 0
  return (
    <span className="kpi-linha">
      <span className={'delta ' + (bom ? 'sobe' : 'desce')}>
        <Icone nome={v >= 0 ? 'sobe' : 'desce'} tamanho={11} />
        {pct(Math.abs(v))}
      </span>
      {texto && <span className="kpi-comp">{texto}</span>}
    </span>
  )
}

/** A comparação em % só faz sentido se a base for de pelo menos 10% do valor de agora e positiva. */
/** 72.400 → "72 mil"; 950 → "950". */
export const emMil = (v: number) => (v >= 1000 ? Math.round(v / 1000).toLocaleString('pt-BR') + ' mil' : brl(v))
export const baseFraca = (agora: number, antes: number) => antes <= 0 || antes < Math.abs(agora) * 0.1

/** Cartão de número: rótulo, valor em reais, comparação e a frase que explica de onde vem o número. */
export function Kpi({
  rotulo,
  valor,
  delta,
  comparacao,
  frase,
  tipo,
  cor,
  inverso,
  dinheiro = true,
  antes,
  soReais,
}: {
  rotulo: string
  valor: number
  delta?: number | null
  /** O valor do período anterior (no lugar de `delta`): com base pequena ou negativa, mostra a diferença em reais. */
  antes?: number
  /** Sempre a diferença em reais, nunca a % (o Caixa: a base muda de sinal e a % não diz nada). */
  soReais?: boolean
  comparacao?: string
  frase?: ReactNode
  tipo?: 'destaque' | 'lucro'
  cor?: string
  inverso?: boolean
  dinheiro?: boolean
}) {
  return (
    <article className={'kpi' + (tipo ? ` kpi--${tipo}` : '')}>
      <p className="kpi-rot">
        {!tipo && <i style={{ '--c': cor ?? 'var(--teal)' } as CSSProperties} />}
        {rotulo}
      </p>
      <p className="kpi-val num" title={dinheiro ? 'R$ ' + brl(valor) : undefined}>
        {dinheiro && <small>R$</small>}
        {valor < 0 && '−'}
        <NumeroAnimado valor={Math.abs(valor)} />
      </p>
      {antes !== undefined && soReais ? (
        <span className="kpi-linha">
          <span className={'delta ' + (valor >= antes ? 'sobe' : 'desce')}>
            <Icone nome={valor >= antes ? 'sobe' : 'desce'} tamanho={11} />
            R$ {emMil(Math.abs(valor - antes))} {valor >= antes ? 'a mais' : 'a menos'}
          </span>
          {comparacao && <span className="kpi-comp">{comparacao}</span>}
        </span>
      ) : antes !== undefined && baseFraca(valor, antes) ? (
        // Base pequena ou negativa: a porcentagem não diz nada ("+427%"). Mostra a diferença em reais.
        valor > antes && (
          <span className="kpi-linha">
            <span className={'delta ' + (inverso ? 'desce' : 'sobe')}>
              <Icone nome="sobe" tamanho={11} />
              R$ {brl(valor - antes)} a mais
            </span>
            {comparacao && <span className="kpi-comp">{comparacao}</span>}
          </span>
        )
      ) : (
        (delta !== undefined || antes !== undefined) && <Delta v={antes !== undefined ? (antes ? (valor - antes) / Math.abs(antes) : null) : (delta ?? null)} inverso={inverso} texto={comparacao} />
      )}
      {frase && <p className="kpi-frase">{frase}</p>}
    </article>
  )
}

export function MiniKpi({ rotulo, valor, nota, classe }: { rotulo: string; valor: ReactNode; nota?: ReactNode; classe?: 'sobe' | 'desce' }) {
  return (
    <article className="mini-kpi">
      <p>{rotulo}</p>
      <b className="num">{valor}</b>
      {nota && <span className={classe}>{nota}</span>}
    </article>
  )
}

/** Esqueleto: o formato do conteúdo enquanto ele carrega. */
export function Esqueleto({ linhas = 3, alto }: { linhas?: number; alto?: number }) {
  return (
    <div className="esqueleto" aria-hidden="true" style={alto ? { height: alto } : undefined}>
      {Array.from({ length: linhas }, (_, i) => (
        <span key={i} style={{ width: `${88 - i * 14}%` }} />
      ))}
    </div>
  )
}

function useEstreito() {
  const q = '(max-width: 760px)'
  const [v, setV] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(q).matches)
  useEffect(() => {
    const m = matchMedia(q)
    const f = () => setV(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  return v
}

const abreviar = (v: number) => (v >= 1000 ? `R$ ${Math.round(v / 1000)} mil` : `R$ ${Math.round(v)}`)

/** Barras (faturamento) com a linha do lucro por cima. Desenhado dos dados, sem biblioteca. */
export function GraficoBarras({ pontos, rotulo }: { pontos: { rot: string; fat: number; lucro: number; destaque?: boolean }[]; rotulo: string }) {
  // No celular o desenho fica mais estreito, para o texto dos eixos não encolher demais.
  const L = useEstreito() ? 360 : 760
  const A = 220
  const teto = Math.max(1, ...pontos.map((p) => p.fat)) * 1.08
  const passo = Math.pow(10, Math.floor(Math.log10(teto / 3)))
  const marca = Math.ceil(teto / 3 / passo) * passo
  const larg = L / Math.max(1, pontos.length)
  const w = Math.max(2, larg * 0.58)
  const y = (v: number) => A - (v / teto) * A
  const linha = pontos.map((p, i) => `${i ? 'L' : 'M'}${(i * larg + larg / 2).toFixed(1)} ${y(p.lucro).toFixed(1)}`).join('')
  const cadaRot = Math.ceil(pontos.length / (L < 500 ? 6 : 10))
  return (
    <figure className="grafico-caixa" aria-label={rotulo}>
      <svg className="grafico" viewBox={`-56 -8 ${L + 60} ${A + 34}`} role="img">
        <title>{rotulo}</title>
        {[0, 1, 2, 3].map((k) => (
          <g key={k}>
            <line className="eixo" x1={0} x2={L} y1={y(marca * k)} y2={y(marca * k)} />
            <text x={-8} y={y(marca * k) + 4} textAnchor="end">
              {k ? abreviar(marca * k) : '0'}
            </text>
          </g>
        ))}
        {pontos.map((p, i) => {
          const h = A - y(p.fat)
          return (
            <rect key={i} className={'barra' + (p.destaque ? ' fds' : '')} x={i * larg + (larg - w) / 2} y={y(p.fat)} width={w} height={Math.max(0, h)} rx={Math.min(3, w / 3)}>
              <title>{`${p.rot}: R$ ${brl(p.fat)} vendidos, R$ ${brl(p.lucro)} de lucro`}</title>
            </rect>
          )
        })}
        <path className="lucro" d={linha} />
        {pontos.map((p, i) =>
          i % cadaRot === 0 ? (
            <text key={i} x={i * larg + larg / 2} y={A + 20} textAnchor="middle">
              {p.rot}
            </text>
          ) : null,
        )}
      </svg>
    </figure>
  )
}

/** Rosca (partes de um todo), com a legenda ao lado. */
export function Rosca({ partes, centro, sub }: { partes: { nome: string; valor: number; cor: string }[]; centro: string; sub: string }) {
  const total = partes.reduce((t, p) => t + p.valor, 0) || 1
  const C = 2 * Math.PI * 52
  let acc = 0
  return (
    <div className="rosca-bloco">
      <svg className="rosca" viewBox="0 0 132 132" role="img" aria-label={partes.map((p) => `${p.nome} ${pct(p.valor / total, 0)}`).join(', ')}>
        <circle cx="66" cy="66" r="52" stroke="var(--card-2)" />
        {partes.map((p) => {
          const f = p.valor / total
          const el = (
            <circle
              key={p.nome}
              cx="66"
              cy="66"
              r="52"
              stroke={p.cor}
              strokeDasharray={`${Math.max(0, f * C - 2).toFixed(1)} ${C.toFixed(1)}`}
              strokeDashoffset={(-acc * C).toFixed(1)}
              transform="rotate(-90 66 66)"
            />
          )
          acc += f
          return el
        })}
        <text x="66" y="68" textAnchor="middle">
          {centro}
        </text>
        <text className="p" x="66" y="84" textAnchor="middle">
          {sub}
        </text>
      </svg>
      <ul className="rosca-leg">
        {partes.map((p) => (
          <li key={p.nome}>
            <i style={{ '--c': p.cor } as CSSProperties} />
            <span>{p.nome}</span>
            <b>{pct(p.valor / total, 0)}</b>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Curva do cabeçalho: o período desenhado em curva suave (viewBox 100×40). */
export function caminhoCurva(serie: number[], teto: number) {
  if (serie.length < 2) serie = [serie[0] ?? 0, serie[0] ?? 0]
  const pts = serie.map((v, i) => [(i / (serie.length - 1)) * 100, 40 - (v / (teto || 1)) * 34] as const)
  let d = `M${pts[0][0]} ${pts[0][1].toFixed(2)}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const cx = (x0 + x1) / 2
    d += `C${cx.toFixed(2)} ${y0.toFixed(2)} ${cx.toFixed(2)} ${y1.toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)}`
  }
  return d
}
