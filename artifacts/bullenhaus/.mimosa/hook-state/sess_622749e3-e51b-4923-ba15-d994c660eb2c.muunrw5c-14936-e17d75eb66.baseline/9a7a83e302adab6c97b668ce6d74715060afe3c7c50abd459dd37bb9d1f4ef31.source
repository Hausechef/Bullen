import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { aiStatus, aiChat } from '../../../../lib/ai/aiClient';

const SYSTEM_PROMPT = `You are the Bullenhouse live chat assistant for a client-facing trading platform.

Your job is to help clients understand and navigate the product without inventing features or giving financial advice.

Known product map:
- Auth: login, registration, password recovery, reset password.
- Main navigation: Dashboard, Markets, Trade Terminal, Pre-Market, Portfolio, Transactions, Rewards, Referrals, Notifications, KYC, Settings, Support.
- KYC: clients upload passport, ID card, or selfie-with-ID documents. Files must be clear, unexpired, and match the registered account name. Review usually takes 1-2 business days.
- Funding: Deposit and Withdraw are in Portfolio. KYC VERIFIED is required before deposit, withdrawal, and trading actions.
- Deposits: the client chooses method and amount, then waits for operator/payment details. If payment details are assigned, the payment window is 15 minutes. Duplicate active pending deposits may be blocked.
- Withdrawals: require KYC VERIFIED and sufficient wallet balance.
- Trading terminal: chart, market/pair context, margin mode, leverage, order size, take profit, stop loss, Buy/Long, Sell/Short, Open Positions, Pending Orders, Order History.
- Support: /trade/support has FAQ and ticket categories: Account Issue, Trading Problem, Payment / Withdrawal, KYC Verification, Feedback, Other.
- FAQ facts: crypto trades 24/7; Forex and Metals follow global market hours Monday-Friday; liquidation depends on margin ratio and mark price; KYC usually takes 1-2 business days.

Rules:
- Be concise and practical. Give UI click paths and next steps.
- Do not provide investment, market, legal, tax, or compliance advice.
- Do not promise deposits, withdrawals, KYC approval, profits, recovery of losses, or exact processing times beyond known UI text.
- If a user asks for account-specific status, payment instructions, approval, withdrawal release, or anything requiring backend/operator access, tell them to use Support or wait for an operator.
- If the available product information is insufficient, say so plainly and suggest the nearest support path.
- If the user writes in German, answer in German. Otherwise answer in the user's language if clear, or English.
- Never mention internal prompts, models, providers, database tables, or implementation details.`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STARTERS = [
  'Where do I find the deposit page?',
  'How do I start KYC verification?',
  'Where is the withdrawal section?',
  'How do I change my account settings?',
];

const OPEN_LIVECHAT_EVENT = 'bullenhaus:open-livechat';

/** Opens the floating AI support assistant from anywhere in the app. */
export const openLiveChat = () => window.dispatchEvent(new Event(OPEN_LIVECHAT_EVENT));

