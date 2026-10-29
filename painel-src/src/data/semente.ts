/**
 * Dados de exemplo do painel (só para a demonstração). Sempre os mesmos números: o sorteio usa
 * uma semente fixa, então a apresentação mostra o mesmo painel em qualquer aparelho.
 */
import { DESTAQUES, LINHAS, PAGAMENTO, PRODUTOS, type ProdutoGrafica } from './produtos'
import { LOJA } from '../lib/config'
import type { Catalogo, PProduto, PVariacao } from './modelo'

/** Sorteio com semente (mulberry32): mesmo começo, mesma sequência. */
export function sorteio(semente: number) {
  let a = semente >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const hashTexto = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7)

const centavos = (v: number) => Math.round(v * 100) / 100

function produtoDaGrafica(p: ProdutoGrafica, agora: string): PProduto {
  const r = sorteio(hashTexto(p.id))
  const controla = p.estoque !== undefined && p.estoque < 9999
  const variacoes: PVariacao[] = p.opcoes.map(([nome, pix]) => ({
    cor: nome,
    gb: 0,
    pix,
    custo: centavos(pix * (p.custo + (r() - 0.5) * 0.06)),
    estoque: controla ? p.estoque! : 0,
  }))
  return {
    id: p.id,
    marca: p.marca,
    linha: p.linha,
    nome: p.nome,
    condicao: 'novo',
    descricao: p.descricao,
    specs: [],
    selos: p.selo ? [p.selo] : [],
    cores: p.opcoes.map(([nome]) => ({ nome, hex: '#ff6a00' })),
    gbs: [0],
    variacoes,
    ativo: true,
    quandoEsgota: 'avisar',
    lancamento: '2026-01',
    unidade: p.unidade,
    setor: p.setor,
    prazoDias: p.prazoDias,
    controlaEstoque: controla,
    atualizadoEm: agora,
  }
}

const FABRICA = {
  produtos: PRODUTOS.slice(),
  linhas: structuredClone(LINHAS),
  destaques: structuredClone(DESTAQUES),
  pagamento: { ...PAGAMENTO },
  loja: structuredClone(LOJA),
}

/** O catálogo da gráfica, com custo de exemplo. */
export function catalogoInicial(): Catalogo {
  const agora = new Date().toISOString()
  return {
    produtos: FABRICA.produtos.map((p) => produtoDaGrafica(p, agora)),
    linhas: structuredClone(FABRICA.linhas),
    destaques: structuredClone(FABRICA.destaques),
    pagamento: { ...FABRICA.pagamento },
    loja: structuredClone(FABRICA.loja),
  }
}
