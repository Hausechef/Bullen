import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  LifeBuoy, Plus, Search, RefreshCw, Clock, AlertCircle, Loader2,
  Send, X, ChevronRight, User,
} from 'lucide-react';
import { useTickets, TICKET_STATUSES, TICKET_PRIORITIES } from '../hooks/useTickets';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { supabase } from '../../../lib/supabase/browserClient';

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return Math.floor(diff / 86400000) + 'd ago';
}

function slaStatus(slaDueAt: string | null, status: string): { color: string; label: string } {
  if (!slaDueAt || status === 'resolved' || status === 'closed') return { color: '#64748b', label: '—' };
  const remaining = new Date(slaDueAt).getTime() - Date.now();
  if (remaining < 0) return { color: '#ef4444', label: 'Overdue' };
  if (remaining < 3600000) return { color: '#ef4444', label: Math.floor(remaining / 60000) + 'm left' };
  if (remaining < 14400000) return { color: '#f59e0b', label: Math.floor(remaining / 3600000) + 'h left' };
  return { color: '#10b981', label: Math.floor(remaining / 3600000) + 'h left' };
}

// ---------------------------------------------------------------------------
// Ticket Row
// ---------------------------------------------------------------------------
function TicketRow({ ticket, onOpen }: { ticket: any, onOpen: () => void }) {
  const status = TICKET_STATUSES.find((s) => s.value === ticket.status);
  const priority = TICKET_PRIORITIES.find((p) => p.value === ticket.priority);
  const sla = slaStatus(ticket.sla_due_at, ticket.status);

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onOpen}
      className="group w-full text-left flex items-center gap-3 rounded-lg border border-white/5 glass-card/60 hover:border-gold/30 hover:glass-card p-3 transition-all"
    >
      <div className="p-2 rounded-lg" style={{ backgroundColor: (priority?.color || '#64748b') + '15', color: priority?.color }}>
        <LifeBuoy size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-bold text-aura-platinum">{ticket.subject}</p>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <span className="text-[10px] text-aura-platinum/50 flex items-center gap-0.5">
            <User size={9} /> {ticket.clientName}
          </span>
          <span className="text-[10px] text-aura-platinum/40">{timeAgo(ticket.created_at)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: sla.color, backgroundColor: sla.color + '15' }}>
          <Clock size={8} className="inline mr-0.5" />{sla.label}
        </span>
        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: priority?.color, backgroundColor: (priority?.color || '#64748b') + '15' }}>
          {priority?.label}
        </span>
        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: status?.color, backgroundColor: (status?.color || '#64748b') + '15' }}>
          {status?.label}
        </span>
        <ChevronRight size={12} className="text-aura-platinum/30 group-hover:text-gold transition-colors" />
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Ticket Detail Drawer
// ---------------------------------------------------------------------------
function TicketDetail({ ticket, onClose, onUpdate, onComment }: {
  ticket: any;
  onClose: () => void;
  onUpdate: (patch: any) => void;
  onComment: (body: string) => Promise<void>;
}) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!ticket) return;
    setLoadingComments(true);
    supabase
      .from('ticket_comments')
      .select('id, author_id, body, created_at, author:users!ticket_comments_author_id_fkey(full_name, email)')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          setComments(data.map((c: any) => ({
            ...c,
            authorName: c.author?.full_name || c.author?.email || 'Unknown',
          })));
        }
        setLoadingComments(false);
      });
  }, [ticket?.id]);

  const submitComment = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    try {
      await onComment(newComment.trim());
      // Refresh comments
      const { data } = await supabase
        .from('ticket_comments')
        .select('id, author_id, body, created_at, author:users!ticket_comments_author_id_fkey(full_name, email)')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });
      if (data) setComments(data.map((c: any) => ({ ...c, authorName: c.author?.full_name || c.author?.email || 'Unknown' })));
      setNewComment('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  if (!ticket) return null;
  const status = TICKET_STATUSES.find((s) => s.value === ticket.status);
  const priority = TICKET_PRIORITIES.find((p) => p.value === ticket.priority);

  return (
    <Drawer isOpen={!!ticket} onClose={onClose} title="Ticket Details" width="max-w-xl">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: priority?.color, backgroundColor: (priority?.color || '#64748b') + '15' }}>
              {priority?.label}
            </span>
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: status?.color, backgroundColor: (status?.color || '#64748b') + '15' }}>
              {status?.label}
            </span>
          </div>
          <h3 className="font-serif text-xl text-aura-platinum">{ticket.subject}</h3>
          <p className="text-[11px] text-aura-platinum/50 mt-1">
            From <span className="text-gold/80">{ticket.clientName}</span> · {timeAgo(ticket.created_at)}
          </p>
        </div>

        {/* Original message */}
        <div className="rounded-lg border border-white/5 bg-black/30 p-3">
          <p className="text-[12px] text-aura-platinum/80 whitespace-pre-wrap">{ticket.message}</p>
        </div>

        {/* Status / Priority controls */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-1 block">Status</label>
            <select
              value={ticket.status}
              onChange={(e) => onUpdate({ status: e.target.value })}
              className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-1.5 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none"
            >
              {TICKET_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-1 block">Priority</label>
            <select
              value={ticket.priority}
              onChange={(e) => onUpdate({ priority: e.target.value })}
              className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-1.5 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none"
            >
              {TICKET_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {/* Comments */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-2">Conversation</p>
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {loadingComments ? (
              <div className="text-center py-4"><Loader2 size={14} className="animate-spin text-gold/40 mx-auto" /></div>
            ) : comments.length === 0 ? (
              <p className="text-[11px] text-aura-platinum/40 text-center py-4">No comments yet</p>
            ) : comments.map((c) => (
              <div key={c.id} className="rounded-lg border border-white/5 glass-card p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-gold/80">{c.authorName}</span>
                  <span className="text-[9px] text-aura-platinum/40">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-[11px] text-aura-platinum/80 whitespace-pre-wrap">{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* New comment */}
        <div className="flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
            placeholder="Add a comment…"
            className="flex-1 rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none"
          />
          <Button variant="primary" size="sm" onClick={submitComment} disabled={sending || !newComment.trim()}>
            {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

// ---------------------------------------------------------------------------
// Create Ticket Modal
// ---------------------------------------------------------------------------
function CreateTicketModal({ open, onClose, onCreated }: { open: boolean, onClose: () => void, onCreated: () => void }) {
  const [clientId, setClientId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [clients, setClients] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      supabase.from('users').select('id, email, full_name').eq('role', 'client').limit(100).then(({ data }) => setClients(data || []));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !subject.trim() || !message.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const slaHours = priority === 'critical' ? 4 : priority === 'high' ? 24 : priority === 'medium' ? 72 : 168;
      const { error } = await supabase.from('support_tickets').insert({
        client_id: clientId,
        subject: subject.trim(),
        message: message.trim(),
        priority,
        status: 'new',
        created_by: user?.id || null,
        sla_due_at: new Date(Date.now() + slaHours * 3600 * 1000).toISOString(),
      });
      if (error) throw new Error(error.message);
      toast.success('Ticket created');
      setClientId(''); setSubject(''); setMessage(''); setPriority('medium');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="New Support Ticket" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-1 block">Client *</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none"
          >
            <option value="">— Select client —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-1 block">Subject *</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="Cannot withdraw funds"
            className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-1 block">Message *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            placeholder="Describe the issue…"
            className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none resize-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-1 block">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none">
            {TICKET_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" size="sm" type="submit" disabled={saving || !clientId || !subject.trim() || !message.trim()}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Create Ticket
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export const Tickets = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const { tickets, loading, error, refetch, updateTicket, addComment } = useTickets({
    status: statusFilter || undefined,
    search: search || undefined,
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-5 w-1 bg-gradient-to-b from-gold to-gold/40 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold/80">Helpdesk</span>
          </div>
          <h1 className="font-serif text-3xl font-light italic tracking-tight text-aura-platinum">Support Tickets</h1>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> New Ticket
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-aura-platinum/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets…"
            className="w-full rounded-lg border border-white/8 bg-black/30 py-1.5 pl-9 pr-3 text-[12px] text-aura-platinum placeholder:text-aura-platinum/30 focus:border-gold/40 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-white/8 bg-black/30 px-3 py-1.5 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none"
        >
          <option value="">All Statuses</option>
          {TICKET_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gold/50" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-rose-400 text-sm">{error}</div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-aura-platinum/40">
            <LifeBuoy size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No tickets found</p>
            <p className="text-[10px] mt-1">All support tickets will appear here</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              onOpen={() => setSelectedTicket(ticket)}
            />
          ))
        )}
      </div>

      <CreateTicketModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={refetch} />

      <TicketDetail
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onUpdate={async (patch) => {
          try {
            await updateTicket(selectedTicket.id, patch);
            setSelectedTicket({ ...selectedTicket, ...patch });
            toast.success('Ticket updated');
          } catch (e: any) { toast.error(e.message); }
        }}
        onComment={async (body) => {
          await addComment(selectedTicket.id, body);
          toast.success('Comment added');
        }}
      />
    </div>
  );
};
