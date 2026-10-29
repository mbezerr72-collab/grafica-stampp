/**
 * Ajuda dentro de cada tela:
 *  - na primeira vez em cada tela, um guia de 3 passos com balões apontando (Pular / Ver de novo no "?");
 *  - "Como faço…?" no "?": cada pergunta é um passo a passo que acende os botões na própria tela;
 *
 * O alvo de cada passo é um seletor CSS ou "texto:…" (o botão, link ou aba que tem esse texto).
 * Se o alvo não estiver na tela, o balão aparece no meio com a frase (sem apontar).
 */
import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react'

export type Passo = { alvo: string; texto: string }
type GuiaTela = { passos: Passo[]; perguntas: { p: string; passos: Passo[] }[]; video?: { arquivo: string; nome: string } }

export const GUIAS: Record<string, GuiaTela> = {
  inicio: {
    passos: [
      { alvo: '[data-tour="periodo"]', texto: 'Escolha o período: hoje, 7 dias ou o mês. Os números mudam juntos.' },
      { alvo: '.kpis', texto: 'Aqui está quanto vendeu, quanto lucrou e quanto tem no caixa.' },
      { alvo: '[data-tour="mais"]', texto: 'Para abrir um pedido, vender no balcão ou lançar uma conta, toque no botão de fazer.' },
    ],
    perguntas: [
      { p: 'Como vejo quanto vendi hoje?', passos: [{ alvo: '[data-tour="periodo"]', texto: 'Toque aqui e escolha “Hoje”.' }, { alvo: '.kpis', texto: 'O primeiro número é o que vendeu hoje.' }] },
      { p: 'Como abro um pedido daqui?', passos: [{ alvo: 'texto:Novo pedido', texto: 'Toque em “Novo pedido”.' }] },
    ],
  },
  'inicio-vendedor': {
    passos: [
      { alvo: '.vendedor-bt.principal', texto: '1. Cliente quer camisa, banner, cartão? Toque em Novo pedido.' },
      { alvo: '.vendedor-bts', texto: '2. Xerox e pronta entrega ficam no Balcão; o que fazer primeiro, na Fila de produção.' },
      { alvo: '.comissao-cartao', texto: '3. Aqui você vê quanto já ganhou de comissão no mês.' },
    ],
    perguntas: [{ p: 'Como vejo minha comissão?', passos: [{ alvo: '.comissao-cartao', texto: 'Toque no cartão para ver venda por venda.' }] }],
  },
  comissao: {
    passos: [
      { alvo: '.comissao-cartao', texto: '1. Quanto você ganhou de comissão neste mês.' },
      { alvo: '.comissao-barra', texto: '2. A barra mostra quanto falta para a meta.' },
      { alvo: '.comissao-lista, .painel', texto: '3. Cada venda sua, com o que ela rendeu para você.' },
    ],
    perguntas: [],
  },
  pedidos: {
    passos: [
      { alvo: 'texto:Novo pedido', texto: '1. Cliente fechou? Toque em Novo pedido: produto, quantidade, grade de tamanhos e prazo.' },
      { alvo: '.quadro', texto: '2. Cada pedido anda pelas colunas: Novo, Arte, Aprovação, Produção, Pronto e Entregue.' },
      { alvo: '.os-prox', texto: '3. O botão do cartão leva para a próxima etapa e já prepara a mensagem do WhatsApp.' },
    ],
    perguntas: [
      { p: 'Como abro um pedido?', passos: [{ alvo: 'texto:Novo pedido', texto: 'Toque em Novo pedido, escolha o cliente, o produto e a quantidade.' }] },
      { p: 'Como recebo o sinal?', passos: [{ alvo: '.os-abrir', texto: 'Toque no pedido. Em “Pagamento”, escreva o valor e toque em Receber entrada.' }] },
      { p: 'Como aviso que ficou pronto?', passos: [{ alvo: '.os-prox', texto: 'Toque no botão do cartão até “Pronto”. A mensagem do WhatsApp abre sozinha.' }] },
    ],
  },
  orcamentos: {
    passos: [
      { alvo: '.quadro', texto: '1. Os pedidos de orçamento do site entram aqui sozinhos, em “Para responder”.' },
      { alvo: '.os-prox', texto: '2. Toque em Responder: confira o que o cliente pediu, ponha valor e prazo.' },
      { alvo: 'texto:Novo orçamento', texto: '3. Chegou pelo WhatsApp ou no balcão? Registre aqui.' },
    ],
    perguntas: [{ p: 'Como transformo em pedido?', passos: [{ alvo: '.os-abrir', texto: 'Abra o orçamento e toque em “Cliente fechou”. Ele vira pedido na hora.' }] }],
  },
  producao: {
    passos: [
      { alvo: '[aria-label="Setor"]', texto: '1. Escolha o seu setor: arte, sublimação, DTF, impressão…' },
      { alvo: '.quadro', texto: '2. O que vence primeiro fica em cima. Atrasado fica em vermelho.' },
      { alvo: '.os-prox', texto: '3. Terminou? Toque no botão do cartão. A ficha de produção sai em PDF.' },
    ],
    perguntas: [],
  },
  insumos: {
    passos: [
      { alvo: '[aria-label="Situação do material"]', texto: '1. O que está acabando aparece aqui.' },
      { alvo: 'texto:Comprar', texto: '2. Em “Comprar”, o pedido de cada fornecedor já vem pronto para o WhatsApp.' },
      { alvo: '.tabela', texto: '3. Toque no insumo para dar baixa do que a produção usou.' },
    ],
    perguntas: [{ p: 'Como dou baixa de camisa usada?', passos: [{ alvo: 'input[aria-label="Buscar material"]', texto: 'Ache a camisa (cor e tamanho), toque nela, escreva a quantidade e toque em Usei (tirar).' }] }],
  },
  pdv: {
    passos: [
      { alvo: 'input[aria-label*="Buscar"], texto:Bipar com a câmera', texto: '1. Ache o produto: digite o nome (ex.: xerox) ou bipe o código.' },
      { alvo: 'section[aria-label="Pagamento"]', texto: '2. Escolha como o cliente paga (Pix, cartão, dinheiro). Dá para dividir.' },
      { alvo: 'texto:Finalizar venda', texto: '3. Toque em Finalizar venda. O recibo vai pelo WhatsApp.' },
    ],
    perguntas: [
      { p: 'Como vendo 50 cópias de xerox?', passos: [{ alvo: 'input[aria-label*="Buscar"]', texto: 'Digite “xerox” e toque no produto.' }, { alvo: '.escolher', texto: 'Escolha a opção, toque em 50 e em Pôr no carrinho.' }, { alvo: 'texto:Finalizar venda', texto: 'Escolha o pagamento e toque em Finalizar venda.' }] },
      { p: 'Como divido o pagamento?', passos: [{ alvo: 'section[aria-label="Pagamento"]', texto: 'Toque em “Dividir em duas formas” e escreva quanto vai em cada uma.' }] },
    ],
  },
  vendas: {
    passos: [
      { alvo: 'input[aria-label="Buscar venda"]', texto: '1. Ache a venda pelo nome do cliente, número ou produto.' },
      { alvo: '.lista, table, .vendas-lista', texto: '2. Toque na venda para ver o recibo.' },
      { alvo: '[data-tour="mais"], texto:Venda no balcão', texto: '3. Para vender de novo, use o botão de fazer.' },
    ],
    perguntas: [
      { p: 'Como devolvo uma venda?', passos: [{ alvo: 'input[aria-label="Buscar venda"]', texto: 'Ache a venda e toque nela.' }, { alvo: 'texto:Registrar devolução', texto: 'Toque em “Registrar devolução”. A venda sai do total vendido.' }] },
      { p: 'Como mando o recibo de novo?', passos: [{ alvo: 'input[aria-label="Buscar venda"]', texto: 'Ache a venda e toque nela.' }, { alvo: 'texto:WhatsApp', texto: 'Toque no WhatsApp para mandar o recibo de novo.' }] },
    ],
  },
  produtos: {
    passos: [
      { alvo: 'input[aria-label="Buscar produto"]', texto: '1. Ache o produto pelo nome.' },
      { alvo: 'texto:Preços em lista', texto: '2. Para mudar preços ou reajustar vários em %, use “Preços em lista”.' },
      { alvo: '.menu-linha', texto: '3. Em “…”, desative o produto sem apagar.' },
    ],
    perguntas: [{ p: 'Como mudo o preço?', passos: [{ alvo: 'texto:Preços em lista', texto: 'Toque em “Preços em lista”.' }, { alvo: 'input[aria-label="Buscar produto"]', texto: 'Ache o produto, escreva o preço novo de cada opção e salve.' }] }],
  },
  compras: {
    passos: [
      { alvo: 'texto:Chegou material', texto: '1. Chegou material do fornecedor? Toque em “Chegou material”.' },
      { alvo: '.forn', texto: '2. Os fornecedores, com quanto comprou de cada um.' },
      { alvo: '.lista-vendas', texto: '3. As últimas compras, com o vencimento da conta.' },
    ],
    perguntas: [],
  },
  anuncios: {
    passos: [
      { alvo: '.anuncio-mini-lista', texto: '1. Escolha o modelo olhando as prévias.' },
      { alvo: '.anuncio-fotos, select', texto: '2. Escolha o produto e a foto (ou use uma sua).' },
      { alvo: 'texto:Baixar imagem', texto: '3. Baixe a imagem e copie a legenda. É só postar.' },
    ],
    perguntas: [{ p: 'Como faço uma promoção?', passos: [{ alvo: 'texto:Promoção', texto: 'Toque no modelo Promoção, escolha o produto e o desconto.' }, { alvo: 'texto:Baixar imagem', texto: 'Baixe a imagem e poste.' }] }],
  },
  clientes: {
    passos: [
      { alvo: 'input[aria-label="Buscar cliente"]', texto: '1. Ache o cliente pelo nome ou telefone.' },
      { alvo: '[aria-label="Listas prontas"]', texto: '2. As listas mostram aniversário, empresas, pedido do ano passado e pedido pronto.' },
      { alvo: '.btn-p', texto: '3. Cliente novo? Cadastre aqui.' },
    ],
    perguntas: [{ p: 'Como mando mensagem para vários clientes?', passos: [{ alvo: '[aria-label="Listas prontas"]', texto: 'Escolha a lista e toque no WhatsApp ao lado de cada pessoa.' }] }],
  },
  despesas: {
    passos: [
      { alvo: '.btn-p', texto: '1. Lance a conta: já paga ou para pagar depois.' },
      { alvo: '.conta-bt, .conta-txt', texto: '2. Contas para pagar aparecem aqui, na data.' },
      { alvo: '[data-tour="periodo"]', texto: '3. Mude o período para ver os outros meses.' },
    ],
    perguntas: [{ p: 'Como marco uma conta como paga?', passos: [{ alvo: '.conta-bt', texto: 'Toque em “Paguei” na conta.' }] }],
  },
}

