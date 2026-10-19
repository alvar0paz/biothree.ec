import {Link} from 'react-router';
import type {Route} from './+types/blogs.ciencia-intestinal._index';
import {SectionLabel} from '~/components/marketing/SectionLabel';
import {
  scienceArticle,
  SCIENCE_ARTICLE_PATH,
  SCIENCE_BLOG_PATH,
} from '~/data/editorial';
import {pageMeta} from '~/lib/seo';

export const meta: Route.MetaFunction = () =>
  pageMeta({
    title: 'Blog de ciencia intestinal | Biothree Ecuador',
    description:
      'Microbiota, probióticos y butirato explicados con claridad. Lee qué sabemos, qué falta por conocer y las fuentes de cada artículo.',
    path: SCIENCE_BLOG_PATH,
  });

export default function ScienceBlog() {
  return (
    <div className="biothree">
      <div className="bt-container-narrow bt-hero flex flex-col items-start gap-5">
        <SectionLabel>Blog</SectionLabel>
        <h1 className="bt-h1 text-ink">
          Ciencia intestinal, sin complicaciones.
        </h1>
        <p className="bt-lead text-muted">
          Una pregunta a la vez. Explicaciones breves, evidencia en contexto y
          fuentes para profundizar.
        </p>
      </div>
      <div className="bt-container-narrow bt-section-compact">
        <article className="bt-rule-block flex flex-col items-start gap-5">
          <span className="bt-index-label">
            Microbiota · Probióticos · Butirato
          </span>
          <h2 className="bt-h2 text-ink">
            <Link to={SCIENCE_ARTICLE_PATH} className="bt-editorial-link">
              {scienceArticle.title}
            </Link>
          </h2>
          <p className="bt-lead text-muted">{scienceArticle.description}</p>
          <Link to={SCIENCE_ARTICLE_PATH} className="bt-editorial-link">
            Leer el artículo →
          </Link>
        </article>
        <p className="bt-note text-muted mt-8 mb-12">
          Contenido educativo de Biothree Ecuador. Cada artículo distingue los
          datos del fabricante, los estudios clínicos y sus limitaciones.{' '}
          <Link to="/acerca-de" className="bt-editorial-link">
            Conoce quién publica
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
