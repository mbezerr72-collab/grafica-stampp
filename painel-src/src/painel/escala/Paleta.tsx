/** Busca e paleta de comandos (Ctrl+K no computador, a lupa no celular): telas, produtos e ações. */
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { pode, sessao, useDados, type Sessao } from '../../data/store'
import { estoqueTotal } from '../../data/modelo'
import { tituloPedido } from '../../data/negocio'
import { GRUPOS, menuDe } from '../modulos'
import { ir } from '../rota'
import { Icone } from '../ui'
import { trocarTema } from './marca'
import { abrirAssistente } from './Assistente'
import { interpretarComando } from './comandos'
import { pedir } from './pedido'

let aberta = false
const ouvintes = new Set<() => void>()
const avisar = () => ouvintes.forEach((f) => f())
export const abrirPaleta = () => {
  aberta = true
  avisar()
}
const fechar = () => {
  aberta = false
  avisar()
}

type Item = { id: string; grupo: 'Ações' | 'Telas' | 'Produtos' | 'Clientes' | 'Vendas e pedidos'; nome: string; sub: string; icone: string; fazer: () => void; atalho?: string }

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function Paleta({ s }: { s: Sessao }) {
  const aberto = useSyncExternalStore(
    (f) => {
      ouvintes.add(f)
      return () => ouvintes.delete(f)
    },
    () => aberta,
  )
  // Ctrl+K (ou Cmd+K) abre de qualquer tela.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (aberta) fechar()
        else abrirPaleta()
      }
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [])
  if (!aberto) return null
  return <Caixa s={s} />
}

