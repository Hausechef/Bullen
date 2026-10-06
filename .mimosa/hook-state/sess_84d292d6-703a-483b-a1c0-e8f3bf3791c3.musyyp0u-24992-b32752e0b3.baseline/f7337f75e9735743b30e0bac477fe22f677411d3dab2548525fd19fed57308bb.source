import React from 'react';
import { Shield } from 'lucide-react';

const LEGAL_LINKS = [
  { label: 'Contact & Compliance', href: '/legal/contact' },
  { label: 'Terms of Service',     href: '/legal/terms'   },
  { label: 'Privacy Policy',       href: '/legal/privacy' },
  { label: 'AML & Compliance Policy', href: '/legal/aml'  },
  { label: 'Corporate Data',       href: '/legal/corporate'},
];

export const TradingFooter: React.FC = () => (
  <footer className="pt-6 pb-6 border-t border-white/5 shrink-0">
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-2 text-[10px] text-slate-500">
        <Shield size={12} className="text-accent-primary/50" />
        <span className="uppercase tracking-widest font-bold">Bullenhaus · Regulated Financial Services</span>
      </div>

      <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        {LEGAL_LINKS.map(link => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-500 hover:text-accent-primary transition-colors font-medium"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <p className="text-[10px] text-slate-600 text-center max-w-2xl leading-relaxed">
        Trading in financial instruments carries a high level of risk to your capital. You should only trade with money you can afford to lose.
        Past performance is not necessarily indicative of future results.
        &copy; {new Date().getFullYear()} Bullenhaus. All rights reserved.
      </p>
    </div>
  </footer>
);
