/**
 * Abrir uma tela já preenchida: o Calendário, o "+", a busca (Ctrl+K) e o Assistente montam o
 * pedido; a tela lê quando abre e a pessoa só confirma. Um formulário só para cada coisa.
 */
import type { FormaPag } from '../../data/negocio'
import type { Marca } from '../../data/produtos'
import { ir } from '../rota'

export type Pedido =
  | { tela: 'pdv'; produtoId?: string; cor?: string; clienteId?: string; forma?: FormaPag; parcelas?: number }
  | { tela: 'pedidos'; nova: true; clienteId?: string; abrir?: number }
  | { tela: 'pedidos'; abrir: number; nova?: false }
  | { tela: 'despesas'; modo: 'pago' | 'pagar' | 'receber'; data?: string }
  | { tela: 'produtos'; reajuste?: { marca: 'todos' | Marca; pct: number } }
  | { tela: 'compras'; entrada: true; nfe?: boolean }

let atual: Pedido | null = null

/** Guarda o pedido e abre a tela. */
export function pedir(p: Pedido) {
  atual = p
  if (location.hash.replace(/^#\/?/, '').split('/')[0] === p.tela) window.dispatchEvent(new Event('escala:pedido'))
  else ir(p.tela)
}

/** A tela pega o pedido que é dela (uma vez só). */
export function pegarPedido<T extends Pedido['tela']>(tela: T): Extract<Pedido, { tela: T }> | null {
  if (atual?.tela !== tela) return null
  const p = atual as Extract<Pedido, { tela: T }>
  // O React (modo estrito) chama duas vezes seguidas: o pedido some só depois.
  setTimeout(() => {
    if (atual === p) atual = null
  }, 0)
  return p
}
