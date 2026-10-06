import React from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Premium icon treatment used across the platform: gold gradient stroke with
 * a soft glow, optionally sitting on a dark glass tile with a gold hairline.
 *
 * GoldDefs must be mounted once (App root) — it provides the shared SVG
 * gradient the icons reference via stroke="url(#bh-gold)".
 */

export const GoldDefs: React.FC = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden focusable="false">
    <defs>
      <linearGradient id="bh-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F9E9A0" />
        <stop offset="45%" stopColor="#E6C558" />
        <stop offset="100%" stopColor="#96741F" />
      </linearGradient>
    </defs>
  </svg>
);

interface LuxIconProps {
  icon: LucideIcon;
  size?: number;
  /** Soft gold glow behind the strokes. Default true. */
  glow?: boolean;
  className?: string;
}

export const LuxIcon: React.FC<LuxIconProps> = ({ icon: Icon, size = 20, glow = true, className = '' }) => (
  <Icon
    size={size}
    stroke="url(#bh-gold)"
    className={`${glow ? 'drop-shadow-[0_0_6px_rgba(212,175,55,0.45)]' : ''} shrink-0 ${className}`}
  />
);

interface LuxIconTileProps {
  icon: LucideIcon;
  /** Tile size in px. Defaults to 44. */
  size?: number;
  iconSize?: number;
  className?: string;
}

/** Dark glass tile with a gold hairline border holding a gradient icon. */
export const LuxIconTile: React.FC<LuxIconTileProps> = ({ icon, size = 44, iconSize, className = '' }) => (
  <div
    style={{ width: size, height: size }}
    className={`rounded-xl bg-gradient-to-b from-[#22201A] via-[#161511] to-[#0B0A08] border border-gold/25 shadow-[inset_0_1px_2px_rgba(255,255,255,0.12),0_6px_16px_rgba(0,0,0,0.55)] flex items-center justify-center shrink-0 ${className}`}
  >
    <LuxIcon icon={icon} size={iconSize ?? Math.round(size * 0.5)} />
  </div>
);
