import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Relative base path so it works on GitHub Pages under any repository name
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
