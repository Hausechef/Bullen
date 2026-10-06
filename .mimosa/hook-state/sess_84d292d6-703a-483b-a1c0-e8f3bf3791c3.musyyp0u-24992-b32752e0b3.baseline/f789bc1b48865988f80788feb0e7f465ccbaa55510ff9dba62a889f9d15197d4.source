import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, Rocket, Wallet, CandlestickChart, Coins, ShieldCheck, Trophy, Users2, ArrowLeft, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { LuxIcon, LuxIconTile } from '../../components/common/LuxIcon';

/**
 * Platform documentation — detailed guides for every major feature.
 * Static content rendered client-side; searchable by title/body.
 */

interface Guide {
  id: string;
  icon: LucideIcon;
  title: string;
  summary: string;
  sections: { heading: string; body: string }[];
}

const GUIDES: Guide[] = [
  {
    id: 'getting-started',
    icon: Rocket,
    title: 'Getting Started',
    summary: 'Create your account, verify your identity and make your first deposit.',
    sections: [
      { heading: '1. Create an account', body: 'Register with your email and a strong password. Confirm your email address if prompted. After logging in you land on the Trading Dashboard.' },
      { heading: '2. Complete KYC verification', body: 'Open KYC from the sidebar and upload a passport, ID card, or a selfie with your ID. Documents must be clear, unexpired, and match your registered name. Review usually takes 1–2 business days — you will be notified once approved. KYC VERIFIED status is required before depositing, withdrawing, or trading.' },
      { heading: '3. Fund your account', body: 'Go to Portfolio and press Deposit. Choose a method and amount, then follow the payment instructions assigned by an operator. When payment details are assigned, the payment window is 15 minutes.' },
      { heading: '4. Start trading', body: 'Open the Trade Terminal, pick an instrument in the pair selector, and place your first order — or use Spot mode to simply buy and hold crypto.' },
    ],
  },
  {
    id: 'deposits-withdrawals',
    icon: Wallet,
    title: 'Deposits & Withdrawals',
    summary: 'How money moves in and out of your wallet.',
    sections: [
      { heading: 'Deposits', body: 'Portfolio → Deposit. Select method and amount and wait for the operator to assign payment details. Complete the payment within the 15-minute window. Duplicate active pending deposits may be blocked.' },
      { heading: 'Withdrawals', body: 'Portfolio → Withdraw. Requires KYC VERIFIED status and sufficient available balance (balance minus margin in use). Withdrawal requests are reviewed by an operator before being released.' },
      { heading: 'Transaction history', body: 'Every deposit, withdrawal and trade is recorded on the Transactions page with its live status.' },
    ],
  },
  {
    id: 'margin-trading',
    icon: CandlestickChart,
    title: 'Margin Trading',
    summary: 'Long/Short positions with leverage in the Trade Terminal.',
    sections: [
      { heading: 'Placing an order', body: 'In the Trade Terminal choose the pair, margin mode (Cross or Isolated), leverage (1–125x) and order size. Optionally set Take Profit and Stop Loss. Press Buy/Long if you expect the price to rise, Sell/Short if you expect it to fall.' },
      { heading: 'Order types', body: 'Market orders execute instantly at the current price. Limit orders execute when the price reaches your target. Stop orders trigger once the price crosses the stop level.' },
      { heading: 'Liquidation', body: 'Liquidation depends on your margin ratio and the mark price. Higher leverage means the liquidation price sits closer to your entry. The estimated liquidation price is shown before you open a position.' },
      { heading: 'Managing positions', body: 'Open Positions, Pending Orders, Spot holdings and Order History live in the left panel of the terminal. Positions can be closed at any time at the current market price.' },
    ],
  },
  {
    id: 'spot',
    icon: Coins,
    title: 'Spot Trading',
    summary: 'Buy, hold and sell crypto without leverage.',
    sections: [
      { heading: 'Buying', body: 'Switch the order panel to Spot mode, enter the amount and press Buy. The total is deducted from your wallet balance and the coins appear in your holdings.' },
      { heading: 'Holding', body: 'Your holdings, average buy price, live value and unrealized P&L are visible in the Spot tab of the terminal and in Portfolio → Spot Holdings.' },
      { heading: 'Selling', body: 'Sell part of a holding from the Spot order form, or everything at once with Sell All. Proceeds are credited to your wallet instantly at the current market price.' },
    ],
  },
  {
    id: 'premarket',
    icon: Rocket,
    title: 'Pre-Market (Pre-IPO)',
    summary: 'Invest in companies before they go public.',
    sections: [
      { heading: 'How it works', body: 'The Pre-Market page lists pre-IPO assets at a fixed price per share. Choose the number of shares and press Buy.' },
      { heading: 'Investment contract', body: 'Your first purchase (and any purchase after the price changed) requires signing the investment agreement. The contract is auto-filled with your name, the quantity, price per share, total amount and date. You can print it or save it as PDF, and download it later from the asset card.' },
    ],
  },
  {
    id: 'kyc',
    icon: ShieldCheck,
    title: 'KYC Verification',
    summary: 'Identity verification requirements and process.',
    sections: [
      { heading: 'Accepted documents', body: 'Passport, national ID card, or a selfie holding your ID. Files must be sharp, uncropped, unexpired and match the name on your account.' },
      { heading: 'Review time', body: 'Verification is usually completed within 1–2 business days. You will receive a notification with the result.' },
      { heading: 'Why it is required', body: 'Deposits, withdrawals and trading are unlocked only for verified accounts, in line with AML and compliance policies (see the AML & Compliance page in the footer).' },
    ],
  },
  {
    id: 'rewards',
    icon: Trophy,
    title: 'Rewards & Progression',
    summary: 'XP, badges and the global leaderboard.',
    sections: [
      { heading: 'Earning XP', body: 'Every trade (margin or spot) earns 100 XP; positive realized profit adds XP on top. Your level progress is shown on the Rewards page.' },
      { heading: 'Badges', body: 'Achievements unlock automatically from your real activity: first trade, first winning position, using a stop loss, placing a limit order, making a spot trade, reaching balance and profit milestones.' },
      { heading: 'Leaderboard', body: 'The global ranking compares all traders by XP. Your row is highlighted; press Load More to see deeper ranks.' },
    ],
  },
  {
    id: 'referrals',
    icon: Users2,
    title: 'Referral Program',
    summary: 'Invite traders and earn commission.',
    sections: [
      { heading: 'Your referral link', body: 'Find your personal invite code and link on the Referrals page. Share it with friends and colleagues.' },
      { heading: 'Earnings', body: 'You earn commission from the trading activity of every user who signs up through your link — up to 40%, depending on your tier.' },
    ],
  },
];

