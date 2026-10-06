import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  width?: string;
  position?: 'left' | 'right';
}

export function Drawer({ isOpen, onClose, title, subtitle, children, className, width, position = 'right' }: DrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: position === 'right' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: position === 'right' ? '100%' : '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed top-0 bottom-0 z-50 w-full max-w-md border-glass-border glass-card shadow-2xl flex flex-col",
              position === 'right' ? 'right-0 border-l' : 'left-0 border-r',
              width,
              className
            )}
          >
            {(title || subtitle) && (
              <div className="flex items-start justify-between p-6 border-b border-glass-border shrink-0">
                <div>
                  {title && <h2 className="font-serif text-xl font-light italic tracking-tight text-aura-platinum">{title}</h2>}
                  {subtitle && <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-1 uppercase">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="rounded p-1 text-aura-platinum/50 hover:bg-white/5 hover:text-aura-platinum transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            
            {!title && !subtitle && (
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={onClose}
                  className="rounded p-1 text-aura-platinum/50 hover:bg-white/5 hover:text-aura-platinum transition-colors backdrop-blur-md glass-card"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto w-full">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
