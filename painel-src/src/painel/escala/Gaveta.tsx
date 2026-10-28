/** Gaveta lateral (no celular, sobe de baixo): o detalhe de uma venda, pedido, orçamento ou cliente. */
import { useEffect, useRef, type ReactNode } from 'react'
import { Icone } from '../ui'

export function Gaveta({ titulo, sub, fechar, children, pe }: { titulo: string; sub?: ReactNode; fechar: () => void; children: ReactNode; pe?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [])
  return (
    <dialog ref={ref} className="gaveta" aria-labelledby="gaveta-t" onCancel={(e) => (e.preventDefault(), fechar())} onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="gaveta-caixa">
        <header className="gaveta-topo">
          <div>
            <h2 id="gaveta-t">{titulo}</h2>
            {sub && <p className="mut">{sub}</p>}
          </div>
          <button type="button" className="icone-bt icone-bt--leve" aria-label="Fechar" onClick={fechar}>
            <Icone nome="fechar" />
          </button>
        </header>
        <div className="gaveta-corpo">{children}</div>
        {pe && <footer className="gaveta-pe">{pe}</footer>}
      </div>
    </dialog>
  )
}
