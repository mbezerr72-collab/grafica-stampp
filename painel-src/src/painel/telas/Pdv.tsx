import { useEffect, useMemo, useRef, useState } from 'react'
import qrcode from 'qrcode-generator'
import { agoraLoja, hoje, negocio, pode, useDados, type Sessao } from '../../data/store'
import { estoqueTotal, type PProduto } from '../../data/modelo'
import { NOME_MARCA, PAGAMENTO, type Marca } from '../../data/produtos'
import { type FormaPag, type ItemVenda, type Venda } from '../../data/negocio'
import { CampoDinheiro, Contador, Icone, Topo, avisar } from '../ui'
import { ir, link } from '../rota'
import { brl } from '../escala/componentes'
import { Miniatura } from '../escala/Miniatura'
import { linkWhats, mensagemVenda, reciboPdf } from '../escala/documentos'
import { LerCodigo } from '../escala/LerCodigo'
import { EscolherCliente } from '../escala/EscolherCliente'
import { Gaveta } from '../escala/Gaveta'
import { cartaoLoja, eanDe, interpretarCodigo, parcelamento, pixCopiaECola, saemJunto, valorNaForma } from '../escala/automatico'
import { pegarPedido } from '../escala/pedido'
import { LOJA } from '../../lib/config'

type Item = ItemVenda & { chave: string; liberado?: boolean }
type Pag = { forma: FormaPag; valor: number; parcelas: number }

const FILTROS: { id: 'mais' | Marca; nome: string }[] = [{ id: 'mais', nome: 'Mais vendidos' }, ...(Object.entries(NOME_MARCA) as [Marca, string][]).map(([id, nome]) => ({ id, nome }))]
const FORMAS: { id: FormaPag; nome: string }[] = [
  { id: 'pix', nome: 'Pix' },
  { id: 'credito', nome: 'Crédito' },
  { id: 'debito', nome: 'Débito' },
  { id: 'dinheiro', nome: 'Dinheiro' },
]
const MAIS = ['xerox-pb', 'impressao-cor', 'plastificacao', 'encadernacao', 'cartao-visita', 'canecas', 'chaveiros', 'canetas']
const CHAVE_VENDEDOR = 'estamp:atendente'

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const dinheiro = (v: number) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })
const lerVendedor = () => {
  try {
    return localStorage.getItem(CHAVE_VENDEDOR) ?? ''
  } catch {
    return ''
  }
}
/** Balcão: xerox, impressão e pronta entrega. Tocar, cobrar e pronto; o resto o sistema preenche. */
/** Leva até o lugar do que falta e acende ele por um instante (a "seta" do aviso). */
function mostrarOnde(sel: string) {
  const el = document.querySelector<HTMLElement>(sel)
  if (!el) return
  el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  el.classList.add('campo-aceso')
  setTimeout(() => el.classList.remove('campo-aceso'), 1600)
}

