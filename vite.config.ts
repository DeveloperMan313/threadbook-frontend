import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide'
		})
	],

	// 👇 ВРЕМЕННЫЙ ПРОКСИ ДЛЯ DEV
	server: {
		proxy: {
			// Проксируем все /api → на Go-бэкенд
			'/api': {
				target: 'http://api:8080', // порт Go-сервера
				changeOrigin: true,
				secure: false,
			},
		}
	}
});
