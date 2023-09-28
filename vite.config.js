import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import historyApiFallback from 'connect-history-api-fallback';
import pluginRewriteAll from 'vite-plugin-rewrite-all';

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    globals: true,
  },
  plugins: [react(), pluginRewriteAll()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
    port: 8080,
    middleware: [historyApiFallback()],
  },
});
