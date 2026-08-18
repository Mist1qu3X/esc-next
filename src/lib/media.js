import config from './config';

// Абсолютный URL (медиа на S3 уже абсолютные — не префиксуем API_URL).
const abs = (u) => (u ? (u.startsWith('http') ? u : `${config.API_URL}${u}`) : null);

// Нормализуем медиа Strapi к плоскому объекту {url, formats,...}.
// Поддержка: строка, v5-плоский объект, v4 {data:{attributes}}, массив/множественное.
const mediaObj = (m) => {
  if (!m) return null;
  if (typeof m === 'string') return { url: m };
  if (Array.isArray(m)) return mediaObj(m[0]);
  if (m.data) return mediaObj(Array.isArray(m.data) ? m.data[0] : m.data);
  if (m.attributes) return m.attributes;
  return m;
};

const ORDER = ['thumbnail', 'small', 'medium', 'large'];

// URL картинки нужного размера. size: 'thumbnail'|'small'|'medium'|'large'|'full'.
// Берём запрошенный формат, если нет — следующий по возрастанию, иначе оригинал.
// Так сетки/превью тянут ~40–100 КБ вместо полноразмерных 0.5–2 МБ.
export function imageUrl(media, size = 'full') {
  const o = mediaObj(media);
  if (!o || !o.url) return null;
  if (size === 'full' || !o.formats) return abs(o.url);
  const from = ORDER.indexOf(size);
  if (from >= 0) {
    for (let i = from; i < ORDER.length; i++) {
      const f = o.formats[ORDER[i]];
      if (f?.url) return abs(f.url);
    }
  }
  return abs(o.url);
}

export default imageUrl;
