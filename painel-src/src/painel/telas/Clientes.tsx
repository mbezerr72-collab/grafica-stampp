import { useMemo, useState, type CSSProperties } from 'react'
import { hoje, negocio, pode, useDados, type Cliente, type Pedido, type Sessao, type Venda } from '../../data/store'
import { itensFrase, tituloPedido, custoVenda, faturamentoVenda, NOMES_STATUS_PEDIDO, totalPedido, type Origem } from '../../data/negocio'
import { Icone, Topo, avisar } from '../ui'
import { link } from '../rota'
import { MiniKpi, brl, pct } from '../escala/componentes'
import { Gaveta } from '../escala/Gaveta'
import { Avatar } from '../escala/Avatar'
import { diasEntre, nomeMes, somaDias } from '../escala/periodo'
import { linkWhats } from '../escala/documentos'
import { LOJA } from '../../lib/config'

const ORIGEM: Record<Origem, string> = { whatsapp: 'WhatsApp', instagram: 'Instagram', indicacao: 'Indicação', site: 'Site', loja: 'Passou na gráfica', outro: 'Outro' }
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const dataLonga = (d: string) => `${Number(d.slice(8, 10))} de ${nomeMes(d)}${d.slice(0, 4) !== hoje().slice(0, 4) ? ` de ${d.slice(0, 4)}` : ''}`

type Resumo = { c: Cliente; vendas: Venda[]; pedidos: Pedido[]; total: number; ultima?: string; anoPassado?: string }
type Lista = { id: string; nome: string; frase: string; filtro: (r: Resumo) => boolean; mensagem: (r: Resumo) => string; cor: string }

/** As listas inteligentes: cada uma com quem entra nela e a mensagem pronta para mandar. */
function listas(h: string): Lista[] {
  const semana = new Set(Array.from({ length: 7 }, (_, i) => somaDias(h, i).slice(5)))
  const primeiro = (r: Resumo) => r.c.nome.split(' ')[0]
  return [
    { id: 'todos', nome: 'Todos', frase: 'Todos os clientes cadastrados.', filtro: () => true, mensagem: (r) => `Oi, ${primeiro(r)}! Aqui é da ${LOJA.nome}.`, cor: 'var(--teal)' },
    {
      id: 'aniversario',
      nome: 'Aniversário na semana',
      frase: 'Fazem aniversário nos próximos 7 dias.',
      filtro: (r) => !!r.c.aniversario && semana.has(r.c.aniversario),
      mensagem: (r) => `Feliz aniversário, ${primeiro(r)}! 🎉 A ${LOJA.nome} preparou um presente: 10% de desconto em canecas e camisas personalizadas até o fim do mês. É só mostrar esta mensagem.`,
      cor: 'var(--roxo)',
    },
    {
      id: 'empresas',
      nome: 'Empresas e grupos',
      frase: 'Times, escolas, igrejas e empresas: pedidos grandes.',
      filtro: (r) => !!r.c.empresa,
      mensagem: (r) => `Oi, ${primeiro(r)}! Aqui é da ${LOJA.nome}. Estamos com condição especial para uniformes, camisas de evento e material impresso em quantidade. Quer um orçamento?`,
      cor: 'var(--inf)',
    },
    {
      id: 'recompra',
      nome: 'Pedido do ano passado',
      frase: 'Fizeram pedido há 10 a 13 meses: uniforme e evento se repetem.',
      filtro: (r) => !!r.anoPassado,
      mensagem: (r) => `Oi, ${primeiro(r)}! Aqui é da ${LOJA.nome}. Faz quase um ano do seu pedido de ${r.anoPassado}. Vai repetir este ano? Já temos a arte guardada.`,
      cor: 'var(--ent)',
    },
    {
      id: 'sumidos',
      nome: 'Sumidos',
      frase: 'Compraram, mas não voltam há mais de 4 meses.',
      filtro: (r) => !!r.ultima && diasEntre(r.ultima, h) > 120,
      mensagem: (r) => `Oi, ${primeiro(r)}! Faz tempo que você não passa na ${LOJA.nome}. Temos novidades em camisas, canecas e brindes personalizados. Quer ver?`,
      cor: 'var(--ate)',
    },
    {
      id: 'fieis',
      nome: 'Fiéis',
      frase: '3 compras ou mais.',
      filtro: (r) => r.vendas.filter((v) => v.status === 'concluida').length >= 3,
      mensagem: (r) => `Oi, ${primeiro(r)}! Obrigado por ser cliente da ${LOJA.nome}. Para você, que volta sempre, tem condição especial no próximo pedido. Chama aqui!`,
      cor: 'var(--teal)',
    },
    {
      id: 'prontos',
      nome: 'Pedido pronto',
      frase: 'Têm pedido pronto esperando retirada.',
      filtro: (r) => r.pedidos.some((o) => o.status === 'pronto'),
      mensagem: (r) => `Oi, ${primeiro(r)}! Seu pedido está pronto na ${LOJA.nome}. Pode buscar de segunda a sexta, das 7h30 às 17h30, e sábado até 11h30.`,
      cor: 'var(--ent)',
    },
  ]
}

