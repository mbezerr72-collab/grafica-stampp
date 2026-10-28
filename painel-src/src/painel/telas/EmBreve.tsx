import type { Modulo } from '../modulos'
import type { Sessao } from '../../data/store'
import { Topo, Icone } from '../ui'
import { link } from '../rota'

const ENTREGAS: Record<number, string> = {
  2: 'Início completo e Calendário',
  3: 'Vender, Vendas e Caixa',
  4: 'Aparelhos no estoque, Compras, Usado na troca e Etiquetas',
  5: 'Assistência e Clientes',
  6: 'Equipe, Financeiro e Relatórios',
  7: 'Busca, avisos, Assistente e Site',
  8: 'Loja e acabamento',
}

/** Parte do painel que ainda está sendo montada (a demonstração é entregue por etapas). */
export function EmBreve({ m }: { m: Modulo; s?: Sessao }) {
  return (
    <>
      <Topo titulo={m.nome} sub={m.frase} />
      <section className="painel vazio">
        <span className="vazio-ic">
          <Icone nome={m.icone} tamanho={28} />
        </span>
        <h2>Chega na entrega {m.etapa}</h2>
        <p>
          {m.nome} faz parte da entrega {m.etapa}: {ENTREGAS[m.etapa]}. Os dados de exemplo dela já estão no painel.
        </p>
        <a className="bt bt-forte" href={link('produtos')}>
          Ir para Produtos
        </a>
      </section>
    </>
  )
}
