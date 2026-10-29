import { useEffect, useState } from 'react'
import { comecarDoZero, pode, restaurarDemonstracao, sessao, type Sessao } from '../../data/store'
import { ETAPA_PRONTA, GRUPOS, menuDe, nomeMenu } from '../modulos'
import { ir, link } from '../rota'
import { Icone, Topo, avisar, confirmar } from '../ui'
import { verTour } from '../escala/Tour'
import { trocarTema, useTema } from '../escala/marca'

/** "Mais" (celular): todas as partes do painel, em grupos, e as ações da demonstração. */
export function Mais({ s }: { s: Sessao }) {
  // A página "Mais" só existe no celular; no computador, o menu lateral já mostra tudo.
  useEffect(() => {
    if (matchMedia('(min-width: 761px)').matches) ir('inicio')
  }, [])
  const [restaurando, setRestaurando] = useState(false)
  const tema = useTema()
  const grupos = (Object.keys(GRUPOS) as (keyof typeof GRUPOS)[]).map((g) => ({
    g,
    itens: menuDe(s).filter((m) => m.grupo === g && m.id !== 'inicio'),
  }))

  const restaurar = async () => {
    const ok = await confirmar({
      titulo: 'Restaurar a demonstração?',
      texto: 'Tudo volta como no primeiro acesso: produtos, preços, insumos e vendas de exemplo. O que você mudou neste aparelho se perde.',
      botao: 'Restaurar',
      perigo: true,
    })
    if (!ok) return
    setRestaurando(true)
    await restaurarDemonstracao()
    setRestaurando(false)
    avisar('Demonstração restaurada.')
  }

  const zerar = async () => {
    const ok = await confirmar({
      titulo: 'Começar do zero?',
      texto: 'Apaga só os dados de exemplo (vendas, clientes, pedidos, orçamentos, contas e compras). Os produtos, a equipe e o que você cadastrou ficam.',
      botao: 'Apagar exemplos',
      perigo: true,
    })
    if (!ok) return
    comecarDoZero()
    avisar('Dados de exemplo apagados.')
  }

  return (
    <>
      <Topo titulo="Mais" sub="Todas as partes do painel" />
      {grupos.map(({ g, itens }) =>
        itens.length ? (
          <section key={g} className="mais-grupo">
            <h2>{GRUPOS[g]}</h2>
            <ul>
              {itens.map((m) => (
                <li key={m.id}>
                  <a href={link(m.id)}>
                    <Icone nome={m.icone} />
                    <span>
                      <strong>
                        {nomeMenu(s, m)}
                        {m.etapa > ETAPA_PRONTA && <em className="em-breve">em breve</em>}
                      </strong>
                      <small>{m.frase}</small>
                    </span>
                    <Icone nome="seta" tamanho={18} />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}

      <section className="mais-grupo">
        <h2>Este aparelho</h2>
        <div className="demo-acoes">
          <button type="button" className="bt bt-leve" onClick={() => trocarTema()}>
            <Icone nome={tema === 'escuro' ? 'sol' : 'lua'} tamanho={18} />
            {tema === 'escuro' ? 'Usar o tema claro' : 'Usar o tema escuro'}
          </button>
          <button type="button" className="bt bt-leve" onClick={() => { location.hash = '/inicio'; setTimeout(verTour, 300) }}>
            Ver o tour de novo
          </button>
          <a className="bt bt-leve" href="/" target="_blank" rel="noopener">
            <Icone nome="site" tamanho={18} />
            Ver o site
          </a>
        </div>
      </section>

      <section className="mais-grupo">
        <h2>Demonstração</h2>
        <div className="demo-acoes">
          {s.papel === 'dono' && (
            <button type="button" className="bt bt-leve" onClick={zerar}>
              Começar do zero
            </button>
          )}
          <button type="button" className="bt bt-leve" onClick={restaurar} disabled={restaurando}>
            {restaurando ? 'Restaurando…' : 'Restaurar demonstração'}
          </button>
          <button type="button" className="bt bt-leve" onClick={() => sessao.sair()}>
            <Icone nome="sair" tamanho={18} />
            Sair ({s.papel === 'dono' ? 'dono' : 'funcionário'})
          </button>
        </div>
      </section>
    </>
  )
}
