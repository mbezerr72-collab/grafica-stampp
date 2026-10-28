import { useState } from 'react'
import { restaurarDemonstracao, catalogo, desfazer, loja, useDados, type Papel, type Sessao } from '../../data/store'
import type { Loja as TLoja, Pagamento } from '../../data/modelo'
import { precoCartao, valorParcela } from '../../data/produtos'
import { Icone, Interruptor, Topo, avisar, confirmar } from '../ui'
import { link } from '../rota'
import { brl } from '../escala/componentes'
import { cartaoLoja } from '../escala/automatico'
import { NOME_CATEGORIA, type Categoria } from '../../data/negocio'

type Aba = 'info' | 'pagamento' | 'usuarios' | 'config' | 'historico'
const ABAS: [Aba, string][] = [
  ['info', 'Dados da gráfica'],
  ['pagamento', 'Pagamento e sinal'],
  ['config', 'Cópia de segurança'],
  ['historico', 'O que foi mudado'],
]
const PODE: [string, boolean, boolean][] = [
  ['Vender no balcão, abrir pedido, ver clientes', true, true],
  ['Fila de produção, insumos e orçamentos', true, true],
  ['Produtos (sem ver o custo)', true, true],
  ['Custo, lucro, caixa e relatórios', true, false],
  ['Contas, despesas e metas', true, false],
  ['Preços, promoções, compras e configurações', true, false],
  ['Usuários e histórico', true, false],
]

/** Configurações da gráfica: dados, pagamento, quem entra, cópia e histórico. */
export default function Loja({ s }: { s: Sessao }) {
  const [aba, setAba] = useState<Aba>('info')
  return (
    <>
      <Topo titulo="Configurações da gráfica" sub="Dados da gráfica, pagamento, sinal, quem entra no painel e cópia de segurança." />
      <div className="fichas abas" role="tablist" aria-label="Parte">
        {ABAS.map(([id, nome]) => (
          <button key={id} type="button" role="tab" className="ficha" aria-selected={aba === id} onClick={() => setAba(id)}>
            {nome}
          </button>
        ))}
      </div>
      {aba === 'info' && <Info />}
      {aba === 'pagamento' && <Pag />}
      {aba === 'config' && <Config />}
      {aba === 'historico' && <Historico />}
    </>
  )
}

