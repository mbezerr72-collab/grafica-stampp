import { useEffect, useMemo, useRef, useState } from 'react'
import { useDados, type Sessao } from '../../data/store'
import { NOME_MARCA, PAGAMENTO, valorParcela, type Marca } from '../../data/produtos'
import type { PProduto } from '../../data/modelo'
import { fotosTrabalho } from '../../lib/fotos'
import { LOJA } from '../../lib/config'
import { Icone, Topo, avisar } from '../ui'
import { linkWhats } from '../escala/documentos'

// ───────────── Modelos, formatos e cores ─────────────

type ModeloId = 'oferta' | 'promocao' | 'portfolio' | 'tabela' | 'rapido' | 'data' | 'aviso'
const MODELOS: { id: ModeloId; nome: string; frase: string }[] = [
  { id: 'oferta', nome: 'Oferta', frase: 'Foto do trabalho e o preço em destaque' },
  { id: 'promocao', nome: 'Promoção', frase: 'Desconto em %, de/por e validade' },
  { id: 'portfolio', nome: 'Feito aqui', frase: 'Foto inteira de um trabalho entregue' },
  { id: 'tabela', nome: 'Tabela de preços', frase: 'Vários produtos de uma categoria' },
  { id: 'rapido', nome: 'Pronto rápido', frase: 'Prazo curto como chamada' },
  { id: 'data', nome: 'Data comemorativa', frase: 'Dia das Mães, Natal, formatura…' },
  { id: 'aviso', nome: 'Aviso', frase: 'Horário, feriado ou recado, sem foto' },
]
const FORMATOS = [
  { id: 'feed', nome: 'Publicação (4:5)', w: 1080, h: 1350 },
  { id: 'story', nome: 'Story e status (9:16)', w: 1080, h: 1920 },
  { id: 'quadrado', nome: 'Quadrado', w: 1080, h: 1080 },
] as const
type Formato = (typeof FORMATOS)[number]['id']
type Paleta = { bg: string; ink: string; mut: string; acc: string; accInk: string; nome: string }
const PALETAS: Record<'escuro' | 'claro' | 'laranja', Paleta> = {
  escuro: { nome: 'Preto', bg: '#121212', ink: '#FFFFFF', mut: '#A8A8A8', acc: '#FF6A00', accInk: '#111111' },
  claro: { nome: 'Branco', bg: '#F6F3EF', ink: '#141414', mut: '#5E5A55', acc: '#FF6A00', accInk: '#FFFFFF' },
  laranja: { nome: 'Laranja', bg: '#FF6A00', ink: '#111111', mut: '#4A2200', acc: '#111111', accInk: '#FFFFFF' },
}
type PaletaId = keyof typeof PALETAS
const OCASIOES = [
  { id: 'maes', nome: 'Dia das Mães', cor: '#E8457A', chamada: 'Presente que emociona', produto: 'canecas' },
  { id: 'pais', nome: 'Dia dos Pais', cor: '#2F6FDE', chamada: 'Presente com a cara dele', produto: 'canecas' },
  { id: 'criancas', nome: 'Dia das Crianças', cor: '#18A957', chamada: 'Lembrancinhas personalizadas', produto: 'chaveiros' },
  { id: 'natal', nome: 'Natal', cor: '#D62C2C', chamada: 'Brindes para clientes e equipe', produto: 'kits-empresas' },
  { id: 'aulas', nome: 'Volta às aulas', cor: '#F2B705', chamada: 'Etiquetas e adesivos com o nome', produto: 'adesivos-etiquetas' },
  { id: 'formatura', nome: 'Formatura', cor: '#C99A2E', chamada: 'Camisas e lembranças da turma', produto: 'camisas-eventos' },
] as const
type OcasiaoId = (typeof OCASIOES)[number]['id']

/** Fotos que servem de imagem quando o produto ainda não tem trabalho fotografado. */
const EXTRAS: Record<string, string[]> = {
  'cartao-visita': ['/img/cards/prod-cartoes-body.jpg'],
  'cartao-fotografico': ['/img/cards/prod-cartoes-body.jpg'],
  ecobags: ['/img/cards/prod-ecobags-body.jpg'],
  canecas: ['/img/cards/prod-canecas-body.jpg'],
  canetas: ['/img/cards/prod-canetas-body.jpg'],
  'camisas-personalizadas': ['/img/cards/prod-camisas-body.jpg'],
}
const fotosDo = (p?: PProduto) => (p ? [...fotosTrabalho(p.id), ...(EXTRAS[p.id] ?? [])] : [])

