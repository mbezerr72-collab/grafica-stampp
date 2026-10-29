import type { PProduto } from '../../data/modelo'
import { fotoProduto } from '../../lib/fotos'

/** Foto pequena do produto (um trabalho feito pela gráfica), para listas e rankings. */
export function Miniatura({ p }: { p: PProduto; cor?: string }) {
  return (
    <span className="mini mini--escura">
      <img src={fotoProduto(p)} alt="" loading="lazy" decoding="async" />
    </span>
  )
}
