import { defineConfig } from 'vite';

// Served from https://eforus-overseer.github.io/empathy-captcha/
export default defineConfig({
  base: '/empathy-captcha/',
  build: { target: 'es2022', sourcemap: true },
  test: { include: ['tests/**/*.test.ts'] },
});
