import { lazy, Suspense, useEffect, useMemo } from 'react'
import { hoje, negocio, pode, sessao as sessaoApi, useDados, vitrine, type Sessao } from '../data/store'
import { avisar as avisarTopo } from './ui'
import { link, useRota } from './rota'
import { Avisos, Confirmacao, Icone, Topo , avisar } from './ui'
import { DO_VENDEDOR, ETAPA_PRONTA, GRUPOS, MODULOS, ehVendedor, menuDe, modulo, nomeMenu, type Grupo } from './modulos'
import { Login } from './telas/Login'
import { Inicio } from './telas/Inicio'
import { Comissao } from './telas/Comissao'
import { Mais } from './telas/Mais'
import { EmBreve } from './telas/EmBreve'
import { FaixaDemo } from './escala/Cabecalho'
import { MarcaEscala, MARCA, SinalEmpresa } from './escala/marca'
import { Paleta, abrirPaleta } from './escala/Paleta'
import { FolhaAcoes, abrirAcoes } from './escala/Acoes'
import { Tour } from './escala/Tour'
import { Guia, useGuiaPrimeiraVez } from './escala/Guia'
import { Assistente } from './escala/Assistente'
import { Esqueleto } from './escala/componentes'

// Telas pesadas só carregam quando abertas.
const Produtos = lazy(() => import('./telas/Produtos'))
const ProdutoForm = lazy(() => import('./telas/ProdutoForm'))
const Calendario = lazy(() => import('./telas/Calendario'))
const Pdv = lazy(() => import('./telas/Pdv'))
const Vendas = lazy(() => import('./telas/Vendas'))
const Insumos = lazy(() => import('./telas/Insumos'))
const Compras = lazy(() => import('./telas/Compras'))
const Pedidos = lazy(() => import('./telas/Pedidos'))
const Orcamentos = lazy(() => import('./telas/Orcamentos'))
const Producao = lazy(() => import('./telas/Producao'))
const Clientes = lazy(() => import('./telas/Clientes'))
const Despesas = lazy(() => import('./telas/Despesas'))
const Metas = lazy(() => import('./telas/Metas'))
const Relatorios = lazy(() => import('./telas/Relatorios'))
const Equipe = lazy(() => import('./telas/Equipe'))
const Loja = lazy(() => import('./telas/Loja'))

export function App() {
  const s = useDados('sessao')
  // Promoção que passou da data acaba sozinha (o preço volta).
  useEffect(() => {
    if (!s) return
    vitrine.vencerPromos()
    // Despesas fixas do mês que vem já entram sozinhas (aluguel, energia, internet, salários).
    if (pode(s, 'despesas')) negocio.lancarFixas()
    // Pedidos que os clientes mandaram pelo site entram como orçamentos novos.
    const trazer = () => {
      const n = negocio.importarDoSite()
      if (n) avisarTopo(`${n} ${n === 1 ? 'pedido novo chegou' : 'pedidos novos chegaram'} pelo site.`, { nome: 'Ver', fazer: () => (location.hash = '#/orcamentos') })
    }
    trazer()
    const t = setInterval(trazer, 15000)
    addEventListener('focus', trazer)
    return () => {
      clearInterval(t)
      removeEventListener('focus', trazer)
    }
  }, [s])
  if (!s) return <Login />
  return (
    <div className="casca">
      <Lateral s={s} />
      <div className="trabalho">
        <FaixaDemo />
        <main className="conteudo" id="conteudo">
          <Suspense fallback={<Carregando />}>
            <Tela s={s} />
          </Suspense>
        </main>
      </div>
      <BarraBaixo s={s} />
      <FolhaAcoes s={s} />
      <Paleta s={s} />
      <Tour />
      <Guia />
      <Assistente />
      <Confirmacao />
      <Avisos />
    </div>
  )
}

function Carregando() {
  return (
    <div className="carregando" role="status" aria-label="Abrindo">
      <div className="topo topo--baixo" />
      <div className="painel">
        <Esqueleto linhas={4} />
      </div>
    </div>
  )
}

