import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

type BadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children"> & {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  className?: string;
  children?: ReactNode;
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    success: 'bg-aura-emerald/10 text-aura-emerald border-aura-emerald/20',
    warning: 'bg-aura-gold/10 text-aura-gold border-aura-gold/20',
    danger: 'bg-aura-ruby/10 text-aura-ruby border-aura-ruby/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    default: 'bg-white/5 text-aura-platinum/70 border-white/10',
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
