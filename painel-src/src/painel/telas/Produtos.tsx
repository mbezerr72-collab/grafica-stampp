import { useMemo, useState } from 'react'
import { produtos, useDados, desfazer, dados, pode, type Sessao } from '../../data/store'
import { Precos, Categorias } from './Precos'
import { pegarPedido } from '../escala/pedido'
import { estoqueTotal, type PProduto } from '../../data/modelo'
import { NOME_MARCA, NOME_SETOR, type Marca } from '../../data/produtos'
import { Miniatura } from '../escala/Miniatura'
export { Miniatura }
import { ir, link } from '../rota'
import { Icone, Topo, avisar, brl0, confirmar } from '../ui'

const MARCAS: { id: Marca | 'todas'; nome: string }[] = [{ id: 'todas', nome: 'Todos' }, ...(Object.entries(NOME_MARCA) as [Marca, string][]).map(([id, nome]) => ({ id, nome }))]

type Situacao = 'todas' | 'venda' | 'esgotados' | 'desativados'

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Lista de produtos: busca, filtro, e para cada um: abrir, duplicar, ligar/desligar no site, excluir. */
export default function Produtos({ s }: { s: Sessao }) {
  const [pedido] = useState(() => pegarPedido('produtos'))
  const [aba, setAba] = useState<'lista' | 'precos' | 'categorias'>(pedido?.reajuste ? 'precos' : 'lista')
  const dono = pode(s, 'configuracoes')
  const abas = dono && (
    <div className="fichas abas" role="tablist" aria-label="Parte de produtos">
      {(
        [
          ['lista', 'Cadastro'],
          ['precos', 'Preços em lista'],
          ['categorias', 'Categorias'],
        ] as const
      ).map(([id, nome]) => (
        <button key={id} type="button" role="tab" className="ficha" aria-selected={aba === id} onClick={() => setAba(id)}>
          {nome}
        </button>
      ))}
    </div>
  )
  if (aba !== 'lista')
    return (
      <>
        <Topo titulo="Produtos" sub={aba === 'precos' ? 'Mude o preço de cada opção ou reajuste vários em %.' : 'Os grupos de cada categoria.'} />
        {abas}
        {aba === 'precos' ? <Precos reajuste={pedido?.reajuste} /> : <Categorias />}
      </>
    )
  return <Lista s={s} abas={abas} />
}

function Lista({ s, abas }: { s: Sessao; abas: React.ReactNode }) {
  const { produtos: lista } = useDados('catalogo')
  const [busca, setBusca] = useState('')
  const [marca, setMarca] = useState<Marca | 'todas'>('todas')
  const [situacao, setSituacao] = useState<Situacao>('todas')

  const filtrados = useMemo(() => {
    const q = semAcento(busca.trim())
    return lista.filter((p) => {
      if (marca !== 'todas' && p.marca !== marca) return false
      if (q && !semAcento(p.nome).includes(q)) return false
      const total = estoqueTotal(p)
      if (situacao === 'venda') return p.ativo && total > 0
      if (situacao === 'esgotados') return p.ativo && p.controlaEstoque && total === 0
      if (situacao === 'desativados') return !p.ativo
      return true
    })
  }, [lista, busca, marca, situacao])

  return (
    <>
      <Topo titulo="Produtos">
        <a className="bt bt-forte acao-principal" href={link('produtos', 'novo')}>
          <Icone nome="somar" tamanho={18} />
          Novo produto
        </a>
      </Topo>
      {abas}

      <div className="filtros">
        <label className="busca">
          <Icone nome="busca" tamanho={18} />
          <input type="search" placeholder="Buscar pelo nome" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar produto" />
        </label>
        <div className="segmentos" role="radiogroup" aria-label="Categoria">
          {MARCAS.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={marca === m.id} onClick={() => setMarca(m.id)}>
              {m.nome}
            </button>
          ))}
        </div>
        <select value={situacao} onChange={(e) => setSituacao(e.target.value as Situacao)} aria-label="Situação">
          <option value="todas">Todas as situações</option>
          <option value="venda">Ativos</option>
          <option value="esgotados">Pronta entrega esgotada</option>
          <option value="desativados">Desativados</option>
        </select>
      </div>

      <p className="contagem">
        {filtrados.length} {filtrados.length === 1 ? 'produto' : 'produtos'}
      </p>

      {filtrados.length ? (
        <ul className="produtos">
          {filtrados.map((p) => (
            <Linha key={p.id} p={p} s={s} />
          ))}
        </ul>
      ) : (
        <section className="vazio">
          <h2>Nada encontrado</h2>
          <p>Mude a busca ou os filtros, ou cadastre um produto novo.</p>
        </section>
      )}
    </>
  )
}


