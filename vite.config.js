import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'

export default defineConfig({
  plugins: [react(), cesium()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 10_000,
  },
  optimizeDeps: { exclude: ['cesium'] },
})
