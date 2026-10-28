import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// O painel da gráfica é compilado para a pasta /painel do site (que é estático, sem compilação).
export default defineConfig({
  plugins: [react()],
  base: '/painel/',
  build: { outDir: '../painel', emptyOutDir: true, chunkSizeWarningLimit: 900 },
  worker: { format: 'es' },
})
