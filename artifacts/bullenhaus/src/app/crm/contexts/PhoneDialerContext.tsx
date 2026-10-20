import { createContext, useContext, useState, ReactNode } from "react";
import { PhoneDialer } from "../components/PhoneDialer";
import { useTelephony } from "../../../telephony/callStore";
import { normalizeOutboundNumber } from "../../../telephony/normalize";

interface DialerPrefill {
  phone: string;
  name?: string;
  clientId?: string;
}

interface PhoneDialerCtx {
  openDialer: (prefill?: DialerPrefill) => void;
  isAgentRole: boolean;
}

const PhoneDialerContext = createContext<PhoneDialerCtx>({
  openDialer: () => {},
  isAgentRole: false,
});

export function usePhoneDialer() {
  return useContext(PhoneDialerContext);
}

export function PhoneDialerProvider({ children, role }: { children: ReactNode; role: string }) {
  const isAgent = role === 'agent';
  const [prefill, setPrefill] = useState<DialerPrefill | null>(null);
  const dial = useTelephony((s) => s.dial);
  const telephonyState = useTelephony((s) => s.state);

  const openDialer = (p?: DialerPrefill) => {
    if (!isAgent) return;
    if (!p) { setPrefill(null); return; }
    const norm = normalizeOutboundNumber(p.phone);
    const phone = norm.ok ? norm.e164 : p.phone;
    // If telephony is ready, dial immediately via WebRTC.
    if (telephonyState === 'READY') {
      if (norm.ok) {
        dial(phone, p.name, p.clientId);
        return;
      }
    }
    // Otherwise open the dialer UI (shows status / lets agent type).
    setPrefill({ ...p, phone });
  };

  return (
    <PhoneDialerContext.Provider value={{
      openDialer,
      isAgentRole: isAgent,
    }}>
      {children}
      {isAgent && (
        <PhoneDialer prefill={prefill} onClearPrefill={() => setPrefill(null)} />
      )}
    </PhoneDialerContext.Provider>
  );
}
