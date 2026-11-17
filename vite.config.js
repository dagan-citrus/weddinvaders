import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Served from the root of the custom domain (weddinvaders.barvazone.com), so base stays '/'.
export default defineConfig({
  plugins: [react()],
})
