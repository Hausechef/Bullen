import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Image as ImageIcon, FileText, CheckCircle2, AlertCircle, RefreshCw, X, Pencil, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../contexts/AuthContext';

export interface PreMarketAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  contract_url?: string;
  is_active: boolean;
  created_at: string;
}

export const AdminPreMarket = () => {
  const { t } = useTranslation('common');
  const { role } = useAuth();
  const [assets, setAssets] = useState<PreMarketAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingContract, setUploadingContract] = useState(false);
  const [formData, setFormData] = useState<Partial<PreMarketAsset>>({
    name: '',
    symbol: '',
    price: 0,
    description: '',
    image_url: '',
    contract_url: '',
    is_active: true
  });

  const canEdit = role === 'trade_admin' || role === 'admin';

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('premarket_assets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAssets(data || []);
    } catch (err: any) {
      toast.error(t('adminPremarket.toastFailedLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleSave = async () => {
    if (!canEdit) return;
    if (!formData.name || !formData.symbol || !formData.description) {
      toast.error(t('adminPremarket.toastFillFields'));
      return;
    }
    if (Number(formData.price) <= 0) {
      toast.error(t('adminPremarket.toastPriceGreater'));
      return;
    }

    setSaving(true);
    try {
      if (formData.id) {
        const { error } = await supabase.from('premarket_assets').update(formData).eq('id', formData.id);
        if (error) throw error;
        toast.success(t('adminPremarket.toastUpdateSuccess'));
      } else {
        const { error } = await supabase.from('premarket_assets').insert([formData]);
        if (error) throw error;
        toast.success(t('adminPremarket.toastCreateSuccess'));
      }
      setShowForm(false);
      fetchAssets();
    } catch (err: any) {
      toast.error(t('adminPremarket.toastErrorSave') + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('adminPremarket.imageTooLarge', { defaultValue: 'Image must be less than 2MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, image_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleContractUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input so selecting the same file again re-triggers onChange
    e.target.value = '';
    if (!file) return;

    // Accept PDF even when the browser doesn't populate file.type (some Windows setups)
    const lowerName = file.name.toLowerCase();
    const isPdfByExt = lowerName.endsWith('.pdf');
    if (file.type && file.type !== 'application/pdf') {
      toast.error(t('adminPremarket.onlyPdf', 'Only PDF files are allowed for contracts'));
      return;
    }
    if (!file.type && !isPdfByExt) {
      toast.error(t('adminPremarket.onlyPdf', 'Only PDF files are allowed for contracts'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('adminPremarket.contractTooLarge', 'Contract must be less than 5MB'));
      return;
    }

    setUploadingContract(true);
    try {
      const fileExt = isPdfByExt ? 'pdf' : (file.name.split('.').pop() || 'pdf');

      // Check that the bucket exists — if not, guide the user to run the migration
      const { error: listError } = await supabase.storage.from('premarket_contracts').list();
      if (listError) {
        throw new Error(
          `Storage bucket "premarket_contracts" is not reachable. ` +
          `Run supabase migration 28_premarket_contracts_bucket.sql first. (${listError.message})`
        );
      }

      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('premarket_contracts')
        .upload(fileName, file, {
          cacheControl: '3600',
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('premarket_contracts')
        .getPublicUrl(fileName);

      if (!data?.publicUrl) {
        throw new Error('Upload succeeded but public URL is empty.');
      }

      setFormData(prev => ({ ...prev, contract_url: data.publicUrl }));
      toast.success(t('adminPremarket.contractUploaded', 'Contract uploaded successfully'));
    } catch (err: any) {
      console.error('[AdminPreMarket] contract upload failed:', err);
      toast.error(t('adminPremarket.errorUploadingContract', 'Error uploading contract: ') + (err?.message || String(err)));
    } finally {
      setUploadingContract(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) return;
    if (!window.confirm(t('adminPremarket.confirmDelete'))) return;
    try {
      const { error } = await supabase.from('premarket_assets').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('adminPremarket.toastDeleteSuccess'));
      fetchAssets();
    } catch (err: any) {
      toast.error(t('adminPremarket.toastErrorDelete'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">{t('adminPremarket.title')}</h2>
        {canEdit && (
          <button onClick={() => { setFormData({ name: '', symbol: '', price: 0, description: '', image_url: '', contract_url: '', is_active: true }); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> {t('adminPremarket.addAsset')}
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <div className="glass-card p-6 border-accent-primary/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">{formData.id ? t('adminPremarket.editAsset') : t('adminPremarket.newAsset')}</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('adminPremarket.name')}</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-accent-primary/50 transition-colors" placeholder="e.g. Neuralink" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('adminPremarket.symbol')}</label>
              <input type="text" value={formData.symbol} onChange={e => setFormData({ ...formData, symbol: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-accent-primary/50 transition-colors" placeholder="e.g. NRLK" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('adminPremarket.priceUsd')}</label>
              <input type="number" min="0.01" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white font-mono focus:border-accent-primary/50 transition-colors" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('adminPremarket.imageUrl')}</label>
              <div className="flex gap-2">
                <input type="text" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-accent-primary/50 transition-colors" placeholder="e.g. /neuralink-poster.png or https://..." />
                <label className="bg-white/5 hover:bg-white/10 text-white cursor-pointer flex items-center justify-center px-4 rounded-xl border border-white/10 transition-colors">
                  <ImageIcon size={18} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              {formData.image_url && formData.image_url.startsWith('data:image') && (
                 <div className="mt-2">
                   <img src={formData.image_url} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-white/10" />
                 </div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('adminPremarket.contractUrl', 'Contract URL (PDF)')}</label>
              <div className="flex gap-2">
                <input type="text" value={formData.contract_url || ''} onChange={e => setFormData({ ...formData, contract_url: e.target.value })} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-accent-primary/50 transition-colors" placeholder="e.g. /premarket_contract_v1.pdf or https://..." />
                <label className="bg-white/5 hover:bg-white/10 text-white cursor-pointer flex items-center justify-center px-4 rounded-xl border border-white/10 transition-colors" title="Upload PDF">
                  {uploadingContract ? <RefreshCw className="animate-spin text-accent-primary" size={18} /> : <FileText size={18} />}
                  <input type="file" accept="application/pdf" className="hidden" onChange={handleContractUpload} disabled={uploadingContract} />
                </label>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('adminPremarket.description')}</label>
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-accent-primary/50 transition-colors" placeholder="..." />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">{t('adminPremarket.cancel')}</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2 flex items-center gap-2">
              {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              {t('adminPremarket.saveAsset')}
            </button>
          </div>
        </div>
      )}

      <div className="glass-card overflow-x-auto">
        {loading ? (
          <div className="py-2 px-4 text-center text-slate-400 text-xs">{t('adminPremarket.loadingAssets')}</div>
        ) : assets.length === 0 ? (
          <div className="py-2 px-4 text-center text-slate-400 text-xs">{t('adminPremarket.noAssetsFound')}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">{t('adminPremarket.tableAsset')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">{t('adminPremarket.tableSymbol')}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">{t('adminPremarket.tablePrice')}</th>
                {canEdit && <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">{t('adminPremarket.tableActions')}</th>}
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => (
                <tr key={asset.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {asset.image_url ? (
                        <img src={asset.image_url} alt={asset.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center"><ImageIcon size={16} className="text-slate-400" /></div>
                      )}
                      <span className="font-bold text-white">{asset.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300 font-mono">{asset.symbol}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">${Number(asset.price).toFixed(2)}</td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setFormData(asset); setShowForm(true); }} className="p-2 text-slate-400 hover:text-white transition-colors" title="Edit"><Pencil size={18} /></button>
                      <button onClick={() => handleDelete(asset.id)} className="p-2 text-slate-400 hover:text-rose-400 transition-colors ml-2" title="Delete"><Trash2 size={18} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};