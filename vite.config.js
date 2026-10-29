import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'fs'

// Flat project layout: every file lives in the repo root.
// Cloudflare files (_worker.js = the API, _headers, favicon) are copied into dist after the build.
const CLOUDFLARE_FILES = ['_worker.js', '_headers', 'favicon.svg']

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-cloudflare-files',
      closeBundle() {
        for (const f of CLOUDFLARE_FILES) if (existsSync(f)) copyFileSync(f, `dist/${f}`)
      },
    },
  ],
  publicDir: false,
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 10000,
  },
})