/** Clientes: listas inteligentes com mensagem pronta e a ficha de cada um. */
export default function Clientes({ s, id }: { s: Sessao; id?: string }) {
  const clientes = useDados('clientes')
  const vendas = useDados('vendas')
  const pedidos = useDados('pedidos')
  const h = hoje()
  const [lista, setLista] = useState('todos')
  const [busca, setBusca] = useState('')
  const [mostrar, setMostrar] = useState(30)
  const [novo, setNovo] = useState(false)

  const resumos = useMemo(() => {
    const porCli = new Map<string, Resumo>()
    for (const c of clientes) porCli.set(c.id, { c, vendas: [], pedidos: [], total: 0 })
    for (const v of vendas) {
      const r = v.clienteId ? porCli.get(v.clienteId) : undefined
      if (!r) continue
      r.vendas.push(v)
      if (v.status === 'concluida') {
        r.total += faturamentoVenda(v)
        if (!r.ultima || v.data > r.ultima) r.ultima = v.data.slice(0, 10)
      }
    }
    for (const o of pedidos) {
      const r = porCli.get(o.clienteId)
      if (!r) continue
      r.pedidos.push(o)
      if (o.entregueEm && o.entregueEm >= somaDias(h, -395) && o.entregueEm <= somaDias(h, -300)) r.anoPassado = itensFrase(o)
    }
    return [...porCli.values()]
  }, [clientes, vendas, pedidos, h])

  if (id) {
    const r = resumos.find((x) => x.c.id === id)
    if (r) return <Ficha r={r} dono={pode(s, 'custo')} />
  }

  const ls = listas(h)
  const l = ls.find((x) => x.id === lista) ?? ls[0]
  const q = semAcento(busca.trim())
  const filtrados = resumos.filter(l.filtro).filter((r) => !q || semAcento(r.c.nome + r.c.telefone + r.c.cidade).includes(q)).sort((a, b) => b.total - a.total)
  const ativos90 = resumos.filter((r) => r.ultima && r.ultima >= somaDias(h, -90)).length

  return (
    <>
      <Topo titulo="Clientes" sub="Listas prontas para chamar no WhatsApp: aniversário, empresas, pedido do ano passado e quem sumiu.">
        <button type="button" className="bt bt-forte acao-principal" onClick={() => setNovo(true)}>
          <Icone nome="somar" tamanho={18} />
          <span>Cadastrar cliente</span>
        </button>
      </Topo>
      <section className="kpis-menores">
        <MiniKpi rotulo="Clientes" valor={clientes.length} nota={`${ativos90} compraram nos últimos 90 dias`} />
        <MiniKpi rotulo="Voltaram a comprar" valor={pct(resumos.filter((r) => r.vendas.length >= 2).length / Math.max(1, resumos.filter((r) => r.vendas.length).length), 0)} nota="de quem já comprou" />
        <MiniKpi rotulo="Gasto médio" valor={'R$ ' + brl(resumos.reduce((t, r) => t + r.total, 0) / Math.max(1, resumos.filter((r) => r.total).length))} nota="por cliente que comprou" />
        <MiniKpi rotulo="Empresas e grupos" valor={clientes.filter((c) => c.empresa).length} nota={`R$ ${brl(resumos.filter((r) => r.c.empresa).reduce((t, r) => t + r.total, 0))} comprados`} />
      </section>

      <section className="listas" aria-label="Listas inteligentes">
        {ls.slice(1).map((x) => {
          const n = resumos.filter(x.filtro).length
          return (
            <button key={x.id} type="button" className={'lista-c' + (lista === x.id ? ' ativa' : '')} style={{ '--c': x.cor } as CSSProperties} aria-pressed={lista === x.id} onClick={() => setLista(lista === x.id ? 'todos' : x.id)}>
              <b>{n}</b>
              <span>{x.nome}</span>
              <small>{x.frase}</small>
            </button>
          )
        })}
      </section>

      <section className="painel">
        <div className="painel-t">
          <h3>{l.nome}</h3>
          <span className="mut">
            {filtrados.length} {filtrados.length === 1 ? 'cliente' : 'clientes'}
          </span>
        </div>
        <label className="entrada entrada--p">
          <Icone nome="busca" tamanho={18} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, telefone ou cidade" aria-label="Buscar cliente" />
        </label>
        {lista !== 'todos' && (
          <p className="msg-modelo">
            <b>Mensagem desta lista:</b> {l.mensagem(filtrados[0] ?? resumos[0]).replace((filtrados[0] ?? resumos[0])?.c.nome.split(' ')[0] ?? '', '[nome]')}
          </p>
        )}
        <ul className="clientes">
          {filtrados.slice(0, mostrar).map((r, i) => (
            <li key={r.c.id}>
              <a className="cli-l" href={link('clientes', r.c.id)}>
                <Avatar nome={r.c.nome} i={i} tamanho={36} />
                <span className="cli-l-txt">
                  <b>{r.c.nome}</b>
                  <small>
                    {r.c.telefone}, {r.c.cidade}
                  </small>
                </span>
                <span className="cli-l-num">
                  <b className="num">{r.total ? `R$ ${brl(r.total)}` : 'sem compra'}</b>
                  <small>{r.ultima ? `última ${r.ultima.slice(8)}/${r.ultima.slice(5, 7)}/${r.ultima.slice(2, 4)}` : `${r.pedidos.length} pedidos`}</small>
                </span>
              </a>
              {lista !== 'todos' && (
                <a className="icone-bt icone-bt--leve" href={linkWhats(r.c.telefone, l.mensagem(r))} target="_blank" rel="noopener" aria-label={`Mandar a mensagem para ${r.c.nome}`}>
                  <Icone nome="whats" />
                </a>
              )}
            </li>
          ))}
        </ul>
        {!filtrados.length && <p className="mut vazio-linha">Ninguém nesta lista agora.</p>}
        {filtrados.length > mostrar && (
          <button type="button" className="btn btn-o largo" onClick={() => setMostrar(mostrar + 40)}>
            Mostrar mais
          </button>
        )}
      </section>
      {novo && <EditarCliente fechar={() => setNovo(false)} />}
    </>
  )
}

