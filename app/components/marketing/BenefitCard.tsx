type BenefitCardProps = {
  title: string;
  description: string;
  icon: string;
  index: number;
};

export function BenefitCard({title, description, icon, index}: BenefitCardProps) {
  return (
    <div className="bt-card bt-card-hover flex h-full flex-col gap-3 border border-line bg-surface/70">
      <div className="flex items-start justify-between">
        <div className="bt-icon-badge">
          <img
            src={icon}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="h-8 w-8 object-contain"
          />
        </div>
        <span className="bt-card-number" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <h3 className="bt-h3 text-ink">{title}</h3>
      <p className="bt-p text-muted">{description}</p>
    </div>
  );
}