function Info() {
  const c = useDados('catalogo')
  const [x, setX] = useState<TLoja>(c.loja)
  const mudou = JSON.stringify(x) !== JSON.stringify(c.loja)
  return (
    <div className="grade-2">
      <section className="painel">
        <div className="painel-t">
          <h3>Contato e endereço</h3>
        </div>
        <div className="form-g">
          <label className="campo">
            WhatsApp da gráfica (com DDD)
            <input inputMode="tel" value={x.whatsapp} onChange={(e) => setX({ ...x, whatsapp: e.target.value.replace(/\D/g, '') })} />
          </label>
          <label className="campo">
            Instagram (sem o @)
            <input value={x.instagram} onChange={(e) => setX({ ...x, instagram: e.target.value.replace('@', '') })} />
          </label>
          {x.endereco.map((l, i) => (
            <label key={i} className="campo">
              Endereço, linha {i + 1}
              <input value={l} onChange={(e) => setX({ ...x, endereco: x.endereco.map((y, j) => (j === i ? e.target.value : y)) })} />
            </label>
          ))}
          <label className="campo">
            Entrega e retirada
            <textarea rows={2} value={x.prazoEntrega} onChange={(e) => setX({ ...x, prazoEntrega: e.target.value })} />
          </label>
        </div>
      </section>
      <section className="painel">
        <div className="painel-t">
          <h3>Horário</h3>
        </div>
        <ul className="horarios">
          {x.horarios.map((h, i) => (
            <li key={h.dia}>
              <b>{h.dia}</b>
              {h.fechado ? (
                <span className="mut">fechado</span>
              ) : (
                <span className="hora">
                  <input type="time" value={h.abre} aria-label={`${h.dia}, abre`} onChange={(e) => setX({ ...x, horarios: x.horarios.map((y, j) => (j === i ? { ...y, abre: e.target.value } : y)) })} />
                  às
                  <input type="time" value={h.fecha} aria-label={`${h.dia}, fecha`} onChange={(e) => setX({ ...x, horarios: x.horarios.map((y, j) => (j === i ? { ...y, fecha: e.target.value } : y)) })} />
                </span>
              )}
              <Interruptor rotulo={`${h.dia} aberto`} ligado={!h.fechado} mudar={(v) => setX({ ...x, horarios: x.horarios.map((y, j) => (j === i ? { ...y, fechado: !v } : y)) })} />
            </li>
          ))}
        </ul>
        {mudou && (
          <div className="cli-novo-acoes">
            <button type="button" className="bt bt-leve" onClick={() => setX(c.loja)}>
              Voltar como estava
            </button>
            <button
              type="button"
              className="bt bt-forte"
              onClick={() => {
                catalogo.mudar((y) => ({ ...y, loja: x }))
                avisar('Dados salvos. Recibos e mensagens já usam.')
              }}
            >
              Salvar
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

function Pag() {
  const c = useDados('catalogo')
  const [x, setX] = useState<Pagamento>(c.pagamento)
  const mudou = JSON.stringify(x) !== JSON.stringify(c.pagamento)
  const ex = 250
  const cartao = ex / (1 - x.descontoPix)
  return (
    <div className="grade-2">
      <section className="painel">
        <div className="painel-t">
          <h3>Pix e parcelas</h3>
        </div>
        <div className="form-g form-g--3">
          <label className="campo">
            Desconto no Pix (%)
            <input type="number" min={0} max={30} step={0.5} value={Math.round(x.descontoPix * 1000) / 10} onChange={(e) => setX({ ...x, descontoPix: Number(e.target.value) / 100 })} />
          </label>
          <label className="campo">
            Sem juros até
            <select value={x.semJurosAte} onChange={(e) => setX({ ...x, semJurosAte: Number(e.target.value) })}>
              {[1, 3, 6, 10, 12].map((n) => (
                <option key={n} value={n}>
                  {n}x
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            Juros ao mês depois (%)
            <input type="number" min={0} max={10} step={0.01} value={Math.round(x.jurosMes * 10000) / 100} onChange={(e) => setX({ ...x, jurosMes: Number(e.target.value) / 100 })} />
          </label>
          <label className="campo">
            Máximo de parcelas
            <select value={x.maxParcelas} onChange={(e) => setX({ ...x, maxParcelas: Number(e.target.value) })}>
              {[6, 10, 12, 18].map((n) => (
                <option key={n} value={n}>
                  {n}x
                </option>
              ))}
            </select>
          </label>
        </div>
        {mudou && (
          <button
            type="button"
            className="btn btn-p"
            onClick={() => {
              catalogo.mudar((y) => ({ ...y, pagamento: x }))
              avisar('Pagamento salvo. O balcão já usa.')
            }}
          >
            Salvar
          </button>
        )}
      </section>
      <Automatico />
      <section className="painel">
        <div className="painel-t">
          <h3>Como fica um pedido de R$ {brl(ex)}</h3>
        </div>
        <ul className="det-itens">
          <li>
            <span>Preço no cartão</span>
            <span className="num">R$ {brl(cartao, true)}</span>
          </li>
          {[1, x.semJurosAte, x.maxParcelas].filter((n, i, l) => l.indexOf(n) === i).map((n) => {
            const total = cartao
            const i = x.jurosMes
            const parcela = n <= x.semJurosAte || i <= 0 ? total / n : (total * i) / (1 - Math.pow(1 + i, -n))
            return (
              <li key={n}>
                <span>
                  {n}x {n <= x.semJurosAte ? 'sem juros' : 'com juros'}
                </span>
                <span className="num">R$ {brl(parcela, true)}</span>
              </li>
            )
          })}
        </ul>
        <p className="mut pequeno">
          No balcão o preço do cartão sai arredondado: R$ {brl(cartaoLoja(ex), true)}. Hoje, com o que está salvo: {`R$ ${brl(precoCartao(ex), true)}`} no cartão ou {x.semJurosAte}x de R$ {brl(valorParcela(ex, x.semJurosAte), true)}.
        </p>
      </section>
    </div>
  )
}

/** Quem entra no painel (mora em Equipe e comissões). */
export function Usuarios({ s }: { s: Sessao }) {
  const usuarios = useDados('usuarios')
  const [novo, setNovo] = useState({ nome: '', email: '', papel: 'funcionario' as Papel })
  return (
    <div className="grade-2">
      <section className="painel">
        <div className="painel-t">
          <h3>Quem entra no painel</h3>
        </div>
        <ul className="usuarios">
          {usuarios.map((u) => (
            <li key={u.id}>
              <span className="cli-l-txt">
                <b>{u.nome}</b>
                <small>
                  {u.email}, {u.papel === 'dono' ? 'dono' : 'funcionário'}
                  {u.nome === s.nome ? ' (você)' : ''}
                </small>
              </span>
              <Interruptor rotulo={`${u.nome} pode entrar`} ligado={u.ativo} mudar={(v) => (u.nome === s.nome ? avisar('Você não pode tirar o próprio acesso.') : loja.salvarUsuario({ ...u, ativo: v }))} />
            </li>
          ))}
        </ul>
        <form
          className="cli-novo"
          onSubmit={(e) => {
            e.preventDefault()
            if (!novo.nome.trim() || !novo.email.includes('@')) return
            loja.salvarUsuario({ ...novo, nome: novo.nome.trim(), ativo: true })
            setNovo({ nome: '', email: '', papel: 'funcionario' })
            avisar('Usuário criado.')
          }}
        >
          <input placeholder="Nome" aria-label="Nome do usuário" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
          <input placeholder="E-mail" type="email" aria-label="E-mail do usuário" value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} />
          <select aria-label="Papel" value={novo.papel} onChange={(e) => setNovo({ ...novo, papel: e.target.value as Papel })}>
            <option value="funcionario">Funcionário</option>
            <option value="dono">Dono</option>
          </select>
          <button type="submit" className="bt bt-forte bt-pequeno">
            Criar usuário
          </button>
        </form>
      </section>
      <section className="painel">
        <div className="painel-t">
          <h3>O que cada um pode</h3>
        </div>
        <div className="tabela-caixa" tabIndex={0} role="region" aria-label="Tabela">
          <table className="tabela permissoes">
            <thead>
              <tr>
                <th>Parte do painel</th>
                <th className="dir">Dono</th>
                <th className="dir">Funcionário</th>
              </tr>
            </thead>
            <tbody>
              {PODE.map(([n, d, f]) => (
                <tr key={n}>
                  <td>{n}</td>
                  <td className="dir">{d ? <Icone nome="check" tamanho={18} /> : '—'}</td>
                  <td className="dir">{f ? <Icone nome="check" tamanho={18} /> : <span className="mut">não vê</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mut pequeno">O funcionário não vê custo, lucro nem as contas da gráfica. Ele atende, abre pedidos, cuida da produção e dos insumos.</p>
      </section>
    </div>
  )
}

function Config() {
  const config = useDados('config')
  const [x, setX] = useState(config)
  const mudou = JSON.stringify(x) !== JSON.stringify(config)
  const baixar = () => {
    const blob = new Blob([loja.copia()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `copia-grafica-estamp-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    avisar('Cópia de segurança baixada.')
  }
  const voltar = async (f: File) => {
    const ok = await confirmar({ titulo: 'Voltar esta cópia?', texto: 'Tudo o que está no painel agora é trocado pelo que está no arquivo (as fotos ficam).', botao: 'Voltar a cópia', perigo: true })
    if (!ok) return
    const n = loja.restaurarCopia(await f.text())
    avisar(n ? `Cópia restaurada (${n} partes).` : 'Esse arquivo não é uma cópia do painel.')
  }
  return (
    <div className="grade-2">
      <section className="painel">
        <div className="painel-t">
          <h3>Cópia de segurança</h3>
        </div>
        <p className="mut">Baixe um arquivo com produtos, preços, pedidos, orçamentos, vendas, clientes, insumos, caixa e contas. Guarde no Google Drive ou no e-mail.</p>
        <button type="button" className="btn btn-p" onClick={baixar}>
          <Icone nome="relatorio" tamanho={18} />
          Baixar cópia de segurança
        </button>
        <label className="btn btn-o arquivo-bt">
          Voltar uma cópia
          <input type="file" accept="application/json,.json" onChange={(e) => e.target.files?.[0] && voltar(e.target.files[0])} />
        </label>
        <button
          type="button"
          className="btn btn-o"
          onClick={async () => {
            if (await confirmar({ titulo: 'Restaurar a demonstração?', texto: 'Tudo volta como no primeiro acesso: produtos, pedidos, vendas e insumos deste aparelho.', botao: 'Restaurar', perigo: true })) {
              await restaurarDemonstracao()
              avisar('Demonstração restaurada.')
            }
          }}
        >
          Restaurar demonstração
        </button>
      </section>
    </div>
  )
}

function Historico() {
  const historico = useDados('historico')
  return (
    <section className="painel">
      <div className="painel-t">
        <h3>O que mudou nos produtos</h3>
        <span className="mut">os últimos {historico.length}</span>
      </div>
      {historico.length ? (
        <ul className="contas">
          {historico.slice(0, 80).map((h) => (
            <li key={h.id} className="conta conta--hist">
              <span className="agenda-dia">
                <b>{h.quando.slice(8, 10)}</b>
                <small>{h.quando.slice(11, 16)}</small>
              </span>
              <span className="conta-txt">
                <b>
                  {h.acao}: {(h.depois ?? h.antes)?.nome ?? 'produto'}
                </b>
                <small>
                  {h.quem}
                  {h.desfeito ? ', desfeito' : ''}
                </small>
              </span>
              {!h.desfeito && (h.antes || h.depois) ? (
                <button
                  type="button"
                  className="btn btn-o conta-bt"
                  onClick={async () => {
                    const ok = await confirmar({ titulo: 'Voltar como estava?', texto: 'O produto volta como estava antes dela.', botao: 'Voltar como estava' })
                    if (ok) {
                      desfazer(h)
                      avisar('Mudança desfeita.')
                    }
                  }}
                >
                  Voltar como estava
                </button>
              ) : (
                <span />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mut">Nada mudou ainda. Cada mudança em produto, preço ou promoção aparece aqui e pode ser desfeita.</p>
      )}
    </section>
  )
}

/** O que o dono define para o modo automático: limite de desconto, senha, chave Pix e margem de cada categoria. */
function Automatico() {
  const cfg = useDados('config')
  const [x, setX] = useState({ descontoMax: cfg.descontoMax, senhaDono: cfg.senhaDono, chavePix: cfg.chavePix, margens: cfg.margens, sinalPct: cfg.sinalPct })
  const mudou = JSON.stringify(x) !== JSON.stringify({ descontoMax: cfg.descontoMax, senhaDono: cfg.senhaDono, chavePix: cfg.chavePix, margens: cfg.margens, sinalPct: cfg.sinalPct })
  const CATS = Object.entries(NOME_CATEGORIA) as [Categoria, string][]
  return (
    <section className="painel">
      <div className="painel-t">
        <h3>Sinal, desconto, Pix e margens</h3>
      </div>
      <div className="form-g form-g--3">
        <label className="campo">
          Desconto do atendente sem senha (%)
          <input type="number" min={0} max={50} step={1} value={x.descontoMax} onChange={(e) => setX({ ...x, descontoMax: Number(e.target.value) })} />
        </label>
        <label className="campo">
          Senha do dono para liberar mais
          <input type="password" autoComplete="new-password" value={x.senhaDono} onChange={(e) => setX({ ...x, senhaDono: e.target.value })} />
        </label>
        <label className="campo">
          Sinal para começar o pedido (%)
          <input type="number" min={0} max={100} step={5} value={x.sinalPct} onChange={(e) => setX({ ...x, sinalPct: Number(e.target.value) })} />
        </label>
        <label className="campo">
          Chave Pix (QR do balcão e do sinal)
          <input value={x.chavePix} onChange={(e) => setX({ ...x, chavePix: e.target.value })} />
        </label>
      </div>
      <p className="det-rot">Margem padrão de cada categoria (referência para preço novo)</p>
      <div className="form-g form-g--3">
        {CATS.map(([k, n]) => (
          <label key={k} className="campo">
            {n} (%)
            <input type="number" min={0} max={300} value={x.margens[k]} onChange={(e) => setX({ ...x, margens: { ...x.margens, [k]: Number(e.target.value) } })} />
          </label>
        ))}
      </div>
      {mudou && (
        <button
          type="button"
          className="btn btn-p"
          onClick={() => {
            loja.salvarConfig(x)
            avisar('Salvo. O balcão e os pedidos já usam.')
          }}
        >
          Salvar
        </button>
      )}
    </section>
  )
}
