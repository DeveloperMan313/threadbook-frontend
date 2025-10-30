import tailwindcss from '@tailwindcss/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/lib/paraglide'
    })
  ],
  assetsInclude: ['**/*.wasm'],

  optimizeDeps: {
    exclude: ['deepfilternet3-noise-filter']
  },

  build: {
    rollupOptions: {
      external: ['deepfilternet3-noise-filter']
    }
  }
});