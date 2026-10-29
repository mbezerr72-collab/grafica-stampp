import { iniciais } from './numeros'

const CORES = ['var(--grad)', 'linear-gradient(118deg,#5b3fb8,#b79cff)', 'linear-gradient(118deg,#8a5a00,#ffd166)', 'linear-gradient(118deg,#0f5e46,#3ddc97)', 'linear-gradient(118deg,#8f2a1f,#ff7b6b)']

/** Bolinha com as iniciais (cada pessoa da equipe com uma cor). */
export function Avatar({ nome, i = 0, tamanho = 28 }: { nome: string; i?: number; tamanho?: number }) {
  return (
    <span className="avatar" aria-hidden="true" style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.4, background: CORES[i % CORES.length] }}>
      {iniciais(nome)}
    </span>
  )
}
