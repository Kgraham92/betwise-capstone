import { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "info";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-brand-muted/20 text-brand-muted",
  success: "bg-brand-green/20 text-brand-green",
  warning: "bg-yellow-500/20 text-yellow-400",
  info: "bg-brand-blue/20 text-brand-blue",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
