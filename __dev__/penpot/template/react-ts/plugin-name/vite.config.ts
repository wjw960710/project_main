import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "node:path";
import {build as esbuild} from "esbuild";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    postProcessPlugin(),
  ],
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

/**
 * @desc 多編譯一次 plugin 以解決不能使用 import 語法的問題
 */
function postProcessPlugin () {
  return {
    name: 'post-process-plugin',
    closeBundle: async () => {
      const pluginPath = path.resolve(__dirname, 'dist/plugin.js')

      console.log('正在使用 esbuild 重新封裝 plugin.js...')

      await esbuild({
        entryPoints: [pluginPath],
        outfile: pluginPath,
        bundle: true,
        minify: true,
        allowOverwrite: true,
        format: 'iife',
        platform: 'browser',
      })

      console.log('plugin.js 重新封裝完成！')
    }
  }
}
