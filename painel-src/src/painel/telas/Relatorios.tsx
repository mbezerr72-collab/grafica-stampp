import { useMemo, useState } from 'react'
import { hoje, useDados, type Sessao } from '../../data/store'
import { custoVenda, faturamentoVenda, NOME_CATEGORIA } from '../../data/negocio'
import { Icone, Topo, avisar } from '../ui'
import { intervalo, usePeriodo, cadaDia, dataCurta, diasEntre } from '../escala/periodo'
import { noPeriodo, porForma, porProduto, porVendedor, resumo, NOME_FORMA_RESUMO, formaDaVenda, type FormaResumo } from '../escala/numeros'
import { brl, pct } from '../escala/componentes'
import { exportarExcel, exportarPdf, formatar, type Relatorio } from '../escala/exportar'

type Id = 'vendas' | 'produtos' | 'formas' | 'resumo'
const LISTA: { id: Id; nome: string; frase: string; icone: string }[] = [
  { id: 'produtos', nome: 'Lucro por produto', frase: 'Quanto cada um deixou', icone: 'produtos' },
  { id: 'vendas', nome: 'Vendas', frase: 'Dia a dia', icone: 'vendas' },
  { id: 'formas', nome: 'Formas de pagamento', frase: 'Pix, cartão, dinheiro', icone: 'carteira' },
  { id: 'resumo', nome: 'Resumo do período', frase: 'Para baixar e guardar', icone: 'relatorio' },
]

