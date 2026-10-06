import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Building2, CreditCard, Copy, Landmark, Loader2, Lock, RefreshCw, Save,
  ShieldCheck, Webhook, Activity, FlaskConical,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../lib/api';

interface AdminPaymentsData {
  company: {
    id: string; name: string; legal_name: string | null; country: string | null;
    registration_number: string | null; vat_number: string | null; legal_address: string | null;
    support_email: string | null; support_phone: string | null; website: string | null; base_currency: string;
  };
  settings: {
    enabled: boolean; environment: 'SANDBOX' | 'PRODUCTION'; publicKey: string | null;
    hasSecret: boolean; sandboxBaseUrl: string; productionBaseUrl: string | null;
    cardEnabled: boolean; bankTransferEnabled: boolean; cardGatewayId: string | null;
    bankTransferGatewayId: string | null; defaultCurrency: string; supportedCurrencies: string[];
    minimumDeposit: number; maximumDeposit: number; webhookConfigured: boolean; updatedAt: string;
  };
  webhookUrl: string | null;
  validation: {
    current: { ok: boolean; errors: string[] };
    production: { ok: boolean; errors: string[] };
  };
  observability: { lastWebhookAt: string | null; lastSuccessfulPaymentAt: string | null; failedPayments24h: number };
}

const FORM_CURRENCIES = ['USD', 'EUR', 'GBP'];

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="glass-card p-6">
    <div className="flex items-center gap-2.5 mb-5">
      <span className="text-gold">{icon}</span>
      <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">{title}</h3>
    </div>
    {children}
  </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }> = ({ checked, onChange, disabled, label }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 ${checked ? 'bg-gold' : 'bg-white/10'}`}
    aria-label={label}
    aria-pressed={checked}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const inputCls = 'input-dark w-full text-sm';
const labelCls = 'text-[10px] font-bold uppercase tracking-widest text-text-dim block mb-1.5';

// Admin → Payments: TRAPAY configuration for the CURRENT company. The company
// is resolved server-side; there is no client-controlled company id. Editing is
// restricted to the platform 'admin' role (the API enforces this independently).
export const AdminPayments = () => {
  const { t } = useTranslation('common');
  const { role } = useAuth();
  const canEdit = role === 'admin';

  const [data, setData] = useState<AdminPaymentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[] | null>(null);

  // editable form state
  const [form, setForm] = useState({
    enabled: false, environment: 'SANDBOX' as 'SANDBOX' | 'PRODUCTION',
    publicKey: '', sandboxBaseUrl: '', productionBaseUrl: '',
    cardEnabled: false, cardGatewayId: '', bankTransferEnabled: false, bankTransferGatewayId: '',
    defaultCurrency: 'USD', currencies: [] as string[],
    minimumDeposit: 50, maximumDeposit: 100000, webhookConfigured: false,
  });
  const [secretInput, setSecretInput] = useState('');
  const [replaceSecret, setReplaceSecret] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/payments/trapay');
      if (!res.ok) throw new Error('load_failed');
      const payload: AdminPaymentsData = await res.json();
      setData(payload);
      const s = payload.settings;
      setForm({
        enabled: s.enabled, environment: s.environment, publicKey: s.publicKey ?? '',
        sandboxBaseUrl: s.sandboxBaseUrl, productionBaseUrl: s.productionBaseUrl ?? '',
        cardEnabled: s.cardEnabled, cardGatewayId: s.cardGatewayId ?? '',
        bankTransferEnabled: s.bankTransferEnabled, bankTransferGatewayId: s.bankTransferGatewayId ?? '',
        defaultCurrency: s.defaultCurrency, currencies: s.supportedCurrencies,
        minimumDeposit: s.minimumDeposit, maximumDeposit: s.maximumDeposit,
        webhookConfigured: s.webhookConfigured,
      });
      setValidationErrors(null);
    } catch {
      toast.error(t('adminPay.loadFailed', 'Failed to load payment settings'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (saving || !canEdit) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = { ...form };
      if (replaceSecret && secretInput.trim().length > 0) {
        body.secret = secretInput.trim();
      }
      const res = await apiFetch('/api/admin/payments/trapay', { method: 'PATCH', body: JSON.stringify(body) });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (payload?.errors && Array.isArray(payload.errors)) setValidationErrors(payload.errors);
        toast.error(payload?.error || t('adminPay.saveFailed', 'Failed to save settings'));
        return;
      }
      setReplaceSecret(false);
      setSecretInput('');
      toast.success(t('adminPay.saved', 'Payment settings saved'));
      await load();
    } catch {
      toast.error(t('adminPay.saveFailed', 'Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  const runSandboxTest = async () => {
    if (testing) return;
    setTesting(true);
    try {
      const res = await apiFetch('/api/admin/payments/trapay/test', { method: 'POST', body: JSON.stringify({ method: 'CARD' }) });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.ok) {
        toast.success(t('adminPay.testOk', 'Sandbox payment created — provider reachable'), {
          description: `order ${payload.orderId} · status ${payload.providerStatus ?? '—'}`,
        });
      } else {
        toast.error(payload?.error || t('adminPay.testFailed', 'Sandbox payment test failed'));
      }
    } catch {
      toast.error(t('adminPay.testFailed', 'Sandbox payment test failed'));
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }
  if (!data) {
    return <div className="p-8 text-sm text-text-muted">{t('adminPay.loadFailed', 'Failed to load payment settings')}</div>;
  }

  const { settings, company, webhookUrl, observability } = data;

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto animate-in fade-in duration-150">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-2xl font-light italic tracking-tight text-text flex items-center gap-3">
            <CreditCard className="text-gold" size={22} /> {t('adminPay.title', 'Payments')}
          </h2>
          <p className="text-sm text-text-muted mt-1">
            {t('adminPay.subtitle', 'TRAPAY configuration for the current company')}
          </p>
        </div>
        <button onClick={load} className="p-2 border border-border rounded-xl text-text-muted hover:text-text transition-all">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {!canEdit && (
        <div className="glass-card p-4 mb-6 flex items-center gap-2.5 text-xs text-text-muted border border-border">
          <Lock size={14} className="text-text-dim" />
          {t('adminPay.readOnly', 'Only platform administrators can change payment configuration.')}
        </div>
      )}

      {validationErrors && validationErrors.length > 0 && (
        <div className="glass-card p-5 mb-6 border border-danger/30">
          <p className="text-xs font-bold uppercase tracking-widest text-danger mb-2">
            {t('adminPay.validationTitle', 'Configuration validation failed')}
          </p>
          <ul className="text-xs text-text-muted space-y-1 list-disc list-inside">
            {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-6">
        {/* COMPANY */}
        <Section title={t('adminPay.section.company', 'Company')} icon={<Building2 size={16} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {([
              ['Name', company.name],
              ['Legal name', company.legal_name],
              ['Country', company.country],
              ['Registration No.', company.registration_number],
              ['VAT / Tax No.', company.vat_number],
              ['Legal address', company.legal_address],
              ['Support email', company.support_email],
              ['Support phone', company.support_phone],
              ['Website', company.website],
              ['Base currency', company.base_currency],
            ] as const).map(([label, value]) => (
              <div key={label}>
                <span className={labelCls}>{label}</span>
                <span className="text-text-muted">{value || '—'}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* TRAPAY STATUS */}
        <Section title={t('adminPay.section.status', 'TRAPAY Status')} icon={<Activity size={16} />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <span className={labelCls}>{t('adminPay.provider', 'Provider')}</span>
              <div className="flex items-center gap-2">
                <span className="text-text font-bold">TRAPAY</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${settings.enabled ? 'bg-success/10 text-success' : 'bg-white/10 text-text-muted'}`}>
                  {settings.enabled ? 'Connected' : 'Incomplete'}
                </span>
              </div>
            </div>
            <div>
              <span className={labelCls}>{t('adminPay.environment', 'Environment')}</span>
              <select
                value={form.environment}
                onChange={e => setForm(f => ({ ...f, environment: e.target.value as 'SANDBOX' | 'PRODUCTION' }))}
                disabled={!canEdit}
                className={inputCls}
              >
                <option value="SANDBOX">Sandbox</option>
                <option value="PRODUCTION">Production</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pb-1">
              <Toggle checked={form.enabled} onChange={v => setForm(f => ({ ...f, enabled: v }))} disabled={!canEdit} label="TRAPAY enabled" />
              <span className="text-xs text-text-muted">{t('adminPay.enabled', 'Enabled')}</span>
            </div>
          </div>
          <div className="mt-4 text-[11px] text-text-dim flex flex-wrap gap-x-6 gap-y-1">
            <span>{t('adminPay.lastWebhook', 'Last webhook')}: {observability.lastWebhookAt ? new Date(observability.lastWebhookAt).toLocaleString() : '—'}</span>
            <span>{t('adminPay.lastPaid', 'Last successful payment')}: {observability.lastSuccessfulPaymentAt ? new Date(observability.lastSuccessfulPaymentAt).toLocaleString() : '—'}</span>
            <span>{t('adminPay.failed24h', 'Failed payments 24h')}: {observability.failedPayments24h}</span>
          </div>
        </Section>

        {/* PAYMENT METHODS */}
        <Section title={t('adminPay.section.methods', 'Payment Methods')} icon={<CreditCard size={16} />}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard size={16} className="text-text-dim" />
                <span className="text-sm text-text">{t('adminPay.bankCard', 'Bank Card')} <span className="text-text-dim text-[10px] ml-1">Visa / Mastercard</span></span>
              </div>
              <Toggle checked={form.cardEnabled} onChange={v => setForm(f => ({ ...f, cardEnabled: v }))} disabled={!canEdit} label="Card enabled" />
            </div>
            {form.cardEnabled && (
              <div>
                <span className={labelCls}>Card Gateway ID</span>
                <input value={form.cardGatewayId} onChange={e => setForm(f => ({ ...f, cardGatewayId: e.target.value }))} disabled={!canEdit} className={inputCls} placeholder="from TRAPAY dashboard" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Landmark size={16} className="text-text-dim" />
                <span className="text-sm text-text">{t('adminPay.bankTransfer', 'Bank Transfer')}</span>
              </div>
              <Toggle checked={form.bankTransferEnabled} onChange={v => setForm(f => ({ ...f, bankTransferEnabled: v }))} disabled={!canEdit} label="Bank transfer enabled" />
            </div>
            {form.bankTransferEnabled && (
              <div>
                <span className={labelCls}>{t('adminPay.bankGateway', 'Bank Transfer / Open Banking Gateway ID')}</span>
                <input value={form.bankTransferGatewayId} onChange={e => setForm(f => ({ ...f, bankTransferGatewayId: e.target.value }))} disabled={!canEdit} className={inputCls} placeholder="from TRAPAY dashboard" />
              </div>
            )}
          </div>
        </Section>

        {/* CURRENCIES + LIMITS */}
        <Section title={t('adminPay.section.currencies', 'Currencies & Deposit Limits')} icon={<Activity size={16} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className={labelCls}>{t('adminPay.supportedCurrencies', 'Supported currencies')}</span>
              <div className="flex gap-2">
                {FORM_CURRENCIES.map(c => {
                  const active = form.currencies.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setForm(f => ({
                        ...f,
                        currencies: active ? f.currencies.filter(x => x !== c) : [...f.currencies, c],
                      }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        active ? 'bg-gold text-black border-gold' : 'text-text-muted border-border hover:bg-white/5'
                      } ${!canEdit ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              <span className={`${labelCls} mt-4`}>{t('adminPay.defaultCurrency', 'Default currency')}</span>
              <select
                value={form.defaultCurrency}
                onChange={e => setForm(f => ({ ...f, defaultCurrency: e.target.value }))}
                disabled={!canEdit}
                className={inputCls}
              >
                {(form.currencies.length > 0 ? form.currencies : [form.defaultCurrency]).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className={labelCls}>{t('adminPay.minDeposit', 'Minimum deposit')}</span>
                <input type="number" min={1} value={form.minimumDeposit} onChange={e => setForm(f => ({ ...f, minimumDeposit: Number(e.target.value) }))} disabled={!canEdit} className={inputCls} />
              </div>
              <div>
                <span className={labelCls}>{t('adminPay.maxDeposit', 'Maximum deposit')}</span>
                <input type="number" min={1} value={form.maximumDeposit} onChange={e => setForm(f => ({ ...f, maximumDeposit: Number(e.target.value) }))} disabled={!canEdit} className={inputCls} />
              </div>
            </div>
          </div>
        </Section>

        {/* CREDENTIALS */}
        <Section title={t('adminPay.section.credentials', 'Credentials')} icon={<ShieldCheck size={16} />}>
          <div className="space-y-4">
            <div>
              <span className={labelCls}>Public Key</span>
              <input value={form.publicKey} onChange={e => setForm(f => ({ ...f, publicKey: e.target.value }))} disabled={!canEdit} className={inputCls} autoComplete="off" />
            </div>
            <div>
              <span className={labelCls}>Secret / API credential</span>
              {settings.hasSecret && !replaceSecret ? (
                <div className="flex items-center gap-3">
                  <input value="••••••••••••••••" disabled className={`${inputCls} font-mono select-none`} />
                  <button
                    type="button"
                    onClick={() => setReplaceSecret(true)}
                    disabled={!canEdit}
                    className="px-3 py-2 rounded-lg border border-border text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-text hover:border-border-strong transition-all disabled:opacity-40 whitespace-nowrap"
                  >
                    {t('adminPay.replaceKey', 'Replace key')}
                  </button>
                </div>
              ) : (
                <input
                  type="password"
                  value={secretInput}
                  onChange={e => setSecretInput(e.target.value)}
                  disabled={!canEdit}
                  className={inputCls}
                  placeholder={settings.hasSecret ? t('adminPay.newSecret', 'New secret — saved encrypted, never shown again') : t('adminPay.enterSecret', 'Secret — saved encrypted, never shown')}
                  autoComplete="new-password"
                />
              )}
              <p className="text-[10px] text-text-dim mt-1.5">
                {t('adminPay.secretNote', 'Stored encrypted server-side; never returned to the browser or written to logs.')}
              </p>
            </div>
          </div>
        </Section>

        {/* WEBHOOK */}
        <Section title={t('adminPay.section.webhook', 'Webhook')} icon={<Webhook size={16} />}>
          <div className="flex items-center gap-3">
            <input value={webhookUrl ?? ''} disabled readOnly className={`${inputCls} font-mono text-xs`} />
            <button
              type="button"
              onClick={() => { if (webhookUrl) { navigator.clipboard?.writeText(webhookUrl); toast.success(t('adminPay.copied', 'Copied')); } }}
              className="p-2 rounded-lg border border-border text-text-muted hover:text-text hover:border-border-strong transition-all shrink-0"
              aria-label="Copy webhook URL"
            >
              <Copy size={14} />
            </button>
          </div>
          <label className="flex items-center gap-3 mt-4 text-xs text-text-muted cursor-pointer">
            <Toggle checked={form.webhookConfigured} onChange={v => setForm(f => ({ ...f, webhookConfigured: v }))} disabled={!canEdit} label="Webhook configured" />
            {t('adminPay.webhookConfigured', 'Webhook URL is configured in the TRAPAY dashboard')}
          </label>
          <p className="text-[10px] text-text-dim mt-2">
            {t('adminPay.webhookNote', 'TRAPAY webhook signature verification is not publicly documented (TRAPAY_DOCUMENTATION_REQUIRED): events are recorded but cannot credit balances until the official specification is implemented.')}
          </p>
        </Section>

        {/* ACTIONS */}
        <div className="flex flex-wrap items-center gap-3 pb-4">
          <button onClick={save} disabled={saving || !canEdit} className="btn-gold inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {t('adminPay.save', 'Save Changes')}
          </button>
          {settings.environment === 'SANDBOX' && (
            <button
              onClick={runSandboxTest}
              disabled={testing || !canEdit}
              className="px-5 py-2.5 rounded-xl border border-white/15 text-white hover:bg-white/5 inline-flex items-center gap-2 text-sm disabled:opacity-40"
            >
              {testing ? <Loader2 size={16} className="animate-spin" /> : <FlaskConical size={16} />}
              {t('adminPay.runSandboxTest', 'Run Sandbox Payment Test')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
