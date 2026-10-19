import {COMMERCIAL_COMPANY} from '~/data/copy';
import {pageMeta} from '~/lib/seo';
import type {Route} from './+types/acerca-de';

export const meta: Route.MetaFunction = () =>
  pageMeta({
    title: 'Acerca de Biothree Ecuador | Información editorial',
    description:
      'Conoce quién publica la información de Biothree Ecuador y cómo distinguimos las fuentes científicas de las afirmaciones comerciales.',
    path: '/acerca-de',
  });

export async function loader() {
  return {};
}

export default function AcercaDe() {
  return (
    <div className="biothree">
      <div className="bt-container-narrow bt-section">
        <h1 className="bt-h1 mb-8">Acerca de Biothree Ecuador</h1>
        <div className="bt-prose bt-lead text-muted">
          <p>
            Este sitio presenta BIO-THREE para uso humano en Ecuador, en sus
            dos presentaciones: tabletas y sobres.{' '}
            <a href={COMMERCIAL_COMPANY.url}>{COMMERCIAL_COMPANY.name}</a> es
            la empresa matriz responsable de su comercialización en Ecuador.
          </p>
          <p>
            El producto fue importado mediante una alianza entre Armijos
            Corporation y Kenko.
          </p>
          <h2 className="bt-h3 text-ink">Cómo presentamos la ciencia</h2>
          <p>
            Publicamos contenido educativo sobre la fórmula y su investigación.
            Identificamos las fuentes del fabricante, los estudios clínicos y
            las evaluaciones de seguridad, y explicamos sus límites junto a los
            resultados.
          </p>
          <p>
            Biothree Ecuador tiene un interés comercial en el producto. Los
            artículos firmados por la marca no son una revisión médica
            independiente. No atribuimos una revisión clínica a profesionales
            que no hayan participado.
          </p>
          <h2 className="bt-h3 text-ink">Preguntas o correcciones</h2>
          <p>
            Puedes escribir a{' '}
            <a href="mailto:info@biothree.ec">info@biothree.ec</a> si tienes una
            consulta sobre el producto o detectas información que deba
            corregirse. Para decisiones sobre tu salud, consulta con un
            profesional.
          </p>
        </div>
      </div>
    </div>
  );
}
