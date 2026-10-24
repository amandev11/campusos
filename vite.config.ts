import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

/**
 * Extra hostnames the dev server may answer to, for a proxy preview.
 * Vite only honours its own allowed-host environment variable when this option
 * is already an array, and an empty list is the default behaviour: nothing is
 * allowed beyond localhost and the machine's own addresses. Keep specific
 * hostnames out of this file — pass them per process, never a wildcard.
 */
const allowedHosts = (process.env.VITE_ALLOWED_HOSTS ?? '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Bind all interfaces so the cloud preview proxy can reach the dev server.
    host: true,
    port: 3000,
    strictPort: false,
    allowedHosts,
  },
  preview: {
    host: true,
    port: 3000,
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('framer-motion') || id.includes('/motion')) return 'vendor-motion';
          if (id.includes('lucide')) return 'vendor-icons';
          if (id.includes('react')) return 'vendor-react';
          return 'vendor';
        },
      },
    },
  },
});
