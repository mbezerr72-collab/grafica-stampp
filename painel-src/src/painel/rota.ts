import { useSyncExternalStore } from 'react'

/**
 * Endereços do painel pelo # (ex.: /painel#/produtos/iphone-17). Funciona em qualquer servidor
 * e o botão voltar do celular volta de tela.
 */
const ler = () => location.hash.replace(/^#\/?/, '') || 'inicio'

export function useRota(): string[] {
  const r = useSyncExternalStore(
    (f) => {
      window.addEventListener('hashchange', f)
      return () => window.removeEventListener('hashchange', f)
    },
    ler,
  )
  return r.split('/').map(decodeURIComponent)
}

export function ir(...partes: string[]) {
  location.hash = '/' + partes.map(encodeURIComponent).join('/')
}

export const link = (...partes: string[]) => '#/' + partes.map(encodeURIComponent).join('/')
