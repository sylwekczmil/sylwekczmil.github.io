import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// This is a GitHub user site (sylwekczmil.github.io), which must publish from
// the main branch — so we build into docs/ and point Pages at main /docs.
// Served at the custom domain root, so base stays /.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
})
