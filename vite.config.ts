import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/lib/paraglide'
    })
  ],
  define: {
    'import.meta.vitest': 'undefined'
  },
  build: {
    ssrEmitAssets: true
  },
  ssr: {
    noExternal: ['deepfilternet3-noise-filter']
  },
  optimizeDeps: {
    exclude: ['deepfilternet3-noise-filter']
  }
});