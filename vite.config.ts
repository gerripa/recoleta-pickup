import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// SINGLEFILE=1 genera un único index.html (para publicar la demo como página)
export default defineConfig({
  plugins: process.env.SINGLEFILE ? [react(), viteSingleFile()] : [react()],
})
