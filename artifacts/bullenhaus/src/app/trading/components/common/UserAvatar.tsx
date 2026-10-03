import React from 'react';

// Deterministic, locally-rendered avatar: a jewel-tone gradient circle with
// serif monogram initials, no external network dependency (previously a flat
// single-hue dicebear "initials" fallback, e.g. a plain purple disc with "ME").
const PALETTE: [string, string][] = [
  ['#D4AF37', '#8A6D1F'], // gold
  ['#8B5CF6', '#4C1D95'], // violet
  ['#38BDF8', '#0C4A6E'], // sapphire
  ['#34D399', '#065F46'], // emerald
  ['#FB7185', '#881337'], // ruby
  ['#F59E0B', '#78350F'], // amber
  ['#818CF8', '#312E81'], // indigo
];

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export const UserAvatar: React.FC<{ name: string; size?: number; className?: string }> = ({
  name,
  size = 40,
  className = '',
}) => {
  const seed = name || 'User';
  const [c1, c2] = PALETTE[hashSeed(seed) % PALETTE.length];
  const initials = initialsOf(seed);

  return (
    <div
      className={`relative flex items-center justify-center rounded-lg overflow-hidden shrink-0 ${className}`}
      style={{
        background: `radial-gradient(circle at 32% 26%, ${c1} 0%, ${c2} 78%)`,
        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.25), inset 0 -4px 10px rgba(0,0,0,0.45)',
      }}
    >
      <span
        className="font-serif font-bold text-white select-none leading-none"
        style={{ fontSize: `${size * 0.4}px`, textShadow: '0 1px 3px rgba(0,0,0,0.55)' }}
      >
        {initials}
      </span>
      <div className="absolute inset-0 rounded-lg pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)' }} />
    </div>
  );
};
