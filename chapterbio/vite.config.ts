import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/public/chapterbio/',
  build: {
    outDir: '../public/chapterbio',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'vite-entry/index.html'),
      },
    },
  },
  plugins: [react()],
});
