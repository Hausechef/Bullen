import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Webhook, Activity, History, Server, Search, CheckCircle2, AlertCircle, Play, Database, FileText, Settings, Key, Pause, RefreshCcw } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';

const webhooks: any[] = [];

const syncEvents: any[] = [];

export const CRMSyncPanel: React.FC = () => {
  const { t } = useTranslation(['common']);
  const [showSecretConfig, setShowSecretConfig] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState('');
  const [isSecretEnabled, setIsSecretEnabled] = useState(false);
  const [isSecretVisible, setIsSecretVisible] = useState(false);

  return (
    <div className="col-span-12 grid grid-cols-12 gap-6 animate-in fade-in duration-150">
      
      {/* Top Metrics Map */}
      <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-secondary/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-xl bg-slate-500/10 text-slate-500">
              <Activity size={20} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded">{t('adminCrm.metrics.notConfigured')}</span>
          </div>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('adminCrm.metrics.connection')}</h4>
          <p className="text-2xl font-bold font-mono text-white mb-2">{t('adminCrm.metrics.na')}</p>
          <p className="text-[10px] font-bold text-slate-400">{t('adminCrm.metrics.uptime')}</p>
        </div>

        <div className="glass-card p-6 border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary">
              <RefreshCw size={20} />
            </div>
          </div>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('adminCrm.metrics.synced')}</h4>
          <p className="text-2xl font-bold font-mono text-white mb-2">0</p>
          <p className="text-[10px] font-bold text-accent-primary">{t('adminCrm.metrics.vsYesterday', { val: 0 })}</p>
        </div>

        <div className="glass-card p-6 border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <History size={20} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">{t('adminCrm.metrics.active', { val: 0 })}</span>
          </div>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('adminCrm.metrics.pending')}</h4>
          <p className="text-2xl font-bold font-mono text-white mb-2">0</p>
        </div>

        <div className="glass-card p-6 border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <AlertCircle size={20} />
            </div>
          </div>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('adminCrm.metrics.deadLetter')}</h4>
          <p className="text-2xl font-bold font-mono text-white mb-2">0</p>
        </div>
      </div>

      {/* Webhooks Config */}
      <div className="col-span-12 xl:col-span-8 space-y-6">
        {/* Secret Management (New) */}
        <AnimatePresence mode="wait">
          {showSecretConfig && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-6 border-accent-secondary/20 bg-accent-secondary/[0.02] mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <Key size={18} className="text-accent-secondary" /> {t('adminCrm.secret.title')}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">{t('adminCrm.secret.subtitle')}</p>
                  </div>
                  <button 
                    onClick={() => setShowSecretConfig(false)}
                    className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                  >
                    <Pause size={16} />
                  </button>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl flex items-start gap-4">
                    <AlertCircle size={20} className="text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">{t('adminCrm.secret.warningTitle')}</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {t('adminCrm.secret.warningDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-white mb-1">{t('adminCrm.secret.enable')}</p>
                        <p className="text-[10px] text-slate-500">{t('adminCrm.secret.enableDesc')}</p>
                      </div>
                      <button 
                        onClick={() => setIsSecretEnabled(!isSecretEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${isSecretEnabled ? 'bg-accent-secondary' : 'bg-slate-700'}`}
                      >
                        <motion.div 
                          animate={{ x: isSecretEnabled ? 26 : 2 }}
                          className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-lg"
                        />
                      </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">{t('adminCrm.secret.activeKey')}</label>
                        <div className="relative group">
                          <input 
                            type={isSecretVisible ? 'text' : 'password'}
                            value={webhookSecret}
                            onChange={(e) => setWebhookSecret(e.target.value)}
                            disabled={!isSecretEnabled}
                            className={`w-full bg-black/40 border-white/10 group-focus-within:border-accent-secondary/50 rounded-xl px-4 py-3 text-sm font-mono text-white outline-none transition-all ${!isSecretEnabled && 'opacity-50 grayscale'}`}
                          />
                          <button 
                            onClick={() => setIsSecretVisible(!isSecretVisible)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-white transition-colors"
                          >
                            {isSecretVisible ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                        </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 py-3 bg-accent-secondary/10 hover:bg-accent-secondary/20 border border-accent-secondary/20 rounded-xl text-xs font-bold text-accent-secondary uppercase tracking-widest transition-all">
                      {t('adminCrm.secret.rotate')}
                    </button>
                    <button className="flex-1 py-3 bg-white hover:bg-slate-200 rounded-xl text-xs font-bold text-black uppercase tracking-widest transition-all">
                      {t('adminCrm.secret.save')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="glass-card p-6 border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Webhook size={18} className="text-accent-primary" /> {t('adminCrm.endpoints.title')}
            </h3>
            <button 
              onClick={() => setShowSecretConfig(!showSecretConfig)}
              className={`px-4 py-2 border rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                showSecretConfig 
                  ? 'bg-accent-secondary text-white border-accent-secondary' 
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
              }`}
            >
              <Key size={14} /> {showSecretConfig ? t('adminCrm.secret.hide') : t('adminCrm.secret.configure')}
            </button>
          </div>

          <div className="space-y-4">
            {webhooks.length === 0 ? (
               <div className="text-center py-8 text-slate-500 text-sm">{t('adminCrm.endpoints.none')}</div>
            ) : webhooks.map((wh) => (
              <div key={wh.id} className="p-4 border border-white/5 rounded-xl glass-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-sm font-bold text-white">{wh.name}</h4>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                      wh.status === 'active' ? 'bg-accent-secondary/10 text-accent-secondary' : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {wh.status}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-500 mb-3 truncate max-w-md">{wh.endpoint}</p>
                  <div className="flex flex-wrap gap-2">
                    {wh.events.map((evt: any) => (
                      <span key={evt} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-slate-400">
                        {evt}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2 shrink-0">
                  <button className="p-2 border border-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <Settings size={16} />
                  </button>
                  <button className="p-2 border border-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    {wh.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-6 py-4 border border-white/10 border-dashed rounded-xl text-xs font-bold text-slate-500 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all uppercase tracking-widest">
            {t('adminCrm.endpoints.add')}
          </button>
        </div>

        {/* Data Architecture Info */}
        <div className="glass-card p-6 border-white/5 glass-card">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Database size={18} className="text-accent-secondary" /> {t('adminCrm.dataPolicy.title')}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              <Trans i18nKey="adminCrm.dataPolicy.desc">
                Financial figures, such as <strong className="text-white">balances, transaction amounts, and portfolio values</strong>, must come from account records or synchronized CRM events before reporting.
              </Trans>
            </p>
            <div className="flex flex-col md:flex-row gap-4">
               <div className="flex-1 p-4 bg-accent-secondary/5 border border-accent-secondary/10 rounded-xl">
                 <p className="text-[10px] font-bold text-accent-secondary uppercase tracking-widest mb-1">{t('adminCrm.dataPolicy.balanceTitle')}</p>
                 <p className="text-xs text-slate-400">{t('adminCrm.dataPolicy.balanceDesc')}</p>
               </div>
               <div className="flex-1 p-4 bg-white/5 border border-white/10 rounded-xl">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('adminCrm.dataPolicy.retentionTitle')}</p>
                 <p className="text-xs text-slate-400">{t('adminCrm.dataPolicy.retentionDesc')}</p>
               </div>
            </div>
        </div>
      </div>

      {/* Audit Trail & Logs */}
      <div className="col-span-12 xl:col-span-4 space-y-6">
        <div className="glass-card p-6 border-white/5 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <FileText size={18} className="text-accent-quaternary" /> {t('adminCrm.audit.title')}
            </h3>
            <div className="flex gap-2">
              <button className="p-1.5 text-slate-500 hover:text-white transition-colors"><Search size={14} /></button>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            {syncEvents.length === 0 ? (
               <div className="text-center py-8 text-slate-500 text-sm">{t('adminCrm.audit.none')}</div>
            ) : syncEvents.map((evt) => (
              <div key={evt.id} className="p-3 border border-white/5 rounded-xl glass-card hover:bg-white/5 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {evt.status === 'success' ? (
                      <CheckCircle2 size={14} className="text-accent-secondary" />
                    ) : (
                      <AlertCircle size={14} className="text-rose-500" />
                    )}
                    <span className="text-xs font-mono font-bold text-white">{evt.type}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{evt.time}</span>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] font-mono text-slate-500">{t('adminCrm.audit.target', { user: evt.user })}</span>
                  {evt.status === 'failed' && (
                    <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                      {evt.error}
                    </span>
                  )}
                </div>

                {evt.retries > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">{t('adminCrm.audit.retries', { count: evt.retries })}</span>
                    <button className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                      <RefreshCcw size={10} /> {t('adminCrm.audit.forceRetry')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-colors uppercase tracking-widest">
            {t('adminCrm.audit.viewAll')}
          </button>
        </div>
      </div>

    </div>
  );
};
