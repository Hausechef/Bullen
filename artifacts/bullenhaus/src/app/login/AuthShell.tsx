import React, { ReactNode } from 'react';
import { motion } from 'motion/react';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * AuthShell — unified PREMIUM luxury shell for all public pages.
 * Private-banking hero: deep black, golden bull, dramatic serif,
 * glass card with gold hairline + ambient glow.
 */
export const AuthShell: React.FC<AuthShellProps> = ({ title, subtitle, children, footer }) => {
  return (
    <div className="min-h-dvh w-full bg-bg relative flex items-center justify-center p-4 overflow-hidden text-center">
      {/* Layer 1 — deep radial gold glow (top) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(212, 175, 55, 0.22) 0%, rgba(212, 175, 55, 0.06) 35%, transparent 65%)',
        }}
      />
      {/* Layer 2 — subtle bottom emerald glow for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(16, 185, 129, 0.06) 0%, transparent 60%)',
        }}
      />
      {/* Layer 3 — golden bull silhouette, very subtle */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.10] mix-blend-luminosity"
        style={{
          backgroundImage: "url('/images/golden_bull_bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Layer 4 — vignette for focus */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.75) 100%)',
        }}
      />
      {/* Layer 5 — fine grain texture via CSS pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            'repeating-conic-gradient(from 0deg at 50% 50%, #fff 0deg 1deg, transparent 1deg 2deg)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[460px]"
      >
        {/* Brand — dramatic logo with halo */}
        <div className="mb-8 text-center flex justify-center">
          <div className="relative">
            {/* Outer halo glow */}
            <div
              className="absolute inset-0 -m-12 rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(212,175,55,0.35) 0%, transparent 60%)',
                filter: 'blur(20px)',
              }}
            />
            <img
              src="/logo.png"
              alt="Bullenhaus"
              className="relative h-56 md:h-72 w-auto object-contain drop-shadow-[0_0_40px_rgba(212,175,55,0.6)]"
            />
          </div>
        </div>

        {/* Eyebrow over title */}
        <motion.p
          initial={{ opacity: 0, letterSpacing: '0.5em' }}
          animate={{ opacity: 1, letterSpacing: '0.35em' }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-[10px] font-bold text-gold/80 uppercase tracking-[0.35em] mb-2"
        >
          Private Trading Terminal
        </motion.p>

        {/* Card — premium glass with gold top hairline + corner accents */}
        <div className="glass-card p-8 md:p-10 relative overflow-hidden">
          {/* Top gold hairline — luxury signature */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
          {/* Corner accents — top left */}
          <div className="absolute top-3 left-3 w-4 h-4 border-l border-t border-gold/30 rounded-tl" />
          {/* Corner accents — top right */}
          <div className="absolute top-3 right-3 w-4 h-4 border-r border-t border-gold/30 rounded-tr" />
          {/* Corner accents — bottom left */}
          <div className="absolute bottom-3 left-3 w-4 h-4 border-l border-b border-gold/30 rounded-bl" />
          {/* Corner accents — bottom right */}
          <div className="absolute bottom-3 right-3 w-4 h-4 border-r border-b border-gold/30 rounded-br" />

          <div className="mb-7">
            <h2 className="font-serif text-3xl font-semibold text-text tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-text-muted mt-2 tracking-wide">{subtitle}</p>
            )}
          </div>

          {children}

          {footer && (
            <div className="mt-7 pt-6 border-t border-border text-center text-sm text-text-muted">
              {footer}
            </div>
          )}
        </div>

        {/* Trust line */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-gold/30" />
          <p className="text-[10px] text-text-dim tracking-[0.4em] uppercase">
            Secured · Encrypted · Audited
          </p>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-gold/30" />
        </div>
      </motion.div>
    </div>
  );
};
