import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useTradingStore } from '../../stores/tradingStore';
import { toast } from 'sonner';
import { Rocket, ShieldCheck, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { LuxIcon } from '../../components/common/LuxIcon';
import { ContractModal } from '../../components/dashboard/ContractModal';
import { AssetIcon } from '../../components/common/AssetIcon';

// Map asset symbol or name (lowercase) to a contract template served from /public/contracts/
const ASSET_CONTRACT_TEMPLATES: Record<string, string> = {
  bytedance: '/contracts/bytedance-contract.html',
  bdnc: '/contracts/bytedance-contract.html',
  btdc: '/contracts/bytedance-contract.html',
  starlink: '/contracts/starlink-contract.html',
  stlk: '/contracts/starlink-contract.html',
  strlk: '/contracts/starlink-contract.html',
  neuralink: '/contracts/neuralink-contract.html',
  nrlk: '/contracts/neuralink-contract.html',
  'the boring company': '/contracts/boringcompany-contract.html',
  'boring company': '/contracts/boringcompany-contract.html',
  tbc: '/contracts/boringcompany-contract.html',
  tbcc: '/contracts/boringcompany-contract.html',
};

// Prefer the admin-managed contract_url from premarket_assets; fall back to the static map.
function resolveContractTemplate(asset: { symbol?: string; name?: string; contract_url?: string }): string | undefined {
  if (asset.contract_url) return asset.contract_url;
  const key = (asset.symbol ?? '').toLowerCase();
  const nameKey = (asset.name ?? '').toLowerCase();
  return ASSET_CONTRACT_TEMPLATES[key] ?? ASSET_CONTRACT_TEMPLATES[nameKey];
}

const AssetCard = ({
  asset,
  wallet,
  buyAsset,
  isBuyingItem,
  setIsBuyingItem,
  contractSigned,
  contractPriceSnapshot,
  checkContractSignature,
}: any) => {
  const { t } = useTranslation('common');
  const [amount, setAmount] = useState('1');
  const parsedAmount = parseFloat(amount);
  const [livePriceForModal, setLivePriceForModal] = useState<number>(asset.price);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const totalCost = isNaN(parsedAmount) ? 0 : parsedAmount * livePriceForModal;
  const availableBalance = Math.max(0, wallet.balance - wallet.marginUsed);
  const canAfford = availableBalance >= totalCost && totalCost > 0;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const templateUrl = resolveContractTemplate(asset);

  const fetchLivePrice = async (): Promise<number> => {
    try {
      const { data } = await supabase
        .from('premarket_assets')
        .select('price')
        .eq('symbol', asset.symbol)
        .eq('is_active', true)
        .maybeSingle();
      if (data?.price != null) return Number(data.price);
    } catch { /* fall back */ }
    return asset.price;
  };

  const handleBuy = async () => {
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    setFetchingPrice(true);
    let live: number;
    try {
      live = await fetchLivePrice();
      setLivePriceForModal(live);
    } finally {
      setFetchingPrice(false);
    }

    const needsSign =
      !contractSigned ||
      contractPriceSnapshot == null ||
      Math.abs(contractPriceSnapshot - live) > 0.001;

    if (needsSign) {
      setIsModalOpen(true);
      return;
    }

    if (availableBalance < live * parsedAmount) return;
    executeBuy(live);
  };

  const executeBuy = async (priceOverride?: number) => {
    setIsBuyingItem(true);
    const success = await buyAsset(
      asset.symbol,
      asset.name,
      priceOverride ?? livePriceForModal,
      parsedAmount,
    );
    setIsBuyingItem(false);
    if (success) {
      toast.success(t('premarket.successBuy', { amount: parsedAmount, symbol: asset.symbol }));
      setAmount('1');
    } else {
      toast.error(t('premarket.insufficientFundsToast'));
    }
  };

  return (
    <>
      <ContractModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assetId={asset.id}
        assetName={asset.name}
        assetPrice={livePriceForModal}
        sharesAmount={isNaN(parsedAmount) || parsedAmount <= 0 ? undefined : parsedAmount}
        templateUrl={templateUrl}
        onSign={() => {
          checkContractSignature();
          executeBuy(livePriceForModal);
        }}
      />
      <div className="glass-card border-accent-primary/20 relative overflow-hidden group flex flex-col">
        <div className="w-full relative overflow-hidden shrink-0 bg-[#0A0E17]">
          <img
            src={asset.image_url || '/neuralink-poster.png'}
            alt={asset.name}
            className="w-full h-auto block opacity-100 transition-transform duration-700 group-hover:scale-105"
          />
        </div>

        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-5 relative z-10 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.2)] backdrop-blur-md">
                  <AssetIcon symbol={asset.symbol} size={36} className="rounded-lg" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight leading-tight">{asset.name}</h3>
                  <p className="text-[10px] font-bold text-accent-primary uppercase tracking-widest">{asset.symbol}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{t('premarket.fixedPrice')}</p>
              <p className="text-xl font-mono font-bold text-white">${Number(livePriceForModal).toFixed(2)}</p>
            </div>
          </div>

          <p className="text-slate-400 text-xs mb-4 leading-relaxed line-clamp-2">{asset.description}</p>

          <div className="space-y-3 mt-auto">
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('premarket.buyShares')}</label>
                <span className="text-[10px] text-slate-500 font-mono">
                  Available: ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-accent-primary/50 transition-colors"
                placeholder="0"
              />
            </div>

            <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{t('premarket.totalCost')}</span>
                <span className="font-mono font-bold text-white">
                  ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {!canAfford && totalCost > 0 && (
                <div className="flex items-center gap-2 text-[10px] text-red-400 pt-1.5 border-t border-white/5">
                  <AlertCircle size={12} />
                  {t('premarket.insufficientFunds')}
                </div>
              )}
            </div>

            <button
              onClick={handleBuy}
              disabled={totalCost <= 0 || isBuyingItem || fetchingPrice || (contractSigned && !canAfford)}
              className={`w-full py-2.5 rounded-lg font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${
                (!contractSigned || canAfford) && !isBuyingItem && !fetchingPrice
                  ? 'bg-accent-primary text-black hover:bg-accent-primary/90 shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                  : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/10'
              }`}
            >
              {isBuyingItem || fetchingPrice ? (
                <span className="animate-pulse">{isBuyingItem ? t('premarket.processing') : '...'}</span>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  {t('premarket.buy', { symbol: asset.symbol })}
                </>
              )}
            </button>

            {contractSigned && templateUrl && (
              <a
                href={templateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 rounded-lg font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10"
              >
                <Download size={13} />
                {t('premarket.downloadContract', 'Download Contract')}
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export const PreMarket: React.FC = () => {
  const { t } = useTranslation('common');
  const wallet = useTradingStore(s => s.wallet);
  const buyAsset = useTradingStore(s => s.buyAsset);
  const contractSigned = useTradingStore(s => s.contractSigned);
  const contractPriceSnapshot = useTradingStore(s => s.contractPriceSnapshot);
  const checkContractSignature = useTradingStore(s => s.checkContractSignature);
  const [isBuyingItem, setIsBuyingItem] = useState(false);

  const [assets, setAssets] = useState<any[]>([{
    id: 'hardcoded-nrlk',
    symbol: 'NRLK',
    name: 'Neuralink',
    price: 15.50,
    description: 'Pre-IPO shares of Neuralink Corp. Participate in the early stages of next-generation brain-computer interface technology before public listing.',
    image_url: '/neuralink-poster.png',
  }]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkContractSignature();
    const fetchAssets = async () => {
      try {
        const { data } = await supabase
          .from('premarket_assets')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true });
        if (data && data.length > 0) setAssets(data);
      } catch { /* fall back to hardcoded */ } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <LuxIcon icon={Rocket} size={28} />
            {t('premarket.title')}
          </h2>
          <p className="text-sm text-slate-400 mt-2 flex items-center gap-2">
            <ShieldCheck size={14} className="text-accent-secondary" />
            {t('premarket.subtitle')}
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
          {loading ? (
            <div className="glass-card p-12 text-center text-slate-400 md:col-span-2">{t('premarket.loading')}</div>
          ) : (
            assets.map(asset => (
              <AssetCard
                key={asset.id}
                asset={asset}
                wallet={wallet}
                buyAsset={buyAsset}
                isBuyingItem={isBuyingItem}
                setIsBuyingItem={setIsBuyingItem}
                contractSigned={contractSigned}
                contractPriceSnapshot={contractPriceSnapshot}
                checkContractSignature={checkContractSignature}
              />
            ))
          )}
        </div>

        {/* Info / FAQ */}
        <div className="space-y-6 flex flex-col justify-start">
          <div className="glass-card p-6 border-white/5">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">{t('premarket.aboutTitle')}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{t('premarket.aboutText')}</p>
          </div>
          <div className="glass-card p-6 border-white/5 bg-black/20">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">{t('premarket.termsTitle')}</h3>
            <ul className="text-xs text-slate-500 space-y-3 list-disc list-inside">
              <li>{t('premarket.terms.1')}</li>
              <li>{t('premarket.terms.2')}</li>
              <li>{t('premarket.terms.3')}</li>
              <li>{t('premarket.terms.4')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
