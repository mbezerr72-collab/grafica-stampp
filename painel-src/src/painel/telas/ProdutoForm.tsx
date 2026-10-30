import { useMemo, useState } from 'react'
import { SELOS, dados, desfazer, pode, produtos, useDados, type Sessao } from '../../data/store'
import { type PCor, type PProduto, type PVariacao } from '../../data/modelo'
import { NOME_MARCA, NOME_SETOR, PAGAMENTO, type Marca, type Selo, type Setor } from '../../data/produtos'
import { fotoProduto, slug } from '../../lib/fotos'
import { ir, link } from '../rota'
import { CampoDinheiro, Contador, Icone, Interruptor, Topo, avisar, brl0, confirmar } from '../ui'

const MARCAS = Object.entries(NOME_MARCA) as [Marca, string][]
const UNIDADES = ['un', 'cópia', 'pacote', 'cento', 'milheiro', 'bloco', 'm²', 'metro', 'kit', 'serviço']

function novoProduto(): PProduto {
  const hoje = new Date()
  return {
    id: 'novo',
    marca: 'camisas',
    linha: 'camisas',
    nome: '',
    condicao: 'novo',
    descricao: '',
    specs: [],
    selos: [],
    cores: [{ nome: 'Padrão', hex: '#ff6a00' }],
    gbs: [0],
    variacoes: [{ cor: 'Padrão', gb: 0, pix: 0, custo: 0, estoque: 0 }],
    ativo: true,
    quandoEsgota: 'avisar',
    lancamento: `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`,
    unidade: 'un',
    setor: 'sublimacao',
    prazoDias: 5,
    controlaEstoque: false,
    atualizadoEm: hoje.toISOString(),
  }
}

/** Uma variação por opção (as que sobram somem). */
function completar(p: PProduto): PProduto {
  const variacoes: PVariacao[] = p.cores.map((c) => p.variacoes.find((v) => v.cor === c.nome) ?? { cor: c.nome, gb: 0, pix: 0, custo: 0, estoque: 0 })
  return { ...p, gbs: [0], variacoes }
}

function idNovo(p: PProduto) {
  const base = slug(p.nome) || 'produto'
  let id = base
  for (let i = 2; produtos.porId(id); i++) id = `${base}-${i}`
  return id
}

/** Cadastro e edição de produto ou serviço da gráfica. A prévia mostra o cartão do site enquanto você digita. */
export default function ProdutoForm({ id, s }: { id: string; s: Sessao }) {
  const existente = useMemo(() => (id === 'novo' ? null : produtos.porId(id)), [id])
  if (id !== 'novo' && !existente)
    return (
      <>
        <Topo titulo="Produto" voltar="produtos" />
        <section className="vazio">
          <h2>Este produto não existe mais</h2>
          <a className="bt bt-forte" href={link('produtos')}>
            Ver produtos
          </a>
        </section>
      </>
    )
  return <Formulario key={id} inicial={existente ? structuredClone(existente) : novoProduto()} novo={!existente} s={s} />
}

