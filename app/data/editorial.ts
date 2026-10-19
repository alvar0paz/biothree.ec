// Reviewed source-controlled editorial content. Existing Shopify CMS blogs remain available.
// Do not invent a medical reviewer or a publication date. Update reviewedOn only after a substantive review.
export const SCIENCE_BLOG_HANDLE = 'ciencia-intestinal';
export const SCIENCE_BLOG_PATH = `/blogs/${SCIENCE_BLOG_HANDLE}`;
export const scienceArticle = {
  handle: 'biothree-microbiota-butirato',
  title: 'BIO-THREE, microbiota y butirato: qué sabemos',
  description:
    'Qué distingue a BIO-THREE, qué es el butirato y cómo interpretar sus estudios sin confundir un mecanismo con un beneficio demostrado.',
  reviewedOn: '2026-10-18',
  author: 'Biothree Ecuador',
  takeaways: [
    'La fórmula combina tres tipos de bacterias con funciones diferentes.',
    'El butirato es una molécula; no es lo mismo que una bacteria probiótica.',
    'Los resultados de un estudio dependen de la cepa, la dosis y las personas estudiadas.',
  ],
  sections: [
    {
      id: 'tres-tipos',
      title: 'Tres tipos de bacterias, una fórmula',
      paragraphs: [
        'TOA, el fabricante japonés, describe BIO-THREE como una combinación de bacterias sacarolíticas, lácticas y productoras de butirato. Las primeras participan en la transformación de carbohidratos; las segundas producen ácido láctico; las terceras producen ácidos como el butirato. El fabricante describe interacciones que favorecen su crecimiento conjunto.',
        'Esta explicación ayuda a entender el diseño de la fórmula. No demuestra por sí sola cuánto mejorará una persona ni permite prometer colonización permanente o una producción continua y cuantificada de butirato.',
      ],
      sourceIds: ['toa'],
    },
    {
      id: 'butirato',
      title: '¿Qué tiene que ver el butirato?',
      paragraphs: [
        'El butirato es un ácido graso de cadena corta producido por ciertas bacterias. Clostridium butyricum es una especie que puede producirlo. Una molécula, una especie bacteriana y una fórmula comercial son objetos distintos de investigación.',
        'Por eso, un hallazgo sobre el butirato no se convierte automáticamente en un beneficio demostrado de BIO-THREE. Tampoco los miligramos de una preparación bacteriana indican cuántos miligramos de butirato producirá dentro del intestino.',
      ],
      sourceIds: ['efsa'],
    },
    {
      id: 'cepa',
      title: 'La cepa importa tanto como el nombre',
      paragraphs: [
        'Una cepa identifica un microorganismo con mayor precisión que su especie. Los resultados obtenidos con Clostridium butyricum CBM588 no se pueden atribuir directamente a Clostridium butyricum TO-A. También importan la formulación, la cantidad utilizada y la población estudiada.',
        'Al leer un estudio, busca cuatro datos: qué preparación se investigó, en quiénes, a qué dosis y qué resultado se midió. Un ensayo en pacientes hospitalizados no responde necesariamente a la pregunta de qué ocurre en una persona sana.',
      ],
      sourceIds: ['nih', 'efsa'],
    },
    {
      id: 'estudios',
      title: '¿Qué muestran los estudios con BIO-THREE?',
      paragraphs: [
        'Un ensayo publicado en 2010 incluyó a 304 niños hospitalizados con diarrea infecciosa aguda. El grupo que recibió BIO-THREE presentó una duración media de la diarrea de 60,1 horas frente a 86,3 horas con placebo. Es un resultado en una situación clínica específica; no es una instrucción para tratar la diarrea en casa ni una autorización de uso infantil para cualquier presentación.',
        'Otro ensayo, publicado en 2015, estudió la prevención de recaídas en colitis ulcerosa inactiva junto con el tratamiento habitual. Se asignaron 60 participantes y se analizaron 46. A los 12 meses, la diferencia en mantenimiento de la remisión no fue estadísticamente significativa (p = 0,248). Ese estudio no permite afirmar que BIO-THREE previene las recaídas.',
        'Estos trabajos son parte de la historia de investigación de la fórmula. Para trasladarlos al producto vendido en Ecuador hay que comprobar la equivalencia de su composición y dosis. Aquí no los presentamos como indicaciones terapéuticas del suplemento local.',
      ],
      sourceIds: ['chen', 'yoshimatsu'],
    },
    {
      id: 'seguridad',
      title: 'Seguridad y eficacia responden preguntas distintas',
      paragraphs: [
        'En 2025, EFSA evaluó la seguridad de un ingrediente concreto: Clostridium butyricum TO-A, identificado como FERM BP-10866, bajo condiciones y límites de uso definidos. La evaluación no comprende la fórmula completa de tres bacterias.',
        'La posterior autorización de la Comisión Europea para ese ingrediente como nuevo alimento no equivale a aprobar beneficios terapéuticos de BIO-THREE. Sus condiciones excluyen a menores de tres años y a mujeres embarazadas o en lactancia; no deben interpretarse como una pauta de dosificación para Ecuador.',
      ],
      sourceIds: ['efsa', 'eu'],
    },
    {
      id: 'uso',
      title: '¿Cómo llevar esta información a una decisión?',
      paragraphs: [
        'Comprueba las indicaciones, edades, ingredientes, conservación y fecha de vencimiento del empaque de la presentación que tienes. No intercambies pautas de otros países ni adaptes dosis de estudios clínicos por tu cuenta.',
        'Si tienes síntomas persistentes, una condición médica, tomas medicamentos, estás embarazada o en lactancia, consulta con un profesional de salud. El cuidado intestinal también incluye alimentación, hidratación y descanso. Un suplemento no sustituye una evaluación ni un tratamiento indicado.',
      ],
      sourceIds: [],
    },
  ],
};
export const SCIENCE_ARTICLE_PATH = `${SCIENCE_BLOG_PATH}/${scienceArticle.handle}`;
export const scienceSources = [
  {
    id: 'toa',
    label: 'TOA Pharmaceutical: composición y explicación del fabricante',
    url: 'https://www.toabio.co.jp/probiotics/about-biothree/',
  },
  {
    id: 'nih',
    label:
      'NIH Office of Dietary Supplements: probióticos y especificidad de cepa',
    url: 'https://ods.od.nih.gov/factsheets/Probiotics-HealthProfessional/',
  },
  {
    id: 'chen',
    label: 'Chen et al., 2010: ensayo en diarrea infecciosa aguda pediátrica',
    url: 'https://pure.lib.cgu.edu.tw/en/publications/probiotics-have-clinical-microbiologic-and-immunologic-efficacy-i-3/',
  },
  {
    id: 'yoshimatsu',
    label: 'Yoshimatsu et al., 2015: ensayo en colitis ulcerosa inactiva',
    url: 'https://www.wjgnet.com/1007-9327/full/v21/i19/5985.htm',
  },
  {
    id: 'efsa',
    label:
      'EFSA Journal, 2025: seguridad de C. butyricum TO-A (DOI 10.2903/j.efsa.2025.9371)',
    url: 'https://www.efsa.europa.eu/en/efsajournal/pub/9371',
  },
  {
    id: 'eu',
    label: 'Comisión Europea: Reglamento de Ejecución (UE) 2025/2233',
    url: 'https://eur-lex.europa.eu/eli/reg_impl/2025/2233/oj/eng',
  },
];
