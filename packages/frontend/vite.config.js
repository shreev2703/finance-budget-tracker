import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The browser calls /api/...; Vite forwards it to the Express backend.
    proxy: { '/api': `http://localhost:${process.env.API_PORT || 3001}` },
  },
})
