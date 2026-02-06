import {Link} from 'react-router';
import type {Route} from './+types/test';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Test Salud Intestinal | Bio-Three'},
    {
      name: 'description',
      content: 'Realiza el test de salud intestinal de Bio-Three.',
    },
  ];
};

export async function loader() {
  return {};
}

export default function TestPage() {
  return (
    <div className="test-page">
      <h1>Test Salud Intestinal</h1>
      <p className="test-subtitle">Próximamente disponible</p>
      <Link to="/" className="landing-cta-btn">
        Volver al inicio
      </Link>
    </div>
  );
}
