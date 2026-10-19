import {Link} from 'react-router';
import {SectionLabel} from './SectionLabel';
import {SCIENCE_ARTICLE_PATH} from '~/data/editorial';

export function ProductDetails() {
  return (
    <>
      <section id="formato" className="scroll-mt-24">
        <div className="bt-container bt-section">
          <SectionLabel index="02">Formato</SectionLabel>
          <h2 className="bt-h2 text-ink mt-4">Elige tu presentación.</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="bt-rule-block flex flex-col gap-4">
              <h3 className="bt-h3">Tabletas</h3>
              <p className="bt-p text-muted">
                Presentación en blíster. Revisa en el empaque las indicaciones
                de uso y conservación.
              </p>
            </div>
            <div className="bt-rule-block flex flex-col gap-4">
              <h3 className="bt-h3">Sobres de polvo oral</h3>
              <p className="bt-p text-muted">
                Presentación en sobres individuales. Sigue las instrucciones del
                empaque para su preparación y consumo.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section id="uso-sugerido" className="scroll-mt-24">
        <div className="bt-container bt-section">
          <SectionLabel index="03">Uso e indicaciones</SectionLabel>
          <h2 className="bt-h2 text-ink mt-4">
            Empieza por las indicaciones del empaque.
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div className="bt-rule-block flex flex-col gap-4">
              <h3 className="bt-h3">La presentación y la edad importan</h3>
              <p className="bt-p text-muted">
                Consulta la cantidad, frecuencia, edades de uso e ingredientes
                indicados en el empaque vendido en Ecuador. No intercambies
                dosis de tabletas, sobres o productos de otros países.
              </p>
            </div>
            <div className="bt-rule-block flex flex-col gap-4">
              <h3 className="bt-h3">Cuándo pedir orientación</h3>
              <p className="bt-p text-muted">
                Consulta con un profesional de salud antes de usarlo en niños,
                durante el embarazo o la lactancia, si tienes una condición
                médica o tomas medicamentos. Si las molestias persisten, busca
                una evaluación.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section id="ideal-para" className="scroll-mt-24">
        <div className="bt-container bt-section grid gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <SectionLabel index="04">Información para decidir</SectionLabel>
            <h2 className="bt-h2 text-ink">
              Conoce la fórmula y su evidencia.
            </h2>
          </div>
          <div className="flex flex-col items-start gap-5">
            <p className="bt-lead text-muted">
              Los estudios de probióticos dependen de la cepa, la preparación y
              las personas estudiadas. Te explicamos qué se ha investigado con
              BIO-THREE y cuáles son los límites de esos resultados.
            </p>
            <Link to={SCIENCE_ARTICLE_PATH} className="bt-editorial-link">
              Leer el artículo con sus fuentes →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
