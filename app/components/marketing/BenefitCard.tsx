type BenefitCardProps = {
  title: string;
  description: string;
  icon: string;
};

export function BenefitCard({title, description, icon}: BenefitCardProps) {
  return (
    <div className="bt-rule-block grid gap-x-6 gap-y-3 sm:grid-cols-[48px_1fr]">
      <div className="flex items-center gap-4 sm:row-span-2">
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
      </div>
      <h3 className="bt-h3 text-ink">{title}</h3>
      <p className="bt-p text-muted">{description}</p>
    </div>
  );
}
