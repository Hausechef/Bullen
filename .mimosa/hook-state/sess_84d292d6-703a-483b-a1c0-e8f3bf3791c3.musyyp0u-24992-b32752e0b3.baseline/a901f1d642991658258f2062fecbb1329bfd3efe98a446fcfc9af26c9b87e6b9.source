import { createContext, useContext, useState, ReactNode } from "react";
import { PhoneDialer } from "../components/PhoneDialer";

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

  return (
    <PhoneDialerContext.Provider value={{
      openDialer:  isAgent ? (p) => setPrefill(p ?? null) : () => {},
      isAgentRole: isAgent,
    }}>
      {children}
      {isAgent && (
        <PhoneDialer prefill={prefill} onClearPrefill={() => setPrefill(null)} />
      )}
    </PhoneDialerContext.Provider>
  );
}