const FONTE = '"Plus Jakarta Sans", Arial, sans-serif'
const dinheiro = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })
const telefone = (n: string) => n.replace(/^55(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
const menorPreco = (p: PProduto) => Math.min(...p.variacoes.map((v) => v.pix))
const hojeMais = (dias: number) => {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

const cacheImg = new Map<string, Promise<HTMLImageElement | null>>()
function carregar(src: string) {
  if (!cacheImg.has(src))
    cacheImg.set(
      src,
      new Promise((ok) => {
        const i = new Image()
        i.onload = () => ok(i)
        i.onerror = () => ok(null)
        i.src = src
      }),
    )
  return cacheImg.get(src)!
}

// ───────────── Desenho ─────────────

type Dados = {
  modelo: ModeloId
  w: number
  h: number
  formato: Formato
  pal: Paleta
  p?: PProduto
  img: HTMLImageElement | null
  chamada: string
  titulo: string
  texto: string
  desconto: number
  validade: string
  ocasiao: (typeof OCASIOES)[number]
  tabela: PProduto[]
}

const fonte = (peso: number, px: number) => `${peso} ${px}px ${FONTE}`

/** Quebra o texto em linhas que cabem na largura (no máximo `max` linhas; a última ganha "…"). */
function linhas(ctx: CanvasRenderingContext2D, texto: string, larg: number, max: number) {
  const out: string[] = []
  for (const par of texto.split('\n')) {
    let l = ''
    for (const pal of par.split(' ')) {
      const t = l ? l + ' ' + pal : pal
      if (ctx.measureText(t).width > larg && l) {
        out.push(l)
        l = pal
      } else l = t
    }
    out.push(l)
  }
  if (out.length > max) {
    const corte = out.slice(0, max)
    corte[max - 1] = corte[max - 1].replace(/\s*\S*$/, '') + '…'
    return corte
  }
  return out
}
function escrever(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, larg: number, max: number, alt: number) {
  const ls = linhas(ctx, texto, larg, max)
  ls.forEach((l, i) => ctx.fillText(l, x, y + i * alt))
  return y + ls.length * alt
}
function retangulo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}
/** Foto preenchendo a área (corta o que sobra), com o foco um pouco acima do meio. */
function fotoCobrindo(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, r = 0, focoY = 0.4) {
  const esc = Math.max(w / img.width, h / img.height)
  const iw = w / esc
  const ih = h / esc
  const sx = (img.width - iw) / 2
  const sy = Math.max(0, Math.min(img.height - ih, (img.height - ih) * focoY))
  ctx.save()
  retangulo(ctx, x, y, w, h, r)
  ctx.clip()
  ctx.drawImage(img, sx, sy, iw, ih, x, y, w, h)
  ctx.restore()
}
function marca(ctx: CanvasRenderingContext2D, x: number, y: number, ink: string, acc: string) {
  ctx.textAlign = 'left'
  ctx.fillStyle = ink
  ctx.font = fonte(700, 22)
  ctx.letterSpacing = '9px'
  ctx.fillText('GRÁFICA', x + 2, y)
  ctx.letterSpacing = '0px'
  ctx.font = fonte(800, 52)
  ctx.fillText('ESTAMP', x, y + 50)
  const w = ctx.measureText('ESTAMP').width
  ctx.fillStyle = acc
  ctx.beginPath()
  ctx.moveTo(x + w + 10, y + 50)
  ctx.lineTo(x + w + 34, y + 50)
  ctx.lineTo(x + w + 22, y + 28)
  ctx.closePath()
  ctx.fill()
}
function pilula(ctx: CanvasRenderingContext2D, texto: string, xDir: number, y: number, bg: string, ink: string, px = 28) {
  ctx.font = fonte(800, px)
  const w = ctx.measureText(texto).width + px * 1.4
  const h = px * 1.9
  ctx.fillStyle = bg
  retangulo(ctx, xDir - w, y, w, h, h / 2)
  ctx.fill()
  ctx.fillStyle = ink
  ctx.textAlign = 'center'
  ctx.fillText(texto, xDir - w / 2, y + h * 0.66)
  ctx.textAlign = 'left'
  return w
}
function rodape(ctx: CanvasRenderingContext2D, d: Dados, cor: string) {
  ctx.fillStyle = cor
  ctx.font = fonte(600, 28)
  ctx.textAlign = 'left'
  ctx.fillText(`WhatsApp ${telefone(LOJA.whatsapp)}`, 72, d.h - 64)
  ctx.textAlign = 'right'
  ctx.fillText(`@${LOJA.instagram}`, d.w - 72, d.h - 64)
  ctx.textAlign = 'left'
}
/** Etiqueta de preço: "a partir de" + valor grande + unidade. Devolve onde ela termina. */
function etiqueta(ctx: CanvasRenderingContext2D, d: Dados, valor: number, y: number, bg: string, ink: string) {
  const M = 72
  const unidade = d.p ? `/${d.p.unidade}` : ''
  ctx.font = fonte(800, 88)
  const wv = ctx.measureText(`R$ ${dinheiro(valor)}`).width
  ctx.font = fonte(700, 32)
  const wu = ctx.measureText(unidade).width
  const w = Math.max(wv + wu + 90, 340)
  const h = 170
  ctx.fillStyle = bg
  retangulo(ctx, M, y, w, h, 26)
  ctx.fill()
  ctx.fillStyle = ink
  ctx.font = fonte(700, 28)
  ctx.fillText('a partir de', M + 34, y + 46)
  ctx.font = fonte(800, 88)
  ctx.fillText(`R$ ${dinheiro(valor)}`, M + 30, y + 132)
  ctx.font = fonte(700, 32)
  ctx.fillText(unidade, M + 40 + wv, y + 132)
  return y + h
}

function desenhar(ctx: CanvasRenderingContext2D, d: Dados) {
  const { w: W, h: H, pal } = d
  const M = 72
  const story = d.formato === 'story'
  const quad = d.formato === 'quadrado'
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.letterSpacing = '0px'
  const fundo = d.modelo === 'data' ? '#FFFFFF' : pal.bg
  ctx.fillStyle = fundo
  ctx.fillRect(0, 0, W, H)
  const preco = d.p ? menorPreco(d.p) : 0

  if (d.modelo === 'portfolio') {
    if (d.img) fotoCobrindo(ctx, d.img, 0, 0, W, H, 0, 0.35)
    const topo = ctx.createLinearGradient(0, 0, 0, 260)
    topo.addColorStop(0, 'rgba(0,0,0,.55)')
    topo.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = topo
    ctx.fillRect(0, 0, W, 260)
    const base = ctx.createLinearGradient(0, H * 0.45, 0, H)
    base.addColorStop(0, 'rgba(0,0,0,0)')
    base.addColorStop(1, 'rgba(0,0,0,.88)')
    ctx.fillStyle = base
    ctx.fillRect(0, H * 0.45, W, H * 0.55)
    marca(ctx, M, M + 10, '#FFFFFF', '#FF6A00')
    pilula(ctx, (d.chamada || 'Feito na Estamp').toUpperCase(), W - M, M - 4, '#FF6A00', '#111111', 26)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = fonte(800, quad ? 66 : 76)
    let y = H - (story ? 420 : quad ? 290 : 330)
    y = escrever(ctx, d.titulo, M, y, W - 2 * M, 2, quad ? 74 : 86)
    ctx.font = fonte(500, 34)
    ctx.fillStyle = 'rgba(255,255,255,.85)'
    escrever(ctx, d.texto, M, y + 6, W - 2 * M, 2, 44)
    rodape(ctx, d, 'rgba(255,255,255,.8)')
    return
  }

  if (d.modelo === 'aviso') {
    marca(ctx, M, M + 10, pal.ink, pal.acc)
    ctx.fillStyle = pal.acc
    retangulo(ctx, M, H * 0.3 - 40, 120, 14, 7)
    ctx.fill()
    ctx.fillStyle = pal.mut
    ctx.font = fonte(800, 32)
    ctx.letterSpacing = '4px'
    ctx.fillText((d.chamada || 'Aviso').toUpperCase(), M, H * 0.3 + 30)
    ctx.letterSpacing = '0px'
    ctx.fillStyle = pal.ink
    ctx.font = fonte(800, quad ? 80 : 96)
    let y = escrever(ctx, d.titulo, M, H * 0.3 + 140, W - 2 * M, 3, quad ? 90 : 106)
    ctx.font = fonte(500, 40)
    ctx.fillStyle = pal.mut
    y = escrever(ctx, d.texto, M, y + 30, W - 2 * M, story ? 8 : 4, 54)
    rodape(ctx, d, pal.mut)
    return
  }

  if (d.modelo === 'tabela') {
    marca(ctx, M, M + 10, pal.ink, pal.acc)
    if (d.chamada) pilula(ctx, d.chamada.toUpperCase(), W - M, M - 4, pal.acc, pal.accInk, 24)
    ctx.fillStyle = pal.ink
    ctx.font = fonte(800, 72)
    let y = escrever(ctx, d.titulo, M, M + 210, W - 2 * M, 2, 80)
    y += 30
    const alt = story ? 116 : 104
    // Quantas linhas cabem antes da observação e do rodapé.
    const max = Math.max(1, Math.floor((H - 230 - y) / alt))
    for (const x of d.tabela.slice(0, max)) {
      const v = x.variacoes.reduce((a, b) => (b.pix < a.pix ? b : a))
      ctx.fillStyle = pal.ink
      ctx.font = fonte(700, 38)
      ctx.fillText(linhas(ctx, x.nome, W - 2 * M - 300, 1)[0], M, y + 44)
      ctx.fillStyle = pal.mut
      ctx.font = fonte(500, 28)
      ctx.fillText(`${v.cor}`.slice(0, 40), M, y + 82)
      ctx.fillStyle = pal.acc
      ctx.font = fonte(800, 46)
      ctx.textAlign = 'right'
      ctx.fillText(`R$ ${dinheiro(v.pix)}`, W - M, y + 58)
      ctx.textAlign = 'left'
      ctx.fillStyle = pal.mut
      ctx.globalAlpha = 0.25
      ctx.fillRect(M, y + alt - 4, W - 2 * M, 2)
      ctx.globalAlpha = 1
      y += alt
    }
    ctx.fillStyle = pal.mut
    ctx.font = fonte(500, 28)
    escrever(ctx, d.texto, M, y + 46, W - 2 * M, 2, 38)
    rodape(ctx, d, pal.mut)
    return
  }

  // Modelos com foto em cima e texto embaixo: oferta, promoção, pronto rápido, data comemorativa.
  const destaque = d.modelo === 'data' ? d.ocasiao.cor : pal.acc
  const ink = d.modelo === 'data' ? '#161616' : pal.ink
  const mut = d.modelo === 'data' ? '#5E5A55' : pal.mut
  if (d.modelo === 'data') {
    // Faixa colorida da data e bolinhas de festa.
    ctx.fillStyle = d.ocasiao.cor
    ctx.fillRect(0, 0, W, story ? 560 : quad ? 330 : 420)
    for (let i = 0; i < 18; i++) {
      ctx.globalAlpha = 0.18
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(((i * 197) % W) + 20, ((i * 113) % (story ? 520 : 380)) + 20, 10 + (i % 4) * 8, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    marca(ctx, M, M + 10, '#FFFFFF', '#111111')
    ctx.fillStyle = '#FFFFFF'
    ctx.font = fonte(800, quad ? 84 : 100)
    ctx.fillText(d.ocasiao.nome, M, (story ? 360 : quad ? 250 : 300))
  } else {
    marca(ctx, M, M + 10, pal.ink, pal.acc)
    if (d.chamada) pilula(ctx, d.chamada.toUpperCase(), W - M, M - 4, pal.acc, pal.accInk, 24)
  }

  let top = d.modelo === 'data' ? (story ? 440 : quad ? 290 : 350) : M + 120
  if (d.modelo === 'rapido') {
    ctx.fillStyle = pal.ink
    ctx.font = fonte(800, quad ? 76 : 92)
    top = escrever(ctx, d.chamada ? d.titulo : d.titulo, M, top + 70, W - 2 * M, 2, quad ? 84 : 100) - 30
  }
  // A foto fica com o que sobra depois de reservar o título, o preço e o rodapé (nada encosta no rodapé).
  const RESERVA: Partial<Record<ModeloId, [number, number]>> = { oferta: [560, 450], promocao: [570, 500], rapido: [560, 450], data: [560, 450] }
  const [rFeed, rQuad] = RESERVA[d.modelo] ?? [560, 450]
  const reserva = quad ? rQuad : rFeed + (story ? 120 : 0)
  const fotoH = Math.min(story ? H * 0.42 : H * 0.44, H - top - reserva)
  const fotoX = d.modelo === 'data' ? M + 40 : M
  const fotoW = W - 2 * fotoX
  if (d.img) fotoCobrindo(ctx, d.img, fotoX, top, fotoW, fotoH, 34)
  else {
    ctx.fillStyle = mut
    ctx.globalAlpha = 0.15
    retangulo(ctx, fotoX, top, fotoW, fotoH, 34)
    ctx.fill()
    ctx.globalAlpha = 1
  }
  if (d.modelo === 'data') {
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 12
    retangulo(ctx, fotoX, top, fotoW, fotoH, 34)
    ctx.stroke()
  }

  if (d.modelo === 'promocao') {
    // Selo redondo do desconto, por cima do canto da foto.
    const r = quad ? 110 : 130
    const cx = W - M - r + 30
    const cy = top + r - 20
    ctx.fillStyle = pal.acc
    ctx.beginPath()
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2
      const rr = i % 2 ? r : r * 0.9
      ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)
    }
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = pal.accInk
    ctx.textAlign = 'center'
    ctx.font = fonte(800, quad ? 70 : 82)
    ctx.fillText(`-${d.desconto}%`, cx, cy + 26)
    ctx.textAlign = 'left'
  }

  let y = top + fotoH + (quad ? 74 : 92)
  ctx.fillStyle = ink
  if (d.modelo === 'data') {
    ctx.font = fonte(800, quad ? 54 : 64)
    y = escrever(ctx, d.titulo, M, y, W - 2 * M, 2, quad ? 62 : 72)
  } else if (d.modelo !== 'rapido') {
    ctx.font = fonte(800, quad ? 60 : 72)
    y = escrever(ctx, d.titulo, M, y, W - 2 * M, 2, quad ? 66 : 80)
  }
  if (d.texto && !quad) {
    ctx.fillStyle = mut
    ctx.font = fonte(500, 32)
    y = escrever(ctx, d.texto, M, y + 4, W - 2 * M, story ? 3 : 1, 42)
  }

  y += quad ? 14 : 34
  if (d.modelo === 'promocao') {
    const por = Math.round(preco * (1 - d.desconto / 100) * 100) / 100
    ctx.fillStyle = mut
    ctx.font = fonte(600, 36)
    const de = `de R$ ${dinheiro(preco)}`
    ctx.fillText(de, M, y + 36)
    const wde = ctx.measureText(de).width
    ctx.fillRect(M, y + 24, wde, 4)
    ctx.fillStyle = pal.acc
    ctx.font = fonte(800, quad ? 92 : 108)
    ctx.fillText(`R$ ${dinheiro(por)}`, M, y + (quad ? 128 : 146))
    if (d.validade) {
      ctx.fillStyle = mut
      ctx.font = fonte(600, 30)
      ctx.fillText(`Válido até ${d.validade.split('-').reverse().slice(0, 2).join('/')}`, M, y + (quad ? 176 : 202))
    }
  } else if (d.modelo === 'rapido') {
    const dias = d.p?.prazoDias ?? 1
    ctx.fillStyle = ink
    ctx.font = fonte(800, 48)
    ctx.fillText(linhas(ctx, d.p?.nome ?? '', W - 2 * M, 1)[0], M, y + 46)
    ctx.fillStyle = mut
    ctx.font = fonte(600, 32)
    ctx.fillText(`a partir de R$ ${dinheiro(preco)}`, M, y + 92)
    ctx.font = fonte(800, 34)
    const selo = dias ? `PRONTO EM ${dias} ${dias === 1 ? 'DIA ÚTIL' : 'DIAS ÚTEIS'}` : 'PRONTO NA HORA'
    pilula(ctx, selo, M + ctx.measureText(selo).width + 34 * 1.4, y + 120, pal.acc, pal.accInk, 34)
  } else if (preco) {
    const fim = etiqueta(ctx, d, preco, y, destaque, d.modelo === 'data' ? '#FFFFFF' : pal.accInk)
    if (preco >= 100 && !quad) {
      ctx.fillStyle = mut
      ctx.font = fonte(600, 30)
      ctx.fillText(`ou ${PAGAMENTO.semJurosAte}x de R$ ${dinheiro(valorParcela(preco, PAGAMENTO.semJurosAte))} sem juros`, M, fim + 52)
    }
  }
  rodape(ctx, d, mut)
}

// ───────────── Tela ─────────────

/** Criar anúncio: vários modelos de arte com os produtos e as fotos dos trabalhos da gráfica. */
export default function Anuncios(_: { s: Sessao }) {
  const { produtos } = useDados('catalogo')
  const ativos = produtos.filter((p) => p.ativo)
  const comFoto = ativos.filter((p) => fotosDo(p).length)
  const [modelo, setModelo] = useState<ModeloId>('oferta')
  const [pid, setPid] = useState(comFoto.find((p) => p.id === 'uniformes-esportivos')?.id ?? comFoto[0]?.id ?? ativos[0]?.id ?? '')
  const p = produtos.find((x) => x.id === pid)
  const fotos = fotosDo(p)
  const [fotoI, setFotoI] = useState(0)
  const [minha, setMinha] = useState<string>()
  const [formato, setFormato] = useState<Formato>('feed')
  const [paleta, setPaleta] = useState<PaletaId>('escuro')
  const [ocasiaoId, setOcasiaoId] = useState<OcasiaoId>('maes')
  const [categoria, setCategoria] = useState<Marca>('impressos')
  const [desconto, setDesconto] = useState(15)
  const [validade, setValidade] = useState(hojeMais(7))
  // Textos: vazio = o sugerido pelo modelo (aparece no campo como exemplo).
  const [chamadaD, setChamada] = useState<string | null>(null)
  const [tituloD, setTitulo] = useState<string | null>(null)
  const [textoD, setTexto] = useState<string | null>(null)
  const ocasiao = OCASIOES.find((o) => o.id === ocasiaoId)!
  const f = FORMATOS.find((x) => x.id === formato)!
  const tabela = ativos.filter((x) => x.marca === categoria)

  const sugestaoDe = (m: ModeloId) => {
    const nome = p?.nome ?? ''
    switch (m) {
      case 'oferta':
        return { chamada: 'Faça o seu', titulo: nome, texto: p?.descricao ?? '' }
      case 'promocao':
        return { chamada: 'Promoção', titulo: nome, texto: 'Só esta semana. Chama no WhatsApp e garanta o seu.' }
      case 'portfolio':
        return { chamada: 'Feito na Estamp', titulo: nome, texto: 'Quer um igual? Manda sua ideia no WhatsApp.' }
      case 'tabela':
        return { chamada: 'Preços', titulo: `Tabela de ${NOME_MARCA[categoria].toLowerCase()}`, texto: 'Preços a partir de. Para quantidades maiores, peça um orçamento.' }
      case 'rapido':
        return { chamada: 'Rapidinho', titulo: 'Precisa pra ontem?', texto: p?.descricao ?? '' }
      case 'data':
        return { chamada: ocasiao.chamada, titulo: ocasiao.chamada, texto: nome ? `${nome}: encomende com antecedência.` : '' }
      case 'aviso':
        return { chamada: 'Aviso', titulo: 'Horário especial no feriado', texto: 'Na sexta-feira abrimos das 7h30 às 11h30. Na segunda voltamos ao horário normal, das 7h30 às 17h30.' }
    }
  }
  const sugerido = sugestaoDe(modelo)
  const chamada = chamadaD ?? sugerido.chamada
  const titulo = tituloD || sugerido.titulo
  const texto = textoD ?? sugerido.texto

  // Trocou o modelo: os textos voltam para os sugeridos (o que foi digitado era de outro modelo).
  const trocarModelo = (m: ModeloId) => {
    setModelo(m)
    setChamada(null)
    setTitulo(null)
    setTexto(null)
    if (m === 'data') {
      const o = OCASIOES.find((x) => x.id === ocasiaoId)!
      if (produtos.some((x) => x.id === o.produto)) setPid(o.produto)
    }
  }
  const imgSrc = minha ?? fotos[fotoI] ?? fotos[0]
  const semFoto = modelo === 'tabela' || modelo === 'aviso'

  const dados = (img: HTMLImageElement | null, m: ModeloId): Dados => ({
    modelo: m,
    w: f.w,
    h: f.h,
    formato,
    pal: PALETAS[paleta],
    p,
    img,
    // O modelo escolhido usa os textos da tela; as outras prévias, os textos sugeridos de cada uma.
    chamada: m === modelo ? chamada : sugestaoDe(m).chamada,
    titulo: m === modelo ? titulo : sugestaoDe(m).titulo,
    texto: m === modelo ? texto : sugestaoDe(m).texto,
    desconto,
    validade,
    ocasiao,
    tabela,
  })

  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let vivo = true
    ;(async () => {
      await Promise.all([document.fonts.load(`800 80px ${FONTE}`), document.fonts.load(`500 30px ${FONTE}`), document.fonts.load(`700 30px ${FONTE}`)]).catch(() => null)
      const img = imgSrc && !semFoto ? await carregar(imgSrc) : null
      const c = ref.current
      if (!vivo || !c) return
      c.width = f.w
      c.height = f.h
      desenhar(c.getContext('2d')!, dados(img, modelo))
    })()
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelo, p, imgSrc, f, formato, paleta, chamada, titulo, texto, desconto, validade, ocasiao, categoria, semFoto])

  const legenda = useMemo(() => {
    const preco = p ? menorPreco(p) : 0
    const fim = ['', `📍 ${LOJA.endereco[0]}, ${LOJA.endereco[2]?.split(',')[0] ?? ''}`, `📲 Peça pelo WhatsApp: ${telefone(LOJA.whatsapp)}`, '', '#graficaestamp #cruzeirodosul #acre #personalizados']
    switch (modelo) {
      case 'tabela':
        return [`📋 ${titulo}`, '', ...tabela.slice(0, 10).map((x) => `• ${x.nome}: a partir de R$ ${dinheiro(menorPreco(x))}`), '', texto, ...fim].join('\n')
      case 'aviso':
        return [`📢 ${titulo}`, '', texto, ...fim].join('\n')
      case 'promocao': {
        const por = Math.round(preco * (1 - desconto / 100) * 100) / 100
        return [`🔥 ${chamada}: ${titulo} com ${desconto}% de desconto!`, '', `De R$ ${dinheiro(preco)} por R$ ${dinheiro(por)} (${p?.unidade ?? 'un'}).`, `⏰ Válido até ${validade.split('-').reverse().join('/')}.`, texto, ...fim].join('\n')
      }
      case 'portfolio':
        return [`✨ ${chamada}: ${titulo}`, '', texto, ...fim].join('\n')
      case 'rapido':
        return [`⚡ ${titulo}`, '', `${p?.nome ?? ''} pronto em ${p?.prazoDias ? `${p.prazoDias} ${p.prazoDias === 1 ? 'dia útil' : 'dias úteis'}` : 'na hora'}, a partir de R$ ${dinheiro(preco)}.`, texto, ...fim].join('\n')
      case 'data':
        return [`🎉 ${ocasiao.nome}: ${titulo}`, '', texto, preco ? `A partir de R$ ${dinheiro(preco)} (${p?.unidade ?? 'un'}).` : '', ...fim].join('\n')
      default:
        return [`${chamada ? chamada + ': ' : ''}${titulo} ✨`, '', texto, `💰 A partir de R$ ${dinheiro(preco)} (${p?.unidade ?? 'un'})`, preco >= 100 ? `💳 ou ${PAGAMENTO.semJurosAte}x sem juros no cartão` : '', ...fim].filter((x, i) => x || i > 3).join('\n')
    }
  }, [modelo, p, titulo, texto, chamada, desconto, validade, ocasiao, tabela])

  const baixar = () => {
    ref.current?.toBlob((b) => {
      if (!b) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(b)
      a.download = `anuncio-${modelo}-${semFoto ? categoria : pid}-${formato}.png`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 2000)
      avisar('Imagem baixada. É só postar.')
    }, 'image/png')
  }
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(legenda)
      avisar('Legenda copiada.')
    } catch {
      avisar('Não deu para copiar. Selecione o texto e copie.')
    }
  }
  const usarMinha = (arq?: File) => {
    if (!arq) return
    if (minha) URL.revokeObjectURL(minha)
    setMinha(URL.createObjectURL(arq))
  }

  return (
    <>
      <Topo titulo="Criar anúncio" sub="Escolha o modelo, o produto e a foto. A arte sai pronta para o Instagram e o status do WhatsApp, com a legenda." />
      <section className="painel anuncio-modelos" aria-label="Modelos">
        <div className="painel-t">
          <h3>Modelo</h3>
          <span className="mut">{MODELOS.length} modelos</span>
        </div>
        <div className="anuncio-mini-lista" role="radiogroup" aria-label="Modelo do anúncio">
          {MODELOS.map((m) => (
            <Miniatura key={m.id} m={m} ativo={modelo === m.id} escolher={() => trocarModelo(m.id)} dados={(img) => dados(img, m.id)} src={m.id === 'tabela' || m.id === 'aviso' ? undefined : imgSrc} chave={`${m.id}|${pid}|${imgSrc}|${paleta}|${formato}|${ocasiaoId}|${categoria}|${desconto}`} />
          ))}
        </div>
      </section>
      <div className="anuncio">
        <section className="painel anuncio-ctrl">
          {modelo === 'data' && (
            <div className="esc-grupo">
              <span>Data</span>
              <div className="fichas">
                {OCASIOES.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className="ficha"
                    aria-pressed={ocasiaoId === o.id}
                    onClick={() => {
                      setOcasiaoId(o.id)
                      setChamada(null)
                      setTitulo(null)
                      setTexto(null)
                      if (produtos.some((x) => x.id === o.produto)) {
                        setPid(o.produto)
                        setFotoI(0)
                        setMinha(undefined)
                      }
                    }}
                  >
                    <i className="bolinha" style={{ background: o.cor }} />
                    {o.nome}
                  </button>
                ))}
              </div>
            </div>
          )}
          {modelo === 'tabela' ? (
            <div className="esc-grupo">
              <span>Categoria</span>
              <div className="fichas">
                {(Object.entries(NOME_MARCA) as [Marca, string][]).map(([id, nome]) => (
                  <button key={id} type="button" className="ficha" aria-pressed={categoria === id} onClick={() => (setCategoria(id), setTitulo(null))}>
                    {nome}
                  </button>
                ))}
              </div>
            </div>
          ) : modelo !== 'aviso' ? (
            <>
              <label className="campo">
                Produto
                <select
                  value={pid}
                  onChange={(e) => {
                    setPid(e.target.value)
                    setFotoI(0)
                    setMinha(undefined)
                    setTitulo(null)
                    setTexto(null)
                  }}
                >
                  {ativos.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.nome}
                      {fotosDo(x).length ? '' : ' (sem foto)'}
                    </option>
                  ))}
                </select>
              </label>
              <div className="esc-grupo">
                <span>Foto</span>
                <div className="anuncio-fotos">
                  {fotos.map((src, i) => (
                    <button key={src} type="button" className="anuncio-foto" aria-pressed={!minha && fotoI === i} aria-label={`Foto ${i + 1}`} onClick={() => (setFotoI(i), setMinha(undefined))}>
                      <img src={src} alt="" loading="lazy" />
                    </button>
                  ))}
                  {minha && (
                    <button type="button" className="anuncio-foto" aria-pressed="true" aria-label="Sua foto">
                      <img src={minha} alt="" />
                    </button>
                  )}
                  <label className="anuncio-foto anuncio-foto--nova">
                    <Icone nome="foto" tamanho={20} />
                    <small>Sua foto</small>
                    <input type="file" accept="image/*" hidden onChange={(e) => (usarMinha(e.target.files?.[0]), (e.target.value = ''))} />
                  </label>
                </div>
                {!fotos.length && !minha && <p className="pag-falta ate">Este produto ainda não tem foto de trabalho. Toque em “Sua foto” e escolha uma do celular.</p>}
              </div>
            </>
          ) : null}
          {modelo === 'promocao' && (
            <div className="form-g form-g--3">
              <label className="campo">
                Desconto (%)
                <input type="number" min={5} max={70} step={5} value={desconto} onChange={(e) => setDesconto(Math.max(1, Math.min(90, Number(e.target.value) || 0)))} />
              </label>
              <label className="campo">
                Válido até
                <input type="date" value={validade} onChange={(e) => setValidade(e.target.value)} />
              </label>
            </div>
          )}
          <div className="esc-grupo">
            <span>Formato</span>
            <div className="fichas">
              {FORMATOS.map((x) => (
                <button key={x.id} type="button" className="ficha" aria-pressed={formato === x.id} onClick={() => setFormato(x.id)}>
                  {x.nome}
                </button>
              ))}
            </div>
          </div>
          {modelo !== 'data' && modelo !== 'portfolio' && (
            <div className="esc-grupo">
              <span>Cores</span>
              <div className="fichas">
                {(Object.keys(PALETAS) as PaletaId[]).map((k) => (
                  <button key={k} type="button" className="ficha" aria-pressed={paleta === k} onClick={() => setPaleta(k)}>
                    <i className="bolinha" style={{ background: PALETAS[k].bg, boxShadow: 'inset 0 0 0 2px rgba(127,127,127,.4)' }} />
                    {PALETAS[k].nome}
                  </button>
                ))}
              </div>
            </div>
          )}
          {modelo !== 'data' && (
            <label className="campo">
              {modelo === 'aviso' ? 'Tipo de aviso (em cima)' : 'Chamada (selo)'}
              <input value={chamada} maxLength={26} onChange={(e) => setChamada(e.target.value)} />
            </label>
          )}
          <label className="campo">
            Título
            <input value={tituloD ?? ''} placeholder={sugerido.titulo} maxLength={modelo === 'aviso' ? 70 : 48} onChange={(e) => setTitulo(e.target.value)} />
          </label>
          <label className="campo">
            {modelo === 'aviso' ? 'Recado' : 'Texto de apoio'}
            <textarea rows={modelo === 'aviso' ? 4 : 2} value={texto} maxLength={modelo === 'aviso' ? 260 : 120} onChange={(e) => setTexto(e.target.value)} />
          </label>
          <label className="campo">
            Legenda
            <textarea rows={8} value={legenda} readOnly />
          </label>
          <div className="det-duas">
            <button type="button" className="btn btn-o" onClick={copiar}>
              Copiar legenda
            </button>
            <a className="btn btn-o" href={linkWhats('', legenda)} target="_blank" rel="noopener">
              <Icone nome="whats" tamanho={18} />
              WhatsApp
            </a>
          </div>
          <button type="button" className="btn btn-p btn-grande" onClick={baixar}>
            <Icone nome="foto" tamanho={18} />
            Baixar imagem ({f.w}×{f.h})
          </button>
        </section>
        <section className="painel anuncio-previa">
          <div className="painel-t">
            <h3>Como fica</h3>
            <span className="mut">
              {MODELOS.find((m) => m.id === modelo)!.nome} · {f.nome}
            </span>
          </div>
          <canvas ref={ref} className={'anuncio-canvas anuncio-canvas--' + formato} aria-label={`Anúncio: ${titulo}`} role="img" />
        </section>
      </div>
    </>
  )
}

/** Prévia pequena de cada modelo (com o produto e a foto escolhidos), para escolher olhando. */
function Miniatura({ m, ativo, escolher, dados, src, chave }: { m: (typeof MODELOS)[number]; ativo: boolean; escolher: () => void; dados: (img: HTMLImageElement | null) => Dados; src?: string; chave: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let vivo = true
    ;(async () => {
      await document.fonts.load(`800 80px ${FONTE}`).catch(() => null)
      const img = src ? await carregar(src) : null
      const c = ref.current
      if (!vivo || !c) return
      const d = dados(img)
      const esc = 220 / d.w
      c.width = 220
      c.height = Math.round(d.h * esc)
      const ctx = c.getContext('2d')!
      ctx.scale(esc, esc)
      desenhar(ctx, d)
    })()
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])
  return (
    <button type="button" role="radio" aria-checked={ativo} className="anuncio-mini" onClick={escolher}>
      <canvas ref={ref} aria-hidden="true" />
      <b>{m.nome}</b>
      <small>{m.frase}</small>
    </button>
  )
}
