import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  server: {
    proxy: {
      '/content': 'http://localhost:3001',
      '/event': 'http://localhost:3001',
      '/status': 'http://localhost:3001',
      '/manifest': 'http://localhost:3001',
      '/scenarios': 'http://localhost:3001',
      '/skill.md': 'http://localhost:3001',
    },
  },
});
