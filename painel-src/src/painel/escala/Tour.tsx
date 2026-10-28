/** Tour de 5 passos na primeira entrada: destaca cada parte da tela com uma frase. */
import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react'

const CHAVE = 'estamp:tour-visto'
const PASSOS = [
  { alvo: 'menu', titulo: 'Tudo da gráfica num lugar', texto: 'Pedidos, orçamentos, fila de produção, insumos, balcão, caixa e clientes ficam aqui, separados por assunto.' },
  { alvo: 'periodo', titulo: 'Escolha o período', texto: 'Hoje, 7 dias, este mês ou as datas que quiser. Os números e a curva mudam juntos e comparam com o período anterior.' },
  { alvo: 'mais', titulo: 'O botão de fazer', texto: 'Novo pedido, venda no balcão, orçamento ou despesa em um toque.' },
  { alvo: 'busca', titulo: 'Busque qualquer coisa', texto: 'Ctrl + K no computador ou a lupa no celular: telas, produtos e ações.' },
  { alvo: 'ajuda', titulo: 'Ajuda em cada tela', texto: 'O “?” explica a tela em que você está. O sino avisa pedido atrasado, orçamento para responder, conta vencendo e insumo acabando.' },
]

let ativo = (() => {
  try {
    return !localStorage.getItem(CHAVE)
  } catch {
    return false
  }
})()
const ouvintes = new Set<() => void>()
export const verTour = () => {
  ativo = true
  ouvintes.forEach((f) => f())
}
const terminar = () => {
  ativo = false
  try {
    localStorage.setItem(CHAVE, '1')
  } catch {
    /* sem storage */
  }
  ouvintes.forEach((f) => f())
}

/** O alvo visível (no celular e no computador o mesmo passo aponta para peças diferentes). */
function achar(alvo: string) {
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${alvo}"]`)) {
    const r = el.getBoundingClientRect()
    if (r.width && r.height && getComputedStyle(el).visibility !== 'hidden') return el
  }
  return null
}

export function Tour() {
  const on = useSyncExternalStore(
    (f) => {
      ouvintes.add(f)
      return () => ouvintes.delete(f)
    },
    () => ativo,
  )
  if (!on) return null
  return <Passos />
}

function Passos() {
  // As peças da tela montam junto com o tour: procura depois que a tela aparece.
  const [passos, setPassos] = useState<typeof PASSOS>([])
  useEffect(() => {
    const t = setTimeout(() => setPassos(PASSOS.filter((p) => achar(p.alvo))), 450)
    return () => clearTimeout(t)
  }, [])
  const [i, setI] = useState(0)
  const [ret, setRet] = useState<DOMRect | null>(null)
  const p = passos[i]
  useLayoutEffect(() => {
    if (!p) return
    const el = achar(p.alvo)
    if (!el) return
    // Só rola até a peça quando ela cabe na tela (o menu inteiro não cabe: fica onde está).
    if (el.getBoundingClientRect().height < innerHeight * 0.6) el.scrollIntoView({ block: 'nearest' })
    const medir = () => setRet(el.getBoundingClientRect())
    medir()
    window.addEventListener('resize', medir)
    window.addEventListener('scroll', medir, true)
    return () => {
      window.removeEventListener('resize', medir)
      window.removeEventListener('scroll', medir, true)
    }
  }, [p])
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && terminar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [])
  if (!p || !ret) return null
  const W = innerWidth
  const H = innerHeight
  const larg = Math.min(320, W - 32)
  const embaixo = ret.bottom + 180 < H
  const top = embaixo ? ret.bottom + 14 : Math.max(16, ret.top - 14 - 170)
  const left = Math.min(W - larg - 16, Math.max(16, ret.left + ret.width / 2 - larg / 2))
  const ultimo = i === passos.length - 1
  return (
    <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-t">
      <div className="tour-luz" style={{ top: ret.top - 6, left: ret.left - 6, width: ret.width + 12, height: ret.height + 12 }} />
      <div className="tour-cartao" style={{ top, left, width: larg }}>
        <p className="tour-passo">
          {i + 1} de {passos.length}
        </p>
        <h2 id="tour-t">{p.titulo}</h2>
        <p>{p.texto}</p>
        <div className="tour-acoes">
          <button type="button" className="bt bt-leve bt-pequeno" onClick={terminar}>
            Pular
          </button>
          <button type="button" className="bt bt-forte bt-pequeno" autoFocus onClick={() => (ultimo ? terminar() : setI(i + 1))}>
            {ultimo ? 'Começar' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  )
}
