import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: '127.0.0.1',
    port: 3000,
    open: false,
    watch: {
      ignored: ['**/release/**', '**/dist/**']
    }
  },
  // OS credentials are available only through the trusted desktop IPC bridge.
  preview: { host: '127.0.0.1' },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
