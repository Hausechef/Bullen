import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Users, TrendingUp, Award, Check, Loader2, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

interface ReferralStats {
  totalReferrals: number;
  activeTraders: number;
  totalRewards: number;
}

function buildRefLink(userId: string): string {
  const code = userId.replace(/-/g, '').slice(0, 10).toUpperCase();
  const base = window.location.origin;
  return `${base}/trade/register?ref=${code}`;
}

export const Referrals = () => {
  const { t } = useTranslation('common');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refLink, setRefLink] = useState('');
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeTraders: 0,
    totalRewards: 0,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const link = buildRefLink(user.id);
        setRefLink(link);

        const refCode = user.id.replace(/-/g, '').slice(0, 10).toUpperCase();

        const { data: referred } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', refCode);

        const referredIds = (referred || []).map((u: any) => u.id);
        const totalReferrals = referredIds.length;

        let activeTraders = 0;
        let totalRewards = 0;

        if (referredIds.length > 0) {
          const { data: activeTx } = await supabase
            .from('transactions')
            .select('user_id, amount')
            .in('user_id', referredIds)
            .eq('type', 'deposit')
            .eq('status', 'approved');

          const uniqueActive = new Set((activeTx || []).map((t: any) => t.user_id));
          activeTraders = uniqueActive.size;
          const volume = (activeTx || []).reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);
          totalRewards = Math.floor(volume * 0.001 * 100) / 100;
        }

        setStats({ totalReferrals, activeTraders, totalRewards });
      } catch (err) {
        console.warn('[Referrals] Failed to load referral data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCopy = () => {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    toast.success(t('linkCopied', { defaultValue: 'Referral link copied to clipboard' }));
    setTimeout(() => setCopied(false), 2000);
  };

  const statCards = [
    {
      label: t('totalReferrals', { defaultValue: 'Total Referrals' }),
      value: loading ? '—' : String(stats.totalReferrals),
      icon: Users,
      color: 'text-blue-400',
    },
    {
      label: t('activeTraders', { defaultValue: 'Active Traders' }),
      value: loading ? '—' : String(stats.activeTraders),
      icon: TrendingUp,
      color: 'text-accent-primary',
    },
    {
      label: t('totalRewards', { defaultValue: 'Total Rewards' }),
      value: loading ? '—' : `$ ${stats.totalRewards.toFixed(2)}`,
      icon: Award,
      color: 'text-accent-secondary',
    },
  ];

  return (
    <div className="p-4 lg:p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">{t('referrals')}</h1>
        <p className="text-slate-400 mb-8">
          {t('referralsDesc', { defaultValue: 'Invite your friends and earn rewards for every active trade they make.' })}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  {loading ? (
                    <Loader2 className="w-5 h-5 text-slate-500 animate-spin mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-8 bg-gradient-to-br from-accent-primary/10 to-transparent">
            <h3 className="text-xl font-bold text-white mb-6">{t('referralLink')}</h3>
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading your link…
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-slate-300 font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                    {refLink}
                  </div>
                  <button
                    onClick={handleCopy}
                    className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                      copied
                        ? 'bg-accent-secondary text-black'
                        : 'bg-accent-primary text-black hover:scale-105'
                    }`}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? t('copied') : t('copy')}
                  </button>
                </div>
                <a
                  href={refLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <ExternalLink size={12} />
                  {t('testLink', { defaultValue: 'Preview registration page with your ref code' })}
                </a>
              </div>
            )}
          </div>

          <div className="glass-card p-8">
            <h3 className="text-xl font-bold text-white mb-6">{t('howItWorks')}</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center font-bold text-black flex-shrink-0">1</div>
                <div>
                  <p className="font-bold text-white mb-1">{t('shareLink', { defaultValue: 'Share your link' })}</p>
                  <p className="text-sm text-slate-400">{t('shareLinkDesc', { defaultValue: 'Send your unique referral link to friends and colleagues.' })}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center font-bold text-black flex-shrink-0">2</div>
                <div>
                  <p className="font-bold text-white mb-1">{t('theySignUp', { defaultValue: 'They sign up' })}</p>
                  <p className="text-sm text-slate-400">{t('theySignUpDesc', { defaultValue: 'When they register via your link, they become your referral.' })}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center font-bold text-black flex-shrink-0">3</div>
                <div>
                  <p className="font-bold text-white mb-1">{t('earnRewards', { defaultValue: 'Earn rewards' })}</p>
                  <p className="text-sm text-slate-400">{t('earnRewardsDesc', { defaultValue: 'Receive 0.1% of every deposit your referrals make.' })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
