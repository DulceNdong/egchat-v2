import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL ?? 'http://localhost:8001',
        changeOrigin: true,
      },
      '/auth': {
        target: process.env.VITE_API_URL ?? 'http://localhost:8001',
        changeOrigin: true,
      },
      '/admin': {
        target: process.env.VITE_API_URL ?? 'http://localhost:8001',
        changeOrigin: true,
      },
      '/aml': {
        target: process.env.VITE_API_URL ?? 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
});
