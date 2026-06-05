type BenefitCardProps = {
  title: string;
  description: string;
  icon: string;
};

export function BenefitCard({title, description, icon}: BenefitCardProps) {
  return (
    <div className="bt-card flex h-full flex-col gap-3 border border-line bg-surface/70 transition-shadow hover:shadow-[0_12px_40px_-20px_rgba(36,11,133,0.22)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-soft">
        <img src={icon} alt="" aria-hidden="true" className="h-8 w-8 object-contain" />
      </div>
      <h3 className="bt-h3 text-ink">{title}</h3>
      <p className="bt-p text-muted">{description}</p>
    </div>
  );
}
