/**
 * MODO AUTOMÁTICO
 * ===============
 * O que o sistema adivinha para o atendente não digitar: preço do cartão já arredondado, o produto
 * pelo código bipado, o pedido pelo QR da ficha, o cliente pelo telefone (com ou sem DDD), o que
 * mais sai junto no balcão e o QR do Pix.
 */
import type { Cliente, Venda } from '../../data/store'
import type { FormaPag } from '../../data/negocio'
import { PAGAMENTO, precoCartao, valorParcela } from '../../data/produtos'
import type { PProduto } from '../../data/modelo'

export const soDigitos = (s: string) => s.replace(/\D/g, '')
const semAcento = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// ───────────── Cliente pelo telefone ou CPF ─────────────

/** As formas de escrever o mesmo celular: com e sem 55, com e sem DDD, com e sem o 9. */
export function formasDoTelefone(tel: string): string[] {
  let d = soDigitos(tel)
  if (d.length >= 12 && d.startsWith('55')) d = d.slice(2)
  const l = new Set<string>([d])
  if (d.length >= 10) {
    const ddd = d.slice(0, 2)
    const num = d.slice(2)
    l.add(num)
    if (num.length === 9 && num.startsWith('9')) {
      l.add(num.slice(1))
      l.add(ddd + num.slice(1))
    }
  }
  return [...l]
}

/** O cliente combina com o que foi digitado? Nome (sem acento) ou só os dígitos do telefone/CPF. */
export function clienteCombina(c: Cliente, q: string) {
  const t = q.trim()
  if (!t) return false
  const dig = soDigitos(t)
  // Mais número que letra: busca só pelos dígitos.
  if (dig.length >= 4 && dig.length >= t.replace(/[\s()+.-]/g, '').length - 1) {
    const buscas = formasDoTelefone(dig)
    const tel = formasDoTelefone(c.telefone)
    if (tel.some((x) => buscas.some((b) => x.includes(b)))) return true
    return !!c.cpf && soDigitos(c.cpf).includes(dig)
  }
  return semAcento(c.nome).includes(semAcento(t))
}

/** O mesmo número já está cadastrado? (para o "Cliente pelo WhatsApp" não duplicar) */
export function clientePeloTelefone(clientes: Cliente[], tel: string) {
  const d = formasDoTelefone(tel)
  if (soDigitos(tel).length < 8) return undefined
  return clientes.find((c) => formasDoTelefone(c.telefone).some((x) => d.includes(x)))
}

/** (68) 99218-6867 */
export function formatarTelefone(tel: string) {
  let d = soDigitos(tel)
  if (d.length >= 12 && d.startsWith('55')) d = d.slice(2)
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  if (d.length === 9) return `(68) ${d.slice(0, 5)}-${d.slice(5)}`
  return tel
}

// ───────────── Preço do cartão sem centavos quebrados ─────────────

/**
 * Preço no cartão do PDV: o Pix ÷ (1 − desconto do Pix), arredondado para a dezena (aparelho)
 * ou para o real (acessório). R$ 6.790 no Pix → R$ 7.460 no cartão → 10x de R$ 746.
 */
/** Preço no cartão (a mesma conta do site, em src/data/produtos.ts). */
export const cartaoLoja = precoCartao

/** Parcelas no crédito: sem juros até o limite; depois, juros do mês com a parcela em real inteiro. */
export function parcelamento(pix: number, n: number) {
  const parcela = valorParcela(pix, n)
  const semJuros = n <= PAGAMENTO.semJurosAte || PAGAMENTO.jurosMes <= 0
  return { parcela, total: semJuros ? precoCartao(pix) : parcela * n, semJuros }
}

/** Quanto o cliente paga numa forma, partindo do valor no preço do Pix. */
export const valorNaForma = (pix: number, forma: FormaPag, parcelas = 1) => (forma === 'credito' ? parcelamento(pix, parcelas).total : pix)

// ───────────── Código de barras e QR da ficha ─────────────

/** Código de barras (EAN-13) de cada opção. Na demonstração ele é calculado; na versão final vem da etiqueta. */
export function eanDe(produtoId: string, cor: string, gb: number) {
  let h = 0
  for (const ch of `${produtoId}|${cor}|${gb}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const base = '789' + String(h % 1e9).padStart(9, '0')
  const soma = [...base].reduce((t, d, i) => t + Number(d) * (i % 2 ? 3 : 1), 0)
  return base + ((10 - (soma % 10)) % 10)
}

export type Lido = { tipo: 'produto'; p: PProduto; cor: string } | { tipo: 'pedido'; numero: number }

/** O que o código bipado é: o código de um produto ou o QR da ficha de produção de um pedido. */
export function interpretarCodigo(texto: string, produtos: PProduto[]): Lido | null {
  const t = texto.trim()
  const ped = t.match(/^PED[-: ]?(\d{3,6})$/i) ?? t.match(/[#/]pedidos\/(\d{3,6})/i)
  if (ped) return { tipo: 'pedido', numero: Number(ped[1]) }
  const d = soDigitos(t)
  if (d.length === 13) for (const p of produtos) for (const v of p.variacoes) if (eanDe(p.id, v.cor, v.gb) === d) return { tipo: 'produto', p, cor: v.cor }
  return null
}

// ───────────── O que mais sai junto ─────────────

/** O que mais saiu na mesma venda daquele produto (ex.: xerox com plastificação, cartão com bloco). */
export function saemJunto(vendas: Venda[], produtoId: string, produtos: PProduto[], fora: Set<string>, n = 3): PProduto[] {
  const conta = new Map<string, number>()
  for (const v of vendas) {
    if (!v.itens.some((i) => i.produtoId === produtoId)) continue
    for (const i of v.itens) if (i.produtoId !== produtoId) conta.set(i.produtoId, (conta.get(i.produtoId) ?? 0) + 1)
  }
  return [...conta.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => produtos.find((x) => x.id === id))
    .filter((x): x is PProduto => !!x && x.ativo && !fora.has(x.id))
    .slice(0, n)
}

// ───────────── Pix copia e cola (BR Code do Banco Central) ─────────────

const campo = (id: string, valor: string) => id + String(valor.length).padStart(2, '0') + valor
function crc16(s: string) {
  let c = 0xffff
  for (let i = 0; i < s.length; i++) {
    c ^= s.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) c = c & 0x8000 ? (c << 1) ^ 0x1021 : c << 1
  }
  return (c & 0xffff).toString(16).toUpperCase().padStart(4, '0')
}
/** O texto "copia e cola" do Pix com o valor da venda (o mesmo que vai no QR). */
export function pixCopiaECola(valor: number, chave: string, nome: string, cidade: string, txid: string) {
  const limpo = (s: string, n: number) => semAcento(s).replace(/[^a-z0-9 ]/gi, '').toUpperCase().slice(0, n)
  const conta = campo('00', 'br.gov.bcb.pix') + campo('01', chave)
  const corpo =
    campo('00', '01') +
    campo('26', conta) +
    campo('52', '0000') +
    campo('53', '986') +
    campo('54', valor.toFixed(2)) +
    campo('58', 'BR') +
    campo('59', limpo(nome, 25)) +
    campo('60', limpo(cidade, 15)) +
    campo('62', campo('05', limpo(txid, 25).replace(/ /g, '')))
  return corpo + '6304' + crc16(corpo + '6304')
}
