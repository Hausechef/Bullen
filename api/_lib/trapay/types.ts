// TRAPAY integration types. Only field names that appear in the publicly
// documented sandbox payment creation flow are typed here. Anything not
// confirmed by official TRAPAY documentation or the merchant dashboard is
// deliberately absent (TRAPAY_DOCUMENTATION_REQUIRED) — never guessed.

export type DepositStatus =
  | "CREATED"
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "CHARGEBACK";

export type DepositMethod = "CARD" | "BANK_TRANSFER";

export type PaymentEnvironment = "SANDBOX" | "PRODUCTION";

export interface CompanyRecord {
  id: string;
  name: string;
  legal_name: string | null;
  country: string | null;
  registration_number: string | null;
  vat_number: string | null;
  legal_address: string | null;
  support_email: string | null;
  support_phone: string | null;
  website: string | null;
  base_currency: string;
}

export interface CompanyPaymentSettingsRecord {
  id: string;
  company_id: string;
  provider: "TRAPAY";
  enabled: boolean;
  environment: PaymentEnvironment;
  public_key: string | null;
  secret_encrypted: string | null;
  sandbox_base_url: string;
  production_base_url: string | null;
  card_enabled: boolean;
  bank_transfer_enabled: boolean;
  card_gateway_id: string | null;
  bank_transfer_gateway_id: string | null;
  default_currency: string;
  supported_currencies: string[];
  minimum_deposit: number;
  maximum_deposit: number;
  webhook_configured: boolean;
  updated_at: string;
}

export interface TrapayCreatePaymentInput {
  publicKey: string;
  gateway: string;
  orderId: string;
  amount: number;
  currency: string;
  successUrl: string;
  failUrl: string;
  pendingUrl: string;
}

export interface TrapayCreatePaymentResult {
  providerPaymentId: string;
  orderId: string;
  proxyUrl: string;
  providerStatus: string | null;
}

export class TrapayClientError extends Error {
  readonly kind: "http_error" | "malformed_response" | "network_error" | "timeout";
  readonly httpStatus?: number;

  constructor(kind: TrapayClientError["kind"], message: string, httpStatus?: number) {
    super(message);
    this.name = "TrapayClientError";
    this.kind = kind;
    this.httpStatus = httpStatus;
  }
}
