import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    // Plugin tự copy manifest + content + background vào dist
    {
      name: 'copy-extension-files',
      closeBundle() {
        // Copy manifest
        copyFileSync('manifest.json', 'dist/manifest.json')
        // Copy icons
        try { mkdirSync('dist/icons', { recursive: true }) } catch {}
        try { copyFileSync('icons/icon16.png',  'dist/icons/icon16.png')  } catch {}
        try { copyFileSync('icons/icon48.png',  'dist/icons/icon48.png')  } catch {}
        try { copyFileSync('icons/icon128.png', 'dist/icons/icon128.png') } catch {}
        console.log('✅ Extension files copied to dist/')
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        sidepanel:  resolve(__dirname, 'src/sidepanel/sidepanel.html'),
        content:    resolve(__dirname, 'src/content/content.ts'),
        background: resolve(__dirname, 'src/background/background.ts'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'content')    return 'content.js'
          if (chunk.name === 'background') return 'background.js'
          return 'assets/[name]-[hash].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
