import { cn } from "@/lib/utils";

/**
 * Logo "hostelyo." — le point est TOUJOURS en couleur poudre.
 * Règle du brand book v4.0.0.
 */
export function Logo({
  className,
  size = "md",
  variant = "ink",
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** ink = pour fond clair, on-aubergine = pour fond aubergine */
  variant?: "ink" | "on-aubergine";
}) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-4xl",
  };

  const colorClasses =
    variant === "ink" ? "text-aubergine" : "text-on-aubergine";

  return (
    <span
      className={cn(
        "inline-flex items-baseline font-serif font-medium tracking-tight",
        sizeClasses[size],
        colorClasses,
        className
      )}
      aria-label="hostelyo."
    >
      hostelyo<span className="text-powder">.</span>
    </span>
  );
}