// ───────────── Estado: o guia aberto agora ─────────────

const CHAVE = (tela: string) => `estamp:guia:${tela}`
let atual: { passos: Passo[]; chave?: string } | null = null
const ouvintes = new Set<() => void>()
const avisar = () => ouvintes.forEach((f) => f())
const ler = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return '1'
  }
}
const gravar = (k: string) => {
  try {
    localStorage.setItem(k, '1')
  } catch {
    /* sem storage */
  }
}

export function mostrarGuia(passos: Passo[], chave?: string) {
  atual = { passos, chave }
  avisar()
}
const fechar = () => {
  if (atual?.chave) gravar(atual.chave)
  atual = null
  avisar()
}
export const verGuiaDeNovo = (tela: string) => GUIAS[tela] && mostrarGuia(GUIAS[tela].passos, CHAVE(tela))

/** Primeira vez na tela: mostra o guia (depois do tour de boas-vindas). */
export function useGuiaPrimeiraVez(tela: string) {
  useEffect(() => {
    const g = GUIAS[tela]
    if (!g || ler(CHAVE(tela)) || ler('escala:guias-vistos') || !ler('escala:tour-visto')) return
    const t = setTimeout(() => {
      if (!atual) mostrarGuia(g.passos, CHAVE(tela))
    }, 900)
    return () => clearTimeout(t)
  }, [tela])
}

