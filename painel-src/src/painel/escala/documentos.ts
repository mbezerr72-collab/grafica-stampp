/**
 * Documentos da gráfica em PDF (recibo, ficha de produção, relatórios) e mensagens do WhatsApp.
 * O jsPDF só carrega na hora de gerar o arquivo: o painel continua leve.
 */
import { dados, type Cliente, type Orcamento, type Pedido, type Venda } from '../../data/store'
import { faturamentoVenda, NOMES_FORMA, NOMES_STATUS_PEDIDO, pecasPedido, totalPedido, totalVenda } from '../../data/negocio'
import { NOME_SETOR, type Setor } from '../../data/produtos'
import { LOJA } from '../../lib/config'
import { pixCopiaECola } from './automatico'

const brl = (v: number) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const dataBr = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`

/** Link do WhatsApp com a mensagem pronta (um por vez, sem API paga). */
export function linkWhats(telefone: string | undefined, texto: string) {
  const n = (telefone ?? '').replace(/\D/g, '')
  const numero = n ? (n.startsWith('55') ? n : '55' + n) : ''
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
}

export type Linha = { t: string; v?: string; forte?: boolean }
export type Bloco = { titulo?: string; linhas?: Linha[]; texto?: string; tabela?: { cab: string[]; linhas: string[][]; dir?: number[] } }

/** Monta um PDF A4 simples com o cabeçalho da gráfica e blocos de conteúdo, e baixa. */
export async function gerarPdf(nomeArquivo: string, titulo: string, sub: string, blocos: Bloco[], assinaturas?: string[]) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const L = 210
  const M = 16
  let y = 0
  // Faixa da loja.
  doc.setFillColor(14, 16, 19)
  doc.rect(0, 0, L, 26, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text(LOJA.nome || 'Gráfica Estamp', M, 13)
  const w = doc.getTextWidth(LOJA.nome || 'Gráfica Estamp')
  doc.setTextColor(245, 217, 10)
  doc.text('.', M + w, 13)
  doc.setTextColor(200, 200, 200)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text([LOJA.endereco.join(', '), `WhatsApp ${LOJA.whatsapp}`].filter(Boolean), M, 18.5)
  y = 38
  doc.setTextColor(20, 20, 20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(titulo, M, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(90, 90, 90)
  doc.text(sub, M, y)
  y += 8

  const quebra = (h: number) => {
    if (y + h > 280) {
      doc.addPage()
      y = 20
    }
  }
  for (const b of blocos) {
    quebra(14)
    if (b.titulo) {
      doc.setDrawColor(220, 220, 220)
      doc.line(M, y, L - M, y)
      y += 6
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(20, 20, 20)
      doc.text(b.titulo, M, y)
      y += 6
    }
    doc.setFontSize(9.5)
    for (const l of b.linhas ?? []) {
      quebra(6)
      doc.setFont('helvetica', l.forte ? 'bold' : 'normal')
      doc.setTextColor(40, 40, 40)
      const partes = doc.splitTextToSize(l.t, l.v ? 120 : L - 2 * M)
      doc.text(partes, M, y)
      if (l.v) doc.text(l.v, L - M, y, { align: 'right' })
      y += 5 * partes.length + 0.5
    }
    if (b.texto) {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      const partes = doc.splitTextToSize(b.texto, L - 2 * M)
      for (const p of partes) {
        quebra(5)
        doc.text(p, M, y)
        y += 4.6
      }
      y += 2
    }
    if (b.tabela) {
      const n = b.tabela.cab.length
      const larg = (L - 2 * M) / n
      const col = (i: number) => (b.tabela!.dir?.includes(i) ? M + larg * (i + 1) - 1 : M + larg * i)
      const al = (i: number) => (b.tabela!.dir?.includes(i) ? 'right' : 'left') as 'right' | 'left'
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(100, 100, 100)
      b.tabela.cab.forEach((c, i) => doc.text(c, col(i), y, { align: al(i) }))
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 30, 30)
      for (const linha of b.tabela.linhas) {
        quebra(6)
        linha.forEach((c, i) => doc.text(doc.splitTextToSize(c, larg - 2)[0], col(i), y, { align: al(i) }))
        y += 5.2
      }
      y += 2
    }
    y += 3
  }
  if (assinaturas?.length) {
    quebra(30)
    y = Math.max(y + 14, 250)
    const larg = (L - 2 * M - 10 * (assinaturas.length - 1)) / assinaturas.length
    assinaturas.forEach((a, i) => {
      const x = M + i * (larg + 10)
      doc.setDrawColor(120, 120, 120)
      doc.line(x, y, x + larg, y)
      doc.setFontSize(8.5)
      doc.setTextColor(80, 80, 80)
      doc.text(a, x + larg / 2, y + 4.5, { align: 'center' })
    })
  }
  doc.setFontSize(7.5)
  doc.setTextColor(150, 150, 150)
  doc.text('Documento gerado pelo sistema Escala Business. Demonstração.', M, 292)
  doc.save(nomeArquivo)
}

// ───────────── Venda ─────────────

const SITE = 'https://grafica-stampp.vercel.app'
const nomeLoja = () => LOJA.nome || 'Gráfica Estamp'

export function descreverItens(v: Venda) {
  return v.itens.map((i) => `${i.qtd > 1 ? i.qtd + '× ' : ''}${i.nome}${i.cor ? ' (' + i.cor + ')' : ''}`)
}

export function pagamentosTexto(v: Venda) {
  const l = v.pagamentos.map((p) => `${NOMES_FORMA[p.forma]}${p.parcelas && p.parcelas > 1 ? ` ${p.parcelas}x` : ''}: ${brl(p.valor)}`)
  if (v.troca) l.push(`Entrada paga antes: ${brl(v.troca)}`)
  return l
}

export const garantiaTexto = (v: Venda) => v.itens.map((i) => `${i.nome}: conferido pelo cliente na entrega`)

export async function reciboPdf(v: Venda, cliente: Cliente | undefined, vendedor: string) {
  await gerarPdf(
    `recibo-${v.numero}.pdf`,
    `Recibo da venda nº ${v.numero}`,
    `${dataBr(v.data)} às ${v.data.slice(11, 16)}. Atendente: ${vendedor}. Cliente: ${cliente ? `${cliente.nome}, ${cliente.telefone}` : 'sem cadastro'}.`,
    [
      {
        titulo: 'Itens',
        tabela: {
          cab: ['Produto', 'Qtd.', 'Valor'],
          dir: [1, 2],
          linhas: v.itens.map((i) => [`${i.nome}${i.cor ? ' (' + i.cor + ')' : ''}`, String(i.qtd), brl((i.preco - i.desconto) * i.qtd)]),
        },
      },
      {
        titulo: 'Pagamento',
        linhas: [...pagamentosTexto(v).map((t) => ({ t })), { t: 'Total', v: brl(faturamentoVenda(v)), forte: true }, { t: 'Pago agora', v: brl(totalVenda(v)) }],
      },
      {
        titulo: 'Conferência',
        texto: 'O cliente conferiu o material na entrega. Defeito de impressão ou de produção é refeito sem custo se avisado em até 7 dias, com este recibo. Erros de texto ou de arte aprovados pelo cliente não são cobertos.',
      },
    ],
    ['Cliente', nomeLoja()],
  )
}

/** Link do recibo em PDF. Na demonstração é de exemplo; na versão final o PDF fica guardado no servidor. */
export const linkRecibo = (v: Venda) => `${SITE}/recibo/${v.numero}-${v.id.slice(-4)}`

export function mensagemVenda(v: Venda, cliente: Cliente | undefined) {
  const nome = cliente?.nome.split(' ')[0]
  return [
    `Oi${nome ? ', ' + nome : ''}! Aqui é da ${nomeLoja()}. Obrigado pela preferência!`,
    '',
    `Venda nº ${v.numero}, ${dataBr(v.data)}:`,
    ...descreverItens(v).map((t) => `• ${t}`),
    `Pago: ${brl(totalVenda(v))}${v.troca ? ` (+ entrada de ${brl(v.troca)})` : ''}`,
    '',
    `Recibo para imprimir: ${linkRecibo(v)}`,
    '',
    'Qualquer coisa, é só chamar aqui.',
  ].join('\n')
}

// ───────────── Pedidos de produção ─────────────

/** Link para o cliente ver e aprovar a arte. Na demonstração é de exemplo (o botão "cliente aprovou" simula). */
export const linkAprovacao = (o: Pedido) => `${SITE}/arte/${o.numero}-${o.id.slice(-4)}`
const prazoBr = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`
const resumoItens = (o: Pedido) => o.itens.map((i) => `${i.qtd > 1 ? i.qtd + ' ' : ''}${i.nome.toLowerCase()}${i.opcao ? ` (${i.opcao})` : ''}`).join(', ')
const pixPedido = (o: Pedido, valor: number) => pixCopiaECola(valor, dados.ler('config').chavePix || 'pix@graficaestamp.demo', nomeLoja(), 'Cruzeiro do Sul', `PED${o.numero}`)
const sinalPct = () => dados.ler('config').sinalPct ?? 50
export const gradeTexto = (g?: Record<string, number>) =>
  g ? Object.entries(g).filter(([, n]) => n > 0).map(([t, n]) => `${t}: ${n}`).join(' · ') : ''

