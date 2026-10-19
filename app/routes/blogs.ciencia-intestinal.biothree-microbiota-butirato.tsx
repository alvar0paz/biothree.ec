import {Link} from 'react-router';
import type {Route} from './+types/blogs.ciencia-intestinal.biothree-microbiota-butirato';
import {
  scienceArticle as article,
  scienceSources,
  SCIENCE_ARTICLE_PATH,
  SCIENCE_BLOG_PATH,
} from '~/data/editorial';
import {pageMeta, SITE_URL} from '~/lib/seo';
import {SectionLabel} from '~/components/marketing/SectionLabel';

export const meta: Route.MetaFunction = () => [
  ...pageMeta({
    title: `${article.title} | Biothree Ecuador`,
    description: article.description,
    path: SCIENCE_ARTICLE_PATH,
    type: 'article',
  }),
  {
    'script:ld+json': {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.description,
      inLanguage: 'es-EC',
      mainEntityOfPage: `${SITE_URL}${SCIENCE_ARTICLE_PATH}`,
      dateModified: article.reviewedOn,
      author: {
        '@type': 'Organization',
        name: article.author,
        url: `${SITE_URL}/acerca-de`,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Biothree Ecuador',
        url: SITE_URL,
      },
      citation: scienceSources.map((source) => source.url),
    },
  },
  {
    'script:ld+json': {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {'@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL},
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Ciencia intestinal',
          item: `${SITE_URL}${SCIENCE_BLOG_PATH}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: article.title,
          item: `${SITE_URL}${SCIENCE_ARTICLE_PATH}`,
        },
      ],
    },
  },
];

export default function ScienceArticle() {
  return (
    <div className="biothree">
      <article className="bt-container-narrow bt-editorial">
        <header className="bt-hero flex flex-col items-start gap-5">
          <Link to={SCIENCE_BLOG_PATH} className="bt-editorial-link">
            ← Ciencia intestinal
          </Link>
          <SectionLabel>Microbiota · Probióticos · Butirato</SectionLabel>
          <h1 className="bt-h1 text-ink">{article.title}</h1>
          <p className="bt-lead text-muted">{article.description}</p>
          <p className="bt-note text-muted">
            Por{' '}
            <Link to="/acerca-de" className="bt-editorial-link">
              {article.author}
            </Link>{' '}
            · Actualizado el{' '}
            <time dateTime={article.reviewedOn}>18 de octubre de 2026</time>
          </p>
          <p className="bt-note text-muted">
            Publicado por la marca que comercializa el producto en Ecuador.
            Información educativa; no es una revisión médica independiente ni
            una pauta de tratamiento.
          </p>
        </header>
        <section
          className="bt-reading-summary"
          aria-labelledby="article-summary"
        >
          <h2 id="article-summary" className="bt-h3">
            Tres ideas para empezar
          </h2>
          <ul>
            {article.takeaways.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <nav
          aria-label="Contenido del artículo"
          className="bt-article-contents"
        >
          <span className="bt-index-label">En este artículo</span>
          <ol>
            {article.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.title}</a>
              </li>
            ))}
          </ol>
        </nav>
        {article.sections.map((section) => (
          <section
            id={section.id}
            key={section.id}
            className="bt-article-section"
          >
            <h2 className="bt-h3 text-ink">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="bt-p text-muted">
                {paragraph}
              </p>
            ))}
            {section.sourceIds.length > 0 && (
              <p className="bt-note text-muted">
                Fuentes:{' '}
                {section.sourceIds.map((id, index) => {
                  const source = scienceSources.find((item) => item.id === id)!;
                  return (
                    <span key={id}>
                      {index > 0 && ' · '}
                      <a href={source.url} className="bt-editorial-link">
                        {source.label}
                      </a>
                    </span>
                  );
                })}
              </p>
            )}
          </section>
        ))}
        <footer className="bt-article-section">
          <p className="bt-legal-note">
            Biothree se presenta en este sitio como suplemento alimenticio. No
            está destinado a diagnosticar, tratar, curar ni prevenir
            enfermedades. Consulta las indicaciones del empaque local.
          </p>
          <div className="flex flex-wrap gap-6">
            <Link to="/ciencia#faq" className="bt-editorial-link">
              Preguntas frecuentes →
            </Link>
            <Link to="/productos" className="bt-editorial-link">
              Ver las presentaciones →
            </Link>
          </div>
        </footer>
      </article>
    </div>
  );
}
