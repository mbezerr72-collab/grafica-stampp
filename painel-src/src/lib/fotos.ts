import type { Marca } from '../data/produtos'

export const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Produtos que têm fotos de trabalhos feitos no site (img/trabalhos/<produto>/01.jpg). */
const COM_FOTO = new Set([
  'adesivos-etiquetas', 'adesivos-vitrine', 'arte-divulgacao', 'banners-lonas', 'blocos-receituarios', 'camisas-eventos', 'camisas-personalizadas',
  'camisas-polo', 'canecas', 'canetas', 'cartao-fotografico', 'cartazes-folders', 'chaveiros', 'criacao-logotipo', 'fachadas-letreiros', 'kits-empresas',
  'panfletos', 'placas-personalizadas', 'trofeus-medalhas', 'uniformes-esportivos', 'uniformes-profissionais',
])

/** Foto do produto: um trabalho já feito pela gráfica; sem ela, a foto da categoria. */
export const fotoProduto = (p: { id: string; marca: Marca; foto?: string }) =>
  p.foto ?? (COM_FOTO.has(p.id) ? `/img/trabalhos/${p.id}/01.jpg` : `/img/cards/cat-${p.marca}.jpg`)
