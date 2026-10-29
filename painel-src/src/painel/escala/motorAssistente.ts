/**
 * ASSISTENTE DO PAINEL
 * ====================
 * Responde perguntas com os dados da gráfica, sem internet: regras simples que acham a intenção
 * (faturamento, lucro, pedidos, orçamentos, insumos, contas, metas…) e montam a resposta com os números.
 * Quando a pergunta pede para MUDAR algo (reajuste, promoção), a resposta traz uma proposta
 * e nada muda até o dono confirmar.
 *
 * Para ligar uma IA depois: crie outro `Motor` (ex.: que chama a sua API com a pergunta e um
 * resumo dos dados) e troque `motorAtual`. A tela do Assistente não muda.
 */
import { dados, hoje, pode, vitrine, arredPreco, type Sessao } from '../../data/store'
import { estoqueTotal } from '../../data/modelo'
import { NOME_MARCA, type Marca } from '../../data/produtos'
import { NOMES_STATUS_PEDIDO, totalPedido } from '../../data/negocio'
import { intervalo, somaDias, diasEntre, nomeMes, type TipoPeriodo } from './periodo'
import { noPeriodo, porProduto, porVendedor, resumo } from './numeros'
import { interpretarComando } from './comandos'
import { pedir } from './pedido'

export type Resposta = {
  texto: string
  itens?: string[]
  link?: { rotulo: string; rota: string }
  proposta?: { titulo: string; detalhes: string[]; botao: string; executar: () => string }
}
export type Motor = (pergunta: string, s: Sessao) => Promise<Resposta>

const brl = (v: number) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })
const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
const tem = (q: string, ...p: string[]) => p.some((x) => q.includes(x))

function periodoDa(q: string): { tipo: TipoPeriodo; nome: string } {
  if (tem(q, 'hoje')) return { tipo: 'hoje', nome: 'hoje' }
  if (tem(q, 'ontem')) return { tipo: 'hoje', nome: 'ontem' }
  if (tem(q, 'semana', '7 dias')) return { tipo: '7d', nome: 'nos últimos 7 dias' }
  if (tem(q, '30 dias')) return { tipo: '30d', nome: 'nos últimos 30 dias' }
  if (tem(q, ' ano', 'anual')) return { tipo: 'ano', nome: 'neste ano' }
  return { tipo: 'mes', nome: `em ${nomeMes(hoje())}` }
}

export const SUGESTOES = ['Novo pedido para Juliana', 'Quanto vendi hoje?', 'Quais pedidos estão atrasados?', 'Tem orçamento para responder?', 'O que falta de insumo?', 'Qual o lucro do mês?', 'Quais contas vencem esta semana?', 'Reajustar camisas em 5%']

