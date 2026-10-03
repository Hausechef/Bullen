import React, { useEffect, useMemo, useState } from 'react';
import { Inbox, Mail, RefreshCw, CheckCircle2, MessageSquare, Send } from 'lucide-react';
import { LuxIcon } from '../../components/common/LuxIcon';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

/**
 * Trading admin — Support Inbox. Lists every support ticket submitted from
 * the client Support page (RLS grants admin/trade_admin full read + update).
 */

interface Ticket {
  id: string;
  client_id: string;
  category: string | null;
  subject: string | null;
  message: string;
  contact_email: string | null;
  status: 'new' | 'open' | 'pending' | 'resolved' | 'closed';
  priority: string;
  created_at: string;
  updated_at: string;
}

const STATUSES: Ticket['status'][] = ['new', 'open', 'pending', 'resolved', 'closed'];

const STATUS_STYLE: Record<string, string> = {
  new:      'bg-orange-500/10 text-orange-400 border-orange-500/30',
  open:     'bg-accent-primary/10 text-accent-primary border-accent-primary/30',
  pending:  'bg-blue-500/10 text-blue-400 border-blue-500/30',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  closed:   'bg-white/5 text-slate-500 border-white/10',
};

interface TicketComment {
  id: string;
  ticket_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
}

export const AdminSupport: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Ticket['status']>('all');
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, TicketComment[]>>({});
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const loadComments = async (ticketIds: string[]) => {
    if (ticketIds.length === 0) return;
    const { data } = await supabase
      .from('ticket_comments')
      .select('id, ticket_id, author_id, body, created_at')
      .in('ticket_id', ticketIds)
      .order('created_at', { ascending: true });
    const map: Record<string, TicketComment[]> = {};
    (data ?? []).forEach((c: TicketComment) => {
      (map[c.ticket_id] ??= []).push(c);
    });
    setComments(map);
  };

  const sendReply = async (tk: Ticket) => {
    const body = replyText.trim();
    if (!body) { toast.error('Reply is empty'); return; }
    setSendingReply(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: cErr } = await supabase.from('ticket_comments').insert({
        ticket_id: tk.id,
        author_id: user?.id ?? null,
        body,
      });
      if (cErr) throw cErr;

      // Deliver the reply into the client's notifications
      const { error: nErr } = await supabase.from('notifications').insert({
        user_id: tk.client_id,
        type: 'support',
        title: `Support reply — ${tk.category || tk.subject || 'your ticket'}`,
        message: body,
        data: { ticket_id: tk.id },
      });
      if (nErr) throw nErr;

      // A freshly answered ticket moves from new -> open
      if (tk.status === 'new') {
        await supabase.from('support_tickets').update({ status: 'open' }).eq('id', tk.id);
        setTickets(ts => ts.map(t => (t.id === tk.id ? { ...t, status: 'open' } : t)));
      }

      setReplyText('');
      setReplyOpen(null);
      await loadComments(tickets.map(t => t.id));
      toast.success('Reply sent — the client has been notified');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      const rows = (data ?? []) as Ticket[];
      setTickets(rows);
      loadComments(rows.map(r => r.id));

      const ids = [...new Set(rows.map(r => r.client_id).filter(Boolean))];
      if (ids.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, display_name, full_name, email')
          .in('id', ids);
        const map: Record<string, string> = {};
        (users ?? []).forEach((u: any) => {
          map[u.id] = u.display_name || u.full_name || u.email || u.id;
        });
        setUserNames(map);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: Ticket['status']) => {
    const prev = tickets;
    setTickets(ts => ts.map(t => (t.id === id ? { ...t, status } : t)));
    const { error } = await supabase
      .from('support_tickets')
      .update({ status, resolved_at: status === 'resolved' || status === 'closed' ? new Date().toISOString() : null })
      .eq('id', id);
    if (error) {
      setTickets(prev);
      toast.error(error.message || 'Failed to update status');
    } else {
      toast.success(`Ticket marked as ${status}`);
    }
  };

  const visible = useMemo(
    () => (filter === 'all' ? tickets : tickets.filter(t => t.status === filter)),
    [tickets, filter],
  );

  const newCount = tickets.filter(t => t.status === 'new').length;

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-[0.15em] flex items-center gap-3">
            <LuxIcon icon={Inbox} size={24} />
            Support Inbox
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {newCount > 0 ? `${newCount} new ticket${newCount > 1 ? 's' : ''} awaiting response` : 'All tickets handled'}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors disabled:opacity-50 self-start md:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {(['all', ...STATUSES] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-colors ${
              filter === s
                ? 'bg-accent-primary/15 text-accent-primary border-accent-primary/40'
                : 'bg-white/5 text-slate-500 border-white/10 hover:text-white'
            }`}
          >
            {s}{s !== 'all' && ` (${tickets.filter(t => t.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      <div className="space-y-3">
        {loading && tickets.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-500 text-sm">Loading tickets…</div>
        ) : visible.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <CheckCircle2 size={32} className="text-accent-secondary mx-auto mb-3" />
            <p className="text-sm text-slate-400">No tickets{filter !== 'all' ? ` with status "${filter}"` : ' yet'}.</p>
          </div>
        ) : (
          visible.map(tk => (
            <div key={tk.id} className="glass-card p-5">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLE[tk.status]}`}>
                      {tk.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                      {tk.category || tk.subject || 'General'}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {new Date(tk.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words mb-3">{tk.message}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="font-bold text-slate-400">{userNames[tk.client_id] || tk.client_id}</span>
                    {tk.contact_email && (
                      <a
                        href={`mailto:${tk.contact_email}`}
                        className="flex items-center gap-1.5 text-accent-primary hover:underline font-mono break-all"
                      >
                        <Mail size={12} /> {tk.contact_email}
                      </a>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Status</label>
                  <select
                    value={tk.status}
                    onChange={e => setStatus(tk.id, e.target.value as Ticket['status'])}
                    className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-primary/50"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Reply thread */}
              {(comments[tk.id]?.length ?? 0) > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                  {comments[tk.id].map(c => (
                    <div key={c.id} className="flex items-start gap-2.5 p-3 bg-accent-primary/5 border border-accent-primary/15 rounded-xl">
                      <MessageSquare size={13} className="text-accent-primary mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap break-words">{c.body}</p>
                        <p className="text-[10px] text-slate-600 mt-1">
                          {(c.author_id && userNames[c.author_id]) || 'Support'} · {new Date(c.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply composer */}
              <div className="mt-4 pt-4 border-t border-white/5">
                {replyOpen === tk.id ? (
                  <div className="space-y-2">
                    <textarea
                      autoFocus
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Write a reply to the client…"
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-primary/50 min-h-[90px] resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setReplyOpen(null); setReplyText(''); }}
                        className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => sendReply(tk)}
                        disabled={sendingReply || !replyText.trim()}
                        className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-accent-primary text-black hover:bg-accent-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Send size={11} /> {sendingReply ? 'Sending…' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setReplyOpen(tk.id); setReplyText(''); }}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-accent-primary hover:text-white transition-colors"
                  >
                    <MessageSquare size={12} /> Reply to client
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
