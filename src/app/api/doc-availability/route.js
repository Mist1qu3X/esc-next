// Серверная проверка доступности файлов (обходит CORS S3 — на сервере ограничений нет).
// POST { urls: string[] } -> { results: { <url>: boolean } }. true = файл реально отдаётся (не 404).
// Используется блоком FEATURED DOCUMENTS, чтобы показать «Not available yet» для битых/невыложенных ссылок.

const cache = new Map(); // url -> { ok, ts }
const TTL = 5 * 60 * 1000; // 5 минут

async function isAvailable(url) {
    const cached = cache.get(url);
    if (cached && Date.now() - cached.ts < TTL) return cached.ok;

    let ok = false;
    try {
        // Сначала HEAD (дёшево). Если сервер его не поддерживает — крошечный ranged-GET.
        let res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(6000) });
        if (res.status === 405 || res.status === 501) {
            res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, signal: AbortSignal.timeout(6000) });
        }
        ok = res.ok || res.status === 206;
    } catch {
        ok = false; // недоступен / таймаут / сетевая ошибка
    }

    cache.set(url, { ok, ts: Date.now() });
    return ok;
}

export async function POST(request) {
    let urls = [];
    try {
        const body = await request.json();
        urls = Array.isArray(body?.urls) ? body.urls : [];
    } catch {
        // пустое/битое тело — вернём пусто
    }

    urls = Array.from(new Set(urls.filter((u) => typeof u === 'string' && u.startsWith('http')))).slice(0, 30);

    const results = {};
    await Promise.all(urls.map(async (u) => { results[u] = await isAvailable(u); }));

    return Response.json({ results });
}
