import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',  // rutas relativas para que funcione con file:// en Electron
  server: {
    host: '0.0.0.0',
    port: 3001,
    middlewareMode: false,
    hmr: { host: 'localhost' },
  },
});
