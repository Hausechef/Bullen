import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet2, Loader2, CheckCircle2, AlertTriangle, ExternalLink, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { isMetaMaskAvailable, connectMetaMask, ensureEthereumMainnet, sendUsdtTransfer } from '../../lib/web3/metamask';

interface PlatformWallet {
  chain: string;
  address: string | null;
  token_symbol: string;
  token_contract: string;
  token_decimals: number;
}

const ETHERSCAN_TX_BASE = 'https://etherscan.io/tx/';
const ETHERSCAN_ADDRESS_BASE = 'https://etherscan.io/address/';

export const CryptoDepositModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { kycStatus } = useAuth();
  const [wallet, setWallet] = useState<PlatformWallet | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ txHash: string; explorerUrl: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setResult(null);
    setAmount('');
    setLoadingWallet(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('platform_wallet_settings')
          .select('chain, address, token_symbol, token_contract, token_decimals')
          .eq('id', 1)
          .single();
        if (error) { toast.error('Could not load the platform deposit address.'); return; }
        setWallet(data as PlatformWallet);
      } finally {
        setLoadingWallet(false);
      }
    })();
  }, [isOpen]);

  const handleConnect = async () => {
    if (!isMetaMaskAvailable()) {
      toast.error('MetaMask is not installed. Install the MetaMask browser extension to deposit with crypto.');
      return;
    }
    setConnecting(true);
    try {
      const account = await connectMetaMask();
      await ensureEthereumMainnet();
      setConnectedAccount(account);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not connect MetaMask.');
    } finally {
      setConnecting(false);
    }
  };

  const handleSend = async () => {
    if (!wallet?.address) { toast.error('The platform has not configured a deposit wallet yet.'); return; }
    if (kycStatus !== 'VERIFIED') { toast.error('KYC Verification required'); return; }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) { toast.error('Enter a valid amount'); return; }

    setSending(true);
    try {
      await ensureEthereumMainnet();
      const { txHash, fromAddress } = await sendUsdtTransfer({
        tokenContract: wallet.token_contract,
        tokenDecimals: wallet.token_decimals,
        toAddress: wallet.address,
        amountHuman: numAmount,
      });

      const explorerUrl = `${ETHERSCAN_TX_BASE}${txHash}`;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('transactions').insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email,
          type: 'Deposit',
          amount: numAmount,
          currency: wallet.token_symbol,
          method: 'Crypto (USDT)',
          status: 'Pending',
          instructions: `${wallet.token_symbol} deposit — tx ${txHash} on ${wallet.chain}`,
          payment_details: {
            type: 'crypto',
            chain: wallet.chain,
            tokenSymbol: wallet.token_symbol,
            tokenContract: wallet.token_contract,
            toAddress: wallet.address,
            fromAddress,
            txHash,
            explorerUrl,
          },
        });
        if (error) {
          // The on-chain transfer already went through; surface this clearly
          // rather than silently losing the record of a real payment.
          toast.error('Your transfer was sent, but we could not record it automatically. Contact support with your transaction hash.');
          console.error('[CryptoDepositModal] Failed to record deposit transaction:', error);
        }
      }

      setResult({ txHash, explorerUrl });
      toast.success('Transaction submitted — an admin will verify it on-chain and credit your balance.');
    } catch (err: any) {
      const message = err?.code === 4001 || err?.code === 'ACTION_REJECTED'
        ? 'Transaction rejected in MetaMask.'
        : (err instanceof Error ? err.message : 'Could not send the transaction.');
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setConnectedAccount(null);
    setResult(null);
    setAmount('');
    onClose();
  };

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
            <div className="absolute top-0 left-0 right-0 h-1 bg-accent-primary shadow-neon-gold" />

            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary">
                    <Wallet2 size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-text tracking-wide">Deposit with Crypto</h3>
                </div>
                <button onClick={handleClose} className="p-2 text-text-muted hover:text-text transition-colors rounded-lg hover:bg-white/5">
                  <X size={20} />
                </button>
              </div>

              {result ? (
                <div className="space-y-4 text-center py-2">
                  <CheckCircle2 size={40} className="mx-auto text-accent-secondary" />
                  <div>
                    <p className="text-sm font-bold text-text">Transaction submitted</p>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      Your balance will be credited once an admin verifies the transaction on-chain.
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-xl px-3 py-2 text-[11px] font-mono text-text-muted break-all">
                    {result.txHash}
                  </div>
                  <a
                    href={result.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm bg-accent-secondary text-black hover:brightness-110 shadow-neon-emerald transition-all"
                  >
                    <ExternalLink size={15} /> View on Etherscan
                  </a>
                  <button onClick={handleClose} className="w-full py-3 rounded-xl text-sm font-bold text-text-muted border border-border hover:border-border-strong transition-all">
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {kycStatus !== 'VERIFIED' && (
                    <div className="flex items-center justify-center p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-500 text-xs text-center gap-2">
                      <Lock size={14} />
                      <span>KYC Verification required. <Link to="/trade/kyc" className="underline font-bold" onClick={onClose}>Verify Identity</Link></span>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-white/5 border border-border text-xs text-text-muted flex items-start gap-2">
                    <AlertTriangle size={14} className="text-accent-primary shrink-0 mt-0.5" />
                    <span>
                      Only send <strong className="text-text">{wallet?.token_symbol || 'USDT'}</strong> on the{' '}
                      <strong className="text-text capitalize">{wallet?.chain || 'Ethereum'}</strong> network to the address below.
                      Sending any other asset or network will result in permanent loss of funds.
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-text-dim font-bold block mb-2">Platform Deposit Address</label>
                    {loadingWallet ? (
                      <div className="p-4 bg-black/40 border border-border rounded-xl text-xs text-text-dim flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" /> Loading…
                      </div>
                    ) : wallet?.address ? (
                      <div className="p-3 bg-black/40 border border-border rounded-xl text-xs font-mono text-text break-all">
                        {wallet.address}
                        <a href={`${ETHERSCAN_ADDRESS_BASE}${wallet.address}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 mt-2 text-accent-primary text-[10px] font-bold uppercase tracking-wider">
                          <ExternalLink size={10} /> View on Etherscan
                        </a>
                      </div>
                    ) : (
                      <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl text-xs text-orange-400">
                        The platform has not configured a deposit wallet yet. Please try again later.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-text-dim font-bold block mb-2">Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full p-4 bg-black/40 border border-border rounded-xl text-lg font-mono font-bold text-text focus:outline-none focus:border-accent-primary/50 transition-all pr-16"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-dim">
                        {wallet?.token_symbol || 'USDT'}
                      </span>
                    </div>
                  </div>

                  {!connectedAccount ? (
                    <button
                      onClick={handleConnect}
                      disabled={connecting || !wallet?.address}
                      className="w-full py-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 bg-accent-primary text-black shadow-neon-gold hover:brightness-110"
                    >
                      {connecting
                        ? <><Loader2 size={16} className="animate-spin" /> Connecting…</>
                        : <><Wallet2 size={16} /> Connect MetaMask</>}
                    </button>
                  ) : (
                    <>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-border text-xs">
                        <span className="text-text-muted">Connected</span>
                        <span className="font-mono text-text">{connectedAccount.slice(0, 6)}…{connectedAccount.slice(-4)}</span>
                      </div>
                      <button
                        onClick={handleSend}
                        disabled={sending || !amount || Number(amount) <= 0 || kycStatus !== 'VERIFIED' || !wallet?.address}
                        className="w-full py-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 bg-accent-secondary text-black shadow-neon-emerald hover:brightness-110"
                      >
                        {sending
                          ? <><Loader2 size={16} className="animate-spin" /> Confirm in MetaMask…</>
                          : <>Send {amount || '0'} {wallet?.token_symbol || 'USDT'}</>}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
