/** Partes do detalhe do pedido que são de gráfica: lista de nomes e números dos uniformes e serviço feito fora. */
import { useState } from 'react'
import { hoje, negocio, useDados, type Pedido } from '../../data/store'
import { pecasPedido, type PecaLista } from '../../data/negocio'
import { CampoDinheiro, Icone, avisar } from '../ui'
import { brl } from '../escala/componentes'

const TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'EXG', 'PPBL', 'PBL', 'MBL', 'GBL', 'GGBL', 'EXGBL']
const dataBr = (d: string) => d.split('-').reverse().join('/')

/** Cada linha da lista colada vira uma peça: "M João 10", "GG - Pedro - 7", "P;Ana;". O tamanho vem primeiro. */
export function lerListaColada(texto: string): PecaLista[] {
  return texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const partes = l.split(/\s*[-;,\t]\s*|\s+/).filter(Boolean)
      const tamanho = TAMANHOS.find((t) => t === partes[0]?.toUpperCase()) ?? ''
      const resto = tamanho ? partes.slice(1) : partes
      const numero = /^\d{1,3}$/.test(resto[resto.length - 1] ?? '') ? resto.pop()! : ''
      return { tamanho, nome: resto.join(' '), numero }
    })
}

/** Lista de nomes e números por peça (uniformes). Sai na ficha de produção. */
export function ListaNomes({ o }: { o: Pedido }) {
  const [lista, setLista] = useState<PecaLista[]>(o.lista ?? [])
  const [colar, setColar] = useState('')
  const mudou = JSON.stringify(lista) !== JSON.stringify(o.lista ?? [])
  const pecas = pecasPedido(o)
  const tamanhosGrade = o.grade ? Object.keys(o.grade).filter((t) => o.grade![t] > 0) : []
  const opcoes = tamanhosGrade.length ? tamanhosGrade : TAMANHOS
  // Confere a lista com a grade: quantos nomes por tamanho contra quantas peças foram pedidas
  const diferencas = tamanhosGrade
    .map((t) => [t, lista.filter((p) => p.tamanho === t).length, o.grade![t]] as const)
    .filter(([, tem, pediu]) => tem !== pediu)
  const muda = (i: number, campo: keyof PecaLista, v: string) => setLista(lista.map((p, j) => (j === i ? { ...p, [campo]: v } : p)))

  return (
    <div className="det-bloco">
      <p className="det-rot">
        Nomes e números · {lista.length} de {pecas} {pecas === 1 ? 'peça' : 'peças'}
      </p>
      {lista.length > 0 && (
        <ul className="det-itens">
          {lista.map((p, i) => (
            <li key={i} className="orc-lin" style={{ gridTemplateColumns: '84px minmax(0, 1fr) 64px 36px' }}>
              <select aria-label={`Tamanho da peça ${i + 1}`} value={p.tamanho} onChange={(e) => muda(i, 'tamanho', e.target.value)} style={{ maxWidth: 92 }}>
                <option value="">—</option>
                {opcoes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input aria-label={`Nome da peça ${i + 1}`} placeholder="Nome nas costas" value={p.nome} onChange={(e) => muda(i, 'nome', e.target.value)} />
              <input aria-label={`Número da peça ${i + 1}`} placeholder="Nº" inputMode="numeric" value={p.numero} onChange={(e) => muda(i, 'numero', e.target.value.replace(/\D/g, '').slice(0, 3))} style={{ maxWidth: 64 }} />
              <button type="button" className="bt bt-leve bt-pequeno" aria-label={`Tirar a peça ${i + 1}`} onClick={() => setLista(lista.filter((_, j) => j !== i))}>
                <Icone nome="lixo" tamanho={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {diferencas.length > 0 && lista.length > 0 && (
        <p className="pequeno" style={{ color: 'var(--ate)' }}>
          Não bate com a grade: {diferencas.map(([t, tem, pediu]) => `${t} tem ${tem} ${tem === 1 ? 'nome' : 'nomes'} para ${pediu} ${pediu === 1 ? 'peça' : 'peças'}`).join('; ')}.
        </p>
      )}
      <div className="esc-grupo">
        <span>Colar a lista do cliente (uma peça por linha: tamanho, nome e número)</span>
        <textarea rows={3} value={colar} onChange={(e) => setColar(e.target.value)} placeholder={'M João 10\nGG - Pedro - 7\nPBL Ana 23'} aria-label="Colar a lista do cliente" />
      </div>
      <div className="cli-novo-acoes" style={{ flexWrap: 'wrap' }}>
        <button type="button" className="bt bt-leve bt-pequeno" onClick={() => setLista([...lista, { tamanho: '', nome: '', numero: '' }])}>
          Pôr uma peça
        </button>
        <button
          type="button"
          className="bt bt-leve bt-pequeno"
          disabled={!colar.trim()}
          onClick={() => {
            const novas = lerListaColada(colar)
            setLista([...lista, ...novas])
            setColar('')
            avisar(`${novas.length} ${novas.length === 1 ? 'peça entrou' : 'peças entraram'} na lista. Confira e salve.`)
          }}
        >
          Pôr a lista colada
        </button>
        {mudou && (
          <button
            type="button"
            className="bt bt-forte bt-pequeno"
            onClick={() => {
              negocio.salvarPedido({ ...o, lista: lista.filter((p) => p.nome.trim() || p.numero) })
              avisar('Lista de nomes salva. Ela sai na ficha de produção.')
            }}
          >
            Salvar lista
          </button>
        )}
      </div>
    </div>
  )
}

/** Serviço feito fora: o pedido (ou parte dele) está num fornecedor, com custo e dia de voltar. */
export function FeitoFora({ o }: { o: Pedido }) {
  const fornecedores = useDados('fornecedores')
  const h = hoje()
  const [abrir, setAbrir] = useState(false)
  const [fornecedor, setFornecedor] = useState(fornecedores[0]?.nome ?? '')
  const [servico, setServico] = useState('')
  const [custo, setCusto] = useState(0)
  const [previsao, setPrevisao] = useState(h)
  const f = o.fora

  if (f) {
    const atrasado = !f.voltouEm && f.previsao < h
    return (
      <div className="det-bloco">
        <p className="det-rot">Feito fora</p>
        <ul className="det-itens">
          <li>
            <span>
              {f.servico} · {f.fornecedor}
            </span>
            <span className="num">R$ {brl(f.custo)}</span>
          </li>
          <li>
            <span>{f.voltouEm ? 'Voltou do fornecedor' : atrasado ? 'Atrasado no fornecedor' : 'Volta do fornecedor'}</span>
            <span style={atrasado ? { color: 'var(--sai)', fontWeight: 700 } : undefined}>{dataBr(f.voltouEm ?? f.previsao)}</span>
          </li>
        </ul>
        <div className="cli-novo-acoes">
          {!f.voltouEm && (
            <button
              type="button"
              className="bt bt-forte bt-pequeno"
              onClick={() => {
                negocio.salvarPedido({ ...o, fora: { ...f, voltouEm: h } })
                avisar('Marcado: voltou do fornecedor.')
              }}
            >
              <Icone nome="check" tamanho={16} />
              Voltou do fornecedor
            </button>
          )}
          <button
            type="button"
            className="bt bt-leve bt-pequeno"
            onClick={() => {
              negocio.salvarPedido({ ...o, fora: undefined })
              avisar('O pedido não está mais marcado como feito fora.')
            }}
          >
            Tirar a marcação
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="det-bloco">
      <p className="det-rot">Feito fora</p>
      {!abrir ? (
        <button type="button" className="bt bt-leve bt-pequeno" onClick={() => setAbrir(true)}>
          Mandar para um fornecedor (letra caixa, offset, bordado…)
        </button>
      ) : (
        <>
          <div className="form-g form-g--3">
            <label className="campo">
              Fornecedor
              <select value={fornecedor} onChange={(e) => setFornecedor(e.target.value)}>
                {fornecedores.map((x) => (
                  <option key={x.id} value={x.nome}>
                    {x.nome}
                  </option>
                ))}
                <option value="Outro fornecedor">Outro fornecedor</option>
              </select>
            </label>
            <label className="campo">
              O que ele vai fazer
              <input placeholder="Ex.: letra caixa em PVC" value={servico} onChange={(e) => setServico(e.target.value)} />
            </label>
            <label className="campo">
              Volta no dia
              <input type="date" value={previsao} min={h} onChange={(e) => setPrevisao(e.target.value)} />
            </label>
          </div>
          <div className="cli-novo-acoes" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <CampoDinheiro compacto rotulo="Quanto ele cobra" valor={custo} mudar={setCusto} />
            <button
              type="button"
              className="bt bt-forte bt-pequeno"
              disabled={!servico.trim()}
              onClick={() => {
                negocio.salvarPedido({ ...o, fora: { fornecedor, servico: servico.trim(), custo, previsao, enviadoEm: h } })
                avisar(`Marcado: está com ${fornecedor}, volta ${dataBr(previsao)}.`)
              }}
            >
              Marcar como feito fora
            </button>
          </div>
        </>
      )}
    </div>
  )
}
