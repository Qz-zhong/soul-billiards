import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 目标 es2018：微信 Android XWeb 的内核版本不可控，不用 esnext。
export default defineConfig({
  plugins: [react()],
  server: { host: true },
  build: {
    outDir: 'dist',
    target: 'es2018',
    sourcemap: false,
  },
});