export default function Pdv({ s }: { s: Sessao }) {
  const { produtos } = useDados('catalogo')
  const clientes = useDados('clientes')
  const equipe = useDados('equipe')
  const vendas = useDados('vendas')
  const config = useDados('config')
  const caixa = negocio.caixaDeHoje()
  const dono = pode(s, 'financeiro')
  const vendedores = equipe.filter((e) => e.ativo && (e.papel === 'dono' || e.papel === 'atendimento'))
  const eu = vendedores.find((e) => e.nome === s.nome)

  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]['id']>('mais')
  const [escolhendo, setEscolhendo] = useState<PProduto | null>(null)
  const [itens, setItens] = useState<Item[]>([])
  const [clienteId, setClienteId] = useState<string>()
  // O vendedor padrão é quem está logado; se alguém escolheu outro neste aparelho, fica o último escolhido.
  const [vendedorId, setVendedorIdBruto] = useState(() => {
    const salvo = lerVendedor()
    return vendedores.some((v) => v.id === salvo) ? salvo : (eu?.id ?? vendedores[0]?.id ?? '')
  })
  const setVendedorId = (id: string) => {
    setVendedorIdBruto(id)
    try {
      localStorage.setItem(CHAVE_VENDEDOR, id)
    } catch {
      /* sem storage */
    }
  }
  const [pags, setPags] = useState<Pag[]>([{ forma: 'pix', valor: 0, parcelas: 1 }])
  const [feita, setFeita] = useState<Venda | null>(null)
  const [lendo, setLendo] = useState(false)
  const [carAberto, setCarAberto] = useState(false)
  const [pix, setPix] = useState(false)
  const [senha, setSenha] = useState<{ chave: string; valor: number } | null>(null)
  const buscaRef = useRef<HTMLInputElement>(null)

  const proximo = vendas.reduce((m, v) => Math.max(m, v.numero), 1000) + 1
  const subtotal = itens.reduce((t, i) => t + i.preco * i.qtd, 0)
  const descontos = itens.reduce((t, i) => t + i.desconto * i.qtd, 0)
  /** Total no preço do Pix (a base de tudo). */
  const totalPix = Math.max(0, subtotal - descontos)
  // Uma forma só: o valor acompanha o total.
  useEffect(() => {
    if (pags.length === 1) setPags((p) => [{ ...p[0], valor: totalPix }])
  }, [totalPix, pags.length])
  const pagoPix = pags.reduce((t, p) => t + p.valor, 0)
  const falta = Math.round((totalPix - pagoPix) * 100) / 100
  /** O que o cliente paga de verdade, na forma escolhida (crédito = preço do cartão). */
  const totalCliente = pags.reduce((t, p) => t + valorNaForma(p.valor, p.forma, p.parcelas), 0) + (pags.length > 1 ? falta : 0)

  const adicionar = (p: PProduto, cor: string, qtd = 1) => {
    const v = p.variacoes.find((x) => x.cor === cor)
    if (!v) return
    setItens((atual) => {
      const ja = atual.find((i) => i.produtoId === p.id && i.cor === cor)
      if (ja) return atual.map((i) => (i === ja ? { ...i, qtd: i.qtd + qtd } : i))
      return [...atual, { chave: Math.random().toString(36).slice(2), produtoId: p.id, nome: p.nome, cor, gb: 0, qtd, preco: v.pix, custo: v.custo, desconto: 0, categoria: p.marca }]
    })
    setEscolhendo(null)
    setBusca('')
    avisar(`${qtd > 1 ? qtd + ' × ' : ''}${p.nome} (${cor}) no carrinho.`)
  }

  /** Código bipado (câmera ou leitor USB/Bluetooth): o produto entra direto no carrinho; o QR da ficha abre o pedido. */
  const bipado = (texto: string) => {
    const r = interpretarCodigo(texto, produtos)
    if (r?.tipo === 'produto') {
      adicionar(r.p, r.cor)
      return true
    }
    if (r?.tipo === 'pedido') {
      ir('pedidos', String(r.numero))
      return true
    }
    return false
  }

  // Pedido de outra tela (Calendário, busca, Assistente): o carrinho já vem montado.
  const usarPedido = () => {
    const pd = pegarPedido('pdv')
    if (!pd) return
    if (pd.produtoId) {
      const p = produtos.find((x) => x.id === pd.produtoId)
      const vs = p?.variacoes.filter((v) => (!p.controlaEstoque || v.estoque > 0) && (!pd.cor || v.cor === pd.cor)) ?? []
      if (p && vs[0]) adicionar(p, vs[0].cor)
      else if (p) avisar(`${p.nome} sem estoque nessa opção.`)
    }
    if (pd.clienteId) setClienteId(pd.clienteId)
    if (pd.forma) setPags([{ forma: pd.forma, valor: 0, parcelas: pd.parcelas ?? (pd.forma === 'credito' ? PAGAMENTO.semJurosAte : 1) }])
  }
  useEffect(() => {
    usarPedido()
    window.addEventListener('escala:pedido', usarPedido)
    return () => window.removeEventListener('escala:pedido', usarPedido)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resultados = useMemo(() => {
    const q = semAcento(busca.trim()).split(/\s+/).filter(Boolean)
    let l = produtos.filter((p) => p.ativo && estoqueTotal(p) > 0)
    if (q.length) l = l.filter((p) => q.every((t) => semAcento(p.nome + ' ' + p.cores.map((c) => c.nome).join(' ')).includes(t)))
    else if (filtro === 'mais') l = MAIS.map((id) => l.find((p) => p.id === id)).filter((p): p is PProduto => !!p)
    else l = l.filter((p) => p.marca === filtro)
    return l.slice(0, 12)
  }, [produtos, busca, filtro])

  // Vendas sugeridas: o que mais sai junto do primeiro item do carrinho.
  const sugestoes = useMemo(() => {
    const primeiro = itens[0]
    if (!primeiro) return []
    return saemJunto(vendas, primeiro.produtoId, produtos, new Set(itens.map((i) => i.produtoId)))
  }, [itens, vendas, produtos])

  const pronto = itens.length > 0 && Math.abs(falta) < 0.01 && !!vendedorId

  /** Desconto com limite: o funcionário dá até X%; acima disso, a senha do dono libera na hora. */
  const darDesconto = (i: Item, d: number) => {
    const valor = Math.min(d, i.preco)
    const limite = (i.preco * config.descontoMax) / 100
    if (!dono && !i.liberado && valor > limite + 0.001) {
      setSenha({ chave: i.chave, valor })
      return
    }
    setItens((l) => l.map((x) => (x.chave === i.chave ? { ...x, desconto: valor } : x)))
  }

  const finalizar = () => {
    if (!pronto) return
    // O cliente paga o valor da forma escolhida; a diferença do cartão entra no faturamento do primeiro item.
    const pagamentos = pags.filter((p) => p.valor > 0).map((p) => ({ forma: p.forma, valor: valorNaForma(p.valor, p.forma, p.parcelas), ...(p.forma === 'credito' ? { parcelas: p.parcelas } : {}) }))
    const extra = pagamentos.reduce((t, p) => t + p.valor, 0) - pagoPix
    const lista = itens.map(({ chave: _c, liberado: _l, ...i }, k) => (k === 0 && extra > 0 ? { ...i, preco: Math.round((i.preco + extra / i.qtd) * 100) / 100 } : i))
    const v = negocio.registrarVenda(
{ data: agoraLoja(), clienteId, vendedorId, itens: lista, desconto: 0, troca: 0, pagamentos, garantiaAte: hoje(), status: 'concluida' })
    setFeita(v)
    setCarAberto(false)
    window.scrollTo(0, 0)
  }

  const novaVenda = () => {
    setFeita(null)
    setItens([])
    setClienteId(undefined)
    setPags([{ forma: 'pix', valor: 0, parcelas: 1 }])
  }

  const cliente = clientes.find((c) => c.id === clienteId)
  const vendedor = equipe.find((e) => e.id === vendedorId)
  const nItens = itens.reduce((t, i) => t + i.qtd, 0)

  if (feita) return <VendaFeita v={feita} vendedor={vendedor?.nome ?? ''} novaVenda={novaVenda} />

  const carrinho = (
    <div className={'pdv-dir' + (carAberto ? ' aberto' : '')} id="carrinho">
      <section className="painel carrinho" aria-label="Carrinho">
        <div className="painel-t">
          <h3>Carrinho</h3>
          <span className="mut">
            {nItens} {nItens === 1 ? 'item' : 'itens'}
          </span>
          <button type="button" className="icone-bt icone-bt--leve so-cel" aria-label="Fechar o carrinho" onClick={() => setCarAberto(false)}>
            <Icone nome="fechar" />
          </button>
        </div>
        <div data-onde="cliente"><EscolherCliente clientes={clientes} cliente={cliente} mudar={setClienteId} /></div>
        <label className="linha-sel">
          <span>Atendente</span>
          <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
                {v.id === eu?.id ? ' (você)' : ''}
              </option>
            ))}
          </select>
        </label>
        {itens.length === 0 && <p className="mut vazio-linha">Toque num produto ou bipe o código para pôr no carrinho.</p>}
        {itens.map((i) => (
          <LinhaCarrinho
            key={i.chave}
            i={i}
            p={produtos.find((p) => p.id === i.produtoId)!}
            mudar={(x) => setItens((l) => l.map((y) => (y.chave === i.chave ? { ...y, ...x } : y)))}
            tirar={() => setItens((l) => l.filter((y) => y.chave !== i.chave))}
            desconto={(d) => darDesconto(i, d)}
            limite={dono ? null : config.descontoMax}
          />
        ))}
        {sugestoes.length > 0 && (
          <div className="sugeridas">
            <p className="mut pequeno">Costuma sair junto:</p>
            <div className="fichas">
              {sugestoes.map((p) => {
                const v = p.variacoes.find((x) => !p.controlaEstoque || x.estoque > 0) ?? p.variacoes[0]
                return (
                  <button key={p.id} type="button" className="ficha" onClick={() => adicionar(p, v.cor)}>
                    <Icone nome="somar" tamanho={14} />
                    {p.nome.replace(/ \(.*\)$/, '')} {dinheiro(v.pix)}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </section>

      <section className="painel" aria-label="Pagamento">
        <div className="painel-t">
          <h3>Pagamento</h3>
          {pags.length === 1 ? (
            <button type="button" className="link-bt" onClick={() => setPags([{ ...pags[0], valor: Math.round(totalPix / 2) }, { forma: 'credito', valor: totalPix - Math.round(totalPix / 2), parcelas: 3 }])} disabled={!totalPix}>
              Dividir em duas formas
            </button>
          ) : (
            <button type="button" className="link-bt" onClick={() => setPags([{ ...pags[0], valor: totalPix }])}>
              Uma forma só
            </button>
          )}
        </div>
        {pags.length === 1 ? (
          <ChipsPagamento pix={totalPix} p={pags[0]} mudar={(x) => setPags([{ ...pags[0], ...x }])} />
        ) : (
          <div className="pag">
            {pags.map((p, k) => (
              <div key={k} className="pag-lin">
                <div className="fichas" role="radiogroup" aria-label={`Forma de pagamento ${k + 1}`}>
                  {FORMAS.map((f) => (
                    <button key={f.id} type="button" role="radio" className="ficha" aria-checked={p.forma === f.id} onClick={() => setPags(pags.map((x, j) => (j === k ? { ...x, forma: f.id } : x)))}>
                      {f.nome}
                    </button>
                  ))}
                </div>
                <label className="pag-valor">
                  Valor
                  <CampoDinheiro rotulo={`Valor da forma ${k + 1}`} valor={p.valor} mudar={(v) => setPags(pags.map((x, j) => (j === k ? { ...x, valor: v } : x)))} />
                </label>
                {p.forma === 'credito' && p.valor > 0 && (
                  <label className="linha-sel">
                    <span>Parcelas</span>
                    <select value={p.parcelas} onChange={(e) => setPags(pags.map((x, j) => (j === k ? { ...x, parcelas: Number(e.target.value) } : x)))}>
                      {Array.from({ length: PAGAMENTO.maxParcelas }, (_, n) => n + 1).map((n) => {
                        const pc = parcelamento(p.valor, n)
                        return (
                          <option key={n} value={n}>
                            {n}x de {dinheiro(pc.parcela)}
                            {pc.semJuros ? ' sem juros' : ' com juros'} (total {dinheiro(pc.total)})
                          </option>
                        )
                      })}
                    </select>
                  </label>
                )}
              </div>
            ))}
            {Math.abs(falta) >= 0.01 && <p className={'pag-falta ' + (falta > 0 ? 'ate' : 'sai')}>{falta > 0 ? `Faltam ${dinheiro(falta)}` : `Passou ${dinheiro(-falta)} do total`}</p>}
          </div>
        )}
        {pags.some((p) => p.forma === 'pix' && p.valor > 0) && (
          <button type="button" className="btn btn-o largo" onClick={() => setPix(true)}>
            <Icone nome="qr" tamanho={18} />
            Mostrar o QR do Pix para o cliente
          </button>
        )}
        <div className="soma">
          <div>
            <span>Subtotal</span>
            <span>{dinheiro(subtotal)}</span>
          </div>
          {descontos > 0 && (
            <div className="neg">
              <span>Descontos</span>
              <span>− {dinheiro(descontos)}</span>
            </div>
          )}
          {Math.abs(totalCliente - totalPix) >= 0.01 && (
            <div>
              <span>Preço do cartão</span>
              <span>+ {dinheiro(totalCliente - totalPix)}</span>
            </div>
          )}
          <div className="total">
            <span>Total</span>
            <span className="num">{dinheiro(totalCliente)}</span>
          </div>
          {Math.abs(totalCliente - totalPix) >= 0.01 && <p className="no-pix">No Pix sairia {dinheiro(totalPix)}</p>}
        </div>
        {!pronto && itens.length > 0 && (
          <p className="pag-falta ate falta-com-seta">
            {!vendedorId ? 'Falta escolher o atendente.' : 'Falta acertar os valores do pagamento.'}
            <button type="button" className="link-bt" onClick={() => mostrarOnde('section[aria-label="Pagamento"]')}>
              Mostrar onde ↑
            </button>
          </p>
        )}
        <button type="button" className="btn btn-p btn-grande largo" disabled={!pronto} onClick={finalizar}>
          Finalizar venda de {dinheiro(totalCliente)}
        </button>
      </section>
    </div>
  )

  return (
    <>
      <Topo titulo="Balcão" sub={`Venda nº ${proximo}. ${caixa ? (caixa.fechamento ? 'Caixa de hoje já fechado.' : `Caixa aberto às ${caixa.abertura.hora} por ${caixa.abertura.quem}.`) : 'Caixa de hoje ainda não foi aberto.'} Atendente: ${vendedor?.nome ?? '—'}.`} />
      {!caixa && (
        <p className="aviso-linha">
          <Icone nome="info" tamanho={18} />
          <span>Abra o caixa antes da primeira venda do dia, para o fechamento bater.</span>
          <a href={link('caixa')}>Abrir caixa</a>
        </p>
      )}
      <div className="pdv">
        <div className="pdv-esq">
          <section className="painel busca-grande">
            <form
              className="busca-bipar"
              onSubmit={(e) => {
                // Leitor USB/Bluetooth: digita o código e manda Enter. Vai direto para o carrinho.
                e.preventDefault()
                if (bipado(busca)) return
                if (resultados.length === 1) setEscolhendo(resultados[0])
              }}
            >
              <label className="entrada">
                <Icone nome="busca" />
                <input ref={buscaRef} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Bipe ou busque" aria-label="Buscar produto ou bipar o código" enterKeyHint="go" autoComplete="off" />
              </label>
              <button type="button" className="btn btn-p bt-bipar" onClick={() => setLendo(true)} aria-label="Bipar com a câmera">
                <Icone nome="camera" tamanho={20} />
                <span>Bipar</span>
              </button>
            </form>
            {!busca && (
              <div className="fichas" role="group" aria-label="Filtro">
                {FILTROS.map((f) => (
                  <button key={f.id} type="button" className="ficha" aria-pressed={filtro === f.id} onClick={() => setFiltro(f.id)}>
                    {f.nome}
                  </button>
                ))}
              </div>
            )}
            <ul className="resultados">
              {resultados.map((p) => {
                const min = Math.min(...p.variacoes.filter((v) => !p.controlaEstoque || v.estoque > 0).map((v) => v.pix))
                const sel = escolhendo?.id === p.id
                return (
                  <li key={p.id} className={'res' + (sel ? ' sel' : '')}>
                    <button type="button" className="res-bt" aria-expanded={sel} onClick={() => setEscolhendo(sel ? null : p)}>
                      <Miniatura p={p} />
                      <span className="res-txt">
                        <b>{p.nome}</b>
                        <span className="meta">
                          <span>
                            {p.cores.length} {p.cores.length === 1 ? 'opção' : 'opções'}, por {p.unidade}
                          </span>
                          {p.controlaEstoque ? <span className={'pill ' + (estoqueTotal(p) <= 2 ? 'ate' : 'ent')}>{estoqueTotal(p)} no estoque</span> : <span className="pill neu">{p.prazoDias ? `${p.prazoDias} ${p.prazoDias === 1 ? 'dia' : 'dias'}` : 'na hora'}</span>}
                        </span>
                      </span>
                      <span className="preco">
                        <b>{dinheiro(min)}</b>
                        <span>a partir de</span>
                      </span>
                    </button>
                    {sel && <Escolher p={p} adicionar={adicionar} />}
                  </li>
                )
              })}
              {!resultados.length && <li className="mut vazio-linha">Nada encontrado com “{busca}”.</li>}
            </ul>
          </section>
        </div>
        {carrinho}
      </div>
      {carAberto && <button type="button" className="car-fundo so-cel" aria-label="Fechar o carrinho" onClick={() => setCarAberto(false)} />}
      {itens.length > 0 && !carAberto && (
        <button type="button" className="faixa-car so-cel-flex" onClick={() => setCarAberto(true)} aria-controls="carrinho">
          <span>
            <b>
              {nItens} {nItens === 1 ? 'item' : 'itens'} · {dinheiro(totalCliente)}
            </b>
            <small>{cliente?.nome ?? 'Sem cliente'}</small>
          </span>
          <span className="btn btn-p">Ver carrinho</span>
        </button>
      )}

      {lendo && (
        <LerCodigo
          titulo="Bipe o código do produto"
          dica="O código de barras da etiqueta, ou o QR da ficha de produção para abrir o pedido."
          aceitar={(t) => /^\d{13}$/.test(t.replace(/\D/g, '')) || /^PED/i.test(t)}
          fechar={() => setLendo(false)}
          lido={(t) => {
            if (!bipado(t)) avisar('Esse código não é de nenhum produto cadastrado.')
          }}
          simular={() => {
            const p = produtos.find((x) => x.id === 'xerox-pb') ?? produtos[0]
            return p ? eanDe(p.id, p.variacoes[0].cor, 0) : ''
          }}
        />
      )}
      {pix && <QrPix valor={pags.filter((p) => p.forma === 'pix').reduce((t, p) => t + p.valor, 0)} numero={proximo} chave={config.chavePix} fechar={() => setPix(false)} />}
      {senha && (
        <SenhaDono
          senhaCerta={config.senhaDono}
          limite={config.descontoMax}
          fechar={(ok) => {
            if (ok) setItens((l) => l.map((x) => (x.chave === senha.chave ? { ...x, desconto: senha.valor, liberado: true } : x)))
            setSenha(null)
          }}
        />
      )}
    </>
  )
}

/** Pagamento em 1 toque: chips com o valor pronto em cada forma. */
function ChipsPagamento({ pix, p, mudar }: { pix: number; p: Pag; mudar: (x: Partial<Pag>) => void }) {
  const n = PAGAMENTO.semJurosAte
  const max = PAGAMENTO.maxParcelas
  const sem = parcelamento(pix, n)
  const com = parcelamento(pix, max)
  const chips: { id: string; forma: FormaPag; parcelas: number; t: string; s: string }[] = [
    { id: 'pix', forma: 'pix', parcelas: 1, t: `Pix ${dinheiro(pix)}`, s: PAGAMENTO.descontoPix > 0 ? 'com desconto' : 'cai na hora' },
    { id: 'c1', forma: 'credito', parcelas: 1, t: `Crédito ${dinheiro(cartaoLoja(pix))}`, s: 'à vista no cartão' },
    { id: 'cn', forma: 'credito', parcelas: n, t: `${n}x de ${dinheiro(sem.parcela)}`, s: 'sem juros' },
    { id: 'cm', forma: 'credito', parcelas: max, t: `${max}x de ${dinheiro(com.parcela)}`, s: `total ${dinheiro(com.total)}` },
    { id: 'deb', forma: 'debito', parcelas: 1, t: `Débito ${dinheiro(pix)}`, s: 'mesmo preço' },
    { id: 'din', forma: 'dinheiro', parcelas: 1, t: `Dinheiro ${dinheiro(pix)}`, s: 'na gaveta' },
  ]
  const outra = p.forma === 'credito' && ![1, n, max].includes(p.parcelas)
  return (
    <div className="pag">
      <div className="chips-pag" role="radiogroup" aria-label="Forma de pagamento">
        {chips.map((c) => (
          <button key={c.id} type="button" role="radio" className="chip-pag" aria-checked={p.forma === c.forma && (c.forma !== 'credito' || p.parcelas === c.parcelas)} disabled={!pix} onClick={() => mudar({ forma: c.forma, parcelas: c.parcelas })}>
            <b className="num">{c.t}</b>
            <small>{c.s}</small>
          </button>
        ))}
      </div>
      {p.forma === 'credito' && pix > 0 && (
        <label className="linha-sel">
          <span>Outras parcelas</span>
          <select value={p.parcelas} onChange={(e) => mudar({ parcelas: Number(e.target.value) })} aria-label="Número de parcelas">
            {Array.from({ length: max }, (_, k) => k + 1).map((k) => {
              const pc = parcelamento(pix, k)
              return (
                <option key={k} value={k}>
                  {k}x de {dinheiro(pc.parcela)}
                  {pc.semJuros ? ' sem juros' : ` com juros (total ${dinheiro(pc.total)})`}
                </option>
              )
            })}
          </select>
        </label>
      )}
      {outra && <p className="pag-nota">{p.parcelas}x escolhido na lista.</p>}
    </div>
  )
}

/** Linha do carrinho: produto e opção, quantidade, desconto e tirar. */
function LinhaCarrinho({ i, p, mudar, tirar, desconto, limite }: { i: Item; p: PProduto; mudar: (x: Partial<Item>) => void; tirar: () => void; desconto: (d: number) => void; limite: number | null }) {
  return (
    <div className="car-lin">
      <Miniatura p={p} />
      <div className="car-txt">
        <b>{i.nome}</b>
        <small>
          {i.cor} · {dinheiro(i.preco)} por {p?.unidade ?? 'un'}
        </small>
        <div className="car-acoes">
          <Contador valor={i.qtd} min={1} rotulo={`Quantidade de ${i.nome}`} mudar={(q) => mudar({ qtd: q })} />
          <label className="desconto">
            Desconto
            <CampoDinheiro compacto rotulo={`Desconto em ${i.nome}`} valor={i.desconto} mudar={desconto} />
          </label>
          <button type="button" className="bt bt-perigo-leve" onClick={tirar}>
            Tirar
          </button>
        </div>
        {limite !== null && <small className="mut">Até {limite}% sem a senha do dono{i.liberado ? ' · liberado' : ''}.</small>}
      </div>
      <span className="v">
        {i.desconto > 0 && <s>{dinheiro(i.preco * i.qtd)}</s>}
        {dinheiro((i.preco - i.desconto) * i.qtd)}
      </span>
    </div>
  )
}

/** Escolha da opção e da quantidade (ex.: 50 cópias de xerox). */
function Escolher({ p, adicionar }: { p: PProduto; adicionar: (p: PProduto, cor: string, qtd: number) => void }) {
  const opcoes = p.variacoes.filter((v) => !p.controlaEstoque || v.estoque > 0)
  const [cor, setCor] = useState(opcoes[0]?.cor ?? '')
  const [qtd, setQtd] = useState(1)
  const v = opcoes.find((x) => x.cor === cor)
  return (
    <div className="escolher">
      <div className="esc-grupo">
        <span>Opção</span>
        <div className="fichas">
          {opcoes.map((o) => (
            <button key={o.cor} type="button" className="ficha" aria-pressed={cor === o.cor} onClick={() => setCor(o.cor)}>
              {o.cor} · {dinheiro(o.pix)}
            </button>
          ))}
        </div>
      </div>
      <div className="esc-grupo">
        <span>Quantidade ({p.unidade})</span>
        <div className="fichas">
          <Contador valor={qtd} min={1} rotulo="Quantidade" mudar={setQtd} />
          {[10, 50, 100].map((n) => (
            <button key={n} type="button" className="ficha" aria-pressed={qtd === n} onClick={() => setQtd(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <button type="button" className="btn btn-p" onClick={() => adicionar(p, cor, qtd)}>
        Pôr no carrinho, {v ? dinheiro(v.pix * qtd) : ''}
      </button>
    </div>
  )
}

/** QR do Pix na tela, para o cliente pagar ali (na demonstração, com a chave de exemplo). */
function QrPix({ valor, numero, chave, fechar }: { valor: number; numero: number; chave: string; fechar: () => void }) {
  const texto = pixCopiaECola(valor, chave, LOJA.nome || 'Gráfica Estamp', 'Cruzeiro do Sul', `VENDA${numero}`)
  const d = useMemo(() => {
    const q = qrcode(0, 'M')
    q.addData(texto)
    q.make()
    const n = q.getModuleCount()
    let path = ''
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) path += `M${x} ${y}h1v1h-1z`
    return { path, n }
  }, [texto])
  return (
    <Gaveta
      titulo={`Pix de ${dinheiro(valor)}`}
      sub="O cliente aponta a câmera do banco para o QR, ou copia o código."
      fechar={fechar}
      pe={
        <button
          type="button"
          className="btn btn-p"
          onClick={() => {
            navigator.clipboard?.writeText(texto).then(
              () => avisar('Código do Pix copiado.'),
              () => avisar('Não deu para copiar. Selecione o código e copie.'),
            )
          }}
        >
          Copiar o código
        </button>
      }
    >
      <div className="qr-pix">
        <svg viewBox={`-2 -2 ${d.n + 4} ${d.n + 4}`} role="img" aria-label={`QR do Pix de ${dinheiro(valor)}`}>
          <rect x={-2} y={-2} width={d.n + 4} height={d.n + 4} fill="#fff" />
          <path d={d.path} fill="#111" />
        </svg>
      </div>
      <p className="mut pequeno quebra">{texto}</p>
      <p className="pag-falta ate">QR de exemplo, com a chave {chave}. Na versão final ele usa a chave da gráfica e confirma o pagamento sozinho.</p>
    </Gaveta>
  )
}

/** Desconto acima do limite: o dono digita a senha na hora, no aparelho do vendedor. */
function SenhaDono({ senhaCerta, limite, fechar }: { senhaCerta: string; limite: number; fechar: (ok: boolean) => void }) {
  const [x, setX] = useState('')
  const [erro, setErro] = useState(false)
  return (
    <Gaveta
      titulo="Desconto acima do limite"
      sub={`O atendente dá até ${limite}% sozinho. Para mais, o dono libera com a senha.`}
      fechar={() => fechar(false)}
      pe={
        <button type="submit" form="senha-dono" className="btn btn-p" disabled={!x}>
          Liberar desconto
        </button>
      }
    >
      <form
        id="senha-dono"
        onSubmit={(e) => {
          e.preventDefault()
          if (x === senhaCerta) fechar(true)
          else setErro(true)
        }}
      >
        <label className="campo">
          Senha do dono
          <input type="password" inputMode="numeric" autoComplete="off" autoFocus value={x} onChange={(e) => (setX(e.target.value), setErro(false))} />
        </label>
        {erro && <p className="erro pequeno">Senha errada.</p>}
        <p className="mut pequeno">Na demonstração, a senha é 1234. O dono muda o limite e a senha em Configurações › Pagamento.</p>
      </form>
    </Gaveta>
  )
}

/** Venda feita: o valor pago, o recibo e o WhatsApp já prontos (com o link do recibo). */
function VendaFeita({ v, vendedor, novaVenda }: { v: Venda; vendedor: string; novaVenda: () => void }) {
  const clientes = useDados('clientes')
  const equipe = useDados('equipe')
  const cli = clientes.find((c) => c.id === v.clienteId)
  const pago = v.pagamentos.reduce((t, p) => t + p.valor, 0)
  const m = equipe.find((e) => e.id === v.vendedorId)
  const comissao = m ? v.itens.reduce((t, i) => t + ((i.preco - i.desconto) * i.qtd * (m.comissao[i.categoria] ?? 0)) / 100, 0) : 0
  const formas = v.pagamentos.map((p) => (p.forma === 'credito' ? `crédito ${p.parcelas ?? 1}x` : { pix: 'Pix', debito: 'débito', dinheiro: 'dinheiro', credito: '' }[p.forma])).join(' + ')
  return (
    <>
      <Topo titulo="Venda feita!" sub={`Venda nº ${v.numero}. Já entrou no caixa de hoje.`} />
      <section className="painel venda-ok">
        <span className="vazio-ic ok">
          <Icone nome="check" tamanho={30} />
        </span>
        <h2>Venda feita!</h2>
        <p className="mut">
          {cli ? `Para ${cli.nome}.` : 'Venda sem cadastro de cliente.'}
        </p>
        <p className="venda-ok-total num">{dinheiro(pago)}</p>
        <p className="mut">
          no {formas}
        </p>
        <div className="venda-ok-acoes">
          <a className="btn btn-p btn-grande" href={linkWhats(cli?.telefone, mensagemVenda(v, cli))} target="_blank" rel="noopener" onClick={() => avisar(`Venda feita. O recibo foi para o WhatsApp ${cli ? `de ${cli.nome.split(' ')[0]}` : 'do cliente'}.`)}>
            <Icone nome="whats" tamanho={18} />
            Mandar o recibo no WhatsApp
          </a>
          <button type="button" className="btn btn-o btn-grande" onClick={() => reciboPdf(v, cli, vendedor)}>
            <Icone nome="relatorio" tamanho={18} />
            Baixar para imprimir
          </button>
          <button type="button" className="btn btn-o btn-grande" onClick={novaVenda}>
            <Icone nome="somar" tamanho={18} />
            Nova venda
          </button>
        </div>
        <pre className="msg-previa">{mensagemVenda(v, cli)}</pre>
        <p className="mut pequeno">A mensagem já leva o nome, o que foi comprado e o link do recibo para imprimir. O link é de exemplo na demonstração; na versão final ele abre o recibo guardado no servidor.</p>
        {comissao > 0 && (
          <p className="ok-linha">
            Comissão de {vendedor.split(' ')[0]} nesta venda: <b>R$ {brl(comissao, comissao % 1 > 0)}</b>
          </p>
        )}
      </section>
    </>
  )
}
