import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  clearScreen: false,
  server: {
    strictPort: true,
    port: 1420,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target:
      process.env.TAURI_PLATFORM === 'windows'
        ? 'chrome105'
        : 'safari15',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        settings: path.resolve(__dirname, 'settings.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@ai-sdk/anthropic'))
            return 'ai-anthropic'
          if (id.includes('node_modules/@ai-sdk/google'))
            return 'ai-google'
          if (id.includes('node_modules/@ai-sdk/openai'))
            return 'ai-openai'
          if (id.includes('node_modules/@ai-sdk/openai-compatible'))
            return 'ai-openai-compat'
          if (id.includes('node_modules/@xterm')) return 'xterm'
          if (id.includes('node_modules/codemirror') || id.includes('node_modules/@codemirror') || id.includes('node_modules/@uiw/codemirror'))
            return 'codemirror'
          if (id.includes('node_modules/streamdown'))
            return 'streamdown'
          if (id.includes('node_modules/motion')) return 'motion'
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler'))
            return 'react-vendor'
          if (id.includes('node_modules/radix-ui') || id.includes('node_modules/@radix-ui'))
            return 'radix'
        },
      },
    },
  },
})
