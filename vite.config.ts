import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Using custom domain hxtrainingclub.com, so base path is '/'
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      '/api': 'http://localhost:3005',
    },
  },
})
