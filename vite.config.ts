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
  optimizeDeps: {
    include: ['@shiguredo/noise-suppression']
  },
  ssr: {
    noExternal: ['@shiguredo/noise-suppression']
  },
  assetsInclude: ['**/*.wasm']
});