/** Exporta um relatório (colunas + linhas) em Excel ou PDF. As bibliotecas só carregam na hora. */
import { gerarPdf, type Bloco } from './documentos'

export type Coluna = { nome: string; tipo: 'texto' | 'dinheiro' | 'numero' | 'pct'; opcional?: boolean }
export type Celula = string | number
export type Relatorio = { titulo: string; sub: string; colunas: Coluna[]; linhas: Celula[][]; total?: Celula[]; antes?: Bloco[] }

export const formatar = (v: Celula, c: Coluna): string => {
  if (typeof v === 'string') return v
  if (c.tipo === 'dinheiro') return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (c.tipo === 'pct') return (v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%'
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

const arquivo = (titulo: string) =>
  titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export async function exportarExcel(r: Relatorio) {
  const { default: writeXlsxFile } = await import('write-excel-file')
  const cab = r.colunas.map((c) => ({ value: c.nome, fontWeight: 'bold' as const }))
  const celula = (v: Celula, c: Coluna) =>
    typeof v === 'number'
      ? { value: v, type: Number, format: c.tipo === 'dinheiro' ? '#,##0.00' : c.tipo === 'pct' ? '0.0%' : '#,##0' }
      : { value: v, type: String }
  const linhas = r.linhas.map((l) => l.map((v, i) => celula(v, r.colunas[i])))
  const total = r.total ? [r.total.map((v, i) => ({ ...celula(v, r.colunas[i]), fontWeight: 'bold' as const }))] : []
  await writeXlsxFile([[{ value: r.titulo, fontWeight: 'bold' as const }], [{ value: r.sub }], [], cab, ...linhas, ...total] as never, {
    fileName: `${arquivo(r.titulo)}.xlsx`,
    columns: r.colunas.map((c, i) => ({ width: i === 0 ? 34 : c.tipo === 'texto' ? 22 : 16 })),
  } as never)
}

export async function exportarPdf(r: Relatorio) {
  const colunas = r.colunas
  const dir = colunas.map((c, i) => (c.tipo === 'texto' ? -1 : i)).filter((i) => i >= 0)
  await gerarPdf(`${arquivo(r.titulo)}.pdf`, r.titulo, r.sub, [
    ...(r.antes ?? []),
    {
      tabela: {
        cab: colunas.map((c) => c.nome),
        dir,
        linhas: [...r.linhas, ...(r.total ? [r.total] : [])].map((l) => l.map((v, i) => formatar(v, colunas[i]))),
      },
    },
  ])
}
