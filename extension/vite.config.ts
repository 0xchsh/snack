import { defineConfig, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, rmSync } from 'fs'

const __dirname = import.meta.dirname

// Plugin to copy static files after build
function copyStaticFiles() {
  return {
    name: 'copy-static-files',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist')
      const publicDir = resolve(__dirname, 'public')

      // Copy manifest.json
      if (existsSync(resolve(publicDir, 'manifest.json'))) {
        copyFileSync(
          resolve(publicDir, 'manifest.json'),
          resolve(distDir, 'manifest.json')
        )
      }

      // Copy HTML files
      if (existsSync(resolve(publicDir, 'popup.html'))) {
        copyFileSync(
          resolve(publicDir, 'popup.html'),
          resolve(distDir, 'popup.html')
        )
      }
      if (existsSync(resolve(publicDir, 'callback.html'))) {
        copyFileSync(
          resolve(publicDir, 'callback.html'),
          resolve(distDir, 'callback.html')
        )
      }

      // Create icons directory and copy icons
      const iconsDir = resolve(distDir, 'icons')
      if (!existsSync(iconsDir)) {
        mkdirSync(iconsDir, { recursive: true })
      }

      // Copy icons if they exist
      const sizes = ['16', '32', '48', '128']
      sizes.forEach((size) => {
        const iconPath = resolve(publicDir, `icons/icon${size}.png`)
        if (existsSync(iconPath)) {
          copyFileSync(iconPath, resolve(iconsDir, `icon${size}.png`))
        }
      })

      // Copy content.css
      const contentCssPath = resolve(__dirname, 'src/styles/content.css')
      if (existsSync(contentCssPath)) {
        copyFileSync(contentCssPath, resolve(distDir, 'content.css'))
      }
    },
  }
}

// Shared config
const sharedConfig: UserConfig = {
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    'import.meta.env.DEV': JSON.stringify(process.env.NODE_ENV === 'development'),
  },
}

// Get build target from environment variable
const buildTarget = process.env.BUILD_TARGET

// Content script config - IIFE format (no ES modules in content scripts)
const contentConfig = defineConfig({
  ...sharedConfig,
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: buildTarget === 'content',
    lib: {
      entry: resolve(__dirname, 'src/content/twitter.ts'),
      name: 'SnackContent',
      formats: ['iife'],
      fileName: () => 'content.js',
    },
    rollupOptions: {
      output: {
        extend: true,
        inlineDynamicImports: true,
      },
    },
    target: 'esnext',
    minify: process.env.NODE_ENV === 'production',
    sourcemap: process.env.NODE_ENV === 'development',
  },
})

// Background script config - ES module format (service workers support modules)
const backgroundConfig = defineConfig({
  ...sharedConfig,
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/background/service-worker.ts'),
      name: 'SnackBackground',
      formats: ['es'],
      fileName: () => 'background.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    target: 'esnext',
    minify: process.env.NODE_ENV === 'production',
    sourcemap: process.env.NODE_ENV === 'development',
  },
})

// Popup config - ES module format (loaded in HTML page)
const popupConfig = defineConfig({
  ...sharedConfig,
  plugins: [react(), copyStaticFiles()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/popup/index.tsx'),
      name: 'SnackPopup',
      formats: ['es'],
      fileName: () => 'popup.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    target: 'esnext',
    minify: process.env.NODE_ENV === 'production',
    sourcemap: process.env.NODE_ENV === 'development',
  },
})

// Export config based on BUILD_TARGET env var
let config: UserConfig
switch (buildTarget) {
  case 'content':
    config = contentConfig
    break
  case 'background':
    config = backgroundConfig
    break
  case 'popup':
    config = popupConfig
    break
  default:
    // Default: build all (will be run via build script)
    config = contentConfig
}

export default config
