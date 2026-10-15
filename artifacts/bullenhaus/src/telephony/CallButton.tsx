// Call button — drops into CRM Contact/Lead/Client locations.
// Validates telephony.call permission, normalizes number, initiates call.
import { Phone } from 'lucide-react';
import { useTelephony } from './callStore';
import { useAuth } from '../app/trading/contexts/AuthContext';
import { normalizeGermanNumber } from './normalize';

interface CallButtonProps {
  phone: string;
  name?: string;
  clientId?: string | null;
  size?: 'sm' | 'md';
}

export function CallButton({ phone, name, clientId, size = 'sm' }: CallButtonProps) {
  const dial = useTelephony((s) => s.dial);
  const state = useTelephony((s) => s.state);
  const { role } = useAuth();

  const canCall = role === 'agent';
  const ready = state === 'READY';
  const norm = normalizeGermanNumber(phone);
  const disabled = !canCall || !ready || !norm.ok;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    dial(phone, name, clientId);
  };

  if (!canCall) return null;

  const sizeCls = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const iconSize = size === 'sm' ? 13 : 16;

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      title={!ready ? 'Phone not ready' : !norm.ok ? 'Invalid international number' : `Call ${phone}`}
      className={`${sizeCls} inline-flex items-center justify-center rounded-lg border transition-colors ${
        disabled
          ? 'border-white/5 text-white/20 cursor-not-allowed'
          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
      }`}
    >
      <Phone size={iconSize} />
    </button>
  );
}