function Linha({ p, s }: { p: PProduto; s: Sessao }) {
  const total = estoqueTotal(p)
  const precos = p.variacoes.map((v) => v.pix).filter(Boolean)
  const menor = precos.length ? Math.min(...precos) : 0
  const cond = `${NOME_MARCA[p.marca]}, ${NOME_SETOR[p.setor].toLowerCase()}`
  const cores = `${p.cores.length} ${p.cores.length === 1 ? 'opção' : 'opções'}`

  const duplicar = () => {
    const id = produtos.duplicar(p.id)
    if (id) {
      avisar('Cópia criada, desativada até você ativar.')
      ir('produtos', id)
    }
  }
  const excluir = async () => {
    const ok = await confirmar({
      titulo: `Excluir ${p.nome}?`,
      texto: 'Ele sai do painel. Dá para desfazer logo em seguida.',
      botao: 'Excluir',
      perigo: true,
    })
    if (!ok) return
    produtos.excluir(p.id)
    const h = dados.ler('historico')[0]
    avisar('Produto excluído.', { nome: 'Voltar como estava', fazer: () => desfazer(h) })
  }
  const alternar = () => {
    produtos.ativar(p.id, !p.ativo)
    avisar(p.ativo ? 'Produto desativado.' : 'Produto ativo de novo.')
  }

  return (
    <li className="produto" data-ativo={p.ativo}>
      <a className="produto-abrir" href={link('produtos', p.id)}>
        <Miniatura p={p} />
        <span className="produto-texto">
          <strong>{p.nome}</strong>
          <small>
            {cond}, {cores}, {p.prazoDias ? `pronto em ${p.prazoDias} ${p.prazoDias === 1 ? 'dia' : 'dias'}` : 'pronto na hora'}
          </small>
          <span className="produto-numeros">
            {menor > 0 && <span>a partir de {brl0(menor)}</span>}
            {p.controlaEstoque ? (
              <span className={total === 0 ? 'selo-estoque selo-zero' : total <= 2 ? 'selo-estoque selo-pouco' : 'selo-estoque'}>{total === 0 ? 'Esgotado' : `${total} em estoque`}</span>
            ) : (
              <span className="selo-estoque">Sob encomenda</span>
            )}
            {!p.ativo && <span className="selo-estoque selo-fora">Desativado</span>}
          </span>
        </span>
      </a>
      <details className="menu-linha">
        <summary aria-label={`Mais ações para ${p.nome}`}>
          <Icone nome="mais" />
        </summary>
        <div className="menu-linha-itens" onClick={(e) => (e.currentTarget.parentElement as HTMLDetailsElement).removeAttribute('open')}>
          <button type="button" onClick={alternar}>
            {p.ativo ? 'Desativar' : 'Ativar'}
          </button>
          <button type="button" onClick={duplicar}>
            Duplicar
          </button>
          {s.papel === 'dono' && (
            <button type="button" className="perigo" onClick={excluir}>
              Excluir
            </button>
          )}
        </div>
      </details>
    </li>
  )
}
