// Адрес бекенда берётся из переменной окружения NEXT_PUBLIC_API_URL,
// а localhost остаётся запасным вариантом для локальной разработки.

const config = {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'
};

export default config;
