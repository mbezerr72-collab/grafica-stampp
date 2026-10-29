import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// O tema (escuro ou claro) entra antes de tudo, para a tela não piscar.
import './escala/marca'
// O cartão de produto do site aparece na prévia: o painel usa o mesmo CSS dele.
import '../catalog.css'
import './escala.css'
import './painel.css'
import './escala-moldura.css'
import './escala-operacao.css'
import './escala-estoque.css'
import './escala-relacao.css'
import './escala-financeiro.css'
import './escala-site.css'
import './escala-automatico.css'
import { App } from './App'

createRoot(document.getElementById('painel')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