/** A mensagem pronta de cada etapa do pedido (vai pelo WhatsApp a cada mudança). */
export function mensagemPedido(o: Pedido, cliente: Cliente | undefined): string {
  const nome = cliente?.nome.split(' ')[0]
  const oi = `Oi${nome ? ', ' + nome : ''}! Aqui é da ${nomeLoja()}.`
  const total = totalPedido(o)
  const resto = Math.max(0, total - o.sinal)
  switch (o.status) {
    case 'novo':
      return `${oi}\nRecebemos seu pedido nº ${o.numero}: ${resumoItens(o)}.\nTotal: ${brl(total)}.\nAgora vamos preparar a arte e mandamos para você aprovar antes de produzir.`
    case 'arte':
      return `${oi}\nA arte do pedido nº ${o.numero} está sendo feita. Assim que ficar pronta, mandamos aqui para você aprovar.`
    case 'aprovacao':
      return [`${oi}`, `A arte do pedido nº ${o.numero} está pronta para você conferir:`, linkAprovacao(o), '', 'Confira nomes, números, cores e posição.', 'Se estiver tudo certo, responda APROVADO aqui.', o.sinal || !sinalPct() ? '' : `Para começar a produção pedimos ${brl(Math.round((total * sinalPct()) / 100))} de entrada (${sinalPct()}%). Pix copia e cola:\n${pixPedido(o, Math.round((total * sinalPct()) / 100))}`].filter(Boolean).join('\n')
    case 'producao':
      return `${oi}\nArte aprovada! O pedido nº ${o.numero} já está em produção. Previsão: ${prazoBr(o.prazo)}.`
    case 'pronto':
      return `${oi}\nSeu pedido nº ${o.numero} está pronto! (${resumoItens(o)})\n${resto > 0 ? `Falta pagar: ${brl(resto)}.\nPara já deixar pago, Pix copia e cola:\n${pixPedido(o, resto)}\n` : 'Já está tudo pago.\n'}Pode retirar na ${LOJA.endereco[0]}, de segunda a sexta das 7h30 às 17h30 e sábado até 11h30.`
    case 'entregue':
      return `${oi}\nObrigado pela confiança! O pedido nº ${o.numero} foi entregue.\nSe puder, mande uma foto usando: a gente adora postar os trabalhos. 😊`
  }
}