/** Relatórios do período: na tela, em PDF e em Excel. */
export default function Relatorios(_: { s: Sessao }) {
  const p = usePeriodo()
  const iv = intervalo(p)
  const vendas = useDados('vendas')
  const despesas = useDados('despesas')
  const equipe = useDados('equipe')
  const clientes = useDados('clientes')
  const { produtos } = useDados('catalogo')
  const [id, setId] = useState<Id>('produtos')
  const [ordem, setOrdem] = useState<{ col: number; desc: boolean } | null>(null)
  const [gerando, setGerando] = useState('')
  const r = resumo(vendas, despesas, iv.de, iv.ate)
  const doPer = useMemo(() => noPeriodo(vendas, iv.de, iv.ate), [vendas, iv.de, iv.ate])
  const sub = `${iv.rotulo} (${dataCurta(iv.de)} a ${dataCurta(iv.ate)}). Gráfica Estamp.`

  const rel = useMemo<Relatorio>(() => {
    switch (id) {
      case 'vendas': {
        const linhas = cadaDia(iv.de, iv.ate)
          .map((d) => {
            const dv = doPer.filter((v) => v.data.startsWith(d))
            const f = dv.reduce((t, v) => t + faturamentoVenda(v), 0)
            const c = dv.reduce((t, v) => t + custoVenda(v), 0)
            return [d.split('-').reverse().join('/'), dv.length, f, c, f - c, dv.length ? f / dv.length : 0]
          })
          .filter((l) => l[1])
          .reverse()
        return {
          titulo: 'Vendas dia a dia',
          sub,
          colunas: [
            { nome: 'Dia', tipo: 'texto' },
            { nome: 'Vendas', tipo: 'numero' },
            { nome: 'Faturamento', tipo: 'dinheiro' },
            { nome: 'Custo', tipo: 'dinheiro', opcional: true },
            { nome: 'Lucro bruto', tipo: 'dinheiro' },
            { nome: 'Valor médio por venda', tipo: 'dinheiro', opcional: true },
          ],
          linhas,
          total: ['Total', r.vendas, r.faturamento, r.custo, r.faturamento - r.custo, r.ticket],
        }
      }
      case 'produtos': {
        const l = porProduto(doPer).map((x) => [x.nome, x.un, x.fat, x.custo, x.fat - x.custo, x.fat ? (x.fat - x.custo) / x.fat : 0])
        return {
          titulo: 'Lucro por produto',
          sub,
          colunas: [
            { nome: 'Produto', tipo: 'texto' },
            { nome: 'Vendidos', tipo: 'numero', opcional: true },
            { nome: 'Faturamento', tipo: 'dinheiro' },
            { nome: 'Custo', tipo: 'dinheiro', opcional: true },
            { nome: 'Lucro', tipo: 'dinheiro' },
            { nome: 'Margem', tipo: 'pct', opcional: true },
          ],
          linhas: l.sort((a, b) => (b[4] as number) - (a[4] as number)),
          total: ['Total', l.reduce((t, x) => t + (x[1] as number), 0), r.faturamento, r.custo, r.faturamento - r.custo, r.margem],
          antes: [
            {
              titulo: 'Fechamento do período',
              linhas: [
                { t: 'Faturamento', v: 'R$ ' + brl(r.faturamento) },
                { t: 'Custo do que foi vendido', v: '− R$ ' + brl(r.custo) },
                { t: 'Lucro bruto', v: 'R$ ' + brl(r.faturamento - r.custo), forte: true },
                { t: 'Despesas da gráfica', v: '− R$ ' + brl(r.despesasLoja) },
                { t: 'Lucro', v: 'R$ ' + brl(r.lucro), forte: true },
              ],
            },
          ],
        }
      }
      case 'formas': {
        const f = porForma(doPer)
        const n = (k: FormaResumo) => doPer.filter((v) => formaDaVenda(v) === k).length
        const tot = Object.values(f).reduce((t, v) => t + v, 0) || 1
        return {
          titulo: 'Formas de pagamento',
          sub,
          colunas: [
            { nome: 'Forma', tipo: 'texto' },
            { nome: 'Vendas', tipo: 'numero' },
            { nome: 'Faturamento', tipo: 'dinheiro' },
            { nome: 'Do total', tipo: 'pct' },
          ],
          linhas: (Object.keys(f) as FormaResumo[]).map((k) => [NOME_FORMA_RESUMO[k], n(k), f[k], f[k] / tot]),
          total: ['Total', r.vendas, r.faturamento, 1],
        }
      }
      case 'resumo':
        return {
          titulo: 'Resumo do período',
          sub,
          colunas: [
            { nome: 'Linha', tipo: 'texto' },
            { nome: 'Valor', tipo: 'dinheiro' },
          ],
          linhas: [
            ['Faturamento', r.faturamento],
            ['Custo do que foi vendido', -r.custo],
            ['Lucro bruto', r.faturamento - r.custo],
            ['Despesas da gráfica', -r.despesasLoja],
            ['Lucro', r.lucro],
            ['Caixa (entrou − saiu, com estoque)', r.caixa],
            [`Vendas: ${r.vendas}, ticket médio`, r.ticket],
          ],
        }
    }
  }, [id, doPer, iv.de, iv.ate, r, sub])

  const linhas = useMemo(() => {
    if (!ordem) return rel.linhas
    return [...rel.linhas].sort((a, b) => {
      const x = a[ordem.col]
      const y = b[ordem.col]
      const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt-BR')
      return ordem.desc ? -c : c
    })
  }, [rel, ordem])

  const exportar = async (tipo: 'pdf' | 'excel') => {
    setGerando(tipo)
    try {
      await (tipo === 'pdf' ? exportarPdf(rel) : exportarExcel(rel))
      avisar(tipo === 'pdf' ? 'Pronto! O arquivo para imprimir foi baixado.' : 'Pronto! A planilha foi baixada.')
    } catch {
      avisar('Não deu para gerar o arquivo. Tente de novo.')
    } finally {
      setGerando('')
    }
  }
  const top = id === 'produtos' ? [...rel.linhas].sort((a, b) => (b[4] as number) - (a[4] as number)).slice(0, 6) : []
  const maxTop = Math.max(1, ...top.map((l) => l[4] as number))
  // A categoria com a maior margem no período.
  const cats = Object.entries(
    porProduto(doPer).reduce<Record<string, { fat: number; custo: number }>>((m, x) => {
      const c = (m[x.categoria] ??= { fat: 0, custo: 0 })
      c.fat += x.fat
      c.custo += x.custo
      return m
    }, {}),
  ).filter(([, x]) => x.fat > 0)
  const [catTop, melhor] = cats.sort((a, b) => (b[1].fat - b[1].custo) / b[1].fat - (a[1].fat - a[1].custo) / a[1].fat)[0] ?? ['', { fat: 0, custo: 0 }]
  const fA = melhor.fat
  const cA = melhor.custo

  return (
    <>
      <Topo titulo="Relatórios" sub={`${iv.rotulo}. Equipe, despesas, insumos, pedidos e caixa têm o próprio “Baixar para imprimir” e “Baixar planilha” na aba deles.`} />
      <div className="rel">
        <nav className="rel-lista" aria-label="Escolher relatório">
          {LISTA.map((x) => (
            <button
              key={x.id}
              type="button"
              className="rel-item"
              aria-pressed={id === x.id}
              onClick={() => {
                setId(x.id)
                setOrdem(null)
              }}
            >
              <span className="ri">
                <Icone nome={x.icone} tamanho={18} />
              </span>
              <span>
                <b>{x.nome}</b>
                <small>{x.frase}</small>
              </span>
            </button>
          ))}
        </nav>
        <div className="rel-corpo">
          {id === 'produtos' && (
            <div>
              <section className="painel">
                <div className="painel-t">
                  <h3>Quem deixou mais lucro</h3>
                  <span className="mut">lucro bruto</span>
                </div>
                <ul className="hbar">
                  {top.map((l) => (
                    <li key={String(l[0])}>
                      <b>{l[0]}</b>
                      <span className="trilho">
                        <i style={{ width: `${((l[4] as number) / maxTop) * 100}%` }} />
                      </span>
                      <span className="v num">R$ {brl(l[4] as number)}</span>
                    </li>
                  ))}
                </ul>
                {fA > 0 && <p className="mut pequeno">{NOME_CATEGORIA[catTop as keyof typeof NOME_CATEGORIA]}: R$ {brl(fA)} de faturamento e {pct((fA - cA) / fA, 0)} de margem, a maior da gráfica.</p>}
              </section>
            </div>
          )}
          <section className="painel">
            <div className="painel-t rel-t">
              <h3>{rel.titulo}</h3>
              <div className="rel-exp">
                <button type="button" className="btn btn-o" disabled={!!gerando} onClick={() => exportar('pdf')}>
                  <Icone nome="relatorio" tamanho={18} />
                  {gerando === 'pdf' ? 'Gerando…' : 'Baixar para imprimir'}
                </button>
                <button type="button" className="btn btn-o" disabled={!!gerando} onClick={() => exportar('excel')}>
                  <Icone nome="estoque" tamanho={18} />
                  {gerando === 'excel' ? 'Gerando…' : 'Baixar planilha'}
                </button>
              </div>
            </div>
            <p className="mut pequeno">{rel.sub} Toque no título da coluna para ordenar.</p>
            <div className="tabela-caixa" tabIndex={0} role="region" aria-label="Tabela">
              <table className="tabela t-rel">
                <thead>
                  <tr>
                    {rel.colunas.map((c, i) => (
                      <th key={c.nome} className={(c.tipo !== 'texto' ? 'dir ' : '') + (c.opcional ? 'opc' : '')} aria-sort={ordem?.col === i ? (ordem.desc ? 'descending' : 'ascending') : undefined}>
                        <button type="button" className="th-bt" onClick={() => setOrdem({ col: i, desc: ordem?.col === i ? !ordem.desc : c.tipo !== 'texto' })}>
                          {c.nome}
                          {ordem?.col === i ? (ordem.desc ? ' ▾' : ' ▴') : ''}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l, k) => (
                    <tr key={k}>
                      {l.map((v, i) => (
                        <td key={i} className={(rel.colunas[i].tipo !== 'texto' ? 'dir num ' : '') + (rel.colunas[i].opcional ? 'opc' : '')}>
                          {i === 0 ? <b>{formatar(v, rel.colunas[i])}</b> : formatar(v, rel.colunas[i])}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {!linhas.length && (
                    <tr>
                      <td colSpan={rel.colunas.length} className="mut">
                        Nada no período.
                      </td>
                    </tr>
                  )}
                </tbody>
                {rel.total && linhas.length > 0 && (
                  <tfoot>
                    <tr>
                      {rel.total.map((v, i) => (
                        <td key={i} className={(rel.colunas[i].tipo !== 'texto' ? 'dir num ' : '') + (rel.colunas[i].opcional ? 'opc' : '')}>
                          <b>{v === '' ? '' : formatar(v, rel.colunas[i])}</b>
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