export const Documentation: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Guide | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? GUIDES.filter(g =>
        g.title.toLowerCase().includes(q) ||
        g.summary.toLowerCase().includes(q) ||
        g.sections.some(s => s.heading.toLowerCase().includes(q) || s.body.toLowerCase().includes(q)))
    : GUIDES;

  return (
    <div className="p-4 lg:p-8 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
              <LuxIcon icon={Book} size={28} />
              Documentation
            </h1>
            <p className="text-sm text-slate-400 mt-2">Detailed guides for every part of the platform.</p>
          </div>
          <button
            onClick={() => navigate('/trade/support')}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors self-start md:self-auto"
          >
            <ArrowLeft size={14} /> Back to Support
          </button>
        </div>

        {active ? (
          /* Guide reader */
          <div className="glass-card p-8">
            <button
              onClick={() => setActive(null)}
              className="flex items-center gap-2 text-xs font-bold text-accent-primary hover:text-white uppercase tracking-widest transition-colors mb-6"
            >
              <ArrowLeft size={14} /> All guides
            </button>
            <div className="flex items-center gap-4 mb-2">
              <LuxIconTile icon={active.icon} size={48} iconSize={24} />
              <h2 className="text-2xl font-bold text-white">{active.title}</h2>
            </div>
            <p className="text-sm text-slate-400 mb-8">{active.summary}</p>
            <div className="space-y-6">
              {active.sections.map(s => (
                <div key={s.heading}>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">{s.heading}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative mb-6">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search guides…"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-accent-primary/50 transition-colors"
              />
            </div>

            {/* Guide cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(g => (
                <button
                  key={g.id}
                  onClick={() => setActive(g)}
                  className="glass-card p-6 text-left hover:bg-white/[0.02] hover:border-accent-primary/20 transition-all group"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <LuxIconTile icon={g.icon} size={44} iconSize={22} className="group-hover:border-gold/50 transition-colors" />
                    <h3 className="text-base font-bold text-white group-hover:text-accent-primary transition-colors">{g.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{g.summary}</p>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-3">{g.sections.length} sections</p>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-slate-500 md:col-span-2 text-center py-12">Nothing found for “{query}”.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
