import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, subtitle, children, className, maxWidth }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-glass-border glass-card p-6 shadow-2xl",
              maxWidth,
              className
            )}
          >
            <div className="flex items-start justify-between mb-6 border-b border-glass-border pb-4">
              <div>
                <h2 className="font-serif text-xl font-light italic tracking-tight text-aura-platinum">{title}</h2>
                {subtitle && <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-1 uppercase">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="rounded p-1 text-aura-platinum/50 hover:bg-white/5 hover:text-aura-platinum transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
