import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [UnoCSS(), react()],
  build: {
    rolldownOptions: {
      input: {
        plugin: 'src/plugin.ts',
        index: './index.html',
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
  preview: {
    port: 4444,
    cors: true,
  },
})
