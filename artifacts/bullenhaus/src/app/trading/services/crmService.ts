import { supabase } from '../lib/supabase';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL as string || '';
const CRM_SYNC_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/crm-sync` : '';

const proxyFetch = async (action: string, payload: any, explicitToken?: string) => {
  if (!CRM_SYNC_URL) {
    console.warn(`[crmService] VITE_SUPABASE_URL not set — skipping CRM sync for ${action}`);
    return null;
  }

  try {
    let token = explicitToken;
    if (!token) {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    }

    if (!token) {
      console.warn(`[crmService] No active session for CRM sync (${action})`);
      return null;
    }

    const response = await fetch(CRM_SYNC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
      },
      body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
      console.warn(`[crmService] crm-sync warning for ${action} (${response.status})`);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.warn(`[crmService] Network error during CRM sync for ${action}`, err);
    return null;
  }
};

export interface RegisterClientPayload {
  external_trader_id: string;
  full_name: string;
  email: string;
  phone?: string;
  country?: string;
  account?: Record<string, unknown>;
  attribution?: {
    ref?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
}

export const crmService = {
  async registerClient(data: RegisterClientPayload, token?: string) {
    return proxyFetch('registerClient', data, token);
  },

  async transaction(data: any, token?: string) {
    const normalizedData = {
      ...data,
      method: data.method || 'Other',
      instructions: data.instructions || '',
      status: data.status.toLowerCase(),
      processed_at: data.processed_at || new Date().toISOString(),
    };
    return proxyFetch('transaction', normalizedData, token);
  },

  async activity(data: any, token?: string) {
    const normalizedData = {
      ...data,
      side: data.side ? data.side.toLowerCase() : undefined,
      opened_at: data.opened_at || new Date().toISOString(),
      volume: Number(data.volume) || 0.01,
    };
    return proxyFetch('activity', normalizedData, token);
  },

  async kycUpdate(data: any, token?: string) {
    const normalizedData = {
      ...data,
      status: data.status.toLowerCase(),
      reviewed_at: data.reviewed_at || new Date().toISOString(),
    };
    return proxyFetch('kycUpdate', normalizedData, token);
  },
};