function Tela({ s }: { s: Sessao }) {
  const [id, ...resto] = useRota()
  const m = modulo(id)
  useGuiaPrimeiraVez(ehVendedor(s) && id === 'inicio' ? 'inicio-vendedor' : id)
  // Cada troca de tela começa no topo, com o nome da tela na aba.
  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = (m && m.id !== 'inicio' ? m.nome + ' · ' : '') + MARCA.titulo
  }, [id, resto[0], m])
  // O funcionário só abre as telas dele, mesmo digitando o endereço: o resto volta para o Início dele.
  const proibida = ehVendedor(s) && id !== 'mais' && !DO_VENDEDOR.includes(id)
  useEffect(() => {
    if (!proibida) return
    avisar('Essa parte é só do dono.')
    location.replace('#/inicio')
  }, [proibida])
  if (proibida) return <Inicio s={s} />
  if (id === 'inicio') return <Inicio s={s} />
  if (id === 'mais') return <Mais s={s} />
  if (!m) return <Inicio s={s} />
  if (!pode(s, m.permissao)) return <SemAcesso />
  if (id === 'produtos') return resto[0] ? <ProdutoForm id={resto[0]} s={s} /> : <Produtos s={s} />
  if (id === 'calendario') return <Calendario s={s} />
  if (id === 'pdv') return <Pdv s={s} />
  if (id === 'vendas') return <Vendas s={s} />
  if (id === 'insumos') return <Insumos s={s} />
  if (id === 'compras') return <Compras s={s} />
  if (id === 'pedidos') return <Pedidos s={s} id={resto[0]} />
  if (id === 'orcamentos') return <Orcamentos s={s} id={resto[0]} />
  if (id === 'producao') return <Producao s={s} />
  if (id === 'clientes') return <Clientes s={s} id={resto[0]} />
  if (id === 'despesas') return <Despesas s={s} />
  if (id === 'metas') return <Metas s={s} />
  if (id === 'relatorios') return <Relatorios s={s} />
  if (id === 'equipe') return <Equipe s={s} />
  if (id === 'comissao') return <Comissao s={s} />
  if (id === 'loja') return <Loja s={s} />
  return <EmBreve m={m} s={s} />
}

function SemAcesso() {
  return (
    <>
      <Topo titulo="Esta parte é só do dono" sub="Custo, lucro, contas e configurações ficam no login do dono." />
      <section className="painel vazio">
        <span className="vazio-ic">
          <Icone nome="cadeado" tamanho={28} />
        </span>
        <h2>Peça ao dono da gráfica para abrir pelo login dele</h2>
        <a className="bt bt-forte" href={link('inicio')}>
          Voltar ao início
        </a>
      </section>
    </>
  )
}

/** Números pequenos ao lado do item do menu: o que está esperando alguém. */
function useContadores(s: Sessao) {
  const pedidos = useDados('pedidos')
  const orcamentos = useDados('orcamentos')
  const insumos = useDados('insumos')
  const contas = useDados('contas')
  return useMemo(() => {
    const h = hoje()
    const atrasados = pedidos.filter((o) => o.status !== 'entregue' && o.status !== 'pronto' && o.prazo < h).length
    const novos = orcamentos.filter((o) => o.status === 'novo').length
    const faltando = insumos.filter((x) => x.estoque < x.minimo).length
    const atrasadas = pode(s, 'despesas') ? contas.filter((c) => c.tipo === 'pagar' && !c.pagaEm && c.vencimento < h).length : 0
    return {
      pedidos: atrasados ? { n: String(atrasados), t: `${atrasados} ${atrasados === 1 ? 'pedido atrasado' : 'pedidos atrasados'}`, ok: false } : null,
      orcamentos: novos ? { n: String(novos), t: `${novos} para responder`, ok: true } : null,
      insumos: faltando ? { n: String(faltando), t: `${faltando} abaixo do mínimo`, ok: false } : null,
      despesas: atrasadas ? { n: String(atrasadas), t: `${atrasadas} ${atrasadas === 1 ? 'conta atrasada' : 'contas atrasadas'}`, ok: false } : null,
    } as Record<string, { n: string; t: string; ok: boolean } | null>
  }, [pedidos, orcamentos, insumos, contas, s])
}

