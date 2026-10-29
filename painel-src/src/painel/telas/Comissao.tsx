import { useMemo } from 'react'
import { hoje, useDados, type Sessao } from '../../data/store'
import type { Membro, Venda } from '../../data/negocio'
import { Icone, Topo } from '../ui'
import { link } from '../rota'
import { brl } from '../escala/componentes'

/** O membro da equipe de quem está logado (pelo nome, como o vendedor padrão da venda). */
export const euNaEquipe = (equipe: Membro[], s: Sessao) => equipe.find((e) => e.nome === s.nome) ?? equipe.find((e) => e.papel === 'atendimento')

/** Vendas do mês de agora deste vendedor, com o que ele ganhou em cada uma. */
export function comissaoDoMes(vendas: Venda[], m: Membro | undefined) {
  const mes = hoje().slice(0, 7)
  const minhas = m ? vendas.filter((v) => v.vendedorId === m.id && v.status === 'concluida' && v.data.slice(0, 7) === mes) : []
  const linhas = minhas.map((v) => {
    const total = v.itens.reduce((t, i) => t + (i.preco - i.desconto) * i.qtd, 0)
    const ganho = v.itens.reduce((t, i) => t + ((i.preco - i.desconto) * i.qtd * (m!.comissao[i.categoria] ?? 0)) / 100, 0)
    return { v, total, ganho }
  })
  return { linhas, vendido: linhas.reduce((t, l) => t + l.total, 0), ganho: linhas.reduce((t, l) => t + l.ganho, 0), meta: m?.metaMes ?? 0 }
}

/** O cartão "Minha comissão do mês" (no Início do vendedor e no alto da tela dele). */
export function CartaoComissao({ s, grande = false }: { s: Sessao; grande?: boolean }) {
  const vendas = useDados('vendas')
  const equipe = useDados('equipe')
  const eu = euNaEquipe(equipe, s)
  const c = useMemo(() => comissaoDoMes(vendas, eu), [vendas, eu])
  const falta = Math.max(0, c.meta - c.vendido)
  const parte = c.meta ? Math.min(1, c.vendido / c.meta) : 0
  return (
    <a className={'comissao-cartao' + (grande ? ' grande' : '')} href={link('comissao')}>
      <span className="comissao-t">
        <Icone nome="carteira" tamanho={20} />
        Minha comissão do mês
      </span>
      <b className="comissao-valor num">R$ {brl(c.ganho)}</b>
      <span className="comissao-sub">
        Você vendeu R$ {brl(c.vendido)} em {c.linhas.length} {c.linhas.length === 1 ? 'venda' : 'vendas'}.
      </span>
      {c.meta > 0 && (
        <>
          <span className="comissao-barra" aria-hidden="true">
            <span style={{ width: `${(parte * 100).toFixed(0)}%` }} />
          </span>
          <span className="comissao-sub">{falta ? `Faltam R$ ${brl(falta)} para a meta de R$ ${brl(c.meta)}.` : 'Meta do mês batida. Parabéns!'}</span>
        </>
      )}
    </a>
  )
}

/** Minha comissão: o vendedor vê quanto vendeu e quanto ganhou no mês, venda por venda. */
export function Comissao({ s }: { s: Sessao }) {
  const vendas = useDados('vendas')
  const equipe = useDados('equipe')
  const eu = euNaEquipe(equipe, s)
  const c = useMemo(() => comissaoDoMes(vendas, eu), [vendas, eu])
  return (
    <>
      <Topo titulo="Minha comissão" sub="O que você vendeu neste mês e quanto ganhou em cada venda." />
      <CartaoComissao s={s} grande />
      <section className="painel">
        <div className="painel-t">
          <h3>Minhas vendas do mês</h3>
        </div>
        {c.linhas.length ? (
          <ul className="comissao-lista">
            {[...c.linhas].reverse().map(({ v, total, ganho }) => (
              <li key={v.id}>
                <span>
                  <b>{v.itens.map((i) => i.nome).join(', ')}</b>
                  <small>
                    Venda nº {v.numero}, {v.data.slice(8, 10)}/{v.data.slice(5, 7)}. Vendeu R$ {brl(total)}.
                  </small>
                </span>
                <b className="num">+ R$ {brl(ganho, ganho % 1 > 0)}</b>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mut">Nenhuma venda sua neste mês ainda. A primeira aparece aqui na hora.</p>
        )}
      </section>
    </>
  )
}
