import {pageMeta, SITE_URL} from '~/lib/seo';
import {useLoaderData} from 'react-router';
import type {Route} from './+types/blogs.$blogHandle.$articleHandle';
import {Image} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

export const meta: Route.MetaFunction = ({data, params}) => {
  const article = data?.article;
  if (!article)
    return [
      {title: 'Artículo no encontrado | Biothree Ecuador'},
      {name: 'robots', content: 'noindex'},
    ];
  const path = `/blogs/${params.blogHandle}/${article.handle}`;
  const description = article.seo?.description || article.title;
  return [
    ...pageMeta({
      title: article.seo?.title || `${article.title} | Biothree Ecuador`,
      description,
      path,
      type: 'article',
      image: article.image?.url,
    }),
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: article.title,
        description,
        inLanguage: 'es-EC',
        mainEntityOfPage: `${SITE_URL}${path}`,
        datePublished: article.publishedAt,
        ...(article.author?.name
          ? {author: {'@type': 'Person', name: article.author.name}}
          : {}),
        ...(article.image?.url ? {image: [article.image.url]} : {}),
        publisher: {
          '@type': 'Organization',
          name: 'Biothree Ecuador',
          url: SITE_URL,
        },
      },
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request, params}: Route.LoaderArgs) {
  const {blogHandle, articleHandle} = params;

  if (!articleHandle || !blogHandle) {
    throw new Response('Not found', {status: 404});
  }

  const [{blog}] = await Promise.all([
    context.storefront.query(ARTICLE_QUERY, {
      variables: {blogHandle, articleHandle},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!blog?.articleByHandle) {
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(
    request,
    {
      handle: articleHandle,
      data: blog.articleByHandle,
    },
    {
      handle: blogHandle,
      data: blog,
    },
  );

  const article = blog.articleByHandle;

  return {article};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Article() {
  const {article} = useLoaderData<typeof loader>();
  const {title, image, contentHtml, author} = article;

  const publishedDate = new Intl.DateTimeFormat('es-EC', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt));

  return (
    <article className="biothree bt-container-narrow bt-section bt-editorial">
      <h1 className="bt-h1">{title}</h1>
      <div className="bt-note my-6">
        <time dateTime={article.publishedAt}>{publishedDate}</time> &middot;{' '}
        <address>{author?.name}</address>
      </div>

      {image && <Image data={image} sizes="90vw" loading="eager" />}
      <div
        dangerouslySetInnerHTML={{__html: contentHtml}}
        className="bt-prose bt-p mt-8"
      />
    </article>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog#field-blog-articlebyhandle
const ARTICLE_QUERY = `#graphql
  query Article(
    $articleHandle: String!
    $blogHandle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    blog(handle: $blogHandle) {
      handle
      articleByHandle(handle: $articleHandle) {
        handle
        title
        contentHtml
        publishedAt
        author: authorV2 {
          name
        }
        image {
          id
          altText
          url
          width
          height
        }
        seo {
          description
          title
        }
      }
    }
  }
` as const;
