// Серверный прокси для принудительного скачивания медиа.
// Прод-картинки лежат на Selectel S3, который отдаёт CORS-заголовки непоследовательно
// (на оригинал — да, на размерные превью `large_`/`medium_` — нет), поэтому клиентский
// fetch().blob() падает. На сервере CORS-ограничений нет: качаем тут и отдаём обратно
// с Content-Disposition: attachment, чтобы браузер именно скачал файл.
// GET /api/download-image?url=<abs>&name=<filename>

import config from '@/lib/config';

// Белый список хостов — чтобы роут не превратился в открытый SSRF-прокси.
function isAllowed(target) {
    let url;
    try {
        url = new URL(target);
    } catch {
        return false;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const host = url.hostname;
    if (host === 'localhost') return true;
    if (host.endsWith('selstorage.ru')) return true; // прод-медиа Selectel S3
    try {
        if (host === new URL(config.API_URL).hostname) return true; // наш Strapi
    } catch {
        // config.API_URL кривой — игнорируем
    }
    return false;
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('url');
    // Имя файла санитизируем: убираем перевод строки и кавычки (инъекция в заголовок).
    const name = (searchParams.get('name') || 'image.jpg').replace(/[\r\n"]/g, '').slice(0, 200);

    if (!target || !isAllowed(target)) {
        return new Response('Bad request', { status: 400 });
    }

    try {
        const upstream = await fetch(target, { signal: AbortSignal.timeout(20000) });
        if (!upstream.ok) return new Response('Upstream error', { status: 502 });

        const buf = await upstream.arrayBuffer();
        const type = upstream.headers.get('content-type') || 'application/octet-stream';
        // RFC 5987 filename* для не-ASCII имён + ASCII-фолбэк.
        const asciiName = name.replace(/[^\x20-\x7E]/g, '_');
        return new Response(buf, {
            headers: {
                'Content-Type': type,
                'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(name)}`,
                'Cache-Control': 'private, max-age=0',
            },
        });
    } catch {
        return new Response('Fetch failed', { status: 502 });
    }
}
