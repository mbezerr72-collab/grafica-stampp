import { useState } from 'react'
import { hoje, negocio, useDados, type Compra, type Fornecedor, type Sessao } from '../../data/store'
import type { Insumo } from '../../data/negocio'
import { CampoDinheiro, Icone, Topo, avisar } from '../ui'
import { MiniKpi, brl } from '../escala/componentes'
import { Gaveta } from '../escala/Gaveta'
import { somaDias } from '../escala/periodo'
import { linkWhats } from '../escala/documentos'
import { pegarPedido } from '../escala/pedido'
import { ir } from '../rota'

type ItemNovo = { chave: string; insumoId: string; qtd: number; custo: number }
const semAc = (x: string) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
/** Quanto pedir: o dobro do mínimo, menos o que já tem. */
const falta = (x: Insumo) => Math.max(1, Math.ceil(x.minimo * 2 - x.estoque))

/** Lê o XML da NF-e: cada item vira uma linha da entrada (pelo nome do insumo). */
function lerXml(xml: string, insumos: Insumo[]) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const tx = (el: Element, t: string) => el.getElementsByTagName(t)[0]?.textContent?.trim() ?? ''
  const itens = [...doc.getElementsByTagName('prod')].flatMap((el) => {
    const nome = semAc(tx(el, 'xProd'))
    const x = [...insumos].sort((a, b) => b.nome.length - a.nome.length).find((i) => nome.includes(semAc(i.nome)))
    return x ? [{ x, qtd: Number(tx(el, 'qCom')) || 1, custo: Number(tx(el, 'vUnCom')) || x.custo }] : []
  })
  return { itens, emitente: tx(doc.documentElement, 'xNome') }
}

const dataBr = (d: string) => d.split('-').reverse().join('/')

