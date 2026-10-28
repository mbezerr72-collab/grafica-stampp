/**
 * Marca do sistema (Escala Business) e da empresa ativa (Gráfica Estamp), num lugar só.
 * As cores ficam em escala.css (tokens dos dois temas); aqui só o que é nome, logo e tema.
 */
import { useSyncExternalStore } from 'react'

export const MARCA = {
  sistema: 'Escala Business',
  titulo: 'Gráfica Estamp — Gestão | Escala Business',
  empresa: { nome: 'Gráfica Estamp', local: 'R. 17 de Novembro, 1471', cidade: 'Cruzeiro do Sul' },
  ajuda: '(68) 99218-6867',
}

/** O "e" da Escala: arco branco, traço do meio e a volta em verde-água. */
export function LogoEscala({ tamanho = 34, fundo = true }: { tamanho?: number; fundo?: boolean }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 40 40" aria-hidden="true">
      {fundo && <rect width="40" height="40" rx="10" fill="#071a24" />}
      <path d="M32.3 17.9A12 12 0 1 0 12.5 30.5" fill="none" stroke="#fff" strokeWidth="5.2" strokeLinecap="round" />
      <path d="M10.5 22.6L31 16.2" stroke="#fff" strokeWidth="4.6" strokeLinecap="round" />
      <path d="M12.5 30.5A12 12 0 0 0 31.4 28" fill="none" stroke="#2bc4dd" strokeWidth="5.2" strokeLinecap="round" />
    </svg>
  )
}

export function MarcaEscala() {
  return (
    <span className="logo-eb">
      <LogoEscala />
      <span>
        <b>ESCALA</b>
        <small>BUSINESS</small>
      </span>
    </span>
  )
}

/** Selo quadrado da empresa ativa: o "A" com o triângulo laranja da Estamp. */
export function SinalEmpresa() {
  return (
    <span className="empresa-sinal" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 64 64">
        <rect width="64" height="64" rx="14" fill="#141414" />
        <path d="M32 10 54 52H44L32 28 20 52H10Z" fill="#fff" />
        <path d="M32 36 40 52H24Z" fill="#ff6a00" />
      </svg>
    </span>
  )
}

// ───────────── Tema (escuro ou claro), lembrado neste aparelho ─────────────

export type Tema = 'escuro' | 'claro'
const CHAVE = 'escala:tema'
const ouvintes = new Set<() => void>()

function lerTema(): Tema {
  try {
    const t = localStorage.getItem(CHAVE)
    if (t === 'escuro' || t === 'claro') return t
  } catch {
    /* sem storage */
  }
  return 'escuro'
}

let atual: Tema = lerTema()
aplicar(atual)

function aplicar(t: Tema) {
  document.documentElement.dataset.tema = t
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'escuro' ? '#0b1a22' : '#edf3f6')
}

export function trocarTema(t: Tema = atual === 'escuro' ? 'claro' : 'escuro') {
  atual = t
  aplicar(t)
  try {
    localStorage.setItem(CHAVE, t)
  } catch {
    /* sem storage */
  }
  ouvintes.forEach((f) => f())
}

export function useTema(): Tema {
  return useSyncExternalStore(
    (f) => {
      ouvintes.add(f)
      return () => ouvintes.delete(f)
    },
    () => atual,
  )
}
