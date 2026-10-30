/** O "+": ações rápidas (barra de baixo no celular, botão "Novo" no computador). */
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { pode, type Sessao } from '../../data/store'
import { ir } from '../rota'
import { pedir, type Pedido } from './pedido'
import { Icone } from '../ui'

let aberto = false
const ouvintes = new Set<() => void>()
const mudar = (v: boolean) => {
  aberto = v
  ouvintes.forEach((f) => f())
}
export const abrirAcoes = () => mudar(true)

const ACOES = [
  { nome: 'Novo pedido', frase: 'Camisa, banner, cartão… com prazo e arte', icone: 'os', rota: ['pedidos'], pedido: { tela: 'pedidos', nova: true } as Pedido, permissao: 'vendas' as const },
  { nome: 'Venda no balcão', frase: 'Cópia, impressão, plastificação e encadernação', icone: 'pdv', rota: ['pdv'], permissao: 'vendas' as const },
  { nome: 'Responder orçamento', frase: 'Os que chegaram do site e do WhatsApp', icone: 'mensagem', rota: ['orcamentos'], permissao: 'vendas' as const },
  { nome: 'Usei (tirar) em insumo', frase: 'Camisa lisa, papel, tinta, lona', icone: 'estoque', rota: ['insumos'], permissao: 'vendas' as const },
  { nome: 'Cadastrar produto', frase: 'Produto ou serviço com opções e preços', icone: 'produtos', rota: ['produtos', 'novo'], permissao: 'produtos' as const },
  { nome: 'Criar anúncio', frase: 'Arte pronta para Instagram e WhatsApp', icone: 'anuncio', rota: ['anuncios'], permissao: 'anuncios' as const },
  { nome: 'Lançar despesa', frase: 'Aluguel, energia, compra: o que pagou ou vai pagar', icone: 'carteira', rota: ['despesas'], pedido: { tela: 'despesas', modo: 'pago' } as Pedido, permissao: 'despesas' as const },
]

export function FolhaAcoes({ s }: { s: Sessao }) {
  const on = useSyncExternalStore(
    (f) => {
      ouvintes.add(f)
      return () => ouvintes.delete(f)
    },
    () => aberto,
  )
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (on && !ref.current?.open) ref.current?.showModal()
    if (!on && ref.current?.open) ref.current.close()
  }, [on])
  return (
    <dialog ref={ref} className="folha" aria-labelledby="folha-t" onCancel={() => mudar(false)} onClose={() => mudar(false)} onClick={(e) => e.target === e.currentTarget && mudar(false)}>
      <div className="folha-caixa">
        <div className="folha-topo">
          <h2 id="folha-t">O que você quer fazer?</h2>
          <button type="button" className="icone-bt icone-bt--leve" aria-label="Fechar" onClick={() => mudar(false)}>
            <Icone nome="fechar" />
          </button>
        </div>
        <ul className="folha-lista">
          {ACOES.filter((a) => pode(s, a.permissao) && (s.papel === 'dono' || a.permissao === 'vendas')).map((a) => (
            <li key={a.nome}>
              <button
                type="button"
                onClick={() => {
                  mudar(false)
                  if ('pedido' in a && a.pedido) pedir(a.pedido)
                  else ir(...a.rota)
                }}
              >
                <span className="folha-ic">
                  <Icone nome={a.icone} />
                </span>
                <b>{a.nome}</b>
                <small>{a.frase}</small>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  )
}
