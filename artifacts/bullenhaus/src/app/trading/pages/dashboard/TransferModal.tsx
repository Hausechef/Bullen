import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Upload, ArrowRight, CheckCircle2, Lock, Loader2, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTradingStore } from '../../stores/tradingStore';
import { useTransactionStore, TxMethod, TX_METHODS } from '../../stores/transactionStore';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { PaymentDetailsDisplay } from '../../components/payment/PaymentDetailsDisplay';
import type { PaymentDetails } from '../../components/admin/PaymentDetailsForm';

export const TransferModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  type: 'deposit' | 'withdraw';
  /** Prefills the amount field when the modal opens (e.g. Elite upgrade = 10000). */
  initialAmount?: number;
}> = ({ isOpen, onClose, type, initialAmount }) => {
  const { t } = useTranslation('common');
  const [step, setStep]                         = useState(1);
  const [amount, setAmount]                     = useState('');
  const [method, setMethod]                     = useState<TxMethod>('Credit Card');
  const [loading, setLoading]                   = useState(false);
  const [requestId, setRequestId]               = useState<string | null>(null);
  const [serverRequestId, setServerRequestId]   = useState<string | null>(null);
  const [serverRequest, setServerRequest]       = useState<any>(null);
  const [serverInstructions, setServerInstructions] = useState('');
  const [serverStatus, setServerStatus]         = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails]     = useState<PaymentDetails | null>(null);
  const [updatedAt, setUpdatedAt]               = useState<string | null>(null);
  const [timeLeft, setTimeLeft]                 = useState<number | null>(null);

  const { wallet }                = useTradingStore();
  const { addRequest, requests }  = useTransactionStore();
  const [user, setUser]           = useState<any>(null);
  const { kycStatus }             = useAuth();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const isDeposit       = type === 'deposit';
  const activeRequest   = requestId ? requests.find(r => r.id === requestId) : null;
  const displayRequest  = serverRequest || activeRequest;
  const displayInstructions = serverRequest?.instructions || activeRequest?.instructions || serverInstructions;

  // Prefill amount on open (a pending transaction found below still overrides it)
  useEffect(() => {
    if (isOpen && initialAmount && initialAmount > 0) {
      setAmount(prev => (prev ? prev : String(initialAmount)));
    }
  }, [isOpen, initialAmount]);

  // Load existing pending transaction on mount/open
  useEffect(() => {
    if (!isOpen || !user) return;

    const checkPendingTransaction = async () => {
      try {
        const { data: pendingTx } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', isDeposit ? 'Deposit' : 'Withdrawal')
          .eq('status', 'Pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingTx) {
          const hasDetails = Boolean(pendingTx.payment_details || pendingTx.instructions);
          if (hasDetails && pendingTx.updated_at) {
            const expiryTime = new Date(pendingTx.updated_at).getTime() + 15 * 60 * 1000;
            const now = new Date().getTime();
            if (now >= expiryTime) {
              // Expired! Attempt to reject it
              await supabase
                .from('transactions')
                .update({ status: 'Rejected' })
                .eq('id', pendingTx.id);
              return;
            }
          }
          
          // Load active transaction
          setServerRequestId(pendingTx.id);
          setServerRequest(pendingTx);
          setServerStatus(pendingTx.status);
          setAmount(pendingTx.amount.toString());
          setMethod(pendingTx.method);
          setServerInstructions(pendingTx.instructions || '');
          setPaymentDetails(pendingTx.payment_details);
          setUpdatedAt(pendingTx.updated_at);
          setStep(2);
        }
      } catch (err) {
        console.warn('[TransferModal] Error checking pending transaction:', err);
      }
    };

    checkPendingTransaction();
  }, [isOpen, user, isDeposit]);

  // Poll Supabase every 5 s for status / instructions / payment_details / updated_at
  useEffect(() => {
    if (step !== 2 || !serverRequestId) return;
    const isFinal = serverStatus === 'Completed' || serverStatus === 'Rejected';
    if (isFinal) return;

    const poll = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('status, instructions, payment_details, updated_at')
        .eq('id', serverRequestId)
        .single();
      if (!data) return;
      if (data.instructions)    setServerInstructions(data.instructions);
      if (data.status)          setServerStatus(data.status);
      if (data.payment_details) setPaymentDetails(data.payment_details as PaymentDetails);
      if (data.updated_at)      setUpdatedAt(data.updated_at);
    };

    poll();
    const interval = window.setInterval(poll, 5000);
    return () => window.clearInterval(interval);
  }, [step, serverRequestId, serverStatus]);

  // Countdown timer for 15-minute expiration
  useEffect(() => {
    const isFinal = serverStatus === 'Completed' || serverStatus === 'Rejected';
    if (step !== 2 || !updatedAt || (!paymentDetails && !serverInstructions) || isFinal) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = async () => {
      const expiryTime = new Date(updatedAt).getTime() + 15 * 60 * 1000;
      const now = new Date().getTime();
      const difference = expiryTime - now;

      if (difference <= 0) {
        setTimeLeft(0);
        toast.error('The payment window (15 minutes) has expired. The transaction has been canceled.');
        try {
          if (serverRequestId) {
            await supabase
              .from('transactions')
              .update({ status: 'Rejected' })
              .eq('id', serverRequestId);
          }
        } catch (err) {
          console.warn('[TransferModal] Failed to reject expired transaction:', err);
        }
        // Reset modal state
        setStep(1);
        setAmount('');
        setRequestId(null);
        setServerRequestId(null);
        setServerRequest(null);
        setServerInstructions('');
        setServerStatus(null);
        setPaymentDetails(null);
        setUpdatedAt(null);
      } else {
        setTimeLeft(Math.floor(difference / 1000));
      }
    };

    calculateTimeLeft();
    const timer = window.setInterval(calculateTimeLeft, 1000);
    return () => window.clearInterval(timer);
  }, [step, updatedAt, paymentDetails, serverInstructions, serverRequestId, serverStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAction = async () => {
    if (kycStatus !== 'VERIFIED') { toast.error('KYC Verification required'); return; }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0)           { toast.error('Invalid amount');        return; }
    if (!isDeposit && numAmount > wallet.balance) { toast.error('Insufficient balance'); return; }

    // Prevent duplicate deposit while one is still pending
    if (isDeposit && user) {
      const { data: pendingDeposits } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'Deposit')
        .eq('status', 'Pending');

      if (pendingDeposits && pendingDeposits.length > 0) {
        // Filter out expired ones
        const activePending = pendingDeposits.filter(tx => {
          const hasDetails = Boolean(tx.payment_details || tx.instructions);
          if (hasDetails && tx.updated_at) {
            const expiryTime = new Date(tx.updated_at).getTime() + 15 * 60 * 1000;
            return new Date().getTime() < expiryTime;
          }
          return true; // Still waiting for operator
        });

        if (activePending.length > 0) {
          toast.error('You already have a pending deposit. Please wait for it to be approved or rejected before submitting a new one.');
          return;
        }
      }
    }

    setLoading(true);

    const localReqId = addRequest({
      userId:    user?.id    || 'unknown',
      userEmail: user?.email || 'unknown',
      userName:  user?.user_metadata?.name || 'User',
      type:      isDeposit ? 'Deposit' : 'Withdrawal',
      amount:    numAmount,
      currency:  'USD',
      method,
    });
    setRequestId(localReqId);

    if (user) {
      try {
        const { data: txRow, error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id:    user.id,
            user_email: user.email,
            user_name:  user.user_metadata?.full_name || user.email,
            type:       isDeposit ? 'Deposit' : 'Withdrawal',
            amount:     numAmount,
            currency:   'USD',
            method,
            status:     'Pending',
          })
          .select()
          .single();
        if (txError) throw new Error(txError.message);
        setServerRequestId(txRow?.id   || null);
        setServerRequest(txRow         || null);
        setServerStatus('Pending');
        setUpdatedAt(txRow?.updated_at || new Date().toISOString());
      } catch (err) {
        console.warn('[TransferModal] Could not persist to Supabase:', err);
      }
    }

    setLoading(false);
    setStep(2);
    toast.success(t('requestProcessing', { defaultValue: 'Your request is being processed.' }));
  };

  const handleClose = () => {
    if (step === 2 && activeRequest && !displayInstructions && !paymentDetails) {
      toast.error('Please wait for instructions from the admin.');
      return;
    }
    setStep(1);
    setAmount('');
    setRequestId(null);
    setServerRequestId(null);
    setServerRequest(null);
    setServerInstructions('');
    setServerStatus(null);
    setPaymentDetails(null);
    setUpdatedAt(null);
    setTimeLeft(null);
    onClose();
  };

  const hasDetails = Boolean(paymentDetails || displayInstructions);

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 ${isDeposit ? 'bg-accent-secondary shadow-neon-emerald' : 'bg-orange-500 shadow-neon-rose'}`} />

            {/* ── Step 1: form ─────────────────────────────────── */}
            {step === 1 && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isDeposit ? 'bg-accent-secondary/10 text-accent-secondary' : 'bg-orange-500/10 text-orange-500'}`}>
                      {isDeposit ? <Download size={20} /> : <Upload size={20} />}
                    </div>
                    <h3 className="text-lg font-bold text-text tracking-wide">
                      {isDeposit ? 'Deposit' : 'Withdrawal'}
                    </h3>
                  </div>
                  <button onClick={handleClose} className="p-2 text-text-muted hover:text-text transition-colors rounded-lg hover:bg-white/5">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-text-dim font-bold block mb-2">Select Currency</label>
                    <div className="p-3 bg-black/40 border border-border rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-xs">$</div>
                        <div>
                          <p className="text-sm font-bold text-text">USD</p>
                          <p className="text-[10px] text-text-dim">US Dollar</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-text-dim" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-[10px] uppercase tracking-widest text-text-dim font-bold block">Amount</label>
                      {!isDeposit && (
                        <span className="text-[10px] font-bold text-text-dim">Available: <span className="text-text">{wallet.balance.toFixed(2)} USD</span></span>
                      )}
                    </div>
                    <div className="relative group">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full p-4 bg-black/40 border border-border rounded-xl text-lg font-mono font-bold text-text focus:outline-none focus:border-accent-primary/50 transition-all pl-12"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-text-dim font-bold">$</span>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-dim">USD</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-text-dim font-bold block mb-2">Transfer Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      {TX_METHODS.map(m => (
                        <button
                          key={m}
                          onClick={() => setMethod(m)}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            method === m
                              ? 'bg-accent-primary/10 border-accent-primary text-accent-primary'
                              : 'bg-black/40 border-border text-text-muted hover:bg-white/5 hover:border-border-strong'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {kycStatus !== 'VERIFIED' && (
                    <div className="flex items-center justify-center p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-500 text-xs text-center gap-2">
                      <Lock size={14} />
                      <span>KYC Verification required. <Link to="/trade/kyc" className="underline font-bold" onClick={onClose}>Verify Identity</Link></span>
                    </div>
                  )}

                  <button
                    onClick={handleAction}
                    disabled={!amount || Number(amount) <= 0 || loading || kycStatus !== 'VERIFIED'}
                    className={`w-full py-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 ${
                      kycStatus !== 'VERIFIED'
                        ? 'bg-surface/50 text-text-muted'
                        : isDeposit
                        ? 'bg-accent-secondary text-black shadow-neon-emerald hover:brightness-110'
                        : 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:brightness-110'
                    }`}
                  >
                    {loading ? 'Processing...' : (isDeposit ? 'Submit Deposit' : 'Submit Withdrawal')}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: waiting / payment details ───────────── */}
            {step === 2 && displayRequest && (
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-text">
                    {hasDetails ? 'Payment Details' : 'Awaiting Details'}
                  </h3>
                  <button onClick={handleClose} className="p-1.5 text-text-muted hover:text-text transition-colors rounded-lg hover:bg-white/5">
                    <X size={18} />
                  </button>
                </div>

                {/* Request summary */}
                <div className="w-full bg-white/5 border border-border rounded-xl p-3 text-left text-xs space-y-1.5">
                  <div className="flex justify-between"><span className="text-text-muted">Type</span><span className="font-bold text-text">{displayRequest.type}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Amount</span><span className="font-mono font-bold text-text">{displayRequest.amount.toLocaleString()} {displayRequest.currency}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Method</span><span className="font-bold text-text">{displayRequest.method || method}</span></div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Status</span>
                    <span className={`font-bold ${
                      serverStatus === 'Completed' ? 'text-success' :
                      serverStatus === 'Rejected'  ? 'text-danger'  :
                      'text-warning'
                    }`}>{serverStatus || displayRequest.status}</span>
                  </div>
                </div>

                {/* Countdown Timer */}
                {timeLeft !== null && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono text-xs animate-in fade-in duration-300">
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="animate-pulse text-orange-500" />
                      <span className="font-sans font-medium">Payment window remaining</span>
                    </div>
                    <span className="font-bold text-sm tracking-wider text-orange-500">{formatTime(timeLeft)}</span>
                  </div>
                )}

                {/* Payment details or waiting state */}
                {paymentDetails ? (
                  <PaymentDetailsDisplay details={paymentDetails} isDeposit={isDeposit} />
                ) : displayInstructions ? (
                  <div className="bg-white/5 border border-border p-4 rounded-xl text-left text-sm font-mono text-text break-words max-h-[160px] overflow-y-auto">
                    {displayInstructions}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                    <Loader2 size={36} className={`animate-spin ${isDeposit ? 'text-accent-secondary' : 'text-orange-500'}`} />
                    <div>
                      <p className="text-sm font-bold text-text">Waiting for operator</p>
                      <p className="text-xs text-text-muted mt-1">Keep this window open. Payment details will appear here automatically.</p>
                    </div>
                  </div>
                )}

                {hasDetails && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium ${
                      isDeposit
                        ? 'bg-accent-secondary/5 border-accent-secondary/20 text-accent-secondary'
                        : 'bg-orange-500/5 border-orange-500/20 text-orange-400'
                    }`}
                  >
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>
                      {isDeposit
                        ? 'Send your payment using the details above. Your balance will be credited once confirmed.'
                        : 'Please follow the withdrawal instructions above. Funds will be sent to you shortly.'}
                    </span>
                  </motion.div>
                )}

                <button
                  onClick={handleClose}
                  className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
                    hasDetails
                      ? isDeposit
                        ? 'bg-accent-secondary text-black shadow-neon-emerald hover:brightness-110'
                        : 'bg-orange-500 text-black hover:brightness-110'
                      : 'bg-surface/60 text-text-muted border border-border hover:border-border-strong'
                  }`}
                >
                  {hasDetails ? 'Done' : 'Close'}
                </button>
              </div>
            )}
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
