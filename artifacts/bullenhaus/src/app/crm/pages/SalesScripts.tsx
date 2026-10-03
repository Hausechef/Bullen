import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  Search, Plus, RefreshCw, Loader2, BookOpen, Copy, Trash2,
  MessageSquareWarning, Phone, TrendingUp, ShieldCheck,
} from 'lucide-react';
import { useScripts, SCRIPT_CATEGORIES } from '../hooks/useScripts';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';

const CATEGORY_ICONS: Record<string, any> = {
  cold_call: Phone,
  follow_up: RefreshCw,
  objection_handling: MessageSquareWarning,
  closing: TrendingUp,
  kyc_help: ShieldCheck,
  general: BookOpen,
};

function ScriptCard({ script, onOpen }: { script: any, onOpen: () => void }) {
  const Icon = CATEGORY_ICONS[script.category] || BookOpen;
  const cat = SCRIPT_CATEGORIES.find((c) => c.value === script.category);
  const objections = Array.isArray(script.objections) ? script.objections : [];

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onOpen}
      className="group w-full text-left rounded-lg border border-white/5 glass-card/60 hover:border-gold/30 hover:glass-card p-3 transition-all"
    >
      <div className="flex items-start gap-3 mb-2">
        <div className="p-2 rounded-lg" style={{ backgroundColor: (cat?.color || '#64748b') + '15', color: cat?.color }}>
          <Icon size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-bold text-aura-platinum">{script.title}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: cat?.color, backgroundColor: (cat?.color || '#64748b') + '15' }}>
              {cat?.label}
            </span>
            {script.stage && (
              <span className="text-[9px] text-aura-platinum/40 uppercase">{script.stage.replace(/_/g, ' ')}</span>
            )}
          </div>
        </div>
      </div>
      <p className="text-[10px] text-aura-platinum/50 line-clamp-2 mb-2">{script.body}</p>
      {objections.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[8px] text-aura-platinum/40 uppercase tracking-wider">Triggers:</span>
          {objections.slice(0, 3).map((o: string, i: number) => (
            <span key={i} className="text-[8px] text-amber-400/80 bg-amber-500/10 px-1 rounded">"{o}"</span>
          ))}
          {objections.length > 3 && <span className="text-[8px] text-aura-platinum/40">+{objections.length - 3}</span>}
        </div>
      )}
    </motion.button>
  );
}

function ScriptDetail({ script, onClose, onDelete }: { script: any, onClose: () => void, onDelete: () => void }) {
  if (!script) return null;
  const cat = SCRIPT_CATEGORIES.find((c) => c.value === script.category);
  const objections = Array.isArray(script.objections) ? script.objections : [];
  const tags = Array.isArray(script.tags) ? script.tags : [];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(script.body);
    toast.success('Script copied to clipboard');
  };

  return (
    <Drawer isOpen={!!script} onClose={onClose} title="Script Details" width="max-w-xl">
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: cat?.color, backgroundColor: (cat?.color || '#64748b') + '15' }}>
              {cat?.label}
            </span>
            {script.stage && (
              <span className="text-[9px] text-aura-platinum/50 uppercase">{script.stage.replace(/_/g, ' ')}</span>
            )}
          </div>
          <h3 className="font-serif text-xl text-aura-platinum">{script.title}</h3>
        </div>

        <div className="rounded-lg border border-white/5 bg-black/30 p-3">
          <p className="text-[12px] text-aura-platinum/90 whitespace-pre-wrap leading-relaxed">{script.body}</p>
        </div>

        {objections.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-2">Triggers (auto-suggest when client says)</p>
            <div className="flex flex-wrap gap-1.5">
              {objections.map((o: string, i: number) => (
                <span key={i} className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">"{o}"</span>
              ))}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-aura-platinum/60 mb-2">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t: string, i: number) => (
                <span key={i} className="text-[10px] text-gold/80 bg-gold/10 border border-gold/20 px-2 py-0.5 rounded">#{t}</span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="primary" size="sm" onClick={copyToClipboard}>
            <Copy size={12} /> Copy Script
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete}>
            <Trash2 size={12} /> Delete
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

function CreateScriptModal({ open, onClose, onCreated }: { open: boolean, onClose: () => void, onCreated: () => void }) {
  const { createScript } = useScripts();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('cold_call');
  const [body, setBody] = useState('');
  const [objections, setObjections] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    try {
      await createScript({
        title: title.trim(),
        category,
        body: body.trim(),
        objections: objections.split(',').map((s) => s.trim()).filter(Boolean),
      });
      toast.success('Script created');
      setTitle('');
      setBody('');
      setObjections('');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="New Sales Script" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Script title (e.g. Cold Call Opening)"
          className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none">
          {SCRIPT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder="Script body... Use {name} for client name placeholder"
          className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none resize-none"
        />
        <input
          value={objections}
          onChange={(e) => setObjections(e.target.value)}
          placeholder="Triggers (comma-separated: think, consider, not sure)"
          className="w-full rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" size="sm" type="submit" disabled={saving || !title.trim() || !body.trim()}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export const SalesScripts = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [selectedScript, setSelectedScript] = useState<any | null>(null);

  const { scripts, loading, error, refetch, deleteScript } = useScripts({
    category: activeCategory || undefined,
    search: search || undefined,
  });

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    for (const s of scripts) {
      if (!g[s.category]) g[s.category] = [];
      g[s.category].push(s);
    }
    return g;
  }, [scripts]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-5 w-1 bg-gradient-to-b from-gold to-gold/40 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold/80">Knowledge Base</span>
          </div>
          <h1 className="font-serif text-3xl font-light italic tracking-tight text-aura-platinum">Sales Scripts</h1>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> New Script
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveCategory('')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
            !activeCategory ? 'bg-gold/10 text-gold border border-gold/25' : 'text-aura-platinum/50 hover:bg-white/5'
          }`}
        >
          All ({scripts.length})
        </button>
        {SCRIPT_CATEGORIES.map((c) => {
          const count = grouped[c.value]?.length || 0;
          if (count === 0) return null;
          return (
            <button
              key={c.value}
              onClick={() => setActiveCategory(c.value)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                activeCategory === c.value ? 'bg-gold/10 text-gold border border-gold/25' : 'text-aura-platinum/50 hover:bg-white/5'
              }`}
            >
              {c.label} ({count})
            </button>
          );
        })}
        <div className="relative ml-auto">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-aura-platinum/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scripts..."
            className="rounded-lg border border-white/8 bg-black/30 py-1.5 pl-8 pr-3 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none w-48"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gold/50" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-rose-400 text-sm">{error}</div>
      ) : scripts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-aura-platinum/40">
          <BookOpen size={32} className="mb-2 opacity-50" />
          <p className="text-sm">No scripts found</p>
          <p className="text-[10px] mt-1">Create your first sales script or objection handler</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {scripts.map((s) => (
            <ScriptCard key={s.id} script={s} onOpen={() => setSelectedScript(s)} />
          ))}
        </div>
      )}

      <CreateScriptModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={refetch} />

      <ScriptDetail
        script={selectedScript}
        onClose={() => setSelectedScript(null)}
        onDelete={async () => {
          if (!selectedScript?.id) return;
          try {
            await deleteScript(selectedScript.id);
            toast.success('Script deleted');
            setSelectedScript(null);
          } catch (e: any) {
            toast.error(e.message);
          }
        }}
      />
    </div>
  );
};
