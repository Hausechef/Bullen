import React from 'react';
import { MarketControlPanel } from './MarketControlPanel';
import { useTranslation } from 'react-i18next';

export const AdminMarketControl = () => {
  const { t } = useTranslation(['common']);
  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-150">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{t('adminMarket.title')}</h2>
        <p className="text-sm text-slate-500">{t('adminMarket.desc')}</p>
      </div>
      <MarketControlPanel />
    </div>
  );
};
