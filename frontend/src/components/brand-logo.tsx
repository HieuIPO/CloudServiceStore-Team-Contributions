type BrandLogoProps = {
  variant?: "mark" | "full";
  className?: string;
};

export function BrandLogo({ variant = "mark", className = "" }: BrandLogoProps) {
  if (variant === "full") {
    return (
      <span aria-label="CloudServiceStore" className={`brand-logo brand-logo--full ${className}`.trim()}>
        <span aria-hidden="true" className="brand-logo__full-mark" />
        <span className="brand-logo__full-name">
          <span className="brand-logo__name-accent">Cloud</span>ServiceStore
        </span>
      </span>
    );
  }

  return (
    <span aria-label="CloudServiceStore" className={`brand-logo brand-logo--mark ${className}`.trim()}>
      <span aria-hidden="true" className="brand-logo__mark-media" />
      <span className="brand-logo__name">
        <span className="brand-logo__name-accent">Cloud</span>ServiceStore
      </span>
    </span>
  );
}
