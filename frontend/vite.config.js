import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

function puertoApi() {
  if (process.env.PORT) return Number(process.env.PORT)

  try {
    const env = fs.readFileSync(path.join(rootDir, '..', 'backend', '.env'), 'utf8')
    const match = env.match(/^\s*PORT\s*=\s*"?(\d+)"?/m)
    if (match) return Number(match[1])
  } catch {
    // Sin backend/.env se usa el puerto por defecto.
  }

  return 5000
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${puertoApi()}`,
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
