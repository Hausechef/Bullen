import { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  Plus, RefreshCw, Loader2, Zap, Play, Trash2,
  History, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Clock,
} from 'lucide-react';
import { useWorkflows, useWorkflowExecutions, WORKFLOW_TRIGGERS } from '../hooks/useWorkflows';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return Math.floor(diff / 86400000) + 'd ago';
}

function WorkflowRow({ workflow, onToggle, onRun, onDelete, expanded, onExpand }: {
  workflow: any;
  onToggle: () => void;
  onRun: () => void;
  onDelete: () => void;
  expanded: boolean;
  onExpand: () => void;
}) {
  const trigger = WORKFLOW_TRIGGERS.find((t) => t.value === workflow.trigger);
  const actions = Array.isArray(workflow.actions) ? workflow.actions : [];
  const isActive = workflow.status === 'active';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border p-3 transition-all ${
        isActive ? 'border-gold/20 glass-card/80' : 'border-white/5 glass-card/60 opacity-60'
      }`}
    >
      <div className="flex items-center gap-3">
        <button onClick={onExpand} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <div className="p-2 rounded-lg" style={{ backgroundColor: (trigger?.color || '#64748b') + '15', color: trigger?.color }}>
            <Zap size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold text-aura-platinum">{workflow.name}</p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: trigger?.color, backgroundColor: (trigger?.color || '#64748b') + '15' }}>
                {trigger?.label || workflow.trigger}
              </span>
              <span className="text-[9px] text-aura-platinum/40">Priority {workflow.priority}</span>
              {actions.length > 0 && (
                <span className="text-[9px] text-gold/60">{actions.length} action{actions.length === 1 ? '' : 's'}</span>
              )}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={onRun}
            disabled={!isActive}
            className="p-1.5 rounded text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-30"
            title="Run now"
          >
            <Play size={12} />
          </button>
          <button
            onClick={onToggle}
            className={`p-1.5 rounded transition ${isActive ? 'text-gold' : 'text-aura-platinum/40 hover:text-aura-platinum'}`}
            title={isActive ? 'Disable' : 'Enable'}
          >
            {isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded text-rose-400 hover:bg-rose-500/10"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
          <button onClick={onExpand} className="p-1 text-aura-platinum/40">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-white/5 space-y-2"
        >
          {workflow.description && (
            <p className="text-[11px] text-aura-platinum/70">{workflow.description}</p>
          )}
          {Object.keys(workflow.conditions || {}).length > 0 && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-aura-platinum/50 mb-1">Conditions</p>
              <pre className="text-[10px] text-aura-platinum/70 bg-black/30 rounded p-2 overflow-x-auto">{JSON.stringify(workflow.conditions, null, 2)}</pre>
            </div>
          )}
          {actions.length > 0 && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-aura-platinum/50 mb-1">Actions</p>
              <div className="space-y-1">
                {actions.map((a: any, i: number) => (
                  <div key={i} className="text-[10px] text-aura-platinum/70 bg-black/30 rounded p-2">
                    <span className="font-bold text-gold/80">{a.type.replace(/_/g, ' ')}</span>
                    {a.task_type && <span className="ml-2">-&gt; {a.task_type}</span>}
                    {a.to_stage && <span className="ml-2">-&gt; {a.to_stage}</span>}
                    {a.title && <span className="ml-2">"{a.title}"</span>}
                    {a.escalate_to && <span className="ml-2">-&gt; {a.escalate_to}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

function CreateWorkflowModal({ open, onClose, onCreated }: { open: boolean, onClose: () => void, onCreated: () => void }) {
  const { createWorkflow } = useWorkflows();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState('lead_created');
  const [priority, setPriority] = useState(50);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createWorkflow({
        name: name.trim(),
        description: description.trim() || undefined,
        trigger,
        priority,
        conditions: {},
        actions: [{ type: 'create_task', task_type: 'follow_up', title: `Auto: ${name.trim()}` }],
      });
      toast.success('Workflow created');
      setName('');
      setDescription('');
      setTrigger('lead_created');
      setPriority(50);
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="New Workflow Rule" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rule name (e.g. Follow-up after no deposit)"
          className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Description..."
          className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none resize-none"
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-1 block">Trigger</label>
            <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none">
              {WORKFLOW_TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-1 block">Priority</label>
            <input
              type="number"
              min="1"
              max="100"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" size="sm" type="submit" disabled={saving || !name.trim()}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export const WorkflowRules = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(false);

  const { workflows, loading, error, refetch, toggleActive, deleteWorkflow, runWorkflow } = useWorkflows();
  const { executions, loading: logLoading, refetch: refetchLog } = useWorkflowExecutions(30);

  const activeCount = workflows.filter((w) => w.status === 'active').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-5 w-1 bg-gradient-to-b from-gold to-gold/40 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold/80">Automation</span>
          </div>
          <h1 className="font-serif text-3xl font-light italic tracking-tight text-aura-platinum">Workflow Rules</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setShowLog((v) => !v); refetchLog(); }}>
            <History size={12} /> Log
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> New Rule
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[11px]">
        <span className="text-aura-platinum/60">{workflows.length} total rules</span>
        <span className="text-emerald-400 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {activeCount} active
        </span>
        <span className="text-aura-platinum/40">{workflows.length - activeCount} disabled</span>
      </div>

      {showLog && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-lg border border-white/5 bg-black/30 p-3"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-2">Execution Log</p>
          {logLoading ? (
            <div className="text-center py-2"><Loader2 size={12} className="animate-spin text-gold/40 mx-auto" /></div>
          ) : executions.length === 0 ? (
            <p className="text-[11px] text-aura-platinum/40 text-center py-2">No executions yet</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
              {executions.map((ex) => (
                <div key={ex.id} className="flex items-center gap-2 text-[10px] py-1 border-b border-white/5">
                  <span className={`h-1.5 w-1.5 rounded-full ${ex.status === 'succeeded' ? 'bg-emerald-500' : ex.status === 'failed' ? 'bg-rose-500' : 'bg-aura-platinum/30'}`} />
                  <span className="text-aura-platinum/80 font-medium truncate flex-1">{ex.workflow_name}</span>
                  <span className="text-aura-platinum/40 uppercase">{ex.status}</span>
                  <span className="text-aura-platinum/40 flex items-center gap-0.5"><Clock size={9} />{timeAgo(ex.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gold/50" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-rose-400 text-sm">{error}</div>
      ) : workflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-aura-platinum/40">
          <Zap size={32} className="mb-2 opacity-50" />
          <p className="text-sm">No workflow rules yet</p>
          <p className="text-[10px] mt-1">Create automation rules to streamline operations</p>
        </div>
      ) : (
        <div className="space-y-2">
          {workflows.map((w) => (
            <WorkflowRow
              key={w.id}
              workflow={w}
              expanded={expandedId === w.id}
              onExpand={() => setExpandedId(expandedId === w.id ? null : w.id)}
              onToggle={async () => {
                try {
                  const wasActive = w.status === 'active';
                  await toggleActive(w.id, !wasActive);
                  toast.success(wasActive ? 'Disabled' : 'Enabled');
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
              onRun={async () => {
                try {
                  await runWorkflow(w);
                  toast.success('Workflow executed');
                  refetchLog();
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
              onDelete={async () => {
                if (!confirm(`Delete "${w.name}"?`)) return;
                try {
                  await deleteWorkflow(w.id);
                  toast.success('Rule deleted');
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
            />
          ))}
        </div>
      )}

      <CreateWorkflowModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={refetch} />
    </div>
  );
};