/** Compras e fornecedores: quem vende para a loja, o que chegou e a entrada de mercadoria. */
export default function Compras(_: { s: Sessao }) {
  const fornecedores = useDados('fornecedores')
  const compras = useDados('compras')
  const contas = useDados('contas')
  const insumos = useDados('insumos')
  const [entrada, setEntrada] = useState(() => !!pegarPedido('compras'))
  const [forn, setForn] = useState<Fornecedor | 'novo' | null>(null)
  const [vista, setVista] = useState<Compra>()
  const h = hoje()
  const d90 = somaDias(h, -89)
  const ultimas = [...compras].reverse().slice(0, 15)
  const total90 = compras.filter((c) => c.data >= d90).reduce((t, c) => t + c.total, 0)
  const aPagar = contas.filter((c) => c.categoria === 'estoque' && c.tipo === 'pagar' && !c.pagaEm)
  const nomeF = (id: string) => fornecedores.find((f) => f.id === id)?.nome ?? '—'
  const ins = (id: string) => insumos.find((x) => x.id === id)

  return (
    <>
      <Topo titulo="Compras e fornecedores" sub="Camisas lisas, papel, tinta, lona: o que chegou, de quem, por quanto e quando vence.">
        <button type="button" className="bt bt-forte" onClick={() => setEntrada(true)}>
          <Icone nome="somar" tamanho={18} />
          <span>Chegou material</span>
        </button>
      </Topo>
      <section className="kpis-menores">
        <MiniKpi rotulo="Comprado em 90 dias" valor={'R$ ' + brl(total90)} nota={`${compras.filter((c) => c.data >= d90).length} compras`} />
        <MiniKpi rotulo="A pagar aos fornecedores" valor={'R$ ' + brl(aPagar.reduce((t, c) => t + c.valor, 0))} nota={`${aPagar.length} contas em aberto`} />
        <MiniKpi rotulo="Próximo vencimento" valor={aPagar.length ? dataBr([...aPagar].sort((a, b) => a.vencimento.localeCompare(b.vencimento))[0].vencimento).slice(0, 5) : '—'} nota={aPagar.length ? 'compra de insumos' : 'Nada em aberto'} />
        <MiniKpi rotulo="Fornecedores" valor={fornecedores.length} nota="cadastrados" />
      </section>

      <section className="painel">
        <div className="painel-t">
          <h3>Fornecedores</h3>
          <button type="button" className="link-bt" onClick={() => setForn('novo')}>
            Cadastrar fornecedor
          </button>
        </div>
        <ul className="forn">
          {fornecedores.map((f) => {
            const dele = compras.filter((c) => c.fornecedorId === f.id && c.data >= d90)
            return (
              <li key={f.id}>
                <button type="button" className="forn-bt" onClick={() => setForn(f)}>
                  <b>{f.nome}</b>
                  <small>
                    {f.cidade}, prazo de {f.prazoDias} dias
                  </small>
                  <span className="forn-num">
                    R$ {brl(dele.reduce((t, c) => t + c.total, 0))} <small>em 90 dias</small>
                  </span>
                  {f.obs && <small className="forn-obs">{f.obs}</small>}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="painel">
        <div className="painel-t">
          <h3>Últimas compras</h3>
        </div>
        <ul className="lista-vendas">
          {ultimas.map((c) => {
            const conta = contas.find((x) => x.id === c.contaId)
            return (
              <li key={c.id}>
                <button type="button" className="lv lv--compra" onClick={() => setVista(c)}>
                  <span className="lv-quando">
                    <b>{dataBr(c.data).slice(0, 5)}</b>
                    <small>{c.data.slice(0, 4)}</small>
                  </span>
                  <span className="lv-txt">
                    <b>{nomeF(c.fornecedorId)}</b>
                    <small>
                      {c.itens.length} {c.itens.length === 1 ? 'insumo' : 'insumos'}: {c.itens.slice(0, 2).map((i) => ins(i.insumoId)?.nome ?? 'insumo').join(', ')}{c.itens.length > 2 ? '…' : ''}
                    </small>
                  </span>
                  <span className="lv-pag">{conta && <span className={'pill ' + (conta.pagaEm ? 'ent' : conta.vencimento < h ? 'sai' : 'ate')}>{conta.pagaEm ? 'paga' : `vence ${dataBr(conta.vencimento).slice(0, 5)}`}</span>}</span>
                  <span className="lv-valor num">R$ {brl(c.total)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {vista && (
        <Gaveta titulo={`Compra de ${dataBr(vista.data)}`} sub={nomeF(vista.fornecedorId)} fechar={() => setVista(undefined)}>
          <ul className="det-itens">
            {vista.itens.map((i, k) => (
              <li key={k}>
                <span>
                  <b>
                    {i.qtd} {ins(i.insumoId)?.unidade ?? 'un'} de {ins(i.insumoId)?.nome ?? 'insumo'}
                  </b>
                  <small>R$ {brl(i.custo)} cada</small>
                </span>
                <span className="num">R$ {brl(i.qtd * i.custo)}</span>
              </li>
            ))}
            <li className="det-total">
              <span>Total</span>
              <span className="num">R$ {brl(vista.total)}</span>
            </li>
          </ul>
        </Gaveta>
      )}

      {forn && <FornecedorForm f={forn === 'novo' ? undefined : forn} fechar={() => setForn(null)} />}
      {entrada && <Entrada fechar={() => setEntrada(false)} />}
    </>
  )
}

function FornecedorForm({ f, fechar }: { f?: Fornecedor; fechar: () => void }) {
  const [x, setX] = useState({ nome: f?.nome ?? '', cnpj: f?.cnpj ?? '', telefone: f?.telefone ?? '', cidade: f?.cidade ?? '', prazoDias: f?.prazoDias ?? 30, obs: f?.obs ?? '' })
  const salvar = () => {
    if (!x.nome.trim()) return
    negocio.salvarFornecedor({ ...x, id: f?.id })
    avisar(f ? 'Fornecedor salvo.' : 'Fornecedor cadastrado.')
    fechar()
  }
  return (
    <Gaveta
      titulo={f ? f.nome : 'Novo fornecedor'}
      fechar={fechar}
      pe={
        <>
          {f && (
            <a className="btn btn-o" href={linkWhats(f.telefone, `Olá, ${f.nome}! Aqui é da Gráfica Estamp.`)} target="_blank" rel="noopener">
              <Icone nome="whats" tamanho={18} />
              WhatsApp
            </a>
          )}
          <button type="button" className="btn btn-p" onClick={salvar} disabled={!x.nome.trim()}>
            Salvar
          </button>
        </>
      }
    >
      <div className="form-g">
        <label className="campo">
          Nome
          <input value={x.nome} onChange={(e) => setX({ ...x, nome: e.target.value })} />
        </label>
        <label className="campo">
          CNPJ (opcional)
          <input value={x.cnpj} onChange={(e) => setX({ ...x, cnpj: e.target.value })} inputMode="numeric" />
        </label>
        <label className="campo">
          Telefone ou WhatsApp
          <input value={x.telefone} onChange={(e) => setX({ ...x, telefone: e.target.value })} inputMode="tel" />
        </label>
        <label className="campo">
          Cidade
          <input value={x.cidade} onChange={(e) => setX({ ...x, cidade: e.target.value })} />
        </label>
        <label className="campo">
          Prazo para pagar (dias)
          <input type="number" min={0} value={x.prazoDias} onChange={(e) => setX({ ...x, prazoDias: Number(e.target.value) })} />
        </label>
        <label className="campo">
          Observação
          <textarea rows={2} value={x.obs} onChange={(e) => setX({ ...x, obs: e.target.value })} />
        </label>
      </div>
    </Gaveta>
  )
}

/** Chegou material: fornecedor, insumos com quantidade e custo. O estoque soma e a conta a pagar é criada. */
function Entrada({ fechar }: { fechar: () => void }) {
  const fornecedores = useDados('fornecedores')
  const insumos = useDados('insumos')
  const [fid, setFid] = useState(fornecedores[0]?.id ?? '')
  const [itens, setItens] = useState<ItemNovo[]>([])
  const [iid, setIid] = useState('')
  const [nota, setNota] = useState('')
  const f = fornecedores.find((x) => x.id === fid)
  const [venc, setVenc] = useState(somaDias(hoje(), f?.prazoDias ?? 30))
  const doFornecedor = insumos.filter((x) => x.fornecedorId === fid)
  const abaixo = doFornecedor.filter((x) => x.estoque < x.minimo && !itens.some((i) => i.insumoId === x.id))
  const chave = () => Math.random().toString(36).slice(2)
  const usarXml = (xml: string, origem: string) => {
    const r = lerXml(xml, insumos)
    if (!r.itens.length) return avisar('Não achei insumos cadastrados nessa nota.')
    const forn = fornecedores.find((x) => r.emitente && x.nome.toLowerCase().startsWith(r.emitente.toLowerCase().split(' ')[0]))
    if (forn) setFid(forn.id)
    setItens(r.itens.map(({ x, qtd, custo }) => ({ chave: chave(), insumoId: x.id, qtd, custo })))
    setNota(origem)
    avisar(`${r.itens.length} insumos da nota preenchidos. Confira as quantidades.`)
  }
  const total = itens.reduce((t, i) => t + i.qtd * i.custo, 0)
  const ok = !!fid && itens.length > 0 && itens.every((i) => i.qtd > 0 && i.custo > 0)
  const salvar = () => {
    if (!ok) return
    negocio.registrarCompra(
      fid,
      itens.map((i) => ({ insumoId: i.insumoId, qtd: i.qtd, custo: i.custo })),
      venc,
    )
    avisar(`Entrada registrada: ${itens.length} ${itens.length === 1 ? 'insumo' : 'insumos'}. Conta a pagar criada.`)
    fechar()
    ir('insumos')
  }
  const ordenados = [...doFornecedor, ...insumos.filter((x) => x.fornecedorId !== fid)]
  return (
    <Gaveta
      titulo="Chegou material"
      sub="O estoque dos insumos soma, o custo médio se ajusta e a conta a pagar é criada."
      fechar={fechar}
      pe={
        <button type="button" className="btn btn-p" disabled={!ok} onClick={salvar}>
          Registrar entrada de R$ {brl(total)}
        </button>
      }
    >
      <div className="form-g">
        <label className="campo">
          Fornecedor
          <select
            value={fid}
            onChange={(e) => {
              setFid(e.target.value)
              setVenc(somaDias(hoje(), fornecedores.find((x) => x.id === e.target.value)?.prazoDias ?? 30))
            }}
          >
            {fornecedores.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          Vencimento da conta
          <input type="date" value={venc} onChange={(e) => setVenc(e.target.value)} />
        </label>
      </div>
      <div className="nfe">
        {abaixo.length > 0 && (
          <button type="button" className="btn btn-o" onClick={() => setItens([...itens, ...abaixo.map((x) => ({ chave: chave(), insumoId: x.id, qtd: falta(x), custo: x.custo }))])}>
            <Icone nome="alerta" tamanho={18} />
            Trazer os {abaixo.length} abaixo do mínimo
          </button>
        )}
        <label className="btn btn-o">
          <Icone nome="relatorio" tamanho={18} />
          Enviar o XML da nota
          <input
            type="file"
            accept=".xml,text/xml,application/xml"
            hidden
            onChange={async (e) => {
              const a = e.target.files?.[0]
              if (a) usarXml(await a.text(), a.name)
              e.target.value = ''
            }}
          />
        </label>
      </div>
      {nota && <p className="ok-linha pequeno">Preenchido pela nota: {nota}.</p>}
      {itens.map((i) => {
        const x = insumos.find((y) => y.id === i.insumoId)
        if (!x) return null
        return (
          <div key={i.chave} className="ent-item">
            <div className="ent-topo">
              <b>{x.nome}</b>
              <button type="button" className="bt bt-perigo-leve" onClick={() => setItens(itens.filter((y) => y !== i))}>
                Tirar
              </button>
            </div>
            <div className="form-g form-g--3">
              <label className="campo">
                Quantidade ({x.unidade})
                <input inputMode="decimal" value={i.qtd} onChange={(e) => setItens(itens.map((y) => (y === i ? { ...y, qtd: Number(e.target.value.replace(',', '.')) || 0 } : y)))} />
              </label>
              <CampoDinheiro rotulo={`Custo por ${x.unidade}`} valor={i.custo} mudar={(c) => setItens(itens.map((y) => (y === i ? { ...y, custo: c } : y)))} />
              <p className="preco-sug">
                Tem {x.estoque.toLocaleString('pt-BR')} {x.unidade}; fica com <b>{(x.estoque + i.qtd).toLocaleString('pt-BR')}</b>
              </p>
            </div>
          </div>
        )
      })}
      <div className="ent-add">
        <select value={iid} onChange={(e) => setIid(e.target.value)} aria-label="Insumo para adicionar">
          <option value="">Escolha um insumo…</option>
          {ordenados.map((x) => (
            <option key={x.id} value={x.id}>
              {x.nome}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-o"
          disabled={!iid}
          onClick={() => {
            const x = insumos.find((y) => y.id === iid)!
            setItens([...itens, { chave: chave(), insumoId: x.id, qtd: falta(x), custo: x.custo }])
            setIid('')
          }}
        >
          <Icone nome="somar" tamanho={18} />
          Adicionar
        </button>
      </div>
    </Gaveta>
  )
}
