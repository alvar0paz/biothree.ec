import type {MetaDescriptor} from 'react-router';

export const SITE_URL = 'https://biothree.ec';

export function pageMeta({
  title,
  description,
  path,
  type = 'website',
  image,
}: {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  image?: string;
}): MetaDescriptor[] {
  const url = new URL(path, SITE_URL).href;
  return [
    {title},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: url},
    {property: 'og:site_name', content: 'Biothree Ecuador'},
    {property: 'og:locale', content: 'es_EC'},
    {property: 'og:type', content: type},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:url', content: url},
    {name: 'twitter:card', content: image ? 'summary_large_image' : 'summary'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description},
    ...(image
      ? [
          {property: 'og:image', content: new URL(image, SITE_URL).href},
          {name: 'twitter:image', content: new URL(image, SITE_URL).href},
        ]
      : []),
  ];
}
