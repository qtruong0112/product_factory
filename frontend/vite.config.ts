import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev proxy: mọi request /api chuyển sang backend Spring Boot :8080
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
