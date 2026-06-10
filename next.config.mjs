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
};

export default nextConfig;
