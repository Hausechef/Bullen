import { cn } from "../../lib/utils";
import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center", className)}>
      {icon && (
        <div className="mb-4 h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-aura-platinum/40">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium text-aura-platinum mb-2">{title}</h3>
      {description && <p className="text-xs text-aura-platinum/50 max-w-sm mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
