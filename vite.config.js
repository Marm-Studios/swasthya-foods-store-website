// vite.config.js
import { defineConfig, defaultAllowedOrigins } from 'vite';
import shopify from 'vite-plugin-shopify';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [shopify(), tailwindcss()],
  build: {
    // outDir: 'assets', // write build files into theme assets/
    // emptyOutDir: false, // don't delete other manually-added assets
    // assetsDir: '', // put assets at the root of outDir (no subfolders)
    // manifest: 'manifest.json', // write manifest as assets/manifest.json (not .vite/manifest.json)
    outDir: 'dist', // write build files into theme assets/
    manifest: 'manifest.json',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'v-[name].[hash].min.js',
        chunkFileNames: 'v-[name].[hash].min.js',
        assetFileNames: 'v-[name].[hash].min[extname]',
      },
    },
  },
  server: {
    // host: '127.0.0.1', // force IPv4 localhost (prevents [::] from being emitted)
    // port: 5173,
    // strictPort: false, // allow fallback to another port if 5173 is busy
    // hmr: {
    //   host: '127.0.0.1',
    //   protocol: 'ws',
    //   port: 5173,
    // },
    cors: {
      origin: [defaultAllowedOrigins, /\.myshopify\.com$/],
    },
  },
});
