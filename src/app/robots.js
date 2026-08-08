// robots.txt (ТЗ 7.2). Домен берётся из NEXT_PUBLIC_SITE_URL, дефолт — целевой esc-shooting.org.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://esc-shooting.org';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
