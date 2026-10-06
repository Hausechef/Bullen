import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { User, Camera, Save, Shield, Languages, History, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useUserStore } from '../../stores/userStore';
import { toast } from 'sonner';

export const ProfileSettings: React.FC = () => {
  const { user, kycStatus } = useAuth();
  const { profile, updateProfile: updateUserStore } = useUserStore();
  const { t, i18n } = useTranslation('common');
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.display_name || profile.full_name || profile.username || user?.user_metadata?.full_name || '');
      setAvatarUrl(profile.avatar_url || user?.user_metadata?.avatar_url || '');
    }
    // Store login timestamp in localStorage for "last session"
    const prev = localStorage.getItem('bh_last_login');
    setLastSeen(prev);
    localStorage.setItem('bh_last_login', new Date().toISOString());
  }, [profile, user]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    toast.success(`Language changed to ${lng.toUpperCase()}`);
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Update Supabase Auth metadata
      const { error: authErr } = await supabase.auth.updateUser({
        data: { display_name: fullName, full_name: fullName, avatar_url: avatarUrl },
      });
      if (authErr) throw authErr;

      // Update public.users table
      if (user?.id) {
        const { error: dbErr } = await supabase
          .from('users')
          .update({ display_name: fullName, full_name: fullName, avatar_url: avatarUrl })
          .eq('id', user.id);
        if (dbErr) throw dbErr;
      }

      await updateUserStore({ display_name: fullName, full_name: fullName, avatar_url: avatarUrl });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const generateAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`);
  };

  const kycBadge = kycStatus === 'VERIFIED'
    ? { label: 'Verified', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
    : kycStatus === 'PENDING'
    ? { label: 'Pending',  cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' }
    : kycStatus === 'REJECTED'
    ? { label: 'Rejected', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
    : { label: 'Unverified', cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-[0.2em]">{t('operatorProfile', { defaultValue: 'Profile' })}</h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-sm text-text-muted font-mono">{user?.email}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${kycBadge.cls}`}>
              {kycStatus === 'VERIFIED' && <CheckCircle2 size={9} />} {kycBadge.label}
            </span>
            <span className="px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider bg-accent-primary/10 text-accent-primary border-accent-primary/20">
              {profile?.role || 'client'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary/10 border border-accent-primary/20 rounded-lg text-[10px] font-bold text-accent-primary uppercase tracking-widest">
          <Shield size={12} /> Encrypted Session
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Identity */}
          <div className="glass-card p-8 relative overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
              <User size={20} className="text-accent-primary" />
              {t('identityConfig', { defaultValue: 'Identity' })}
            </h3>

            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group cursor-pointer" onClick={generateAvatar}>
                  <div className="w-28 h-28 rounded-full border-4 border-[#111] overflow-hidden shadow-neon-gold p-1 bg-gradient-to-br from-accent-primary to-yellow-600">
                    <img
                      src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                      alt="Avatar"
                      className="w-full h-full rounded-full bg-[#050505] object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white mb-1" size={20} />
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider">Randomize</span>
                  </div>
                </div>
                <p className="text-[10px] text-text-dim text-center">Click avatar to randomize</p>
              </div>

              <form onSubmit={updateProfile} className="flex-1 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('displayName', { defaultValue: 'Display Name' })}</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-[#111] border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:border-accent-primary/50 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
                  <input
                    type="text"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-[#111] border border-white/5 rounded-xl py-3 px-4 text-sm text-text-dim cursor-not-allowed"
                  />
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-accent-primary/10 border border-accent-primary/30 rounded-xl text-xs font-bold text-accent-primary hover:bg-accent-primary hover:text-black shadow-neon-gold transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
                    {t('updateProtocol', { defaultValue: 'Save Changes' })}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Language */}
          <div className="glass-card p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
              <Languages size={20} className="text-accent-secondary" />
              {t('localizationUnits', { defaultValue: 'Language' })}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { code: 'en', label: 'English (Global)', sub: 'Standard market terminology' },
                { code: 'de', label: 'Deutsch (German)', sub: 'Vollständige Lokalisierung' },
              ].map(({ code, label, sub }) => (
                <button
                  key={code}
                  onClick={() => changeLanguage(code)}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    i18n.language === code
                      ? 'bg-accent-secondary/10 border-accent-secondary/50'
                      : 'bg-white/5 border-white/5 hover:border-white/10'
                  }`}
                >
                  <p className="text-xs font-bold text-white mb-1">{label}</p>
                  <p className="text-[10px] text-slate-500 uppercase">{sub}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent-tertiary/20 flex items-center justify-center text-accent-tertiary">
                <History size={20} />
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">{t('entryHistory', { defaultValue: 'Session Info' })}</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Current login</span>
                <span className="text-slate-300 font-mono">Now</span>
              </div>
              {lastSeen && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Previous session</span>
                  <span className="text-slate-300 font-mono">{new Date(lastSeen).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">KYC Status</span>
                <span className={`font-bold ${kycStatus === 'VERIFIED' ? 'text-emerald-400' : 'text-orange-400'}`}>{kycStatus || 'UNVERIFIED'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Role</span>
                <span className="text-accent-primary font-bold uppercase">{profile?.role || 'client'}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-secondary/10 flex items-center justify-center text-accent-secondary">
                <Shield size={20} />
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">Security</h4>
            </div>
            <p className="text-xs text-text-muted mb-4">Your account is protected by end-to-end encryption and session-based authentication.</p>
            <div className="flex items-center gap-2 text-xs text-accent-secondary">
              <CheckCircle2 size={12} /> Session encrypted
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
