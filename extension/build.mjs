#!/usr/bin/env node
import * as esbuild from 'esbuild'
import { copyFileSync, mkdirSync, existsSync, rmSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const isProduction = process.env.NODE_ENV === 'production'

// Clean dist directory
const distDir = resolve(__dirname, 'dist')
if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true })
}
mkdirSync(distDir, { recursive: true })

// Build content script as IIFE
console.log('Building content script...')
await esbuild.build({
  entryPoints: [resolve(__dirname, 'src/content/twitter.ts')],
  bundle: true,
  outfile: resolve(__dirname, 'dist/content.js'),
  format: 'iife',
  target: 'chrome100',
  minify: isProduction,
  sourcemap: !isProduction,
  platform: 'browser',
  define: {
    'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
    'process.env': JSON.stringify({ NODE_ENV: isProduction ? 'production' : 'development' }),
    'process': JSON.stringify({ env: { NODE_ENV: isProduction ? 'production' : 'development' } }),
    'global': 'globalThis',
  },
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
  },
  jsx: 'automatic',
  jsxImportSource: 'react',
  alias: {
    '@': resolve(__dirname, 'src'),
  },
})

// Build background script as ESM (service workers support modules)
console.log('Building background script...')
await esbuild.build({
  entryPoints: [resolve(__dirname, 'src/background/service-worker.ts')],
  bundle: true,
  outfile: resolve(__dirname, 'dist/background.js'),
  format: 'esm',
  target: 'chrome100',
  minify: isProduction,
  sourcemap: !isProduction,
  platform: 'browser',
  define: {
    'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
    'process.env': JSON.stringify({ NODE_ENV: isProduction ? 'production' : 'development' }),
    'process': JSON.stringify({ env: { NODE_ENV: isProduction ? 'production' : 'development' } }),
    'global': 'globalThis',
  },
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
  },
  alias: {
    '@': resolve(__dirname, 'src'),
  },
})

// Build popup script as ESM
console.log('Building popup script...')
await esbuild.build({
  entryPoints: [resolve(__dirname, 'src/popup/index.tsx')],
  bundle: true,
  outfile: resolve(__dirname, 'dist/popup.js'),
  format: 'esm',
  target: 'chrome100',
  minify: isProduction,
  sourcemap: !isProduction,
  platform: 'browser',
  define: {
    'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
    'process.env': JSON.stringify({ NODE_ENV: isProduction ? 'production' : 'development' }),
    'process': JSON.stringify({ env: { NODE_ENV: isProduction ? 'production' : 'development' } }),
    'global': 'globalThis',
  },
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
  },
  jsx: 'automatic',
  jsxImportSource: 'react',
  alias: {
    '@': resolve(__dirname, 'src'),
  },
})

// Copy static files
console.log('Copying static files...')
const publicDir = resolve(__dirname, 'public')

// Copy manifest.json
copyFileSync(
  resolve(publicDir, 'manifest.json'),
  resolve(distDir, 'manifest.json')
)

// Copy HTML files
copyFileSync(
  resolve(publicDir, 'popup.html'),
  resolve(distDir, 'popup.html')
)
copyFileSync(
  resolve(publicDir, 'callback.html'),
  resolve(distDir, 'callback.html')
)

// Copy icons
const iconsDir = resolve(distDir, 'icons')
mkdirSync(iconsDir, { recursive: true })
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

console.log('Build complete!')