/** Ficha de produção do pedido (vai para a máquina): itens, grade, cores, imagens e prazo. */
export async function fichaProducaoPdf(o: Pedido, cliente: Cliente | undefined, responsavel: string) {
  const grade = gradeTexto(o.grade)
  await gerarPdf(
    `pedido-${o.numero}-producao.pdf`,
    `Ficha de produção, pedido nº ${o.numero}`,
    `Aberto em ${dataBr(o.criadoEm)}. Prazo: ${dataBr(o.prazo)}. Setor: ${NOME_SETOR[o.setor as Setor]}. Responsável: ${responsavel}. Etapa: ${NOMES_STATUS_PEDIDO[o.status]}.`,
    [
      { titulo: 'Cliente', linhas: [{ t: cliente ? `${cliente.nome}, ${cliente.telefone}` : '—' }] },
      { titulo: 'O que produzir', tabela: { cab: ['Produto', 'Opção', 'Qtd.'], dir: [2], linhas: o.itens.map((i) => [i.nome, i.opcao, String(i.qtd)]) } },
      ...(grade ? [{ titulo: 'Grade de tamanhos', linhas: [{ t: grade }, { t: 'Total de peças', v: String(pecasPedido(o)), forte: true }] }] : []),
      ...(o.cores.length ? [{ titulo: 'Cores', linhas: [{ t: o.cores.join(', ') }] }] : []),
      { titulo: 'Como o cliente quer', texto: o.descricao || '—' },
      ...(o.arquivos.length ? [{ titulo: 'Imagens do cliente', linhas: o.arquivos.map((a) => ({ t: a })) }] : []),
    ],
    ['Conferido por', 'Produção'],
  )
}

// ───────────── Orçamentos ─────────────

export function mensagemOrcamento(o: Orcamento, nomeProduto: string): string {
  const nome = o.nome.split(' ')[0]
  const linhas = [
    `Oi, ${nome}! Aqui é da ${nomeLoja()}. Recebemos seu pedido de orçamento nº ${o.numero} (${nomeProduto}).`,
    '',
  ]
  if (o.valor) {
    linhas.push(`Valor: ${brl(o.valor)}${o.qtd > 1 ? ` (${o.qtd} un., ${brl(o.valor / o.qtd)} cada)` : ''}.`)
    if (o.prazoDias) linhas.push(`Prazo: ${o.prazoDias} dias úteis depois da aprovação da arte.`)
    linhas.push('', `Para fechar, respondemos com a arte para você aprovar e pedimos ${sinalPct()}% de entrada para começar.`, 'Podemos seguir?')
  } else linhas.push('Já estamos vendo os detalhes e mandamos o valor em seguida.')
  return linhas.join('\n')
}