export const motorLocal: Motor = async (pergunta, s) => {
  const q = ' ' + norm(pergunta) + ' '
  const h = hoje()
  const vendas = dados.ler('vendas')
  const despesas = dados.ler('despesas')
  const { produtos } = dados.ler('catalogo')
  const dono = pode(s, 'financeiro')

  // ── Comandos rápidos: a tela abre preenchida e a pessoa só confirma ──
  const cmd = interpretarComando(pergunta, s)
  if (cmd && !cmd.pedido.tela.startsWith('produtos'))
    return { texto: 'Monto a tela para você confirmar:', proposta: { titulo: cmd.titulo, detalhes: cmd.detalhes, botao: 'Abrir preenchido', executar: () => (pedir(cmd.pedido), 'Pronto, a tela está aberta e preenchida. É só conferir e confirmar.') } }

  // ── Pedidos de mudança: viram proposta ──
  const pct = q.match(/(-?\d+(?:[.,]\d+)?)\s*%/)
  if (pct && tem(q, 'reajust', 'aument', 'subir', 'baixar', 'diminu')) {
    if (!pode(s, 'configuracoes')) return { texto: 'Mudar preço é só pelo login do dono.' }
    let n = Number(pct[1].replace(',', '.'))
    if (tem(q, 'baixar', 'diminu') && n > 0) n = -n
    const alvo: Marca | 'todos' = tem(q, 'camis', 'uniform', 'abada') ? 'camisas' : tem(q, 'impress', 'xerox', 'cartao', 'panflet', 'adesiv') ? 'impressos' : tem(q, 'brinde', 'caneca', 'chaveiro', 'trofeu') ? 'brindes' : tem(q, 'banner', 'lona', 'placa', 'fachada') ? 'comunicacao' : tem(q, 'arte', 'logo', 'design') ? 'design' : 'todos'
    const lista = produtos.filter((p) => p.ativo && (alvo === 'todos' || p.marca === alvo))
    const ex = lista.slice(0, 3).map((p) => `${p.nome}: ${brl(p.variacoes[0].pix)} → ${brl(arredPreco(p.variacoes[0].pix * (1 + n / 100)))}`)
    return {
      texto: `Posso reajustar ${lista.length} ${alvo === 'todos' ? 'produtos' : `produtos de ${NOME_MARCA[alvo].toLowerCase()}`} em ${n > 0 ? '+' : ''}${n}%. Confira antes:`,
      proposta: {
        titulo: `Reajuste de ${n > 0 ? '+' : ''}${n}%`,
        detalhes: [...ex, lista.length > 3 ? `e mais ${lista.length - 3} produtos` : '', 'Os preços ficam arredondados (0,55; 12,50; 189,90). Dá para voltar atrás em “O que foi mudado”.'].filter(Boolean),
        botao: 'Confirmar reajuste',
        executar: () => {
          vitrine.reajustar(
            lista.map((p) => p.id),
            n,
          )
          return `Pronto: ${lista.length} produtos reajustados.`
        },
      },
    }
  }
  if (pct && tem(q, 'promoc', 'desconto')) {
    if (!pode(s, 'configuracoes')) return { texto: 'Promoção é só pelo login do dono.' }
    const n = Math.abs(Number(pct[1].replace(',', '.')))
    const p = [...produtos].sort((a, b) => b.nome.length - a.nome.length).find((x) => q.includes(norm(x.nome)))
    if (!p) return { texto: `Em qual produto? Escreva o nome, por exemplo: “promoção de ${n}% em canecas”.` }
    return {
      texto: `${p.nome} em promoção de ${n}% por 7 dias:`,
      proposta: {
        titulo: `Promoção: ${p.nome}`,
        detalhes: [...p.variacoes.slice(0, 4).map((v) => `${v.cor}: ${brl(v.pix)} → ${brl(arredPreco(v.pix * (1 - n / 100)))}`), `Acaba em ${somaDias(h, 7).split('-').reverse().join('/')} e o preço volta sozinho.`],
        botao: 'Começar promoção',
        executar: () => {
          vitrine.comecarPromo(p.id, n, somaDias(h, 7))
          return `${p.nome} em promoção. O selo “Promoção” já aparece no cartão.`
        },
      },
    }
  }

  // ── Orçamentos ──
  if (tem(q, 'orcamento', 'responder')) {
    const l = dados.ler('orcamentos').filter((o) => o.status === 'novo' || o.status === 'respondido')
    const novos = l.filter((o) => o.status === 'novo')
    return {
      texto: `${novos.length} ${novos.length === 1 ? 'orçamento para responder' : 'orçamentos para responder'} e ${l.length - novos.length} esperando o cliente.`,
      itens: l.slice(0, 8).map((o) => `${o.status === 'novo' ? 'Responder' : 'Esperando'}: ${o.numero}, ${o.nome}${o.valor ? ` (${brl(o.valor)})` : ''}`),
      link: { rotulo: 'Orçamentos', rota: 'orcamentos' },
    }
  }

  // ── Pedidos ──
  if (tem(q, 'pedido', 'producao', 'entregar', 'prazo') || (tem(q, 'atrasad', 'pronto') && !tem(q, 'conta', 'boleto', 'pagar'))) {
    const pedidos = dados.ler('pedidos')
    const prontos = pedidos.filter((o) => o.status === 'pronto')
    const atrasados = pedidos.filter((o) => o.status !== 'entregue' && o.status !== 'pronto' && o.prazo < h)
    const andamento = pedidos.filter((o) => o.status !== 'entregue')
    return {
      texto: `${andamento.length} pedidos em andamento: ${prontos.length} ${prontos.length === 1 ? 'pronto esperando o cliente' : 'prontos esperando o cliente'} e ${atrasados.length} ${atrasados.length === 1 ? 'atrasado' : 'atrasados'}.`,
      itens: [
        ...atrasados.map((o) => `Atrasado: pedido ${o.numero}, ${o.itens[0]?.nome.toLowerCase() ?? ''}, prazo ${o.prazo.split('-').reverse().slice(0, 2).join('/')} (${NOMES_STATUS_PEDIDO[o.status].toLowerCase()})`),
        ...prontos.map((o) => `Pronto: pedido ${o.numero}, falta receber ${brl(Math.max(0, totalPedido(o) - o.sinal))}`),
      ].slice(0, 10),
      link: { rotulo: atrasados.length ? 'Fila de produção' : 'Pedidos', rota: atrasados.length ? 'producao' : 'pedidos' },
    }
  }

  // ── Insumos e estoque ──
  if (tem(q, 'insumo', 'estoque', 'falta', 'acabando', 'comprar', ' tem ', 'quantos', 'sobrou')) {
    const insumos = dados.ler('insumos')
    const achado = [...insumos].sort((a, b) => b.nome.length - a.nome.length).find((x) => q.includes(norm(x.nome)))
    if (achado) return { texto: `${achado.nome}: ${achado.estoque.toLocaleString('pt-BR')} ${achado.unidade} (mínimo ${achado.minimo}).`, link: { rotulo: 'Insumos', rota: 'insumos' } }
    const p = [...produtos].sort((a, b) => b.nome.length - a.nome.length).find((x) => q.includes(norm(x.nome)))
    if (p && p.controlaEstoque) {
      const vs = p.variacoes.filter((v) => v.estoque > 0)
      return { texto: vs.length ? `${p.nome}: ${estoqueTotal(p)} no estoque.` : `${p.nome} está esgotado.`, itens: vs.map((v) => `${v.cor}: ${v.estoque} (${brl(v.pix)})`), link: { rotulo: 'Abrir o produto', rota: `produtos/${p.id}` } }
    }
    if (p) return { texto: `${p.nome} é feito sob encomenda: não tem estoque, o que conta são os insumos.`, link: { rotulo: 'Insumos', rota: 'insumos' } }
    const baixo = insumos.filter((x) => x.estoque < x.minimo)
    return {
      texto: baixo.length ? `${baixo.length} ${baixo.length === 1 ? 'insumo está abaixo' : 'insumos estão abaixo'} do mínimo:` : 'Todo o material estão acima do mínimo.',
      itens: baixo.slice(0, 8).map((x) => `${x.nome}: ${x.estoque.toLocaleString('pt-BR')} ${x.unidade} (mínimo ${x.minimo})`),
      link: { rotulo: 'Insumos', rota: 'insumos' },
    }
  }

  // ── Equipe ──
  if (tem(q, 'vendedor', 'vendeu mais', 'ranking', 'equipe', 'quem vendeu')) {
    const per = periodoDa(q)
    const iv = intervalo({ tipo: per.tipo })
    const r = porVendedor(noPeriodo(vendas, iv.de, iv.ate), dados.ler('equipe'))
    if (!r.length) return { texto: `Ninguém vendeu ${per.nome} ainda.` }
    return { texto: `${r[0].membro.nome.split(' ')[0]} vendeu mais ${per.nome}: ${brl(r[0].fat)} em ${r[0].vendas} vendas.`, itens: r.map((x, i) => `${i + 1}º ${x.membro.nome}: ${brl(x.fat)}${dono ? `, comissão ${brl(x.comissao)}` : ''}`), link: { rotulo: 'Equipe e comissões', rota: 'equipe' } }
  }

  // ── Produtos mais vendidos ──
  if (tem(q, 'mais vendido', 'mais vende', 'mais sai', 'campeao')) {
    const per = periodoDa(q)
    const iv = intervalo({ tipo: per.tipo })
    const l = porProduto(noPeriodo(vendas, iv.de, iv.ate)).sort((a, b) => b.fat - a.fat).slice(0, 5)
    return { texto: `O que mais vendeu ${per.nome}, em reais:`, itens: l.map((x) => `${x.nome}: ${x.un} un, ${brl(x.fat)}`) }
  }

  // ── Contas ──
  if (tem(q, 'conta', 'vence', 'boleto', 'pagar', 'atrasad')) {
    if (!pode(s, 'despesas')) return { texto: 'As contas da gráfica são só pelo login do dono.' }
    const l = dados.ler('contas').filter((c) => c.tipo === 'pagar' && !c.pagaEm && c.vencimento <= somaDias(h, 7)).sort((a, b) => a.vencimento.localeCompare(b.vencimento))
    if (!l.length) return { texto: 'Nada vencendo nos próximos 7 dias.' }
    return {
      texto: `${l.length} ${l.length === 1 ? 'conta' : 'contas'} até ${somaDias(h, 7).split('-').reverse().slice(0, 2).join('/')}, ${brl(l.reduce((t, c) => t + c.valor, 0))} no total:`,
      itens: l.map((c) => `${c.vencimento < h ? 'ATRASADA ' : ''}${c.vencimento.split('-').reverse().slice(0, 2).join('/')}: ${c.descricao}, ${brl(c.valor)}`),
      link: { rotulo: 'Contas e despesas', rota: 'despesas' },
    }
  }

  // ── Aniversários ──
  if (tem(q, 'aniversar')) {
    const semana = new Set(Array.from({ length: 7 }, (_, i) => somaDias(h, i).slice(5)))
    const l = dados.ler('clientes').filter((c) => c.aniversario && semana.has(c.aniversario))
    return { texto: l.length ? `${l.length} ${l.length === 1 ? 'cliente faz' : 'clientes fazem'} aniversário nos próximos 7 dias:` : 'Ninguém faz aniversário nos próximos 7 dias.', itens: l.map((c) => `${c.nome}, ${c.aniversario!.slice(3)}/${c.aniversario!.slice(0, 2)}`), link: { rotulo: 'Mandar a mensagem', rota: 'clientes' } }
  }

  // ── Meta ──
  if (tem(q, 'meta', 'projec', 'fechar o mes', 'vai fechar')) {
    if (!dono) return { texto: 'A meta da gráfica é só pelo login do dono.' }
    const mes = h.slice(0, 7)
    const m = dados.ler('metas').find((x) => x.mes === mes)
    const r = resumo(vendas, despesas, mes + '-01', h)
    const dias = new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0).getDate()
    const proj = r.faturamento / (Number(h.slice(8)) / dias)
    return { texto: m ? `Meta de ${nomeMes(h)}: ${brl(m.faturamento)}. Já são ${brl(r.faturamento)} (${Math.round((r.faturamento / m.faturamento) * 100)}%). No ritmo atual, o mês fecha em ${brl(proj)}, ${proj >= m.faturamento ? 'acima' : 'abaixo'} da meta.` : 'Ainda não tem meta para este mês.', link: { rotulo: 'Metas', rota: 'metas' } }
  }

  // ── Faturamento, vendas e lucro ──
  if (tem(q, 'vend', 'fatur', 'lucro', 'ganh', 'caixa', 'ticket', 'resultado')) {
    const per = periodoDa(q)
    const ontem = per.nome === 'ontem'
    const iv = ontem ? { de: somaDias(h, -1), ate: somaDias(h, -1) } : intervalo({ tipo: per.tipo })
    const r = resumo(vendas, despesas, iv.de, iv.ate)
    const itens = [`${r.vendas} vendas, ticket médio de ${brl(r.ticket)}`]
    if (dono) itens.push(`Lucro: ${brl(r.lucro)} (vendido − custo − contas da gráfica)`, `Saldo: ${brl(r.caixa)} (entrou − saiu, com compra de material)`)
    return { texto: `Vendido ${per.nome}: ${brl(r.faturamento)}.`, itens, link: { rotulo: 'Ver no Início', rota: 'inicio' } }
  }

  if (tem(q, 'oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'ajuda')) return { texto: `Oi! Pergunte sobre vendas, lucro, pedidos, orçamentos, insumos, contas, metas ou aniversários. Também posso preparar um reajuste ou uma promoção para você confirmar.`, itens: SUGESTOES }
  return { texto: 'Não entendi essa. Tente uma destas:', itens: SUGESTOES }
}

export const motorAtual: Motor = motorLocal
export const diasDesde = diasEntre
