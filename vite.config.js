import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { copyFile } from 'node:fs/promises'
import { join } from 'node:path'

// GitHub Pages serves 404.html for unknown paths; a copy of index.html lets the SPA route them.
function spaFallback() {
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    async writeBundle({ dir }) {
      await copyFile(join(dir, 'index.html'), join(dir, '404.html'))
    },
  }
}

// https://vite.dev/config/
// Served from the root of the custom domain (weddinvaders.barvazone.com), so base stays '/'.
export default defineConfig({
  plugins: [react(), spaFallback()],
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
})
