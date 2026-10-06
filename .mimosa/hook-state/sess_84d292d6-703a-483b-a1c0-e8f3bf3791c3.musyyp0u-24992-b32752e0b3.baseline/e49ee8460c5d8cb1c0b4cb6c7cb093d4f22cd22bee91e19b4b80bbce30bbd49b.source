import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, ShieldCheck, FileText, Camera, CheckCircle2, AlertCircle, Clock, XCircle, X } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

type DocKey = 'passport' | 'id_card' | 'selfie';

const DOC_SLOTS: { key: DocKey; label: string; icon: React.ReactNode; hint: string; camera?: boolean }[] = [
  { key: 'passport', label: 'Passport',      icon: <FileText size={28} />, hint: 'Photo page clearly visible' },
  { key: 'id_card',  label: 'ID Card',        icon: <FileText size={28} />, hint: 'Front & back if applicable' },
  { key: 'selfie',   label: 'Selfie with ID', icon: <Camera  size={28} />, hint: 'Hold document next to your face', camera: true },
];

export const KYC = () => {
  const { t } = useTranslation('common');
  const { kycStatus, refreshProfile, user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<Record<DocKey, File | null>>({ passport: null, id_card: null, selfie: null });

  const fileInputRefs: Record<DocKey, React.RefObject<HTMLInputElement | null>> = {
    passport: useRef<HTMLInputElement>(null),
    id_card:  useRef<HTMLInputElement>(null),
    selfie:   useRef<HTMLInputElement>(null),
  };

  const handleFile = (key: DocKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB'); return; }
    setFiles(prev => ({ ...prev, [key]: file }));
    e.target.value = '';
  };

  const clearFile = (key: DocKey, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFiles(prev => ({ ...prev, [key]: null }));
    const ref = fileInputRefs[key];
    if (ref.current) ref.current.value = '';
  };

  const handleSubmit = async () => {
    const chosen = (Object.entries(files) as [DocKey, File | null][]).filter(([, f]) => f !== null);
    if (chosen.length === 0) { toast.error('Select at least one document to upload'); return; }
    if (!user?.id) { toast.error('Session expired — please log in again'); return; }

    setSubmitting(true);
    try {
      const uploaded: { type: string; name: string; path: string; contentType: string }[] = [];

      for (const [key, file] of chosen) {
        if (!file) continue;
        const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
        const path = `${user.id}/${key}_${Date.now()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from('kyc-documents')
          .upload(path, file, { contentType: file.type, upsert: true });

        if (upErr) throw new Error(`Upload failed for ${key}: ${upErr.message}`);
        uploaded.push({ type: key, name: file.name, path, contentType: file.type });
        toast.success(`${key.replace('_', ' ')} uploaded`);
      }

      const { error: dbErr } = await supabase
        .from('users')
        .update({ kyc_status: 'PENDING', kyc_documents: uploaded })
        .eq('id', user.id);
      if (dbErr) throw new Error(dbErr.message);

      await refreshProfile();
      toast.success('Documents submitted — awaiting admin review');
    } catch (err: any) {
      toast.error(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (kycStatus === 'PENDING') {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="glass-card p-12 text-center max-w-lg">
          <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500 animate-pulse">
            <Clock size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">{t('kycUnderReview', { defaultValue: 'Under Review' })}</h2>
          <p className="text-slate-400 text-sm">{t('kycUnderReviewDesc', { defaultValue: 'Your documents have been submitted and are being reviewed by our compliance team. This usually takes 1–2 business days.' })}</p>
        </div>
      </div>
    );
  }

  if (kycStatus === 'REJECTED') {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="glass-card p-12 text-center max-w-lg">
          <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
            <XCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Verification Rejected</h2>
          <p className="text-slate-400 text-sm mb-8">Your documents did not meet our requirements. Please re-submit with clearer, valid documents.</p>
          <button onClick={() => setFiles({ passport: null, id_card: null, selfie: null })} className="btn-gold px-8 py-3 rounded-xl">
            Re-submit Documents
          </button>
        </div>
      </div>
    );
  }

  if (kycStatus === 'VERIFIED') {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="glass-card p-12 text-center max-w-lg">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400"
          >
            <ShieldCheck size={40} />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-3">Identity Verified</h2>
          <p className="text-slate-400 text-sm">Your account is fully verified. All trading features are unlocked.</p>
        </div>
      </div>
    );
  }

  const hasAnyFile = Object.values(files).some(f => f !== null);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-accent-primary/10 rounded-2xl text-accent-primary">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{t('kyc', { defaultValue: 'KYC Verification' })}</h1>
            <p className="text-slate-400 text-sm mt-1">Upload your identity documents to unlock all platform features.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {DOC_SLOTS.map(({ key, label, icon, hint, camera }) => {
            const file = files[key];
            return (
              <div
                key={key}
                className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-6 transition-all min-h-[160px] select-none overflow-hidden ${
                  file
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-white/10 bg-white/5 hover:border-accent-primary/50 active:bg-white/10'
                }`}
              >
                {/* Direct overlay input — works on all browsers including mobile */}
                {!file && (
                  <input
                    ref={fileInputRefs[key]}
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 outline-none"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    accept={camera ? 'image/*' : 'image/*,.pdf'}
                    {...(camera ? { capture: 'user' as const } : {})}
                    onChange={e => handleFile(key, e)}
                  />
                )}

                {file ? (
                  <>
                    <CheckCircle2 size={32} className="text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 text-center break-all px-2 leading-snug">
                      {file.name}
                    </span>
                    <button
                      onClick={e => clearFile(key, e)}
                      className="relative z-20 flex items-center gap-1 text-[10px] text-slate-500 hover:text-rose-400 transition-colors mt-1"
                    >
                      <X size={10} /> Remove
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-slate-400 pointer-events-none">{icon}</div>
                    <div className="text-center pointer-events-none">
                      <p className="text-sm font-bold text-white mb-0.5">{label}</p>
                      <p className="text-[10px] text-slate-500">{hint}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300 uppercase tracking-wider pointer-events-none">
                      {camera ? <><Camera size={12} /> Open Camera</> : <><Upload size={12} /> Upload File</>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5 flex gap-4 mb-6">
          <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-bold text-yellow-500 mb-1 text-sm">{t('importantNote', { defaultValue: 'Important' })}</p>
            <p className="text-xs text-yellow-500/80">{t('kycNote', { defaultValue: 'Documents must be clear, unexpired, and match your registered name. Supported formats: JPG, PNG, PDF (max 10 MB each).' })}</p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !hasAnyFile}
          className="btn-gold w-full py-4 rounded-2xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Uploading documents...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <ShieldCheck size={16} />
              Submit for Verification {hasAnyFile ? `(${Object.values(files).filter(Boolean).length} file${Object.values(files).filter(Boolean).length > 1 ? 's' : ''})` : ''}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