function Ficha({ r, dono }: { r: Resumo; dono: boolean }) {
  const equipe = useDados('equipe')
  const [filtro, setFiltro] = useState<'tudo' | 'compras' | 'pedidos'>('tudo')
  const [editar, setEditar] = useState(false)
  const h = hoje()
  const concl = r.vendas.filter((v) => v.status === 'concluida')
  const lucro = concl.reduce((t, v) => t + faturamentoVenda(v) - custoVenda(v), 0)
  const vendedorMais = (() => {
    const m = new Map<string, number>()
    for (const v of concl) m.set(v.vendedorId, (m.get(v.vendedorId) ?? 0) + 1)
    const top = [...m.entries()].sort((a, b) => b[1] - a[1])[0]
    return top ? equipe.find((e) => e.id === top[0])?.nome : undefined
  })()
  const eventos = [
    ...(filtro !== 'pedidos' ? r.vendas.filter((v) => !v.pedidoId).map((v) => ({ tipo: 'venda' as const, data: v.data.slice(0, 10), v })) : []),
    ...(filtro !== 'compras' ? r.pedidos.map((o) => ({ tipo: 'pedido' as const, data: o.criadoEm, o })) : []),
  ].sort((a, b) => b.data.localeCompare(a.data))
  const abertos = r.pedidos.filter((o) => o.status !== 'entregue')
  return (
    <>
      <Topo titulo={r.c.nome} sub={`Cliente desde ${dataLonga(r.c.criadoEm)}. Veio por ${ORIGEM[r.c.origem].toLowerCase()}.`} voltar="clientes">
        <a className="bt bt-forte" href={linkWhats(r.c.telefone, `Oi, ${r.c.nome.split(' ')[0]}! Aqui é da ${LOJA.nome}.`)} target="_blank" rel="noopener">
          <Icone nome="whats" tamanho={18} />
          <span>WhatsApp</span>
        </a>
      </Topo>
      <section className="kpis-menores">
        <MiniKpi rotulo="Total comprado" valor={'R$ ' + brl(r.total)} nota={`em ${concl.length} ${concl.length === 1 ? 'compra' : 'compras'}`} />
        <MiniKpi rotulo="Última compra" valor={r.ultima ? `${Number(r.ultima.slice(8))} de ${nomeMes(r.ultima).slice(0, 3)}` : '—'} nota={r.ultima ? (r.ultima === h ? 'hoje' : `há ${diasEntre(r.ultima, h) - 1} ${diasEntre(r.ultima, h) === 2 ? 'dia' : 'dias'}`) : 'ainda não comprou'} />
        <MiniKpi rotulo="Pedidos" valor={`${r.pedidos.length} pedidos`} nota={`R$ ${brl(r.pedidos.reduce((t, o) => t + totalPedido(o), 0))}`} />
        {dono ? <MiniKpi rotulo="Lucro para a gráfica" valor={'R$ ' + brl(lucro)} nota={r.total ? `${pct(lucro / r.total)} de margem` : '—'} /> : <MiniKpi rotulo="Pedidos em aberto" valor={abertos.length} nota="ainda não entregues" />}
      </section>
      <div className="ficha-c">
        <section className="painel">
          <div className="painel-t">
            <h3>Dados</h3>
            <button type="button" className="link-bt" onClick={() => setEditar(true)}>
              Editar
            </button>
          </div>
          <ul className="dados">
            <li>
              <span>Telefone</span>
              <b>{r.c.telefone}</b>
            </li>
            <li>
              <span>CPF</span>
              <b>{r.c.cpf ? r.c.cpf.replace(/^(\d{3})\.?(\d{3})\.?(\d{3})/, '***.$2.***') : '—'}</b>
            </li>
            <li>
              <span>Aniversário</span>
              <b>{r.c.aniversario ? `${Number(r.c.aniversario.slice(3))} de ${nomeMes('2000-' + r.c.aniversario)}` : '—'}</b>
            </li>
            <li>
              <span>Cidade</span>
              <b>{r.c.cidade}, AC</b>
            </li>
            <li>
              <span>Como chegou</span>
              <b>{ORIGEM[r.c.origem]}</b>
            </li>
            {vendedorMais && (
              <li>
                <span>Quem atende</span>
                <b>{vendedorMais}</b>
              </li>
            )}
          </ul>
          {r.c.obs && <p className="obs">{r.c.obs}</p>}
          {abertos.length > 0 && (
            <div className="det-bloco">
              <p className="det-rot">Pedidos em aberto</p>
              <ul className="det-itens">
                {abertos.map((o) => (
                  <li key={o.id}>
                    <a href={link('pedidos', String(o.numero))}>Pedido {o.numero}</a>
                    <span className="mut">{NOMES_STATUS_PEDIDO[o.status]}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
        <section className="painel">
          <div className="painel-t">
            <h3>Compras e pedidos</h3>
            <div className="segm" role="group" aria-label="Filtrar">
              {(['tudo', 'compras', 'pedidos'] as const).map((f) => (
                <button key={f} type="button" aria-pressed={filtro === f} onClick={() => setFiltro(f)}>
                  {f === 'tudo' ? 'Tudo' : f === 'compras' ? 'Balcão' : 'Pedidos'}
                </button>
              ))}
            </div>
          </div>
          {eventos.length ? (
            <ol className="hist">
              {eventos.map((e) =>
                e.tipo === 'venda' ? (
                  <li key={e.v.id} style={{ '--c': 'var(--teal-txt)', '--f': 'var(--teal-fundo)' } as CSSProperties}>
                    <span className="hist-ic">
                      <Icone nome="vendas" tamanho={16} />
                    </span>
                    <div>
                      <b>
                        Compra nº {e.v.numero}
                        {e.v.status !== 'concluida' ? ` (${e.v.status})` : ''}
                      </b>
                      <p>
                        {dataLonga(e.data)}, {e.v.data.slice(11, 16)}. Atendeu: {equipe.find((x) => x.id === e.v.vendedorId)?.nome.split(' ')[0]}
                      </p>
                      <p className="hist-itens">{e.v.itens.map((i) => `${i.qtd > 1 ? i.qtd + ' × ' : ''}${i.nome}`).join(' · ')}</p>
                    </div>
                    <span className="v num">R$ {brl(faturamentoVenda(e.v))}</span>
                  </li>
                ) : (
                  <li key={e.o.id} style={{ '--c': 'var(--roxo)', '--f': 'var(--inf-fundo)' } as CSSProperties}>
                    <span className="hist-ic">
                      <Icone nome="os" tamanho={16} />
                    </span>
                    <div>
                      <b>
                        Pedido {e.o.numero}: {tituloPedido(e.o)}
                      </b>
                      <p>
                        {dataLonga(e.data)}. {e.o.entregueEm ? `Entregue em ${Math.max(1, diasEntre(e.o.criadoEm, e.o.entregueEm) - 1)} dias` : NOMES_STATUS_PEDIDO[e.o.status]}.
                      </p>
                    </div>
                    <span className="v num">R$ {brl(totalPedido(e.o))}</span>
                  </li>
                ),
              )}
            </ol>
          ) : (
            <p className="mut">Nada por aqui ainda.</p>
          )}
        </section>
      </div>
      {editar && <EditarCliente c={r.c} fechar={() => setEditar(false)} />}
    </>
  )
}

function EditarCliente({ c, fechar }: { c?: Cliente; fechar: () => void }) {
  const [x, setX] = useState({
    nome: c?.nome ?? '',
    telefone: c?.telefone ?? '',
    cpf: c?.cpf ?? '',
    aniversario: c?.aniversario ?? '',
    cidade: c?.cidade ?? 'Cruzeiro do Sul',
    origem: c?.origem ?? ('loja' as Origem),
    obs: c?.obs ?? '',
    empresa: c?.empresa ?? false,
  })
  const salvar = () => {
    if (!x.nome.trim()) return
    negocio.salvarCliente({ ...x, id: c?.id, nome: x.nome.trim(), ...(x.cpf ? { cpf: x.cpf } : {}), ...(x.aniversario ? { aniversario: x.aniversario } : {}) })
    avisar(c ? 'Cliente salvo.' : 'Cliente cadastrado.')
    fechar()
  }
  return (
    <Gaveta
      titulo={c ? 'Editar cliente' : 'Novo cliente'}
      fechar={fechar}
      pe={
        <button type="button" className="btn btn-p" disabled={!x.nome.trim()} onClick={salvar}>
          Salvar
        </button>
      }
    >
      <div className="form-g">
        <label className="campo">
          Nome
          <input value={x.nome} onChange={(e) => setX({ ...x, nome: e.target.value })} />
        </label>
        <label className="campo">
          WhatsApp
          <input inputMode="tel" value={x.telefone} onChange={(e) => setX({ ...x, telefone: e.target.value })} placeholder="(68) 9…" />
        </label>
        <label className="campo">
          CPF (opcional)
          <input inputMode="numeric" value={x.cpf} onChange={(e) => setX({ ...x, cpf: e.target.value })} />
        </label>
        <label className="campo">
          Aniversário (dia e mês)
          <input type="date" value={x.aniversario ? `2000-${x.aniversario}` : ''} onChange={(e) => setX({ ...x, aniversario: e.target.value.slice(5) })} />
        </label>
        <label className="campo">
          Cidade
          <input value={x.cidade} onChange={(e) => setX({ ...x, cidade: e.target.value })} />
        </label>
        <label className="campo">
          Como chegou
          <select value={x.origem} onChange={(e) => setX({ ...x, origem: e.target.value as Origem })}>
            {(Object.keys(ORIGEM) as Origem[]).map((o) => (
              <option key={o} value={o}>
                {ORIGEM[o]}
              </option>
            ))}
          </select>
        </label>
        <label className="check-l">
          <input type="checkbox" checked={x.empresa} onChange={(e) => setX({ ...x, empresa: e.target.checked })} />
          <span>É empresa, time, escola ou grupo</span>
        </label>
        <label className="campo">
          Observação
          <textarea rows={3} value={x.obs} onChange={(e) => setX({ ...x, obs: e.target.value })} />
        </label>
      </div>
    </Gaveta>
  )
}
