import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  server: {
    host: '127.0.0.1', // Força IPv4 para evitar problemas de permissão com IPv6
    port: 5173,
    strictPort: false, // Permite usar outra porta se 5173 estiver ocupada
    proxy: {
      '/api': {
        target: 'http://192.168.0.98:5000',
        changeOrigin: true,
        secure: false,
      },
      '/users': {
        target: 'http://192.168.0.98:5000',
        changeOrigin: true,
        secure: false,
      },
      '/calculate': {
        target: 'http://192.168.0.98:5000',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://192.168.0.98:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})


