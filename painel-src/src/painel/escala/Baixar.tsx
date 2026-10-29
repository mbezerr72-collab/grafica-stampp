/** "Baixar PDF/Excel" de uma aba: o relatório mora na aba dona, não em Relatórios. */
import { useState } from 'react'
import { Icone, avisar } from '../ui'
import { exportarExcel, exportarPdf, type Relatorio } from './exportar'

export function Baixar({ rel }: { rel: () => Relatorio }) {
  const [gerando, setGerando] = useState('')
  const ir = async (tipo: 'pdf' | 'excel') => {
    setGerando(tipo)
    try {
      await (tipo === 'pdf' ? exportarPdf(rel()) : exportarExcel(rel()))
      avisar(tipo === 'pdf' ? 'Pronto! O arquivo para imprimir foi baixado.' : 'Pronto! A planilha foi baixada.')
    } catch {
      avisar('Não deu para gerar o arquivo. Tente de novo.')
    } finally {
      setGerando('')
    }
  }
  return (
    <span className="baixar">
      <button type="button" className="bt bt-leve bt-pequeno" disabled={!!gerando} onClick={() => ir('pdf')}>
        <Icone nome="relatorio" tamanho={16} />
        {gerando === 'pdf' ? 'Gerando…' : 'Baixar para imprimir'}
      </button>
      <button type="button" className="bt bt-leve bt-pequeno" disabled={!!gerando} onClick={() => ir('excel')}>
        <Icone nome="estoque" tamanho={16} />
        {gerando === 'excel' ? 'Gerando…' : 'Baixar planilha'}
      </button>
    </span>
  )
}
