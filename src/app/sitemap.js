// sitemap.xml (ТЗ 7.2): статические разделы + все события (/events/[slug]) и новости (/media/[slug]).
// Домен — из NEXT_PUBLIC_SITE_URL (дефолт esc-shooting.org). Отказоустойчиво: если API недоступен
// на этапе сборки, останутся только статические маршруты. Ревалидация раз в час.
import config from '@/lib/config';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://esc-shooting.org';

// Постранично собираем записи. bareArray — для news-item (кастомный контроллер отдаёт голый массив без meta).
async function collect(pathBase, pick, bareArray = false) {
  const out = [];
  try {
    for (let page = 1; page <= 20; page++) {
      const res = await fetch(
        `${config.API_URL}${pathBase}&pagination[page]=${page}&pagination[pageSize]=100`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) break;
      const json = await res.json();
      const data = bareArray ? (Array.isArray(json) ? json : json.data || []) : json.data || [];
      out.push(...data.map(pick).filter(Boolean));
      const pageCount = json?.meta?.pagination?.pageCount;
      if (bareArray) { if (data.length < 100) break; }
      else if (!pageCount || page >= pageCount) break;
    }
  } catch {
    // API недоступен при сборке — вернём, что успели (обычно пусто)
  }
  return out;
}

export default async function sitemap() {
  const now = new Date();

  const staticRoutes = ['', '/discover', '/events', '/results', '/documents', '/members', '/media', '/contacts'].map(
    (p) => ({ url: `${SITE}${p || '/'}`, lastModified: now, changeFrequency: 'weekly', priority: p === '' ? 1 : 0.7 })
  );

  const [events, news] = await Promise.all([
    collect('/api/events?fields[0]=slug&fields[1]=updatedAt&sort=date:desc', (e) => (e.slug ? { slug: e.slug, lm: e.updatedAt } : null)),
    collect('/api/news-items?fields[0]=slug&fields[1]=updatedAt&sort=date:desc', (n) => (n.slug ? { slug: n.slug, lm: n.updatedAt } : null), true),
  ]);

  const eventUrls = events.map((e) => ({
    url: `${SITE}/events/${e.slug}`,
    lastModified: e.lm ? new Date(e.lm) : now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const newsUrls = news.map((n) => ({
    url: `${SITE}/media/${n.slug}`,
    lastModified: n.lm ? new Date(n.lm) : now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [...staticRoutes, ...eventUrls, ...newsUrls];
}