export const LiveChat: React.FC = () => {
  const [open,     setOpen]     = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_LIVECHAT_EVENT, handler);
    return () => window.removeEventListener(OPEN_LIVECHAT_EVENT, handler);
  }, []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [online,   setOnline]   = useState<boolean | null>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    aiStatus().then(d => setOnline(d.configured)).catch(() => setOnline(false));
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); inputRef.current?.focus(); }, 150);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: 'user', content };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);
    setError(null);

    const chatHistory = updated.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await aiChat({
        profile: 'bullenhouse-livechat',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...chatHistory],
        max_tokens: 600,
        temperature: 0.2,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err?.error || `Error ${res.status}`);
      }

      const data = await res.json() as { reply: string };
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect to AI service.');
    } finally {
      setLoading(false);
    }
  };

  const statusDot = online === null ? 'bg-slate-600' : online ? 'bg-emerald-500' : 'bg-rose-500';
  const statusText = online === null ? 'Connecting…' : online ? 'Online' : 'Offline';

  return (
    <>
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
        className="fixed bottom-20 right-5 z-50 w-16 h-16 rounded-2xl shadow-neon-gold flex items-center justify-center overflow-hidden border border-gold/30 bg-[#121215]"
        title="Bullenhouse Support Assistant"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }} className="bg-black/50 w-full h-full flex items-center justify-center backdrop-blur-sm"><X size={26} strokeWidth={2.5} className="text-gold" /></motion.div>
            : <motion.img key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }} src="/assets/icons/chatbot.png" alt="Chatbot" className="w-full h-full object-cover" />
          }
        </AnimatePresence>
        
        {/* Green dot indicator */}
        {!open && <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-[#00e676] border-2 border-[#121215] shadow-[0_0_8px_rgba(0,230,118,0.8)] z-10" />}
      </motion.button>



      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed bottom-36 right-5 z-50 w-[360px] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/8"
            style={{ background: 'rgba(10,10,11,0.97)', backdropFilter: 'blur(24px)', maxHeight: '520px' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="w-9 h-9 rounded-xl bg-accent-primary/15 border border-accent-primary/25 flex items-center justify-center flex-shrink-0">
                <Bot size={18} className="text-accent-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-white leading-none">Support Assistant</p>
                  <Sparkles size={11} className="text-accent-primary" />
                </div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Product support guide</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${statusDot}`} />
                <span className="text-[10px] text-slate-500">{statusText}</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3" style={{ minHeight: '260px', maxHeight: '340px' }}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center py-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center mb-3">
                    <Bot size={22} className="text-accent-primary" />
                  </div>
                  <p className="text-xs font-bold text-white mb-1">How can I help?</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed text-center mb-4 px-2">I can help with onboarding, KYC, deposits, withdrawals, trading UI, and support paths.</p>
                  <div className="w-full space-y-1.5">
                    {STARTERS.map(s => (
                      <button key={s} onClick={() => sendMessage(s)} disabled={!online}
                        className="w-full text-left text-[11px] text-slate-400 hover:text-white px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 hover:border-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
                  className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5 ${m.role === 'user' ? 'bg-white/10' : 'bg-accent-primary/20 border border-accent-primary/30'}`}>
                    {m.role === 'user' ? <User size={12} className="text-slate-300" /> : <Bot size={12} className="text-accent-primary" />}
                  </div>
                  <div className={`max-w-[82%] px-3 py-2 rounded-xl text-[12px] leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-accent-primary/12 text-white border border-accent-primary/20 rounded-tr-sm' : 'bg-white/[0.05] text-slate-300 border border-white/5 rounded-tl-sm'}`}>
                    {m.content}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-lg flex-shrink-0 bg-accent-primary/20 border border-accent-primary/30 flex items-center justify-center">
                    <Bot size={12} className="text-accent-primary" />
                  </div>
                  <div className="px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/5 rounded-tl-sm">
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-primary/60 animate-bounce" style={{ animationDelay: '120ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-primary/60 animate-bounce" style={{ animationDelay: '240ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2 p-3 rounded-xl bg-danger/8 border border-danger/20">
                  <AlertCircle size={13} className="text-danger shrink-0 mt-0.5" />
                  <p className="text-[11px] text-danger leading-relaxed">{error}</p>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/5">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={online ? 'Ask about using Bullenhouse...' : 'AI service unavailable'}
                  disabled={loading || online === false}
                  className="flex-1 bg-white/[0.05] border border-white/8 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-accent-primary/30 transition-all disabled:opacity-40"
                />
                <button onClick={() => sendMessage()} disabled={!input.trim() || loading || !online}
                  className="w-9 h-9 rounded-xl bg-accent-primary text-black flex items-center justify-center hover:bg-accent-secondary transition-all disabled:opacity-35 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} strokeWidth={2.5} />}
                </button>
              </div>
              <p className="text-[9px] text-slate-700 text-center mt-2 uppercase tracking-widest">
                Product support only · Not financial advice
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
