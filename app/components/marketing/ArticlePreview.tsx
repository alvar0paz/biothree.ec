import {Link} from 'react-router';
import {scienceArticle, SCIENCE_ARTICLE_PATH} from '~/data/editorial';
import {SectionLabel} from './SectionLabel';

export function ArticlePreview() {
  return (
    <section className="bt-band">
      <div className="bt-container bt-section grid gap-8 md:grid-cols-[1fr_1.2fr] md:gap-24">
        <div className="flex flex-col items-start gap-4">
          <SectionLabel>Blog · Ciencia intestinal</SectionLabel>
          <h2 className="bt-h2 text-ink">Entender también es cuidarse.</h2>
        </div>
        <div className="flex flex-col items-start gap-5">
          <h3 className="bt-h3 text-ink">
            <Link to={SCIENCE_ARTICLE_PATH} className="bt-editorial-link">
              {scienceArticle.title}
            </Link>
          </h3>
          <p className="bt-lead text-muted">{scienceArticle.description}</p>
          <Link to={SCIENCE_ARTICLE_PATH} className="bt-editorial-link">
            Leer el artículo con sus fuentes →
          </Link>
        </div>
      </div>
    </section>
  );
}
