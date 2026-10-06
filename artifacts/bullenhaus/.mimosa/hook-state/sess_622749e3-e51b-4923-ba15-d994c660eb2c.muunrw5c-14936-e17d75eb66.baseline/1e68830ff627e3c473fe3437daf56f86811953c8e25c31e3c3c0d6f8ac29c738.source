import { useTradingStore } from '../stores/tradingStore';
import { useAuth } from '../contexts/AuthContext';

/** Wallet balance required to unlock Elite Trade (Institutional Tools). */
export const ELITE_REQUIREMENT = 10000;

/**
 * Elite Trade gate. A client is elite once their wallet balance reaches
 * ELITE_REQUIREMENT; admins always pass.
 */
export const useEliteStatus = () => {
  const balance = useTradingStore(s => s.wallet.balance);
  const { role } = useAuth();

  const isAdmin = role === 'admin' || role === 'trade_admin';
  const isElite = isAdmin || balance >= ELITE_REQUIREMENT;
  const missing = Math.max(0, ELITE_REQUIREMENT - balance);
  const progress = Math.min(100, (balance / ELITE_REQUIREMENT) * 100);

  return { isElite, isAdmin, balance, missing, progress, requirement: ELITE_REQUIREMENT };
};
