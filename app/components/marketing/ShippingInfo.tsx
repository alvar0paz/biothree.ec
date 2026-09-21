import {SectionLabel} from './SectionLabel';
import {shipping} from '~/data/shipping';

export function ShippingInfo() {
  return (
    <section id="envios" className="scroll-mt-24 bg-cream/50">
      <div className="bt-container bt-section">
        <div className="flex flex-col items-start gap-3">
          <SectionLabel>Envíos a todo el Ecuador</SectionLabel>
          <h2 className="bt-h2 text-ink">Información de envío</h2>
        </div>
        <div className="mt-8 rounded-card bg-purple px-6 py-5 text-white">
          <p className="bt-h3">{shipping.promotion}</p>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="bt-card flex flex-col gap-4 border border-line bg-surface/70">
            <h3 className="bt-h3 text-ink">Días de despacho y operación</h3>
            <p className="bt-p text-muted">{shipping.operation}</p>
            <p className="bt-p text-muted">{shipping.holidays}</p>
          </div>
          <div className="bt-card flex flex-col gap-4 border border-line bg-surface/70 lg:col-span-2">
            <h3 className="bt-h3 text-ink">Tiempos estimados de entrega</h3>
            <p className="bt-p text-muted">{shipping.cutoff}</p>
            <div className="grid gap-5 sm:grid-cols-2">
              {shipping.destinations.map((destination) => (
                <div
                  key={destination.title}
                  className="flex flex-col gap-2 border-t border-line pt-4"
                >
                  <h4 className="bt-h3 text-ink">{destination.title}</h4>
                  {destination.detail && (
                    <p className="bt-note text-muted">{destination.detail}</p>
                  )}
                  <p className="bt-h3 text-purple-dark">
                    {destination.estimate}
                  </p>
                  <p className="bt-note text-muted">
                    Entrega estimada posterior al despacho.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 rounded-card border border-line p-6">
          <h3 className="bt-h3 text-ink">Rastreo de su tratamiento</h3>
          <p className="bt-p max-w-3xl text-muted">{shipping.tracking}</p>
        </div>
      </div>
    </section>
  );
}