function Formulario({ inicial, novo, s }: { inicial: PProduto; novo: boolean; s: Sessao }) {
  const [p, setP] = useState<PProduto>(() => completar(inicial))
  const [tentou, setTentou] = useState(false)
  const { linhas } = useDados('catalogo')
  const verCusto = pode(s, 'custo')
  const mudou = JSON.stringify(completar(inicial)) !== JSON.stringify(p)

  const mudar = (m: Partial<PProduto>) => setP((x) => completar({ ...x, ...m }))
  const mudarVar = (cor: string, m: Partial<PVariacao>) => setP((x) => ({ ...x, variacoes: x.variacoes.map((v) => (v.cor === cor ? { ...v, ...m } : v)) }))

  // ───── Opções (tamanho, papel, acabamento…) ─────
  const mudarOpcao = (i: number, m: Partial<PCor>) =>
    setP((x) => {
      const antigo = x.cores[i].nome
      const cores = x.cores.map((c, j) => (j === i ? { ...c, ...m } : c))
      const variacoes = m.nome !== undefined ? x.variacoes.map((v) => (v.cor === antigo ? { ...v, cor: m.nome! } : v)) : x.variacoes
      return { ...x, cores, variacoes }
    })
  const novaOpcao = () => {
    let nome = 'Nova opção'
    for (let i = 2; p.cores.some((c) => c.nome === nome); i++) nome = `Nova opção ${i}`
    // A opção nova começa com o preço e o custo da primeira.
    const base = p.variacoes[0]
    setP((x) => completar({ ...x, cores: [...x.cores, { nome, hex: '#ff6a00' }], variacoes: [...x.variacoes, { cor: nome, gb: 0, pix: base?.pix ?? 0, custo: base?.custo ?? 0, estoque: 0 }] }))
  }
  const tirarOpcao = async (i: number) => {
    const c = p.cores[i]
    const ok = await confirmar({ titulo: `Tirar a opção ${c.nome}?`, texto: 'O preço dessa opção sai junto.', botao: 'Tirar opção', perigo: true })
    if (ok) mudar({ cores: p.cores.filter((_, j) => j !== i) })
  }

  // ───── Salvar ─────
  const problemas: string[] = []
  if (!p.nome.trim()) problemas.push('Dê um nome ao produto.')
  if (!p.cores.length) problemas.push('Cadastre pelo menos uma opção.')
  if (p.cores.some((c) => !c.nome.trim())) problemas.push('Toda opção precisa de nome.')
  if (new Set(p.cores.map((c) => c.nome.trim())).size !== p.cores.length) problemas.push('Duas opções estão com o mesmo nome.')
  if (!p.variacoes.some((v) => v.pix > 0)) problemas.push('Coloque o preço de pelo menos uma opção.')

  const salvar = () => {
    setTentou(true)
    if (problemas.length) return
    const pronto: PProduto = {
      ...p,
      id: novo ? idNovo(p) : p.id,
      nome: p.nome.trim(),
      specs: p.specs.map((x) => x.trim()).filter(Boolean),
      cores: p.cores.map((c) => ({ ...c, nome: c.nome.trim() })),
      variacoes: p.variacoes.map((v) => ({ ...v, cor: v.cor.trim() })),
      atualizadoEm: new Date().toISOString(),
    }
    produtos.salvar(pronto)
    const h = dados.ler('historico')[0]
    avisar(novo ? 'Produto cadastrado.' : 'Salvo.', { nome: 'Voltar como estava', fazer: () => desfazer(h) })
    ir('produtos')
  }

  const cancelar = async () => {
    if (mudou && !(await confirmar({ titulo: 'Sair sem salvar?', texto: 'O que você mudou neste produto se perde.', botao: 'Sair sem salvar', perigo: true }))) return
    ir('produtos')
  }

  const excluir = async () => {
    const ok = await confirmar({ titulo: `Excluir ${p.nome}?`, texto: 'Ele sai do painel. Dá para desfazer logo em seguida.', botao: 'Excluir', perigo: true })
    if (!ok) return
    produtos.excluir(p.id)
    const h = dados.ler('historico')[0]
    avisar('Produto excluído.', { nome: 'Voltar como estava', fazer: () => desfazer(h) })
    ir('produtos')
  }

  const linhasMarca = linhas[p.marca] ?? []
  const precos = p.variacoes.map((v) => v.pix).filter((x) => x > 0)
  const aPartir = precos.length ? Math.min(...precos) : 0

  return (
    <>
      <Topo titulo={novo ? 'Novo produto' : p.nome || 'Produto'} voltar="produtos" />

      <div className="form-produto">
        <aside className="previa-lado">
          <p className="rotulo-previa">Assim aparece no site</p>
          <div className="previa">
            <article className="card card--grafica">
              <img src={fotoProduto(p)} alt="" />
              <b>{p.nome || 'Nome do produto'}</b>
              <small>{NOME_MARCA[p.marca]}</small>
              <span>{aPartir ? `a partir de ${brl0(aPartir)}` : 'Coloque um preço'}</span>
            </article>
          </div>
          {!p.ativo && <p className="nota">Este produto está fora do site e do balcão.</p>}
        </aside>

        <div className="form-campos">
          <section className="bloco">
            <h2>Sobre o produto</h2>
            <label className="campo">
              <span>Nome</span>
              <input value={p.nome} onChange={(e) => mudar({ nome: e.target.value })} placeholder="Ex.: Camisa personalizada" aria-invalid={tentou && !p.nome.trim()} />
            </label>
            <div className="campo">
              <span>Categoria</span>
              <div className="segmentos" role="radiogroup" aria-label="Categoria">
                {MARCAS.map(([id, nome]) => (
                  <button key={id} type="button" role="radio" aria-checked={p.marca === id} onClick={() => mudar({ marca: id, linha: linhas[id]?.[0]?.id ?? '' })}>
                    {nome}
                  </button>
                ))}
              </div>
            </div>
            <label className="campo">
              <span>Grupo (para organizar a lista)</span>
              <select value={p.linha} onChange={(e) => mudar({ linha: e.target.value })}>
                {linhasMarca.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo">
              <span>Descrição (aparece ao abrir o produto)</span>
              <textarea rows={3} value={p.descricao} onChange={(e) => mudar({ descricao: e.target.value })} placeholder="Ex.: Sublimação total em poliéster, cores que não desbotam." />
            </label>
            <label className="campo">
              <span>Detalhes (uma frase por linha)</span>
              <textarea rows={3} value={p.specs.join('\n')} onChange={(e) => mudar({ specs: e.target.value.split('\n') })} placeholder="Ex.: Pedido mínimo de 10 peças" />
            </label>
          </section>

          <section className="bloco">
            <h2>Produção</h2>
            <div className="form-g form-g--3">
              <label className="campo">
                <span>Setor que produz</span>
                <select value={p.setor} onChange={(e) => mudar({ setor: e.target.value as Setor })}>
                  {(Object.entries(NOME_SETOR) as [Setor, string][]).map(([id, nome]) => (
                    <option key={id} value={id}>
                      {nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="campo">
                <span>Prazo padrão (dias úteis)</span>
                <input inputMode="numeric" value={p.prazoDias} onChange={(e) => mudar({ prazoDias: Math.max(0, Number(e.target.value.replace(/\D/g, '')) || 0) })} />
              </label>
              <label className="campo">
                <span>Vende por</span>
                <select value={p.unidade} onChange={(e) => mudar({ unidade: e.target.value })}>
                  {[...new Set([p.unidade, ...UNIDADES])].map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {/* A gráfica só faz sob medida: o botão só aparece para desligar o que ainda estiver como pronta entrega. */}
            {p.controlaEstoque && (
            <Interruptor ligado={p.controlaEstoque} mudar={(controlaEstoque) => mudar({ controlaEstoque })}>
              <span>
                <strong>Pronta entrega (conta estoque)</strong>
                <small>Desligado: é feito sob encomenda, por pedido. O material usado fica em “Material em estoque”.</small>
              </span>
            </Interruptor>
            )}
          </section>

          <section className="bloco">
            <h2>Opções e preços</h2>
            <p className="nota">
              Cada opção é um jeito de vender: tamanho, papel, acabamento, quantidade. Parcela em até {PAGAMENTO.semJurosAte}x sem juros no cartão.
              {verCusto && ' O custo só você vê.'}
            </p>
            <div className="grade-gb">
              <div className={verCusto ? 'grade grade-custo' : 'grade'}>
                <span className="grade-cab">Opção</span>
                <span className="grade-cab">Preço</span>
                {verCusto && <span className="grade-cab">Custo</span>}
                <span className="grade-cab">{p.controlaEstoque ? 'Estoque' : ''}</span>
                {p.cores.map((c, i) => {
                  const v = p.variacoes.find((x) => x.cor === c.nome) ?? { pix: 0, custo: 0, estoque: 0 }
                  const lucro = v.pix > 0 && v.custo > 0 ? (v.pix - v.custo) / v.pix : null
                  return (
                    <div key={i} className="grade-linha">
                      <span className="grade-cor">
                        <input value={c.nome} onChange={(e) => mudarOpcao(i, { nome: e.target.value })} aria-label={`Nome da opção ${i + 1}`} />
                      </span>
                      <span className="grade-preco">
                        <em className="grade-mini">Preço</em>
                        <CampoDinheiro valor={v.pix} mudar={(pix) => mudarVar(c.nome, { pix })} rotulo={`Preço, ${c.nome}`} compacto />
                        <small>por {p.unidade}</small>
                      </span>
                      {verCusto && (
                        <span className="grade-preco">
                          <em className="grade-mini">Custo</em>
                          <CampoDinheiro valor={v.custo} mudar={(custo) => mudarVar(c.nome, { custo })} rotulo={`Custo, ${c.nome}`} compacto />
                          {lucro !== null && <small className={lucro < 0 ? 'neg' : ''}>lucro de {Math.round(lucro * 100)}%</small>}
                        </span>
                      )}
                      <span className="grade-estoque">
                        {p.controlaEstoque && (
                          <>
                            <em className="grade-mini">Estoque</em>
                            <Contador valor={v.estoque} mudar={(estoque) => mudarVar(c.nome, { estoque })} rotulo={`Estoque, ${c.nome}`} />
                          </>
                        )}
                        {p.cores.length > 1 && (
                          <button type="button" className="bt bt-leve bt-pequeno" onClick={() => tirarOpcao(i)} aria-label={`Tirar a opção ${c.nome}`}>
                            <Icone nome="lixo" tamanho={16} />
                          </button>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            <button type="button" className="bt bt-leve" onClick={novaOpcao}>
              <Icone nome="somar" tamanho={18} />
              Adicionar opção
            </button>
          </section>

          <section className="bloco">
            <h2>Etiqueta de destaque</h2>
            <div className="chips">
              {SELOS.map((x) => {
                const tem = p.selos.includes(x.id)
                return (
                  <button key={x.id} type="button" className="ficha" aria-pressed={tem} onClick={() => mudar({ selos: tem ? p.selos.filter((y) => y !== x.id) : [...p.selos, x.id as Selo] })}>
                    {x.nome}
                  </button>
                )
              })}
            </div>
            <p className="nota">O cartão mostra um selo só; com mais de um, vale o mais forte (Promoção, depois Mais vendido).</p>
          </section>

          <section className="bloco">
            <Interruptor ligado={p.ativo} mudar={(ativo) => mudar({ ativo })}>
              <span>
                <strong>Ativo</strong>
                <small>Desligado, some do balcão e dos pedidos novos, mas fica guardado.</small>
              </span>
            </Interruptor>
          </section>

          {!novo && s.papel === 'dono' && (
            <button type="button" className="bt bt-perigo-leve" onClick={excluir}>
              <Icone nome="lixo" tamanho={18} />
              Excluir produto
            </button>
          )}
        </div>
      </div>

      <footer className="rodape-salvar">
        {tentou && problemas.length > 0 && (
          <p className="erro" role="alert">
            {problemas[0]}
          </p>
        )}
        <button type="button" className="bt bt-leve" onClick={cancelar}>
          Cancelar
        </button>
        <button type="button" className="bt bt-forte" onClick={salvar} disabled={!mudou && !novo}>
          {novo ? 'Cadastrar' : mudou ? 'Salvar' : 'Sem mudanças'}
        </button>
      </footer>
    </>
  )
}
