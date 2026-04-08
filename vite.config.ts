import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',   // accesible en toda la red local
    port: 3001,
    middlewareMode: false,
    hmr: { host: 'localhost' },
  },
});
