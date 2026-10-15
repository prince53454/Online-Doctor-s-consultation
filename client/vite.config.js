import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: env.VITE_BASE_PATH || '/',
    envPrefix: ['VITE_', 'REACT_APP_'],
    plugins: [react({ include: /\.[jt]sx?$/ })],
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: []
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: { '.js': 'jsx' }
      }
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      allowedHosts: true,
      proxy: {
        '/api': { target: env.VITE_BACKEND_URL || 'http://127.0.0.1:5000', changeOrigin: true },
        '/uploads': { target: env.VITE_BACKEND_URL || 'http://127.0.0.1:5000', changeOrigin: true },
        '/socket.io': { target: env.VITE_BACKEND_URL || 'http://127.0.0.1:5000', changeOrigin: true, ws: true }
      }
    },
    build: {
      outDir: 'build',
      emptyOutDir: true
    }
  };
});
