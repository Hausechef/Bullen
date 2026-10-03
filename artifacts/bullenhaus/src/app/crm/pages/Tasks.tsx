import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  Plus, Phone, Mail, ShieldCheck, RefreshCw, Clock, Check, X,
  Loader2, Calendar, AlertCircle, User,
} from 'lucide-react';
import { useTasks, TASK_TYPES, TASK_PRIORITIES, TASK_STATUSES } from '../hooks/useTasks';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../../../lib/supabase/browserClient';

const TYPE_ICONS: Record<string, any> = {
  call: Phone, email: Mail, deposit_check: RefreshCw, kyc: ShieldCheck, follow_up: Clock, manual: Plus,
};

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 0) return 'in ' + Math.abs(Math.floor(diff / 86400000)) + 'd';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return Math.floor(diff / 86400000) + 'd ago';
}

function isOverdue(dueAt: string, status: string): boolean {
  if (!dueAt || status === 'completed' || status === 'cancelled') return false;
  return new Date(dueAt).getTime() < Date.now();
}

// ---------------------------------------------------------------------------
// Task Row
// ---------------------------------------------------------------------------
function TaskRow({ task, onComplete, onDelete }: { task: any, onComplete: () => void, onDelete: () => void }) {
  const Icon = TYPE_ICONS[task.type] || Plus;
  const overdue = isOverdue(task.due_at, task.status);
  const priority = TASK_PRIORITIES.find((p) => p.value === task.priority);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group flex items-center gap-3 rounded-lg border p-3 transition-all ${
        overdue ? 'border-rose-500/30 bg-rose-500/5' : 'border-white/5 glass-card/60 hover:border-white/10'
      } ${task.status === 'completed' ? 'opacity-50' : ''}`}
    >
      <div className={`p-2 rounded-lg ${task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-aura-platinum/60'}`}>
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[12px] font-bold ${task.status === 'completed' ? 'line-through text-aura-platinum/40' : 'text-aura-platinum'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          {task.clientName && (
            <span className="text-[10px] text-aura-platinum/50 flex items-center gap-0.5">
              <User size={9} /> {task.clientName}
            </span>
          )}
          {task.due_at && (
            <span className={`text-[10px] flex items-center gap-0.5 ${overdue ? 'text-rose-400' : 'text-aura-platinum/40'}`}>
              <Clock size={9} /> {timeAgo(task.due_at)}
            </span>
          )}
          {task.assigneeName && (
            <span className="text-[10px] text-aura-platinum/40">→ {task.assigneeName}</span>
          )}
        </div>
      </div>
      {priority && (
        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: priority.color, backgroundColor: priority.color + '15' }}>
          {priority.label}
        </span>
      )}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {task.status !== 'completed' && (
          <button onClick={onComplete} className="p-1.5 rounded text-emerald-400 hover:bg-emerald-500/10" title="Complete">
            <Check size={12} />
          </button>
        )}
        <button onClick={onDelete} className="p-1.5 rounded text-rose-400 hover:bg-rose-500/10" title="Delete">
          <X size={12} />
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Create Task Modal
// ---------------------------------------------------------------------------
function CreateTaskModal({ open, onClose, onCreated }: { open: boolean, onClose: () => void, onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('manual');
  const [priority, setPriority] = useState('medium');
  const [dueAt, setDueAt] = useState('');
  const [clientId, setClientId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [notes, setNotes] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useMemo(() => {
    if (open) {
      supabase.from('users').select('id, email, full_name').eq('role', 'client').limit(100).then(({ data }) => setClients(data || []));
      supabase.from('users').select('id, email, full_name').in('role', ['agent', 'manager', 'director']).then(({ data }) => setAgents(data || []));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('tasks').insert({
        title: title.trim(),
        type,
        priority,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        client_id: clientId || null,
        assignee_id: assigneeId || null,
        notes: notes || null,
        created_by: user?.id || null,
        status: 'pending',
      });
      if (error) throw new Error(error.message);
      toast.success('Task created');
      setTitle(''); setType('manual'); setPriority('medium'); setDueAt(''); setClientId(''); setAssigneeId(''); setNotes('');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="New Task" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-1 block">Title *</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Call Hans Mueller about deposit"
            className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-1 block">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none">
              {TASK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-1 block">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none">
              {TASK_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-1 block">Due Date</label>
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-1 block">Client</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none">
              <option value="">— None —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-1 block">Assignee</label>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none">
              <option value="">— Unassigned —</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.full_name || a.email}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-1 block">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none resize-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" size="sm" type="submit" disabled={saving || !title.trim()}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export const Tasks = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<{ status?: string; priority?: string; overdue?: boolean }>({});

  const { tasks, loading, error, refetch, updateTaskStatus, deleteTask } = useTasks(filter);

  const overdueCount = useMemo(
    () => tasks.filter((t) => isOverdue(t.due_at, t.status)).length,
    [tasks]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-5 w-1 bg-gradient-to-b from-gold to-gold/40 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold/80">Follow-ups</span>
          </div>
          <h1 className="font-serif text-3xl font-light italic tracking-tight text-aura-platinum">Tasks</h1>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter({})}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
            !filter.status && !filter.overdue ? 'bg-gold/10 text-gold border border-gold/25' : 'text-aura-platinum/50 hover:bg-white/5'
          }`}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => setFilter({ status: 'pending' })}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
            filter.status === 'pending' ? 'bg-gold/10 text-gold border border-gold/25' : 'text-aura-platinum/50 hover:bg-white/5'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter({ status: 'completed' })}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
            filter.status === 'completed' ? 'bg-gold/10 text-gold border border-gold/25' : 'text-aura-platinum/50 hover:bg-white/5'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setFilter({ overdue: true })}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1 ${
            filter.overdue ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' : 'text-aura-platinum/50 hover:bg-white/5'
          }`}
        >
          <AlertCircle size={10} /> Overdue ({overdueCount})
        </button>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gold/50" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-rose-400 text-sm">{error}</div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-aura-platinum/40">
            <Calendar size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No tasks yet</p>
            <p className="text-[10px] mt-1">Click "New Task" to create a follow-up</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onComplete={async () => {
                try { await updateTaskStatus(task.id, 'completed'); toast.success('Task completed'); }
                catch (e: any) { toast.error(e.message); }
              }}
              onDelete={async () => {
                try { await deleteTask(task.id); toast.success('Task deleted'); }
                catch (e: any) { toast.error(e.message); }
              }}
            />
          ))
        )}
      </div>

      <CreateTaskModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={refetch} />
    </div>
  );
};
