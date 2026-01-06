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
    <div className="landing-shell">
      <div className="landing-container">
        <nav className="landing-nav">
          <Link to="/" className="landing-brand">
            BIO-THREE®
          </Link>
        </nav>

        <main
          className="landing-main"
          style={{
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 700,
                color: '#0E1B2B',
                marginBottom: '24px',
              }}
            >
              Test Salud Intestinal
            </h1>
            <p
              style={{
                fontSize: '18px',
                color: '#0E1B2B',
                opacity: 0.7,
                marginBottom: '32px',
              }}
            >
              Próximamente disponible
            </p>
            <Link to="/" className="landing-cta-btn">
              Volver al inicio
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
