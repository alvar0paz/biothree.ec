import {SectionLabel} from './SectionLabel';

const formats = [
  {
    title: 'Tabletas',
    description:
      'En blíster de alta barrera para asegurar la viabilidad de las cepas y una dosificación exacta.',
  },
  {
    title: 'Sachets de polvo oral',
    description:
      'Formato biosoluble de rápida acción, ideal para absorción inmediata o pacientes con dificultad para deglutir.',
  },
];

const approaches = [
  {
    title: 'Enfoque Terapéutico',
    subtitle: 'Recuperación y Alivio',
    benefits: [
      {
        title: 'Sellar el "Leaky Gut" (Intestino Permeable)',
        description:
          'Regenera las uniones estrechas de la pared intestinal, bloqueando el paso de toxinas al torrente sanguíneo.',
      },
      {
        title: 'Escudo frente a Antibióticos',
        description:
          'Previene y detiene la diarrea y destrucción de la flora causada por terapias antimicrobianas agresivas.',
      },
      {
        title: 'Frenar la Inflamación Crónica',
        description:
          'Reduce drásticamente la sintomatología del Síndrome de Intestino Irritable (SII) y desinflama el abdomen.',
      },
    ],
  },
  {
    title: 'Enfoque Preventivo',
    subtitle: 'Longevidad y Rendimiento',
    benefits: [
      {
        title: 'Blindaje Inmunológico Sistémico',
        description:
          'Modula las defensas naturales desde el tejido linfoide del intestino, elevando la resistencia ante virus y patógenos.',
      },
      {
        title: 'Paz Metabólica y Energía',
        description:
          'Optimiza la absorción de nutrientes desde la raíz, eliminando la pesadez y devolviendo la energía vital diaria.',
      },
      {
        title: 'Protección del Eje Intestino-Cerebro',
        description:
          'Al mantener el microbioma en estricto equilibrio, favorece la producción de neurotransmisores, mejorando el estado de ánimo y la claridad mental.',
      },
    ],
  },
];

export function ProductDetails() {
  return (
    <>
      <section id="formato" className="scroll-mt-24">
        <div className="bt-container bt-section">
          <div className="flex flex-col items-start gap-4">
            <SectionLabel index="02">Formato</SectionLabel>
            <h2 className="bt-h2 text-ink">Formato</h2>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {formats.map((format) => (
              <div
                key={format.title}
                className="bt-rule-block flex flex-col gap-4"
              >
                <h3 className="bt-h3 text-ink">{format.title}</h3>
                <p className="bt-p text-muted">{format.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="uso-sugerido" className="scroll-mt-24">
        <div className="bt-container bt-section">
          <div className="flex max-w-3xl flex-col items-start gap-4">
            <SectionLabel index="03">Uso sugerido · Protocolo clínico</SectionLabel>
            <h2 className="bt-h2 text-ink">Uso sugerido</h2>
            <p className="bt-lead text-muted">
              La posología de Bio Three está diseñada para garantizar un flujo
              continuo de colonización simbiótica y una producción
              ininterrumpida de butirato endógeno. Para maximizar la
              asimilación, se debe ingerir el producto junto con los alimentos:
            </p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="bt-rule-block flex flex-col gap-4">
              <h3 className="bt-h3 text-ink">
                Fase Terapéutica y de Reparación
              </h3>
              <p className="bt-note text-purple-dark">
                Disbiosis, Leaky Gut, Síndrome de Intestino Irritable
              </p>
              <p className="bt-p text-muted">
                Tomar <strong className="text-ink">2 tabletas</strong> o{' '}
                <strong className="text-ink">1 sachet de polvo</strong> junto
                con cada una de las tres comidas principales del día (desayuno,
                almuerzo y cena).
              </p>
              <p className="bt-p border-t border-hairline pt-4 text-muted">
                <em className="text-ink">Nota clínica:</em> En caso de estar
                bajo tratamiento con antibióticos, administrar la dosis
                correspondiente con{' '}
                <strong className="text-ink">2 horas de separación</strong> del
                fármaco para garantizar la máxima resiliencia de las cepas.
              </p>
            </div>
            <div className="bt-rule-block flex flex-col gap-4">
              <h3 className="bt-h3 text-ink">
                Fase Preventiva y de Mantenimiento
              </h3>
              <p className="bt-note text-purple-dark">Para personas sanas</p>
              <p className="bt-p text-muted">
                Para mantener la homeostasis metabólica, blindar el sistema
                inmunológico y proteger la barrera del colon de forma continua,
                puede adaptar la dosis a{' '}
                <strong className="text-ink">1 a 2 tomas diarias</strong> junto
                con sus comidas, o mantener el protocolo clínico según la
                recomendación de su profesional de la salud.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="ideal-para" className="scroll-mt-24">
        <div className="bt-container bt-section">
          <div className="flex flex-col items-start gap-4">
            <SectionLabel index="04">Ideal para</SectionLabel>
            <h2 className="bt-h2 text-ink">Ideal para</h2>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {approaches.map((approach) => (
              <div
                key={approach.title}
                className="bt-rule-block flex flex-col gap-4"
              >
                <SectionLabel>{approach.subtitle}</SectionLabel>
                <h3 className="bt-h3 text-ink">{approach.title}</h3>
                <ul className="flex list-none flex-col gap-5 p-0">
                  {approach.benefits.map((benefit) => (
                    <li
                      key={benefit.title}
                      className="flex flex-col gap-2 border-t border-hairline pt-5"
                    >
                      <h4 className="font-medium text-lg text-ink">
                        {benefit.title}
                      </h4>
                      <p className="bt-p text-muted">{benefit.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
