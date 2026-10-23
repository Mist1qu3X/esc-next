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

const ORDER = ['thumbnail', 'small', 'medium', 'large', 'xlarge'];

// URL картинки нужного размера. size: 'thumbnail'|'small'|'medium'|'large'|'xlarge'|'full'.
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

// Размер для фоновых «героев» на всю ширину: телефонам хватает large (1000px), десктопу — xlarge (1920px).
export function heroSize() {
  return typeof window !== 'undefined' && window.innerWidth <= 1024 ? 'large' : 'xlarge';
}

// Вариант картинки по адресу оригинала — для картинок внутри markdown, где объекта media нет:
// /uploads/<hash>.jpg -> /uploads/large_<hash>.jpg. Формат есть не у всех файлов (Strapi делает
// его только если оригинал больше), поэтому использовать вместе с onError-фолбэком на оригинал.
export function sizedUrl(url, size) {
  if (!url) return url;
  const m = url.match(/^(.*\/uploads\/)(?!(?:thumbnail|small|medium|large|xlarge)_)([^/?#]+)$/);
  return m ? `${m[1]}${size}_${m[2]}` : url;
}

export default imageUrl;
