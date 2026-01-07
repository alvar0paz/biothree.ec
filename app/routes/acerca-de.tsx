import type {Route} from './+types/acerca-de';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Acerca de | Bio-Three'},
    {
      name: 'description',
      content:
        'BioThree llega a Ecuador a través de Bioscience, especializada en productos de salud y bienestar del Sudeste Asiático.',
    },
  ];
};

export async function loader() {
  return {};
}

export default function AcercaDe() {
  return (
    <div className="about-page">
      <h1>Acerca de</h1>
      <div className="about-content">
        <p>
          BioThree llega a Ecuador a través de Bioscience, una empresa
          ecuatoriana especializada en la importación y distribución de
          productos de salud y bienestar provenientes del Sudeste Asiático.
        </p>
        <p>
          Trabajamos con marcas y tecnologías que combinan investigación
          científica, procesos rigurosos y una larga tradición funcional, con el
          objetivo de ofrecer soluciones confiables que apoyen el equilibrio
          intestinal y el bienestar integral.
        </p>
      </div>
    </div>
  );
}
