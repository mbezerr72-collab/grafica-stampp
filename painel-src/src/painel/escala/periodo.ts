/**
 * Seletor de período: Hoje · 7 dias · 30 dias · Este mês · Este ano · Desde o início · Escolher.
 * Cada período tem o "anterior" do mesmo tamanho, para a comparação (a setinha verde ou vermelha).
 * O período escolhido vale para todas as telas e fica lembrado neste aparelho.
 */
import { useSyncExternalStore } from 'react'
import { hoje } from '../../data/store'

export type TipoPeriodo = 'hoje' | '7d' | '30d' | 'mes' | 'ano' | 'tudo' | 'livre'
export type Periodo = { tipo: TipoPeriodo; de?: string; ate?: string }
export type Intervalo = { de: string; ate: string; ant: { de: string; ate: string }; rotulo: string; comparacao: string; dias: number }

export const OPCOES: { tipo: TipoPeriodo; nome: string }[] = [
  { tipo: 'hoje', nome: 'Hoje' },
  { tipo: '7d', nome: '7 dias' },
  { tipo: '30d', nome: '30 dias' },
  { tipo: 'mes', nome: 'Este mês' },
  { tipo: 'ano', nome: 'Este ano' },
  { tipo: 'tudo', nome: 'Desde o início' },
]

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
export const nomeMes = (aaaamm: string) => MESES[Number(aaaamm.slice(5, 7)) - 1]

export const somaDias = (dia: string, n: number) => {
  const d = new Date(dia + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
export const diasEntre = (de: string, ate: string) => Math.round((Date.parse(ate + 'T12:00:00Z') - Date.parse(de + 'T12:00:00Z')) / 864e5) + 1
export const dataCurta = (dia: string) => `${Number(dia.slice(8, 10))}/${dia.slice(5, 7)}`

/** O primeiro dia com movimento (início da demonstração). */
let primeiroDia = somaDias(hoje(), -182)
export const definirPrimeiroDia = (d: string) => (primeiroDia = d)

export function intervalo(p: Periodo, h = hoje()): Intervalo {
  const mes = h.slice(0, 7)
  const nMes = nomeMes(h)
  switch (p.tipo) {
    case 'hoje':
      return { de: h, ate: h, ant: { de: somaDias(h, -7), ate: somaDias(h, -7) }, rotulo: 'Números de hoje até agora', comparacao: 'que o mesmo dia da semana passada', dias: 1 }
    case '7d':
      return { de: somaDias(h, -6), ate: h, ant: { de: somaDias(h, -13), ate: somaDias(h, -7) }, rotulo: 'Últimos 7 dias', comparacao: 'que os 7 dias antes', dias: 7 }
    case '30d':
      return { de: somaDias(h, -29), ate: h, ant: { de: somaDias(h, -59), ate: somaDias(h, -30) }, rotulo: 'Últimos 30 dias', comparacao: 'que os 30 dias antes', dias: 30 }
    case 'mes': {
      const de = mes + '-01'
      const n = diasEntre(de, h)
      const antDe = somaDias(de, -1).slice(0, 7) + '-01'
      return { de, ate: h, ant: { de: antDe, ate: somaDias(antDe, n - 1) }, rotulo: `Números de ${nMes} até agora`, comparacao: `que ${nomeMes(antDe)} no mesmo ponto`, dias: n }
    }
    case 'ano': {
      const de = h.slice(0, 4) + '-01-01'
      const ano = Number(h.slice(0, 4)) - 1
      return { de, ate: h, ant: { de: `${ano}-01-01`, ate: `${ano}${h.slice(4)}` }, rotulo: `Números de ${h.slice(0, 4)} até agora`, comparacao: `que ${ano} no mesmo ponto`, dias: diasEntre(de, h) }
    }
    case 'tudo':
      return { de: primeiroDia, ate: h, ant: { de: somaDias(primeiroDia, -diasEntre(primeiroDia, h)), ate: somaDias(primeiroDia, -1) }, rotulo: 'Desde o início', comparacao: '', dias: diasEntre(primeiroDia, h) }
    case 'livre': {
      const de = p.de ?? h
      const ate = p.ate && p.ate >= de ? p.ate : de
      const n = diasEntre(de, ate)
      return { de, ate, ant: { de: somaDias(de, -n), ate: somaDias(de, -1) }, rotulo: `De ${dataCurta(de)} a ${dataCurta(ate)}`, comparacao: `que os ${n} dias antes`, dias: n }
    }
  }
}

// ───────────── Período escolhido (o mesmo em todas as telas) ─────────────

const CHAVE = 'escala:periodo'
const ouvintes = new Set<() => void>()
let atual: Periodo = (() => {
  try {
    const p = JSON.parse(localStorage.getItem(CHAVE) ?? 'null') as Periodo | null
    if (p && OPCOES.some((o) => o.tipo === p.tipo || p.tipo === 'livre')) return p
  } catch {
    /* sem storage */
  }
  return { tipo: 'mes' }
})()

export function mudarPeriodo(p: Periodo) {
  atual = p
  try {
    localStorage.setItem(CHAVE, JSON.stringify(p))
  } catch {
    /* sem storage */
  }
  ouvintes.forEach((f) => f())
}

export function usePeriodo(): Periodo {
  return useSyncExternalStore(
    (f) => {
      ouvintes.add(f)
      return () => ouvintes.delete(f)
    },
    () => atual,
  )
}

/** Dias de um intervalo, um por um. */
export function cadaDia(de: string, ate: string): string[] {
  const l: string[] = []
  for (let d = de; d <= ate; d = somaDias(d, 1)) l.push(d)
  return l
}
