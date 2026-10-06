import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  Send, Search, RefreshCw, Loader2, User, Mail, MessageCircle,
  FileText, Plus, X, ChevronRight,
} from 'lucide-react';
import { useMessages, useTemplates, MESSAGE_CHANNELS } from '../hooks/useMessages';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../../../lib/supabase/browserClient';

function timeAgo(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Channel icon
// ---------------------------------------------------------------------------
function ChannelIcon({ channel, size = 12 }: { channel: string, size?: number }) {
  const ch = MESSAGE_CHANNELS.find((c) => c.value === channel);
  const Icon = channel === 'email' ? Mail : MessageCircle;
  return <Icon size={size} style={{ color: ch?.color }} />;
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------
function MessageBubble({ msg }: { msg: any }) {
  const outbound = msg.direction === 'outbound';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${outbound ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`max-w-[75%] rounded-xl p-3 ${outbound ? 'bg-gold/15 border border-gold/25' : 'bg-white/5 border border-white/10'}`}>
        <div className="flex items-center gap-2 mb-1">
          <ChannelIcon channel={msg.channel} />
          <span className="text-[10px] font-bold text-aura-platinum/70">{outbound ? msg.senderName : 'Client'}</span>
          {msg.subject && <span className="text-[10px] text-aura-platinum/50 truncate">· {msg.subject}</span>}
        </div>
        <p className="text-[12px] text-aura-platinum whitespace-pre-wrap break-words">{msg.body}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[9px] text-aura-platinum/40">{timeAgo(msg.created_at)}</span>
          <span className={`text-[9px] uppercase ${msg.status === 'sent' ? 'text-emerald-400' : msg.status === 'failed' ? 'text-rose-400' : 'text-aura-platinum/40'}`}>
            {msg.status}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Template Manager Modal
// ---------------------------------------------------------------------------
function TemplateModal({ open, onClose, onCreated }: { open: boolean, onClose: () => void, onCreated: () => void }) {
  const { createTemplate } = useTemplates();
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('email');
  const [category, setCategory] = useState('general');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;
    setSaving(true);
    try {
      await createTemplate({ name: name.trim(), channel, category, body: body.trim() });
      toast.success('Template created');
      setName(''); setBody('');
      onCreated();
      onClose();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="New Template" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name (e.g. Welcome Email)"
          className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className="rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none">
            {MESSAGE_CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none">
            <option value="general">General</option>
            <option value="welcome">Welcome</option>
            <option value="follow_up">Follow-up</option>
            <option value="deposit">Deposit</option>
            <option value="kyc">KYC</option>
            <option value="retention">Retention</option>
            <option value="win_back">Win-back</option>
          </select>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder="Use {name} for client name placeholder…"
          className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none resize-none"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" size="sm" type="submit" disabled={saving || !name.trim() || !body.trim()}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export const Messages = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('email');
  const [draft, setDraft] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [sending, setSending] = useState(false);

  const { templates, loading: templatesLoading } = useTemplates();
  const { messages, loading, error, sendMessage } = useMessages(selectedClientId);

  useMemo(() => {
    supabase.from('users').select('id, email, full_name').eq('role', 'client').limit(200).then(({ data }) => {
      if (data) setClients(data);
    });
  }, []);

  const filteredClients = clients.filter((c) =>
    !search || (c.full_name || c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const clientName = selectedClient?.full_name || selectedClient?.email || 'Client';

  const handleSend = async () => {
    if (!draft.trim() || !selectedClientId) return;
    setSending(true);
    try {
      let body = draft;
      // Replace {name} placeholder
      body = body.replace(/\{name\}/g, clientName.split(' ')[0] || clientName);
      await sendMessage({ clientId: selectedClientId, channel, body });
      setDraft('');
      toast.success(`${MESSAGE_CHANNELS.find((c) => c.value === channel)?.label} sent`);
    } catch (e: any) { toast.error(e.message); }
    finally { setSending(false); }
  };

  const applyTemplate = (tpl: any) => {
    setChannel(tpl.channel);
    setDraft(tpl.body);
    setShowTemplates(false);
  };

  return (
    <div className="flex h-[calc(100vh-160px)] gap-4">
      {/* Client list sidebar */}
      <div className="w-72 shrink-0 flex flex-col glass-card overflow-hidden">
        <div className="p-2 border-b border-white/5">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-aura-platinum/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients…"
              className="w-full rounded-md border border-white/8 bg-black/30 py-1.5 pl-8 pr-2 text-[11px] text-aura-platinum focus:border-gold/40 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
          {filteredClients.length === 0 ? (
            <p className="text-center text-[10px] text-aura-platinum/40 py-4">No clients</p>
          ) : filteredClients.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedClientId(c.id)}
              className={`w-full text-left p-2 rounded-lg transition ${selectedClientId === c.id ? 'bg-gold/10 border border-gold/25' : 'hover:bg-white/5 border border-transparent'}`}
            >
              <p className="truncate text-[11px] font-bold text-aura-platinum">{c.full_name || c.email}</p>
              <p className="truncate text-[9px] text-aura-platinum/40">{c.email}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col glass-card overflow-hidden">
        {!selectedClientId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-aura-platinum/40">
            <MessageCircle size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Select a client to view messages</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/5">
              <div>
                <p className="text-[12px] font-bold text-aura-platinum">{clientName}</p>
                <p className="text-[10px] text-aura-platinum/50">{selectedClient?.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowTemplateModal(true)}>
                <Plus size={12} /> Template
              </Button>
            </div>

            {/* Messages timeline */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-gold/50" />
                </div>
              ) : error ? (
                <div className="text-center text-rose-400 text-sm py-4">{error}</div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-aura-platinum/40">
                  <Mail size={28} className="mb-2 opacity-50" />
                  <p className="text-[12px]">No messages yet</p>
                  <p className="text-[10px] mt-1">Start the conversation below</p>
                </div>
              ) : (
                messages.map((m) => <MessageBubble key={m.id} msg={m} />)
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-white/5 p-3 space-y-2">
              {/* Channel + template picker */}
              <div className="flex items-center gap-2">
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="rounded-md border border-white/8 bg-black/30 px-2 py-1 text-[10px] text-aura-platinum focus:border-gold/40 focus:outline-none"
                >
                  {MESSAGE_CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <button
                  onClick={() => setShowTemplates((v) => !v)}
                  className="px-2 py-1 rounded-md border border-white/8 bg-black/30 text-[10px] text-aura-platinum hover:text-gold hover:border-gold/30"
                >
                  <FileText size={10} className="inline mr-1" /> Templates ({templates.length})
                </button>
              </div>

              {/* Template dropdown */}
              {showTemplates && (
                <div className="rounded-lg border border-white/8 glass-card max-h-48 overflow-y-auto custom-scrollbar">
                  {templatesLoading ? (
                    <p className="text-[10px] text-center py-3 text-aura-platinum/40">Loading…</p>
                  ) : templates.length === 0 ? (
                    <p className="text-[10px] text-center py-3 text-aura-platinum/40">No templates</p>
                  ) : templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t)}
                      className="w-full text-left p-2 hover:bg-white/5 border-b border-white/5"
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <ChannelIcon channel={t.channel} />
                        <span className="text-[11px] font-bold text-aura-platinum">{t.name}</span>
                        <Badge variant="default" className="text-[8px] ml-auto">{t.category}</Badge>
                      </div>
                      <p className="text-[9px] text-aura-platinum/50 truncate">{t.body}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="flex gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSend(); } }}
                  placeholder={`Type ${MESSAGE_CHANNELS.find((c) => c.value === channel)?.label.toLowerCase()}… (use {name} for client name)`}
                  rows={2}
                  className="flex-1 rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none resize-none"
                />
                <Button variant="primary" size="sm" onClick={handleSend} disabled={sending || !draft.trim()}>
                  {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <TemplateModal open={showTemplateModal} onClose={() => setShowTemplateModal(false)} onCreated={() => {}} />
    </div>
  );
};