/** Menu lateral do computador: a Escala, a empresa ativa, a busca e tudo à vista em grupos. */
function Lateral({ s }: { s: Sessao }) {
  const [id] = useRota()
  const cont = useContadores(s)
  const meus = menuDe(s)
  const grupos = ehVendedor(s)
    ? [{ g: 'menu' as const, itens: meus }]
    : (Object.keys(GRUPOS) as Grupo[]).map((g) => ({ g, itens: meus.filter((m) => m.grupo === g) }))
  return (
    <aside className="lado" aria-label="Menu do painel" data-tour="menu">
      <a href={link('inicio')} aria-label="Escala Business, início">
        <MarcaEscala />
      </a>
      <div className="empresa" title="Empresa ativa">
        <SinalEmpresa />
        <span>
          <b>
            {MARCA.empresa.nome}
            <i>.</i>
          </b>
          <small>{MARCA.empresa.local}</small>
        </span>
      </div>
      <button className="lado-busca" type="button" onClick={abrirPaleta} data-tour="busca">
        <Icone nome="busca" tamanho={18} />
        <span>Buscar ou fazer algo</span>
        <kbd>Ctrl K</kbd>
      </button>
      <nav className="lado-nav">
        {grupos.map(({ g, itens }) =>
          itens.length ? (
            <div key={g} className="lado-grupo">
              {g !== 'menu' && <p>{GRUPOS[g]}</p>}
              {itens.map((m) => (
                <a key={m.id} className="lado-item" href={link(m.id)} aria-current={m.id === id ? 'page' : undefined}>
                  <Icone nome={m.icone} tamanho={18} />
                  <span className="lado-nome">{nomeMenu(s, m)}</span>
                  {cont[m.id] ? (
                    <span className={'cnt' + (cont[m.id]!.ok ? ' ok' : '')} title={cont[m.id]!.t} aria-label={cont[m.id]!.t}>
                      {cont[m.id]!.n}
                    </span>
                  ) : m.etapa > ETAPA_PRONTA ? (
                    <span className="em-breve" title={`Chega na entrega ${m.etapa}`} aria-label={`em breve, entrega ${m.etapa}`} />
                  ) : null}
                </a>
              ))}
            </div>
          ) : null,
        )}
      </nav>
      <div className="lado-pe">
        <span className="avatar" aria-hidden="true">
          {s.nome
            .split(' ')
            .map((p) => p[0])
            .slice(0, 2)
            .join('')}
        </span>
        <span className="lado-quem">
          <b>{s.nome}</b>
          <small>{s.papel === 'dono' ? 'Dono' : 'Funcionário'}</small>
        </span>
        <button type="button" className="icone-bt icone-bt--lado" aria-label="Sair do painel" onClick={() => sessaoApi.sair()}>
          <Icone nome="sair" tamanho={18} />
        </button>
      </div>
    </aside>
  )
}

/** Barra de baixo no celular: Início, Vendas, o "+", Pedidos e Mais. */
function BarraBaixo({ s }: { s: Sessao }) {
  const [id] = useRota()
  // O vendedor tem "Vender" no lugar de "Vendas" (ele não vê a lista de vendas da loja).
  const segundo: [string, string, string] = ehVendedor(s) ? ['pdv', 'Balcão', 'pdv'] : ['vendas', 'Vendas', 'vendas']
  const naBarra = ['inicio', segundo[0], 'pedidos'].includes(id)
  const item = (rota: string, nome: string, icone: string) => (
    <a href={link(rota)} aria-current={id === rota || (rota === 'mais' && !naBarra) ? 'page' : undefined}>
      <Icone nome={icone} />
      {nome}
    </a>
  )
  return (
    <nav className="barra-baixo" aria-label="Menu principal" data-tour="menu">
      {item('inicio', 'Início', 'inicio')}
      {item(...segundo)}
      <button type="button" className="mais-acao" aria-label="Fazer algo: venda, pedido, orçamento, despesa" onClick={abrirAcoes} data-tour="mais">
        <Icone nome="somar" />
      </button>
      {item('pedidos', 'Pedidos', 'os')}
      {item('mais', 'Mais', 'mais')}
    </nav>
  )
}
