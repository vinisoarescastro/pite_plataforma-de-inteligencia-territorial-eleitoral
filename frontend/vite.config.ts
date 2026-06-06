import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth':       { target: 'http://localhost:8000', changeOrigin: true },
      '/users':      { target: 'http://localhost:8000', changeOrigin: true },
      '/eleicoes':   { target: 'http://localhost:8000', changeOrigin: true },
      '/candidatos': { target: 'http://localhost:8000', changeOrigin: true },
      '/resultados': { target: 'http://localhost:8000', changeOrigin: true },
      '/secoes':     { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
