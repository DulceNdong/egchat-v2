import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

// Plugin: actualiza la versión del SW automáticamente en cada build
const swVersionPlugin = () => ({
  name: 'sw-version',
  closeBundle() {
    const swPath = path.resolve(__dirname, 'dist/sw.js');
    if (!fs.existsSync(swPath)) return;
    const version = `egchat-v${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now().toString(36)}`;
    let content = fs.readFileSync(swPath, 'utf-8');
    content = content.replace(/const SW_VERSION = 'egchat-push-v[^']+';/, `const SW_VERSION = 'egchat-push-${Date.now().toString(36)}';`);
    fs.writeFileSync(swPath, content);
    console.log(`[sw-version] Cache version updated to: ${version}`);
  },
});

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno del archivo .env correspondiente al modo
  const env = loadEnv(mode, process.cwd(), '');

  // URL del API: prioridad → variable de entorno → fallback producción
  const apiUrl = env.VITE_API_URL || 'https://egchat-api-xlxj.onrender.com';

  console.log(`[vite] mode=${mode} | API_URL=${apiUrl}`);

  return {
  plugins: [react(), tailwindcss(), swVersionPlugin()],
  base: '/',
  // Inyectar la URL del API directamente en el bundle.
  // En modo 'development' usa VITE_API_URL de .env.development (localhost:5000).
  // En modo 'production' usa VITE_API_URL de .env.production o el fallback de Render.
  define: {
    '__API_URL__': JSON.stringify(apiUrl),
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
    middlewareMode: false,
    hmr: { host: 'localhost' },
  },
  build: {
    // esbuild minifica syntax y whitespace de forma segura
    // minifyIdentifiers desactivado: el codebase usa eval/Function que lo requiere
    minify: 'esbuild',
    minifyWhitespace: true,
    minifySyntax: true,
    minifyIdentifiers: false,
    // target ES2020 cubre iOS 14+ y Android 8+ (Capacitor mínimo)
    target: ['es2020', 'safari14'],
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('@maptiler')) return 'maptiler';
          if (id.includes('tesseract')) return 'tesseract';
          if (id.includes('framer-motion') || (id.includes('/motion/') && !id.includes('react'))) return 'motion';
          if (id.includes('leaflet')) return 'leaflet';
          if (id.includes('qrcode') || id.includes('jsqr')) return 'qr';
          if (id.includes('@google/genai')) return 'genai';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react-core';
          if (id.includes('lucide-react')) return 'icons';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@maptiler/sdk', 'tesseract.js'],
  },
  };
});
