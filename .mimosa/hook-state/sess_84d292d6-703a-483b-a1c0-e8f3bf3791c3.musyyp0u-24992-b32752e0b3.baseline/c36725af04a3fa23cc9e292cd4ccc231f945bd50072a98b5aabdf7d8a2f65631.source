import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Book, HelpCircle, Send, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { openLiveChat } from '../../components/chat/LiveChat';
import { LuxIcon, LuxIconTile } from '../../components/common/LuxIcon';

const CATEGORIES = [
  'Account Issue',
  'Trading Problem',
  'Payment / Withdrawal',
  'KYC Verification',
  'Feedback',
  'Other',
];

export const Support = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [ticketReplies, setTicketReplies] = useState<Record<string, any[]>>({});
  const [user, setUser] = useState<any>(null);

  const faqs = [
    { q: t('faqDepositQ', { defaultValue: 'How do I deposit funds?' }),         a: t('faqDepositA', { defaultValue: 'Navigate to Portfolio and click the Deposit button. Choose your method and amount.' }) },
    { q: t('faqHoursQ',   { defaultValue: 'What are the trading hours?' }),      a: t('faqHoursA',   { defaultValue: 'Crypto markets are open 24/7. Forex and Metals follow global market hours (Mon-Fri).' }) },
    { q: t('faqLiqQ',     { defaultValue: 'How is liquidation price calculated?' }), a: t('faqLiqA', { defaultValue: 'Liquidation is based on your margin ratio and the mark price of the asset.' }) },
    { q: t('faqKycQ',     { defaultValue: 'How long does KYC verification take?' }), a: t('faqKycA', { defaultValue: 'KYC review typically takes 1–2 business days. You will be notified once approved.' }) },
  ];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user?.email) setEmail(prev => prev || data.user.email!);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from('support_tickets').select('*').eq('client_id', user.id).order('created_at', { ascending: false }).limit(10)
      .then(async ({ data }) => {
        const tickets = data || [];
        setMyTickets(tickets);
        if (tickets.length > 0) {
          const { data: replies } = await supabase
            .from('ticket_comments')
            .select('id, ticket_id, body, created_at')
            .in('ticket_id', tickets.map((t: any) => t.id))
            .order('created_at', { ascending: true });
          const map: Record<string, any[]> = {};
          (replies ?? []).forEach((r: any) => { (map[r.ticket_id] ??= []).push(r); });
          setTicketReplies(map);
        }
      });
  }, [user, submitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) { toast.error(t('enterMessage', { defaultValue: 'Please enter your message' })); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error(t('enterValidEmail', { defaultValue: 'Please enter a valid email address' }));
      return;
    }
    if (!user) { toast.error(t('loginFirst', { defaultValue: 'Please log in first' })); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('support_tickets').insert({
        client_id:     user.id,
        created_by:    user.id,
        subject:       category,
        category,
        contact_email: email.trim(),
        message:       message.trim(),
        status:        'new',
      });
      if (error) throw error;
      setSubmitted(true);
      setMessage('');
      toast.success(t('ticketSubmitted', { defaultValue: 'Your ticket has been submitted' }));
    } catch (err: any) {
      toast.error(err.message || t('ticketFailed', { defaultValue: 'Failed to submit ticket' }));
    } finally {
      setSubmitting(false);
    }
  };

  const statusStyle = (s: string) =>
    s === 'resolved' || s === 'closed' ? 'bg-emerald-500/10 text-emerald-400' :
    s === 'new' || s === 'open'        ? 'bg-orange-500/10 text-orange-400'   :
                                         'bg-blue-500/10 text-blue-400';

  return (
    <div className="p-4 lg:p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">{t('help', { defaultValue: 'Support Center' })}</h1>
        <p className="text-slate-400 mb-8">{t('helpDesc', { defaultValue: 'Our support team is available 24/7.' })}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* FAQ */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <LuxIcon icon={HelpCircle} size={20} />
                {t('faq', { defaultValue: 'Frequently Asked Questions' })}
              </h2>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <details key={i} className="group bg-white/5 rounded-xl border border-white/5 open:border-accent-primary/20 transition-all">
                    <summary className="p-4 font-bold text-white cursor-pointer list-none flex items-center justify-between">
                      {faq.q}
                      <span className="group-open:rotate-180 transition-transform text-text-dim">▼</span>
                    </summary>
                    <div className="px-4 pb-4 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">{faq.a}</div>
                  </details>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/trade/docs')}
                className="glass-card p-6 flex items-center gap-4 hover:bg-white/[0.02] cursor-pointer transition-all text-left"
              >
                <LuxIconTile icon={Book} size={48} iconSize={24} />
                <div>
                  <p className="font-bold text-white">{t('documentation', { defaultValue: 'Documentation' })}</p>
                  <p className="text-xs text-slate-500">{t('readGuides', { defaultValue: 'Read our detailed guides' })}</p>
                </div>
              </button>
              <button
                onClick={openLiveChat}
                className="glass-card p-6 flex items-center gap-4 hover:bg-white/[0.02] cursor-pointer transition-all text-left"
              >
                <LuxIconTile icon={MessageSquare} size={48} iconSize={24} />
                <div>
                  <p className="font-bold text-white">{t('liveChat', { defaultValue: 'Live Chat' })}</p>
                  <p className="text-xs text-slate-500">{t('speakAgent', { defaultValue: 'Speak with our AI assistant' })}</p>
                </div>
              </button>
            </div>

            {/* My tickets */}
            {myTickets.length > 0 && (
              <div className="glass-card p-6">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Clock size={16} className="text-accent-primary" /> {t('myTickets', { defaultValue: 'My Tickets' })}
                </h2>
                <div className="space-y-2">
                  {myTickets.map(tk => (
                    <div key={tk.id} className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-start gap-3">
                        <AlertCircle size={14} className="text-text-dim mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-text-dim">{tk.category || tk.subject}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${statusStyle(tk.status)}`}>{tk.status}</span>
                          </div>
                          <p className="text-xs text-text-muted truncate">{tk.message}</p>
                        </div>
                        <span className="text-[10px] text-text-dim shrink-0">{new Date(tk.created_at).toLocaleDateString()}</span>
                      </div>
                      {(ticketReplies[tk.id]?.length ?? 0) > 0 && (
                        <div className="mt-2.5 ml-7 space-y-1.5">
                          {ticketReplies[tk.id].map(r => (
                            <div key={r.id} className="p-2.5 bg-accent-primary/5 border border-accent-primary/15 rounded-lg">
                              <p className="text-[9px] font-bold uppercase tracking-wider text-accent-primary mb-0.5">
                                {t('supportReply', { defaultValue: 'Support reply' })} · {new Date(r.created_at).toLocaleString()}
                              </p>
                              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap break-words">{r.body}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contact form */}
          <div className="glass-card p-8 h-fit sticky top-8">
            <h2 className="text-xl font-bold text-white mb-6">{t('contactSupport', { defaultValue: 'Contact Support' })}</h2>
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-accent-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-accent-secondary">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{t('messageSent', { defaultValue: 'Message Sent' })}</h3>
                  <p className="text-sm text-slate-400 mb-6">{t('messageSentDesc', { defaultValue: 'Thank you. We will get back to you shortly.' })}</p>
                  <button onClick={() => setSubmitted(false)} className="text-accent-primary font-bold text-sm hover:underline">
                    {t('sendAnother', { defaultValue: 'Send another message' })}
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{t('category', { defaultValue: 'Category' })}</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none appearance-none"
                    >
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{t('emailAddress', { defaultValue: 'Email for reply' })}</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-primary/50 transition-colors"
                      placeholder={t('emailPlaceholder', { defaultValue: 'you@example.com' })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{t('message', { defaultValue: 'Message' })}</label>
                    <textarea
                      required
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none min-h-[150px] resize-none"
                      placeholder={t('describeIssue', { defaultValue: 'Describe your issue...' })}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-accent-primary hover:bg-accent-primary/90 text-black font-bold rounded-xl shadow-neon-gold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Send size={18} />}
                    {submitting ? t('sending', { defaultValue: 'Sending...' }) : t('sendRequest', { defaultValue: 'Send Request' })}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
