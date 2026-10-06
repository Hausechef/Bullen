import React from 'react';
import { motion } from 'motion/react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * AuthLayout — wrapper for /register, /forgot-password, /reset-password.
 * Uses the same design as AuthShell on /login, but without a header
 * (the child page decides what to render inside the card).
 */
export const AuthLayout: React.FC = () => {
  const { session, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Don't redirect if this is a password recovery flow — the hash contains type=recovery
  const isRecovery = window.location.hash.includes('type=recovery') ||
    window.location.hash.includes('type=signup');

  if (session && !isRecovery) {
    return <Navigate to={role === 'admin' || role === 'trade_admin' ? '/admin/dashboard' : '/trade/dashboard'} replace />;
  }

  return (
    <div className="min-h-dvh w-full bg-bg relative flex items-center justify-center p-4 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.04) 30%, transparent 60%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08] mix-blend-luminosity"
        style={{
          backgroundImage: "url('/images/golden_bull_bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <div className="mb-8 text-center flex justify-center">
          <img
            src="/logo.png"
            alt="Bullenhaus"
            className="h-24 w-auto object-contain drop-shadow-[0_0_18px_rgba(212,175,55,0.35)]"
          />
        </div>

        <div className="glass-card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
};
