import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
};

export function Card({
  children,
  className = "",
  hover = false,
  onClick,
}: CardProps) {
  const baseClasses =
    "bg-brand-surface border border-brand-muted/10 rounded-xl";
  const hoverClasses = hover
    ? "cursor-pointer hover:border-brand-teal/30 hover:bg-brand-surface/80 transition-colors"
    : "";

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
