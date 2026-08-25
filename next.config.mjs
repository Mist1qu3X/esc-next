/** @type {import('next').NextConfig} */
const nextConfig = {
  // Нужно для лёгкого Docker-образа (server.js)
  output: 'standalone',

  // Разрешаем грузить картинки/медиа с домена бекенда (Strapi).
  // Подставь реальный домен бекенда из Dokploy.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.traefik.me',
      },
      // Пример для своего домена:
      // { protocol: 'https', hostname: 'api.example.com' },
    ],
  },

  async headers() {
    return [
      {
        // Тестовый домен (esc.alavenir.tech и любые *.alavenir.tech) закрываем от
        // индексации поисковиками. Условие по Host — прод esc-shooting.org под него
        // не попадает, хотя оба собираются из одного кода.
        // ВАЖНО: страницу НЕ блокируем в robots.txt (краулинг разрешён) — иначе
        // поисковик не сможет прочитать этот заголовок и всё равно проиндексирует URL.
        source: '/:path*',
        has: [{ type: 'host', value: '.*alavenir\\.tech' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
