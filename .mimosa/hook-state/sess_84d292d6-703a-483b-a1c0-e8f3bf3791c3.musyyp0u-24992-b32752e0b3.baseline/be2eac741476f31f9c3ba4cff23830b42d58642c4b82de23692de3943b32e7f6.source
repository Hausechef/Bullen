import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    
    const variants = {
      primary: "bg-aura-gold text-black hover:bg-aura-gold-light border border-aura-gold-light/20 shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]",
      secondary: "bg-white/5 border border-white/5 text-aura-platinum hover:bg-white/10",
      outline: "bg-transparent border border-aura-gold/30 text-aura-gold hover:bg-aura-gold/10",
      danger: "bg-aura-ruby/10 border border-aura-ruby/30 text-aura-ruby hover:bg-aura-ruby/20",
      ghost: "bg-transparent text-aura-platinum/70 hover:text-aura-platinum hover:bg-white/5",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-[9px] uppercase tracking-widest",
      md: "px-4 py-2 text-[10px] uppercase tracking-widest",
      lg: "px-6 py-3 text-xs uppercase tracking-widest",
      icon: "p-2",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded font-bold transition-all duration-300",
          variants[variant],
          sizes[size],
          (disabled || isLoading) && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
