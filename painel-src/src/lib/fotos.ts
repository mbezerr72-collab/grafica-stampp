import type { Marca } from '../data/produtos'

export const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Fotos de trabalhos feitos, por produto (img/trabalhos/<produto>/01.jpg, 02.jpg…). */
const TRABALHOS: Record<string, number> = {
  'adesivos-etiquetas': 1,
  'adesivos-vitrine': 3,
  'arte-divulgacao': 1,
  'banners-lonas': 4,
  'blocos-receituarios': 2,
  'camisas-eventos': 6,
  'camisas-personalizadas': 1,
  'camisas-polo': 3,
  'canecas': 3,
  'canetas': 4,
  'cartao-fotografico': 1,
  'cartazes-folders': 1,
  'chaveiros': 5,
  'criacao-logotipo': 1,
  'fachadas-letreiros': 5,
  'kits-empresas': 1,
  'panfletos': 1,
  'placas-personalizadas': 3,
  'trofeus-medalhas': 9,
  'uniformes-esportivos': 12,
  'uniformes-profissionais': 5,
}

/** Todas as fotos de trabalhos feitos daquele produto (pode ser nenhuma). */
export const fotosTrabalho = (id: string) => Array.from({ length: TRABALHOS[id] ?? 0 }, (_, i) => `/img/trabalhos/${id}/${String(i + 1).padStart(2, '0')}.jpg`)

/** Foto do produto: um trabalho já feito pela gráfica; sem ela, a foto da categoria. */
export const fotoProduto = (p: { id: string; marca: Marca; foto?: string }) =>
  p.foto ?? fotosTrabalho(p.id)[0] ?? `/img/cards/cat-${p.marca}.jpg`
