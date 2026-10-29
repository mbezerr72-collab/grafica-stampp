import { useMemo, useState } from 'react'
import { catalogo, produtos as api, useDados, vitrine, arredPreco } from '../../data/store'
import { type PProduto } from '../../data/modelo'
import { NOME_MARCA, type Marca } from '../../data/produtos'
import { CampoDinheiro, Icone, avisar, confirmar } from '../ui'
import { brl } from '../escala/componentes'
import { Miniatura } from '../escala/Miniatura'

const MARCAS = Object.entries(NOME_MARCA) as [Marca, string][]
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Preços em lista e reajuste em massa (mora em Produtos). `reajuste` vem do comando "reajustar camisas 5%". */
export function Precos({ reajuste }: { reajuste?: { marca: Marca | 'todos'; pct: number } }) {
  const { produtos } = useDados('catalogo')
  const [marca, setMarca] = useState<Marca>(reajuste && reajuste.marca !== 'todos' ? reajuste.marca : 'impressos')
  const [busca, setBusca] = useState('')
  const [sel, setSel] = useState<Set<string>>(() => new Set(reajuste ? produtos.filter((p) => p.ativo && (reajuste.marca === 'todos' || p.marca === reajuste.marca)).map((p) => p.id) : []))
  const [pct, setPct] = useState(reajuste?.pct ?? 5)
  const [edits, setEdits] = useState<Record<string, number>>({})
  const lista = useMemo(() => {
    const q = semAcento(busca.trim())
    return produtos.filter((p) => p.marca === marca && (!q || semAcento(p.nome).includes(q)))
  }, [produtos, marca, busca])
  const chave = (p: PProduto, opcao: string) => `${p.id}|${opcao}`
  const mudados = Object.keys(edits).length

  const salvar = () => {
    const porProduto = new Map<string, Record<string, number>>()
    for (const [k, v] of Object.entries(edits)) {
      const [id, opcao] = k.split('|')
      porProduto.set(id, { ...(porProduto.get(id) ?? {}), [opcao]: v })
    }
    for (const [id, ops] of porProduto) {
      const p = api.porId(id)
      if (!p) continue
      api.salvar({ ...p, variacoes: p.variacoes.map((v) => (ops[v.cor] !== undefined ? { ...v, pix: ops[v.cor] } : v)) }, 'Mudou preço na lista')
    }
    setEdits({})
    avisar(`${mudados} ${mudados === 1 ? 'preço salvo' : 'preços salvos'}.`)
  }
  const reajustar = async () => {
    const ids = [...sel]
    const ex = api.porId(ids[0])
    const ok = await confirmar({
      titulo: `Reajustar ${ids.length} ${ids.length === 1 ? 'produto' : 'produtos'} em ${pct > 0 ? '+' : ''}${pct}%?`,
      texto: ex ? `Exemplo: ${ex.nome} (${ex.variacoes[0].cor}) de R$ ${brl(ex.variacoes[0].pix)} vai para R$ ${brl(arredPreco(ex.variacoes[0].pix * (1 + pct / 100)))}. Os preços ficam arredondados. Dá para voltar atrás em “O que foi mudado”.` : '',
      botao: 'Reajustar',
    })
    if (!ok) return
    vitrine.reajustar(ids, pct)
    setSel(new Set())
    avisar('Preços reajustados.')
  }
  return (
    <section className="painel">
      <div className="filtros-linha">
        <div className="fichas">
          {MARCAS.map(([id, nome]) => (
            <button key={id} type="button" className="ficha" aria-pressed={marca === id} onClick={() => setMarca(id)}>
              {nome}
            </button>
          ))}
        </div>
        <label className="entrada entrada--p">
          <Icone nome="busca" tamanho={18} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto" aria-label="Buscar produto" />
        </label>
      </div>
      <div className="reajuste">
        <label className="check-l">
          <input type="checkbox" checked={lista.length > 0 && lista.every((p) => sel.has(p.id))} onChange={(e) => setSel(e.target.checked ? new Set([...sel, ...lista.map((p) => p.id)]) : new Set([...sel].filter((id) => !lista.some((p) => p.id === id))))} />
          <span>Marcar todos da lista ({sel.size} marcados)</span>
        </label>
        <label className="reaj-pct">
          Reajuste
          <input type="number" step={1} value={pct} onChange={(e) => setPct(Number(e.target.value))} aria-label="Porcentagem do reajuste" />%
        </label>
        <button type="button" className="btn btn-o" disabled={!sel.size || !pct} onClick={reajustar}>
          Reajustar marcados
        </button>
      </div>
      <ul className="precos-lista">
        {lista.map((p) => (
          <li key={p.id}>
            <label className="precos-p">
              <input type="checkbox" checked={sel.has(p.id)} onChange={(e) => setSel(e.target.checked ? new Set([...sel, p.id]) : new Set([...sel].filter((x) => x !== p.id)))} aria-label={`Marcar ${p.nome}`} />
              <Miniatura p={p} />
              <span>
                <b>{p.nome}</b>
                <small>
                  por {p.unidade}
                  {p.promo ? `, em promoção (−${p.promo.desconto}%)` : ''}
                  {!p.ativo ? ', desativado' : ''}
                </small>
              </span>
            </label>
            <div className="precos-gbs">
              {p.variacoes.map((v) => (
                <label key={v.cor} className="preco-gb">
                  <span>{v.cor}</span>
                  <CampoDinheiro compacto rotulo={`Preço de ${p.nome}, ${v.cor}`} valor={edits[chave(p, v.cor)] ?? v.pix} mudar={(x) => setEdits({ ...edits, [chave(p, v.cor)]: x })} />
                </label>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {mudados > 0 && (
        <div className="rodape-salvar">
          <span className="mut">
            {mudados} {mudados === 1 ? 'preço mudado' : 'preços mudados'}.
          </span>
          <button type="button" className="bt bt-leve" onClick={() => setEdits({})}>
            Voltar como estava
          </button>
          <button type="button" className="bt bt-forte" onClick={salvar}>
            Salvar preços
          </button>
        </div>
      )}
    </section>
  )
}

/** Os grupos de cada categoria (as abas do catálogo). */
export function Categorias() {
  const c = useDados('catalogo')
  const [nova, setNova] = useState<Partial<Record<Marca, string>>>({})
  const mudar = (m: Marca, f: (l: { id: string; nome: string }[]) => { id: string; nome: string }[]) => catalogo.mudar((x) => ({ ...x, linhas: { ...x.linhas, [m]: f(x.linhas[m] ?? []) } }))
  return (
    <div className="grade-3 cats">
      {MARCAS.map(([id, nome]) => (
        <section key={id} className="painel">
          <div className="painel-t">
            <h3>{nome}</h3>
            <span className="mut">grupos</span>
          </div>
          <ol className="cat-lista">
            {(c.linhas[id] ?? []).map((l, i) => {
              const usados = c.produtos.filter((p) => p.marca === id && p.linha === l.id).length
              return (
                <li key={l.id}>
                  <input value={l.nome} aria-label={`Nome do grupo ${i + 1}`} onChange={(e) => mudar(id, (x) => x.map((y) => (y.id === l.id ? { ...y, nome: e.target.value } : y)))} />
                  <small className="mut">{usados}</small>
                  <button type="button" className="icone-bt icone-bt--leve" aria-label="Subir" disabled={i === 0} onClick={() => mudar(id, (x) => x.map((y, j) => (j === i - 1 ? x[i] : j === i ? x[i - 1] : y)))}>
                    <Icone nome="sobe" tamanho={16} />
                  </button>
                  <button
                    type="button"
                    className="icone-bt icone-bt--leve"
                    aria-label="Tirar grupo"
                    disabled={usados > 0}
                    title={usados ? 'Tem produtos neste grupo: mude eles antes' : 'Tirar'}
                    onClick={() => mudar(id, (x) => x.filter((y) => y.id !== l.id))}
                  >
                    <Icone nome="fechar" tamanho={16} />
                  </button>
                </li>
              )
            })}
          </ol>
          <form
            className="cat-nova"
            onSubmit={(e) => {
              e.preventDefault()
              const n = (nova[id] ?? '').trim()
              if (!n) return
              mudar(id, (x) => [...x, { id: semAcento(n).replace(/[^a-z0-9]+/g, '-'), nome: n }])
              setNova({ ...nova, [id]: '' })
            }}
          >
            <input value={nova[id] ?? ''} onChange={(e) => setNova({ ...nova, [id]: e.target.value })} placeholder="Novo grupo" aria-label={`Novo grupo de ${nome}`} />
            <button type="submit" className="btn btn-o" disabled={!(nova[id] ?? '').trim()}>
              Criar
            </button>
          </form>
        </section>
      ))}
    </div>
  )
}
