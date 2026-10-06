import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, UserPlus, AlertCircle, User, CheckCircle2, Phone, Globe, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { crmService } from '../../services/crmService';
import { getAttribution } from '../../hooks/useAttribution';
import { COUNTRIES, type Country } from '../../../crm/data/countries';
import { useTranslation } from 'react-i18next';

export const Register: React.FC = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [country,   setCountry]   = useState<Country | null>(null);
  const [localPhone, setLocalPhone] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);

  const fullPhone = country && localPhone.trim() ? `${country.dialCode}${localPhone.trim().replace(/^0/, '')}` : '';
  const fullName  = `${firstName.trim()} ${lastName.trim()}`.trim();

  const handleCountryChange = (code: string) => {
    const found = COUNTRIES.find(c => c.code === code) ?? null;
    setCountry(found);
    setLocalPhone('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) { setError(t('auth.register.errors.firstNameRequired')); return; }
    if (!lastName.trim())  { setError(t('auth.register.errors.lastNameRequired')); return; }
    if (!country)          { setError(t('auth.register.errors.countryRequired')); return; }
    if (!localPhone.trim()) { setError(t('auth.register.errors.phoneRequired')); return; }

    setLoading(true);
    setError(null);

    try {
      if (import.meta.env.DEV && import.meta.env.VITE_SUPABASE_URL?.includes('dummy')) {
        await new Promise(r => setTimeout(r, 1000));
        setSuccess(true);
        return;
      }

      let userSession = null;
      let userId: string | null = null;

      try {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/trade/dashboard`,
            data: {
              full_name:  fullName,
              first_name: firstName.trim(),
              last_name:  lastName.trim(),
              country:    country.name,
              phone:      fullPhone,
            },
          },
        });
        if (signUpError) throw signUpError;
        userSession = data.session;
        userId = data.user?.id ?? null;
      } catch (authError: any) {
        if (authError.message?.includes('Failed to fetch') || import.meta.env.VITE_SUPABASE_URL?.includes('dummy')) {
          setSuccess(true);
          return;
        }
        throw authError;
      }

      // Persist extended profile to users table (works when auto-confirm is on)
      if (userId) {
        try {
          await supabase.from('users').upsert({
            id:         userId,
            email,
            full_name:  fullName,
            first_name: firstName.trim(),
            last_name:  lastName.trim(),
            country:    country.name,
            phone:      fullPhone,
          }, { onConflict: 'id' });
        } catch (_) { /* Non-fatal — trigger may handle this */ }
      }

      // Register in CRM
      try {
        const attribution = getAttribution();
        if (userId) {
          await crmService.registerClient({
            external_trader_id: userId,
            full_name: fullName,
            email,
            account: {
              external_account_id: `ACC-${userId}`,
              platform:     'Bullenhaus',
              account_type: 'real',
              currency:     'USD',
              balance:      0,
              equity:       0,
              leverage:     100,
            },
            ...(attribution ? { attribution } : {}),
          }, userSession?.access_token);
        }
      } catch (_) {
        // Non-fatal CRM error
      }

      if (userSession) {
        navigate('/trade/dashboard', { replace: true });
        return;
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || t('auth.register.errors.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 text-center">
        <div className="w-14 h-14 mx-auto bg-gold-soft rounded-full flex items-center justify-center mb-5">
          <CheckCircle2 size={28} className="text-gold" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-text mb-2">{t('auth.register.successTitle')}</h2>
        <p className="text-sm text-text-muted mb-6">
          {t('auth.register.successSubtitle')}
        </p>
        <Link to="/login" className="btn-gold inline-flex">{t('auth.register.returnToLogin')}</Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-7">
        <h2 className="font-serif text-2xl font-semibold text-text tracking-tight">{t('auth.register.title')}</h2>
        <p className="text-sm text-text-muted mt-1.5">{t('auth.register.subtitle')}</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-5 p-3.5 rounded-xl bg-danger/10 border border-danger/30 flex items-start gap-3"
        >
          <AlertCircle className="text-danger shrink-0 mt-0.5" size={16} />
          <p className="text-xs text-danger">{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">

        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-eyebrow block mb-2">{t('auth.register.firstNameLabel')}</label>
            <div className="relative">
              <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                className="input-dark pl-10 text-sm" placeholder={t('auth.register.firstNamePlaceholder')} required />
            </div>
          </div>
          <div>
            <label className="label-eyebrow block mb-2">{t('auth.register.lastNameLabel')}</label>
            <div className="relative">
              <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                className="input-dark pl-10 text-sm" placeholder={t('auth.register.lastNamePlaceholder')} required />
            </div>
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="label-eyebrow block mb-2">{t('auth.register.countryLabel')}</label>
          <div className="relative">
            <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none z-10" />
            <select
              value={country?.code ?? ''}
              onChange={e => handleCountryChange(e.target.value)}
              className="input-dark pl-10 pr-9 appearance-none w-full cursor-pointer"
              required
            >
              <option value="" disabled>{t('auth.register.countryPlaceholder')}</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="label-eyebrow block mb-2">{t('auth.register.phoneLabel')}</label>
          <div className="flex gap-2">
            {/* Dial code badge */}
            <div className="flex items-center gap-1.5 px-3 rounded-xl bg-black/40 border border-border text-text-muted text-sm font-mono shrink-0 min-w-[72px] justify-center select-none">
              {country ? (
                <span>{country.flag} {country.dialCode}</span>
              ) : (
                <span className="text-text-dim text-xs">+—</span>
              )}
            </div>
            <div className="relative flex-1">
              <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
              <input
                type="tel"
                value={localPhone}
                onChange={e => setLocalPhone(e.target.value.replace(/[^\d\s\-()]/g, ''))}
                className="input-dark pl-10 w-full"
                placeholder={country ? t('auth.register.phonePlaceholder') : t('auth.register.phoneDisabledPlaceholder')}
                disabled={!country}
                required
              />
            </div>
          </div>
          {fullPhone && (
            <p className="text-[10px] text-text-dim mt-1.5 font-mono">{t('auth.register.phoneStoredAs')} {fullPhone}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="label-eyebrow block mb-2">{t('auth.register.emailLabel')}</label>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="input-dark pl-11" placeholder={t('auth.register.emailPlaceholder')} required />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="label-eyebrow block mb-2">{t('auth.register.passwordLabel')}</label>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="input-dark pl-11" placeholder={t('auth.register.passwordPlaceholder')} required minLength={8} />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-gold w-full mt-6">
          {loading ? (
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <><UserPlus size={16} /> {t('auth.register.submitBtn')}</>
          )}
        </button>
      </form>

      <div className="mt-7 pt-6 border-t border-border text-center text-sm text-text-muted">
        {t('auth.register.hasAccount')}{' '}
        <Link to="/login" className="font-bold text-gold hover:text-gold-light transition-colors ml-1">{t('auth.register.loginBtn')}</Link>
      </div>
    </div>
  );
};
