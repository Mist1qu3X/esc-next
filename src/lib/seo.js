// Единый билдер метаданных для generateMetadata (ТЗ 7.2).
// Приоритет — поля компонента `seo` из Strapi; иначе фолбэк на реальные поля сущности.
// Меняет только <head> (title/description/OG) — вид страниц не затрагивает.
import config from '@/lib/config';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://esc-shooting.org';

function absImage(media) {
  const url = media?.url;
  if (!url) return null;
  return url.startsWith('http') ? url : `${config.API_URL}${url}`;
}

function clamp(text, max = 300) {
  if (!text) return text;
  const t = String(text).replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

export function buildMetadata({ seo, title, description, image, path = '' }) {
  const metaTitle = (seo?.metaTitle || title || 'European Shooting Confederation').trim();
  const metaDescription =
    clamp(seo?.metaDescription || description) || 'Official website of the European Shooting Confederation';
  const ogImg = absImage(seo?.ogImage) || absImage(image);
  const url = `${SITE_URL}${path}`;
  return {
    title: metaTitle,
    description: metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url,
      siteName: 'European Shooting Confederation',
      type: 'website',
      ...(ogImg ? { images: [{ url: ogImg }] } : {}),
    },
    twitter: {
      card: ogImg ? 'summary_large_image' : 'summary',
      title: metaTitle,
      description: metaDescription,
      ...(ogImg ? { images: [ogImg] } : {}),
    },
  };
}
