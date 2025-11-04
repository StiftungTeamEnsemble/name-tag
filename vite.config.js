import { defineConfig } from 'vite'

export default defineConfig({
  base: '/name-tag/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  }
})
