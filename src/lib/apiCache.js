import axios from 'axios';

// Кэш ответов API на стороне клиента, чтобы переходы между страницами не
// перезапрашивали одни и те же данные и не упирались в rate-limit бэкенда
// (симптом: после десятка переходов /members, /results, /discover падают с
// net::ERR_TIMED_OUT и «оживают» через минуту).
//
// - cache: url -> { time, res } — отдаём готовый ответ, пока он «свежий» (TTL);
// - inflight: url -> Promise — дедуп одновременных одинаковых запросов;
// - ошибки НЕ кэшируем, чтобы временный сбой не «залипал».
const cache = new Map();
const inflight = new Map();
const DEFAULT_TTL = 3 * 60 * 1000; // 3 минуты

export function cachedGet(url, options = {}) {
    const { ttl = DEFAULT_TTL, ...axiosOpts } = options;

    // Запросы с signal (живой поиск и т.п.) не кэшируем — они одноразовые.
    if (axiosOpts.signal) return axios.get(url, axiosOpts);

    const hit = cache.get(url);
    if (hit && Date.now() - hit.time < ttl) return Promise.resolve(hit.res);

    if (inflight.has(url)) return inflight.get(url);

    const p = axios
        .get(url, axiosOpts)
        .then((res) => {
            cache.set(url, { time: Date.now(), res });
            inflight.delete(url);
            return res;
        })
        .catch((e) => {
            inflight.delete(url);
            throw e;
        });
    inflight.set(url, p);
    return p;
}

// Сбросить кэш (напр. после мутации). Без аргумента — весь.
export function invalidate(url) {
    if (url) cache.delete(url);
    else cache.clear();
}
