import { defineConfig } from 'astro/config';
export default defineConfig({ site: 'https://kaif-life.com', output: 'static', i18n: { defaultLocale: 'ru', locales: ['ru', 'en', 'es'], routing: { prefixDefaultLocale: false } }, trailingSlash: 'always', devToolbar: { enabled: false } });
