import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
 import { localModelsPlugin } from './vite/localModelsPlugin.js'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), localModelsPlugin(root)],
  assetsInclude: ['**/*.glb'],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  build: {
    chunkSizeWarningLimit: 1600,
  },
  server: {
    watch: {
      ignored: [
        '**/*.glb',
        '**/*.gltf',
        '**/public/models/**',
        '**/public/thumbnails/**',
        '**/src/data/catalog.json',
      ],
    },
  },
})
