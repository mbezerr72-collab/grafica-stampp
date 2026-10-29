import { useMemo, useState, type CSSProperties } from 'react'
import { hoje, negocio, pode, useDados, type Sessao } from '../../data/store'
import { totalPedido } from '../../data/negocio'
import { Icone, Topo } from '../ui'
import { link } from '../rota'
import { CartaoComissao } from './Comissao'
import { pedir } from '../escala/pedido'
import { intervalo, usePeriodo, dataCurta, somaDias, nomeMes, diasEntre } from '../escala/periodo'
import { noPeriodo, porVendedor, resumo, serie } from '../escala/numeros'
import { GraficoBarras, Kpi, brl, pct } from '../escala/componentes'
import { linkWhats } from '../escala/documentos'
import { useFila, NOME_TIPO, type MsgFila } from '../escala/fila'

const saudacao = () => {
  const h = Number(new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Rio_Branco', hour: 'numeric', hour12: false }).format(new Date()))
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const SEMANA_LONGA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const diaSem = (d: string) => new Date(d + 'T12:00:00Z').getUTCDay()
const ICONE_MSG: Record<MsgFila['tipo'], string> = { retirar: 'check', orcamento: 'mensagem', obrigado: 'estrela', aniversario: 'calendario', recompra: 'troca' }

type Alerta = { id: string; tipo: 'sai' | 'ate' | 'inf'; icone: string; t: string; s: string; link: string }

/**
 * Início enxuto: os 4 cartões, o gráfico do período, os alertas do dia e a fila de mensagens.
 * O resto (meta, vendas, ranking) aparece em uma linha com link para a aba dona.
 */
export function Inicio({ s }: { s: Sessao }) {
  if (s.papel !== 'dono') return <InicioVendedor s={s} />
  return <InicioDono s={s} />
}

function InicioDono({ s }: { s: Sessao }) {
  const p = usePeriodo()
  const vendas = useDados('vendas')
  const despesas = useDados('despesas')
  const contas = useDados('contas')
  const pedidos = useDados('pedidos')
  const orcamentos = useDados('orcamentos')
  const insumos = useDados('insumos')
  const equipe = useDados('equipe')
  const metas = useDados('metas')
  const fila = useFila(s)
  const dono = pode(s, 'financeiro')
  const iv = intervalo(p)
  const h = hoje()

  const d = useMemo(() => {
    const a = resumo(vendas, despesas, iv.de, iv.ate)
    const b = resumo(vendas, despesas, iv.ant.de, iv.ant.ate)
    const { pontos, passo } = serie(vendas, iv.dias < 7 ? somaDias(iv.ate, -6) : iv.de, iv.ate)
    return { a, b, pontos, passo }
  }, [vendas, despesas, iv.de, iv.ate, iv.ant.de, iv.ant.ate, iv.dias])
  const { a, b, pontos, passo } = d

  const grafico = pontos.map((x) => ({
    rot: passo === 1 ? `${Number(x.dia.slice(8))}${diaSem(x.dia) === 6 ? ' sáb' : ''}` : passo === 7 ? dataCurta(x.dia) : `${x.dia.slice(5, 7)}/${x.dia.slice(2, 4)}`,
    fat: x.fat,
    lucro: x.lucro,
    destaque: passo === 1 && diaSem(x.dia) === 6,
  }))
  const maior = pontos.reduce((m, x) => (x.fat > m.fat ? x : m), { dia: '', fat: 0, lucro: 0 })
  const comp = iv.comparacao

  // ── Alertas do dia: só aparece o que pede uma ação hoje ──
  const alertas = useMemo(() => {
    const l: Alerta[] = []
    if (pode(s, 'despesas')) {
      const atrasadas = contas.filter((c) => c.tipo === 'pagar' && !c.pagaEm && c.vencimento < h)
      for (const c of atrasadas.slice(0, 3)) l.push({ id: 'ct-' + c.id, tipo: 'sai', icone: 'carteira', t: `${c.descricao} atrasada`, s: `R$ ${brl(c.valor)}, venceu ${dataCurta(c.vencimento)} (há ${diasEntre(c.vencimento, h) - 1} dias)`, link: 'despesas' })
      const vencendo = contas.filter((c) => c.tipo === 'pagar' && !c.pagaEm && c.vencimento >= h && c.vencimento <= somaDias(h, 3))
      if (vencendo.length) l.push({ id: 'ct-venc', tipo: 'ate', icone: 'relogio', t: `${vencendo.length} ${vencendo.length === 1 ? 'conta vence' : 'contas vencem'} até ${dataCurta(somaDias(h, 3))}`, s: `R$ ${brl(vencendo.reduce((t, c) => t + c.valor, 0))}: ${vencendo.slice(0, 2).map((c) => c.descricao).join(', ')}${vencendo.length > 2 ? '…' : ''}`, link: 'despesas' })
    }
    const atrasados = pedidos.filter((o) => o.status !== 'entregue' && o.status !== 'pronto' && o.prazo < h)
    if (atrasados.length) l.push({ id: 'ped-atr', tipo: 'sai', icone: 'os', t: `${atrasados.length} ${atrasados.length === 1 ? 'pedido atrasado' : 'pedidos atrasados'}`, s: atrasados.slice(0, 3).map((o) => `Pedido ${o.numero} (${o.itens[0]?.nome.toLowerCase() ?? ''})`).join(', '), link: 'producao' })
    const hojePrazo = pedidos.filter((o) => o.status !== 'entregue' && o.status !== 'pronto' && o.prazo === h)
    if (hojePrazo.length) l.push({ id: 'ped-hoje', tipo: 'ate', icone: 'relogio', t: `${hojePrazo.length} ${hojePrazo.length === 1 ? 'pedido vence' : 'pedidos vencem'} hoje`, s: hojePrazo.slice(0, 3).map((o) => `Pedido ${o.numero}`).join(', '), link: 'producao' })
    const prontos = pedidos.filter((o) => o.status === 'pronto' && !o.avisados?.includes('pronto'))
    if (prontos.length) l.push({ id: 'ped-pr', tipo: 'inf', icone: 'check', t: `${prontos.length} ${prontos.length === 1 ? 'pedido pronto' : 'pedidos prontos'} sem aviso ao cliente`, s: `R$ ${brl(prontos.reduce((t, o) => t + totalPedido(o) - o.sinal, 0))} a receber na entrega`, link: 'pedidos' })
    const novos = orcamentos.filter((o) => o.status === 'novo')
    if (novos.length) l.push({ id: 'orc', tipo: 'inf', icone: 'mensagem', t: `${novos.length} ${novos.length === 1 ? 'orçamento para responder' : 'orçamentos para responder'}`, s: novos.slice(0, 3).map((o) => o.nome.split(' ')[0]).join(', ') + '. Quem responde primeiro fecha.', link: 'orcamentos' })
    const baixo = insumos.filter((x) => x.estoque < x.minimo)
    if (baixo.length) l.push({ id: 'ins', tipo: 'ate', icone: 'estoque', t: `${baixo.length} ${baixo.length === 1 ? 'material acabando' : 'materiais acabando'}`, s: baixo.slice(0, 3).map((x) => `${x.nome} (${x.estoque.toLocaleString('pt-BR')} ${x.unidade})`).join(', '), link: 'insumos' })
    return l
  }, [contas, pedidos, orcamentos, insumos, h, s])

  // ── As linhas de resumo (a tela inteira mora na aba dona) ──
  const mes = h.slice(0, 7)
  const meta = metas.find((m) => m.mes === mes)
  const doMes = resumo(vendas, despesas, mes + '-01', h)
  const diasMes = new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0).getDate()
  const passou = Number(h.slice(8)) / diasMes
  const doMesVendas = noPeriodo(vendas, mes + '-01', h)
  const melhor = porVendedor(doMesVendas, equipe).filter((x) => x.membro.papel !== 'dono')[0]
  const eu = equipe.find((e) => e.nome === s.nome)
  const minha = eu ? porVendedor(doMesVendas, equipe).find((x) => x.membro.id === eu.id) : undefined

  return (
    <>
      <Topo titulo={`${saudacao()}, ${s.nome.split(' ')[0]}`} sub={`${SEMANA[new Date().getDay()]}, ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}. ${iv.rotulo}.`}>
        <button type="button" className="bt bt-forte acao-principal" onClick={() => pedir({ tela: 'pedidos', nova: true })}>
          <Icone nome="somar" tamanho={18} />
          <span>Novo pedido</span>
        </button>
      </Topo>
      <section className="kpis" aria-label="Números do período">
        <Kpi tipo="destaque" rotulo="Total vendido" valor={a.faturamento} antes={b.faturamento} comparacao={comp} frase={`${a.vendas} ${a.vendas === 1 ? 'venda' : 'vendas'}. Tudo que entrou de venda.`} />
        {dono && <Kpi tipo="lucro" rotulo="Lucro" valor={a.lucro} antes={b.lucro} comparacao={comp} frase="O que sobrou: o que vendeu, menos o custo do que foi vendido e as contas da gráfica." />}
        {dono && <Kpi rotulo="Gastos da gráfica" cor="var(--sai)" inverso valor={a.despesasLoja} antes={b.despesasLoja} comparacao={comp} frase="Aluguel, salários, energia e outras contas. Compra de material fica fora." />}
        {!dono && minha && <Kpi tipo="lucro" rotulo={`Sua comissão em ${nomeMes(mes)}`} valor={minha.comissao} frase={`${minha.vendas} vendas suas, R$ ${brl(minha.fat)} vendidos. Atualiza a cada venda.`} />}
      </section>

      <section className="painel">
        <div className="painel-t">
          <h3>Vendas e lucro {passo === 1 ? 'por dia' : passo === 7 ? 'por semana' : 'por mês'}</h3>
          <span className="mut">
            {dataCurta(iv.dias < 7 ? somaDias(iv.ate, -6) : iv.de)} a {dataCurta(iv.ate)}
          </span>
        </div>
        <GraficoBarras pontos={grafico} rotulo="Vendas em barras e lucro em linha" />
        <p className="legenda">
          <span>
            <i style={{ '--c': 'var(--teal)' } as CSSProperties} />
            Vendas
          </span>
          <span>
            <i style={{ '--c': 'var(--ent)' } as CSSProperties} />
            Lucro
          </span>
          {maior.fat > 0 && passo === 1 && (
            <span>
              Maior dia: {SEMANA_LONGA[diaSem(maior.dia)]}, {Number(maior.dia.slice(8))}, R$ {brl(maior.fat)}
            </span>
          )}
        </p>
      </section>

      <div className="grade-2">
        <section className="painel" aria-labelledby="alertas-t">
          <div className="painel-t">
            <h3 id="alertas-t">Alertas do dia</h3>
            <span className="mut">{alertas.length ? `${alertas.length} pedem atenção` : 'tudo em dia'}</span>
          </div>
          {alertas.length ? (
            <ul className="alertas">
              {alertas.map((x) => (
                <li key={x.id}>
                  <a className={'alerta ' + x.tipo} href={link(x.link)}>
                    <span className="alerta-ic">
                      <Icone nome={x.icone} tamanho={18} />
                    </span>
                    <span className="alerta-txt">
                      <b>{x.t}</b>
                      <small>{x.s}</small>
                    </span>
                    <Icone nome="seta" tamanho={16} />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mut">Nenhuma conta vencendo, nenhum pedido atrasado e os insumos estão em dia.</p>
          )}
        </section>
        <FilaDoDia fila={fila} />
      </div>

      <section className="painel resumos" aria-label="Resumo do mês">
        {dono && meta && (
          <a className="resumo-l" href={link('metas')}>
            <span className="resumo-t">
              Meta de {nomeMes(mes)}: <b>{pct(doMes.faturamento / meta.faturamento, 0)}</b> <span className="mut">({pct(passou, 0)} do mês passou)</span>
            </span>
            <span className="meta-barra meta-barra--fina" aria-hidden="true">
              <i style={{ width: `${Math.min(100, (doMes.faturamento / meta.faturamento) * 100)}%` }} />
              <em style={{ left: `${passou * 100}%` }} />
            </span>
            <span className="resumo-link">Ver metas →</span>
          </a>
        )}
        <a className="resumo-l" href={link('vendas')}>
          <span className="resumo-t">
            <b>{doMesVendas.length}</b> vendas em {nomeMes(mes)}
          </span>
          <span className="resumo-link">Ver vendas →</span>
        </a>
        {dono && melhor && (
          <a className="resumo-l" href={link('equipe')}>
            <span className="resumo-t">
              Melhor vendedor do mês: <b>{melhor.membro.nome.split(' ')[0]}</b> <span className="mut">(R$ {brl(melhor.fat)})</span>
            </span>
            <span className="resumo-link">Ver equipe →</span>
          </a>
        )}
      </section>
    </>
  )
}

/** "Mensagens de hoje: 4": cada uma com o texto pronto e um toque para enviar. */
function FilaDoDia({ fila }: { fila: MsgFila[] }) {
  const [aberta, setAberta] = useState<string>()
  const [todas, setTodas] = useState(false)
  const lista = todas ? fila : fila.slice(0, 5)
  return (
    <section className="painel" aria-labelledby="fila-t">
      <div className="painel-t">
        <h3 id="fila-t">Mensagens de hoje: {fila.length}</h3>
        <span className="mut">o sistema montou sozinho</span>
      </div>
      {fila.length ? (
        <ul className="fila">
          {lista.map((m) => (
            <li key={m.id} className="fila-i">
              <span className="fila-ic">
                <Icone nome={ICONE_MSG[m.tipo]} tamanho={18} />
              </span>
              <button type="button" className="fila-txt" onClick={() => setAberta(aberta === m.id ? undefined : m.id)} aria-expanded={aberta === m.id}>
                <b>{m.titulo}</b>
                <small>
                  {NOME_TIPO[m.tipo]}. {m.sub}
                </small>
              </button>
              <a className="btn btn-o fila-enviar" href={linkWhats(m.telefone, m.texto)} target="_blank" rel="noopener" onClick={() => negocio.marcarEnviada(m.id)} aria-label={`Enviar para ${m.titulo} no WhatsApp`}>
                <Icone nome="whats" tamanho={16} />
                <span>Enviar</span>
              </a>
              {aberta === m.id && <pre className="msg-previa fila-previa">{m.texto}</pre>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mut">Nenhuma mensagem para hoje. Amanhã tem mais.</p>
      )}
      {fila.length > 5 && (
        <button type="button" className="link-bt" onClick={() => setTodas(!todas)}>
          {todas ? 'Mostrar menos' : `Ver as ${fila.length}`}
        </button>
      )}
      <p className="mut pequeno">Toque no nome para ler a mensagem. Na demonstração cada uma abre o WhatsApp; na versão final o envio pode sair sozinho.</p>
    </section>
  )
}

/** Início do vendedor: os 3 botões do dia a dia, grandes, e a comissão do mês. */
function InicioVendedor({ s }: { s: Sessao }) {
  const nome = s.nome.split(' ')[0]
  return (
    <>
      <Topo titulo={`Oi, ${nome}!`} sub="O que você vai fazer agora?" periodo={false} />
      <div className="vendedor-bts">
        <button type="button" className="vendedor-bt principal" onClick={() => pedir({ tela: 'pedidos', nova: true })}>
          <Icone nome="os" tamanho={34} />
          <b>Novo pedido</b>
          <small>Camisa, banner, cartão, caneca…</small>
        </button>
        <a className="vendedor-bt" href={link('pdv')}>
          <Icone nome="pdv" tamanho={34} />
          <b>Balcão</b>
          <small>Xerox, impressão e pronta entrega</small>
        </a>
        <a className="vendedor-bt" href={link('producao')}>
          <Icone nome="pincel" tamanho={34} />
          <b>Fila de produção</b>
          <small>O que fazer primeiro, pelo prazo</small>
        </a>
      </div>
      <CartaoComissao s={s} />
    </>
  )
}
