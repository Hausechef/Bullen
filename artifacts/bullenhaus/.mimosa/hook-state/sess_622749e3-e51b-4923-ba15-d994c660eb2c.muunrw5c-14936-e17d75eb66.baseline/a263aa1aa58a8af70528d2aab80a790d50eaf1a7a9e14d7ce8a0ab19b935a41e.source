import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Shield, CheckCircle2, RefreshCw, Eye, Plus, Minus, Pencil, Users, Phone, Globe, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

const ROLES = ['client', 'agent', 'manager', 'director', 'admin', 'trade_admin'];
const KYC_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED'];

interface EditForm {
  first_name: string;
  last_name: string;
  display_name: string;
  phone: string;
  country: string;
  role: string;
  kyc_status: string;
}

export const AdminUsers = () => {
  const { t } = useTranslation(['common']);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    first_name: '', last_name: '', display_name: '', phone: '', country: '', role: 'client', kyc_status: 'PENDING',
  });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
      if (selectedUser) {
        const refreshed = (data || []).find((u: any) => u.id === selectedUser.id);
        setSelectedUser(refreshed || null);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEdit = (user: any) => {
    setEditingUser(user);
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      display_name: user.display_name || '',
      phone: user.phone || '',
      country: user.country || '',
      role: user.role || 'client',
      kyc_status: user.kyc_status || 'PENDING',
    });
  };

  const closeEdit = () => {
    setEditingUser(null);
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: editForm.first_name || null,
          last_name: editForm.last_name || null,
          display_name: editForm.display_name || null,
          phone: editForm.phone || null,
          country: editForm.country || null,
          role: editForm.role,
          kyc_status: editForm.kyc_status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id);
      if (error) throw error;
      toast.success(t('adminUsers.toasts.userUpdated'));
      closeEdit();
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || t('adminUsers.toasts.failedUpdateUser'));
    } finally {
      setSaving(false);
    }
  };

  const adjustWallet = async (user: any, mode: 'add' | 'remove' | 'set') => {
    const name = user.display_name || user.email;
    const promptMsg = mode === 'add' ? t('adminUsers.toasts.prompts.amountToAdd', { name }) : 
                      mode === 'remove' ? t('adminUsers.toasts.prompts.amountToRemove', { name }) : 
                      t('adminUsers.toasts.prompts.amountToSet', { name });
    
    const value = window.prompt(promptMsg);
    if (value === null) return;

    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error(t('adminUsers.toasts.enterValidAmount'));
      return;
    }

    const currentBalance = Number(user.wallet?.balance || 0);
    const nextBalance = mode === 'set' ? amount : mode === 'add' ? currentBalance + amount : currentBalance - amount;
    if (nextBalance < 0) {
      toast.error(t('adminUsers.toasts.balanceNegative'));
      return;
    }

    const confirmMsg = mode === 'add' ? t('adminUsers.toasts.prompts.confirmAdd', { amount: amount.toLocaleString(), name }) : 
                       mode === 'remove' ? t('adminUsers.toasts.prompts.confirmRemove', { amount: amount.toLocaleString(), name }) : 
                       t('adminUsers.toasts.prompts.confirmSet', { amount: amount.toLocaleString(), name });

    const confirmed = window.confirm(confirmMsg);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ balance: nextBalance })
        .eq('id', user.id);
      if (error) throw error;
      const newWallet = { ...(user.wallet || {}), balance: nextBalance };
      setUsers(curr => curr.map(item => item.id === user.id ? { ...item, balance: nextBalance, wallet: newWallet } : item));
      setSelectedUser((curr: any) => curr?.id === user.id ? { ...curr, balance: nextBalance, wallet: newWallet } : curr);
      toast.success(t('adminUsers.toasts.walletUpdated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('adminUsers.toasts.failedUpdateWallet'));
    }
  };

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter(user => [user.id, user.email, user.display_name, user.role, user.kyc_status, user.phone, user.country].some(value => String(value || '').toLowerCase().includes(query)));
  }, [search, users]);

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-150">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-2xl font-light italic tracking-tight text-text">{t('adminUsers.title')}</h2>
          <p className="text-sm text-text-muted mt-1">{t('adminUsers.desc')}</p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              placeholder={t('adminUsers.search')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input-dark pl-9 py-2 text-sm w-72"
            />
          </div>
          <button onClick={fetchUsers} className="p-2 border border-border rounded-xl text-text-muted hover:text-text hover:border-border-strong transition-all">
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Filter size={18} />}
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left" style={{ minWidth: '900px' }}>
          <thead>
            <tr className="border-b border-border text-[10px] font-bold text-text-dim uppercase tracking-widest bg-surface/60">
              <th className="px-6 py-4 font-bold">{t('adminUsers.columns.identity')}</th>
              <th className="px-6 py-4 font-bold">{t('adminUsers.columns.contact')}</th>
              <th className="px-6 py-4 font-bold">{t('adminUsers.columns.uuid')}</th>
              <th className="px-6 py-4 font-bold">{t('adminUsers.columns.role')}</th>
              <th className="px-6 py-4 font-bold">{t('adminUsers.columns.kyc')}</th>
              <th className="px-6 py-4 font-bold">{t('adminUsers.columns.balance')}</th>
              <th className="px-6 py-4 font-bold">{t('adminUsers.columns.created')}</th>
              <th className="px-6 py-4 text-right font-bold">{t('adminUsers.columns.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono text-xs">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
                      <Users size={20} className="text-text-dim" />
                    </div>
                    <p className="text-sm font-medium text-text-muted">
                      {loading ? t('adminUsers.empty.loading') : t('adminUsers.empty.noUsers')}
                    </p>
                    <p className="text-xs text-text-dim">
                      {!loading && t('adminUsers.empty.adjust')}
                    </p>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.map(user => (
              <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center font-bold text-gold text-sm">
                      {String(user.display_name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text group-hover:text-gold transition-colors">{user.display_name || user.email || 'User'}</p>
                      <p className="text-[10px] text-text-dim italic mt-0.5">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {user.phone ? (
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <Phone size={10} className="text-success shrink-0" />
                        <span className="font-mono">{user.phone}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-text-dim">—</span>
                    )}
                    {user.country && (
                      <div className="flex items-center gap-1.5 text-[10px] text-text-dim">
                        <Globe size={10} className="shrink-0" />
                        <span>{user.country}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-text-dim truncate max-w-[120px]">{user.id}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${
                    user.role === 'admin' ? 'bg-danger/10 text-danger' :
                    user.role === 'trade_admin' ? 'bg-warning/10 text-warning' :
                    user.role === 'manager' || user.role === 'director' ? 'bg-gold/10 text-gold' :
                    user.role === 'agent' ? 'bg-info/10 text-info' :
                    'bg-surface text-text-muted'
                  }`}>
                    {t(`adminUsers.roles.${user.role || 'client'}`) as string}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {user.kyc_status === 'VERIFIED'
                      ? <CheckCircle2 size={12} className="text-success" />
                      : <Shield size={12} className="text-text-dim" />}
                    <span className={user.kyc_status === 'VERIFIED' ? 'text-success' : 'text-text-muted'}>{user.kyc_status || 'PENDING'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-text">
                  ${Number(user.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="ml-2 text-[10px] text-text-dim">USD</span>
                </td>
                <td className="px-6 py-4 text-text-dim">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td>
                <td className="px-6 py-4 text-right">
                   <div className="flex justify-end gap-1">
                      <button
                         onClick={() => setSelectedUser(user)}
                         className="p-2 text-text-dim hover:text-text hover:bg-white/5 rounded-lg transition-all"
                         title={t('adminUsers.tooltips.view')}
                      >
                         <Eye size={15} />
                      </button>
                      <button
                         onClick={() => openEdit(user)}
                         className="p-2 text-text-dim hover:text-gold hover:bg-gold/10 rounded-lg transition-all"
                         title={t('adminUsers.tooltips.edit')}
                      >
                         <Pencil size={15} />
                      </button>
                      <button
                         onClick={() => adjustWallet(user, 'add')}
                         className="p-2 text-text-dim hover:text-success hover:bg-success/10 rounded-lg transition-all"
                         title={t('adminUsers.tooltips.addBal')}
                      >
                         <Plus size={15} />
                      </button>
                      <button
                         onClick={() => adjustWallet(user, 'remove')}
                         className="p-2 text-text-dim hover:text-warning hover:bg-warning/10 rounded-lg transition-all"
                         title={t('adminUsers.tooltips.remBal')}
                      >
                         <Minus size={15} />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {selectedUser && (
        <div className="glass-card mt-6 p-6 border-white/10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t('adminUsers.details.title')}</h3>
              <p className="text-xs text-slate-500 mt-1">{selectedUser.display_name || selectedUser.email}</p>
            </div>
            <button onClick={() => setSelectedUser(null)} className="text-xs font-bold text-slate-500 hover:text-white transition-colors">
              {t('adminUsers.details.close')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 text-xs">
            <div className="glass-card p-4">
              <p className="text-slate-500 uppercase font-bold tracking-widest mb-2">{t('adminUsers.details.identity')}</p>
              <p className="text-white break-all">{selectedUser.id}</p>
              <p className="text-slate-400 mt-2">{selectedUser.email}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-slate-500 uppercase font-bold tracking-widest mb-2">{t('adminUsers.details.contact')}</p>
              {selectedUser.phone ? (
                <div className="flex items-center gap-1.5 text-white">
                  <Phone size={11} className="text-success shrink-0" />
                  <span className="font-mono">{selectedUser.phone}</span>
                </div>
              ) : (
                <p className="text-slate-500 italic">{t('adminUsers.details.noPhone')}</p>
              )}
              {selectedUser.country ? (
                <div className="flex items-center gap-1.5 text-slate-400 mt-2">
                  <Globe size={11} className="shrink-0" />
                  <span>{selectedUser.country}</span>
                </div>
              ) : (
                <p className="text-slate-500 mt-2 italic">{t('adminUsers.details.noCountry')}</p>
              )}
            </div>
            <div className="glass-card p-4">
              <p className="text-slate-500 uppercase font-bold tracking-widest mb-2">{t('adminUsers.details.access')}</p>
              <p className="text-white">{t('adminUsers.details.role')}: {t(`adminUsers.roles.${selectedUser.role || 'client'}`) as string}</p>
              <p className="text-slate-400 mt-2">KYC: {selectedUser.kyc_status || 'N/A'}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-slate-500 uppercase font-bold tracking-widest mb-2">{t('adminUsers.details.wallet')}</p>
              <p className="text-white font-mono text-lg">
                ${Number(selectedUser.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-slate-400 mt-2">USD</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button onClick={() => openEdit(selectedUser)} className="px-4 py-2 rounded-xl bg-gold/10 text-gold border border-gold/20 text-xs font-bold hover:bg-gold hover:text-black transition-all">
              {t('adminUsers.actions.editUser')}
            </button>
            <button onClick={() => adjustWallet(selectedUser, 'add')} className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500 hover:text-black transition-all">
              {t('adminUsers.actions.addAssets')}
            </button>
            <button onClick={() => adjustWallet(selectedUser, 'remove')} className="px-4 py-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs font-bold hover:bg-orange-500 hover:text-black transition-all">
              {t('adminUsers.actions.removeAssets')}
            </button>
            <button onClick={() => adjustWallet(selectedUser, 'set')} className="px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold hover:bg-blue-500 hover:text-black transition-all">
              {t('adminUsers.actions.editAssets')}
            </button>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-lg p-6 border border-border-strong shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t('adminUsers.editModal.title')}</h3>
                <p className="text-xs text-text-dim mt-1">{editingUser.email}</p>
              </div>
              <button onClick={closeEdit} className="p-1.5 rounded-lg text-text-dim hover:text-text hover:bg-white/5 transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1.5">{t('adminUsers.editModal.firstName')}</label>
                <input
                  type="text"
                  value={editForm.first_name}
                  onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))}
                  placeholder={t('adminUsers.editModal.firstName')}
                  className="input-dark w-full py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1.5">{t('adminUsers.editModal.lastName')}</label>
                <input
                  type="text"
                  value={editForm.last_name}
                  onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))}
                  placeholder={t('adminUsers.editModal.lastName')}
                  className="input-dark w-full py-2 text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1.5">{t('adminUsers.editModal.displayName')}</label>
                <input
                  type="text"
                  value={editForm.display_name}
                  onChange={e => setEditForm(f => ({ ...f, display_name: e.target.value }))}
                  placeholder={t('adminUsers.editModal.displayName')}
                  className="input-dark w-full py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1.5">{t('adminUsers.editModal.phone')}</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 234 567 8900"
                  className="input-dark w-full py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1.5">{t('adminUsers.editModal.country')}</label>
                <input
                  type="text"
                  value={editForm.country}
                  onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))}
                  placeholder="e.g. United States"
                  className="input-dark w-full py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1.5">{t('adminUsers.editModal.role')}</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  className="input-dark w-full py-2 text-sm"
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{t(`adminUsers.roles.${r || 'client'}`) as string}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1.5">{t('adminUsers.editModal.kycStatus')}</label>
                <select
                  value={editForm.kyc_status}
                  onChange={e => setEditForm(f => ({ ...f, kyc_status: e.target.value }))}
                  className="input-dark w-full py-2 text-sm"
                >
                  {KYC_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeEdit}
                className="px-4 py-2 rounded-xl border border-border text-text-muted text-xs font-bold hover:border-border-strong hover:text-text transition-all"
              >
                {t('adminUsers.actions.cancel')}
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-gold text-black text-xs font-bold hover:bg-gold/80 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                {saving ? t('adminUsers.actions.saving') : t('adminUsers.actions.saveChanges')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
