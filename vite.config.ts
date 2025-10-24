import tailwindcss from '@tailwindcss/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      tailwindcss(),
      sveltekit(),
      paraglideVitePlugin({
        project: './project.inlang',
        outdir: './src/lib/paraglide'
      })
    ],
    build: {
      rollupOptions: {
        external: ['deepfilternet3-noise-filter']
      }
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_PROXY_API_ORIGIN,
          changeOrigin: true,
          secure: true
        }
      }
    }
  };
});
