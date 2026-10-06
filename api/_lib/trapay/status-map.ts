import type { DepositStatus } from "./types.js";

// Status mapping — built ONLY from statuses published in TRAPAY's public
// sandbox documentation. The single documented creation status is
// "PENDING_CUSTOMER_DETAILS". Any other value the provider sends is treated as
// unknown: it is stored as-is on the deposit (provider_status) but NEVER
// triggers a balance credit.
//
// TRAPAY_DOCUMENTATION_REQUIRED: the full provider status vocabulary, event
// names, and webhook verification scheme are not publicly documented. When the
// merchant dashboard/official docs provide them, extend DOCUMENTED_STATUS_MAP
// explicitly — do not guess.

export type MappedDepositStatus = DepositStatus | "UNKNOWN_PROVIDER_STATUS";

const DOCUMENTED_STATUS_MAP: Readonly<Record<string, MappedDepositStatus>> = {
  PENDING_CUSTOMER_DETAILS: "PENDING",
};

export function mapTrapayStatus(providerStatus: string | null | undefined): MappedDepositStatus {
  if (!providerStatus || typeof providerStatus !== "string") {
    return "UNKNOWN_PROVIDER_STATUS";
  }
  return DOCUMENTED_STATUS_MAP[providerStatus.toUpperCase()] ?? "UNKNOWN_PROVIDER_STATUS";
}