function Caixa({ s }: { s: Sessao }) {
  const { produtos } = useDados('catalogo')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])

  const todos = useMemo<Item[]>(() => {
    const acoes: Item[] = [
      { id: 'a-pedido', grupo: 'Ações', nome: 'Novo pedido', sub: 'Camisa, banner, cartão, caneca…', icone: 'os', fazer: () => pedir({ tela: 'pedidos', nova: true }) },
      { id: 'a-venda', grupo: 'Ações', nome: 'Venda no balcão', sub: 'Cópia, impressão, plastificação e encadernação', icone: 'pdv', fazer: () => ir('pdv') },
      { id: 'a-orc', grupo: 'Ações', nome: 'Responder orçamentos', sub: 'Os que chegaram do site e do WhatsApp', icone: 'mensagem', fazer: () => ir('orcamentos') },
      { id: 'a-produto', grupo: 'Ações', nome: 'Cadastrar produto', sub: 'Produto ou serviço com opções e preços', icone: 'somar', fazer: () => ir('produtos', 'novo') },
      { id: 'a-ass', grupo: 'Ações', nome: 'Abrir o Assistente', sub: 'Pergunte sobre vendas, pedidos, contas…', icone: 'assistente', fazer: () => abrirAssistente() },
      { id: 'a-tema', grupo: 'Ações', nome: 'Trocar entre tema claro e escuro', sub: 'Vale neste aparelho', icone: 'lua', fazer: () => trocarTema() },
      { id: 'a-site', grupo: 'Ações', nome: 'Ver o site', sub: 'Abre em outra aba', icone: 'site', fazer: () => window.open('/', '_blank', 'noopener') },
      { id: 'a-sair', grupo: 'Ações', nome: 'Sair do painel', sub: s.nome, icone: 'sair', fazer: () => sessao.sair() },
    ]
    const telas: Item[] = menuDe(s).map((m) => ({
      id: 't-' + m.id,
      grupo: 'Telas',
      nome: m.nome,
      sub: GRUPOS[m.grupo],
      icone: m.icone,
      fazer: () => ir(m.id),
    }))
    const prods: Item[] = produtos.map((p) => {
      const est = estoqueTotal(p)
      const min = Math.min(...p.variacoes.map((v) => v.pix))
      return {
        id: 'p-' + p.id,
        grupo: 'Produtos',
        nome: p.nome,
        sub: `${p.controlaEstoque ? `${est} no estoque` : 'sob encomenda'}${Number.isFinite(min) ? `, a partir de R$ ${min.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}${p.ativo ? '' : ', desativado'}`,
        icone: 'produtos',
        fazer: () => ir('produtos', p.id),
      }
    })
    return [...acoes, ...telas, ...prods]
  }, [produtos, s])

  const clientes = useDados('clientes')
  const vendas = useDados('vendas')
  const pedidos = useDados('pedidos')
  const lista = useMemo(() => {
    const termos = semAcento(q.trim()).split(/\s+/).filter(Boolean)
    if (!termos.length) return [...todos.filter((i) => i.grupo !== 'Produtos'), ...todos.filter((i) => i.grupo === 'Produtos').slice(0, 5)]
    const casa = (txt: string) => termos.every((t) => semAcento(txt).includes(t))
    const achados = todos.filter((i) => casa(i.nome + ' ' + i.sub)).slice(0, 14)
    // Busca nos dados: clientes, vendas e pedidos pelo número.
    const extra: Item[] = []
    if (pode(s, 'vendas')) {
      for (const c of clientes.filter((c) => casa(c.nome + ' ' + c.telefone)).slice(0, 4))
        extra.push({ id: 'c-' + c.id, grupo: 'Clientes', nome: c.nome, sub: `${c.telefone}, ${c.cidade}`, icone: 'cliente', fazer: () => ir('clientes', c.id) })
      const num = q.replace(/\D/g, '')
      if (num.length >= 3 && num.length <= 5) {
        for (const v of vendas.filter((v) => String(v.numero) === num)) extra.push({ id: 'v-' + v.id, grupo: 'Vendas e pedidos', nome: `Venda nº ${v.numero}`, sub: v.itens.map((i) => i.nome).join(', '), icone: 'vendas', fazer: () => ir('vendas') })
        for (const o of pedidos.filter((o) => String(o.numero) === num)) extra.push({ id: 'o-' + o.id, grupo: 'Vendas e pedidos', nome: `Pedido ${o.numero}`, sub: tituloPedido(o), icone: 'os', fazer: () => ir('pedidos', String(o.numero)) })
      }
      for (const o of pedidos.filter((o) => o.status !== 'entregue' && casa(`pedido ${o.numero} ${o.itens.map((i) => i.nome).join(' ')} ${o.descricao}`)).slice(0, 3))
        if (!extra.some((x) => x.id === 'o-' + o.id)) extra.push({ id: 'o-' + o.id, grupo: 'Vendas e pedidos', nome: `Pedido ${o.numero}: ${o.itens[0]?.nome ?? ''}`, sub: o.descricao, icone: 'os', fazer: () => ir('pedidos', String(o.numero)) })
    }
    // Comando rápido ("vender xerox para Juliana no Pix"): abre a tela já preenchida.
    const cmd = interpretarComando(q, s)
    const comando: Item[] = cmd ? [{ id: 'a-cmd', grupo: 'Ações', nome: cmd.titulo, sub: cmd.detalhes.join(' · '), icone: 'assistente', fazer: () => pedir(cmd.pedido) }] : []
    const perguntar: Item = { id: 'a-perguntar', grupo: 'Ações', nome: `Perguntar ao Assistente: “${q.trim()}”`, sub: 'Responde com os números da gráfica', icone: 'assistente', fazer: () => abrirAssistente(q.trim()) }
    return [...comando, ...achados, ...extra, perguntar]
  }, [q, todos, clientes, vendas, pedidos, s])

  const fazer = (i: Item | undefined) => {
    if (!i) return
    fechar()
    i.fazer()
  }

  let grupoAnterior = ''
  return (
    <dialog ref={ref} className="pal" aria-label="Buscar ou fazer algo" onCancel={fechar} onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="pal-caixa">
        <label className="pal-campo">
          <Icone nome="busca" />
          <input
            autoFocus
            value={q}
            placeholder="Buscar, ou mande: “novo pedido para Juliana”"
            aria-label="Buscar ou fazer algo"
            role="combobox"
            aria-expanded="true"
            aria-controls="pal-lista"
            aria-activedescendant={lista[sel] ? 'pal-' + lista[sel].id : undefined}
            onChange={(e) => {
              setQ(e.target.value)
              setSel(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSel((x) => Math.min(lista.length - 1, x + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSel((x) => Math.max(0, x - 1))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                fazer(lista[sel])
              }
            }}
          />
          <button type="button" className="pal-fechar" onClick={fechar} aria-label="Fechar">
            <kbd className="so-pc">Esc</kbd>
            <Icone nome="fechar" tamanho={20} />
          </button>
        </label>
        <div className="pal-corpo" id="pal-lista" role="listbox">
          {lista.length === 0 && <p className="pal-vazio">Nada com “{q}”. Tente o nome do produto ou da tela.</p>}
          {lista.map((i, k) => {
            const cab = i.grupo !== grupoAnterior
            grupoAnterior = i.grupo
            return (
              <div key={i.id} role="presentation">
                {cab && <p className="pal-grupo">{i.grupo}</p>}
                <button
                  type="button"
                  id={'pal-' + i.id}
                  role="option"
                  aria-selected={k === sel}
                  className={'pal-item' + (k === sel ? ' ativo' : '')}
                  onMouseMove={() => setSel(k)}
                  onClick={() => fazer(i)}
                >
                  <span className="pi">
                    <Icone nome={i.icone} tamanho={17} />
                  </span>
                  <span className="pal-txt">
                    <b>{i.nome}</b>
                    <small>{i.sub}</small>
                  </span>
                  {k === sel && <span className="dir so-pc">Enter</span>}
                </button>
              </div>
            )
          })}
        </div>
        <div className="pal-pe so-pc-flex">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd>escolher
          </span>
          <span>
            <kbd>Enter</kbd>abrir
          </span>
          <span>
            <kbd>Esc</kbd>fechar
          </span>
        </div>
      </div>
    </dialog>
  )
}