/** O alvo visível: seletor CSS ou "texto:…" (botão, link ou aba com esse texto). Aceita "a, b" (o primeiro que achar). */
function achar(alvo: string): HTMLElement | null {
  for (const parte of alvo.split(/,\s*(?=texto:|[.#\[a-z])/)) {
    const lista = parte.startsWith('texto:')
      ? [...document.querySelectorAll<HTMLElement>('button, a, [role="tab"], label, summary')].filter((e) => e.textContent?.toLowerCase().includes(parte.slice(6).trim().toLowerCase()))
      : (() => {
          try {
            return [...document.querySelectorAll<HTMLElement>(parte)]
          } catch {
            return []
          }
        })()
    for (const el of lista) {
      if (el.closest('.guia')) continue
      const r = el.getBoundingClientRect()
      if (r.width && r.height && getComputedStyle(el).visibility !== 'hidden') return el
    }
  }
  return null
}

export function Guia() {
  const g = useSyncExternalStore(
    (f) => {
      ouvintes.add(f)
      return () => ouvintes.delete(f)
    },
    () => atual,
  )
  if (!g) return null
  return <Baloes key={g.passos.map((p) => p.texto).join('|')} passos={g.passos} />
}

function Baloes({ passos }: { passos: Passo[] }) {
  const [i, setI] = useState(0)
  const [ret, setRet] = useState<DOMRect | null>(null)
  const [achou, setAchou] = useState(true)
  const p = passos[i]
  useLayoutEffect(() => {
    const el = achar(p.alvo)
    setAchou(!!el)
    if (!el) return setRet(null)
    if (el.getBoundingClientRect().height < innerHeight * 0.6) el.scrollIntoView({ block: 'center' })
    const medir = () => setRet(el.getBoundingClientRect())
    medir()
    addEventListener('resize', medir)
    addEventListener('scroll', medir, true)
    return () => {
      removeEventListener('resize', medir)
      removeEventListener('scroll', medir, true)
    }
  }, [p])
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && fechar()
    addEventListener('keydown', esc)
    return () => removeEventListener('keydown', esc)
  }, [])
  const W = innerWidth
  const H = innerHeight
  const larg = Math.min(320, W - 32)
  const ultimo = i === passos.length - 1
  let top = H / 2 - 90
  let left = W / 2 - larg / 2
  let seta: 'cima' | 'baixo' | null = null
  if (ret && achou) {
    const embaixo = ret.bottom + 190 < H
    top = embaixo ? ret.bottom + 16 : Math.max(16, ret.top - 16 - 172)
    left = Math.min(W - larg - 16, Math.max(16, ret.left + ret.width / 2 - larg / 2))
    seta = embaixo ? 'cima' : 'baixo'
  }
  const setaX = ret ? Math.min(larg - 24, Math.max(16, ret.left + ret.width / 2 - left - 8)) : 0
  return (
    <div className="guia tour" role="dialog" aria-modal="true" aria-labelledby="guia-t">
      {ret && achou ? <div className="tour-luz guia-luz" style={{ top: ret.top - 6, left: ret.left - 6, width: ret.width + 12, height: ret.height + 12 }} /> : <div className="guia-fundo" />}
      <div className={'tour-cartao guia-cartao' + (seta ? ` seta-${seta}` : '')} style={{ top, left, width: larg, ['--seta-x' as string]: `${setaX}px` }}>
        <p className="tour-passo">
          Passo {i + 1} de {passos.length}
        </p>
        <p id="guia-t" className="guia-texto">
          {p.texto}
        </p>
        <div className="tour-acoes">
          <button type="button" className="bt bt-leve bt-pequeno" onClick={fechar}>
            Pular
          </button>
          {i > 0 && (
            <button type="button" className="bt bt-leve bt-pequeno" onClick={() => setI(i - 1)}>
              Voltar
            </button>
          )}
          <button type="button" className="bt bt-forte bt-pequeno" autoFocus onClick={() => (ultimo ? fechar() : setI(i + 1))}>
            {ultimo ? 'Entendi' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  )
}
