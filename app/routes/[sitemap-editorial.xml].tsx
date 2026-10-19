import {SCIENCE_ARTICLE_PATH, SCIENCE_BLOG_PATH} from '~/data/editorial';
import {SITE_URL} from '~/lib/seo';
export const editorialPaths = [
  '/',
  '/productos',
  '/ciencia',
  '/acerca-de',
  '/blogs',
  SCIENCE_BLOG_PATH,
  SCIENCE_ARTICLE_PATH,
];
export function loader() {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${editorialPaths.map((path) => `<url><loc>${SITE_URL}${path}</loc></url>`).join('')}</urlset>`;
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
