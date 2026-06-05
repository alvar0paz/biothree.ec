type BenefitCardProps = {
  title: string;
  description: string;
  icon: string;
};

export function BenefitCard({title, description, icon}: BenefitCardProps) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-card border border-line bg-surface/70 p-7 transition-shadow hover:shadow-[0_12px_40px_-18px_rgba(36,11,133,0.25)]">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-soft">
        <img src={icon} alt="" aria-hidden="true" className="h-11 w-11 object-contain" />
      </div>
      <h3 className="font-tight text-xl font-semibold text-ink">{title}</h3>
      <p className="text-base leading-relaxed text-muted">{description}</p>
    </div>
  );
}
