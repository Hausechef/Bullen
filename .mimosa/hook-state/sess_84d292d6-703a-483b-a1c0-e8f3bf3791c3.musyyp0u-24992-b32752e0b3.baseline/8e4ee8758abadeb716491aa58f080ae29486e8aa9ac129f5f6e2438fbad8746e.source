import { useState, useMemo, memo } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, useDroppable, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Search, Filter, RefreshCw, GripVertical, Phone, Mail, Loader2, X } from 'lucide-react';
import { useKanban, KANBAN_STAGES, type KanbanStage } from '../hooks/useKanban';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { supabase } from '../../../lib/supabase/browserClient';

// ---------------------------------------------------------------------------
// Sortable Lead Card
// ---------------------------------------------------------------------------
const SortableLeadCard = memo(function SortableLeadCard({ lead, isMoving }: { lead: any, isMoving: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : (isMoving ? 0.5 : 1),
  };
  const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.email || 'Unknown';
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group cursor-grab active:cursor-grabbing rounded-lg border border-white/5 glass-card p-3 hover:border-gold/30 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-bold text-aura-platinum">{name}</p>
          {lead.email && <p className="truncate text-[10px] text-aura-platinum/40">{lead.email}</p>}
        </div>
        <GripVertical size={12} className="mt-0.5 text-aura-platinum/20 group-hover:text-gold/50" />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {lead.capacity && (
          <Badge variant="default" className="text-[9px]">
            ${(Number(lead.capacity) || 0).toLocaleString()}
          </Badge>
        )}
        {lead.country && (
          <span className="text-[9px] text-aura-platinum/40 uppercase tracking-wider">{lead.country}</span>
        )}
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="ml-auto p-1 rounded text-aura-platinum/40 hover:text-gold"
            title={lead.phone}
          >
            <Phone size={10} />
          </a>
        )}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Static Lead Card (for DragOverlay)
// ---------------------------------------------------------------------------
function LeadCardOverlay({ lead }: { lead: any }) {
  const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.email || 'Unknown';
  return (
    <div className="rounded-lg border border-gold/40 glass-card p-3 shadow-[0_0_24px_rgba(212,175,55,0.3)] rotate-2">
      <p className="truncate text-[12px] font-bold text-aura-platinum">{name}</p>
      {lead.email && <p className="truncate text-[10px] text-aura-platinum/40">{lead.email}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kanban Column
// ---------------------------------------------------------------------------
const KanbanColumn = memo(function KanbanColumn({ stage, leads, total, movingId, onLoadMore }: { stage: typeof KANBAN_STAGES[number], leads: any[], total: number, movingId: string | null, onLoadMore: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.value });
  const hasMore = total > leads.length;

  return (
    <div className={`flex flex-1 min-w-[150px] flex-col glass-card transition-colors duration-200 rounded-xl overflow-hidden ${isOver ? 'border-gold/30 bg-gold/5' : 'border-white/5'}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5" style={{ borderTopColor: stage.color, borderTopWidth: '2px' }}>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-aura-platinum">{stage.label}</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-aura-platinum/60 px-1.5 py-0.5 rounded bg-white/5">{total}</span>
      </div>
      <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 min-h-[200px]">
          {leads.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-[10px] text-aura-platinum/30 uppercase tracking-wider">
              No leads
            </div>
          ) : leads.map((lead) => (
            <SortableLeadCard key={lead.id} lead={lead} isMoving={movingId === lead.id} />
          ))}
          {hasMore && (
            <button
              onClick={onLoadMore}
              className="w-full rounded-lg border border-white/5 bg-black/20 py-1.5 text-[9px] font-bold uppercase tracking-widest text-gold/70 hover:border-gold/30 hover:bg-gold/5"
            >
              Load 30 more ({total - leads.length})
            </button>
          )}
        </div>
      </SortableContext>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export const LeadKanban = () => {
  const [filters, setFilters] = useState({ search: '', agentId: '', source: '' });
  const [activeLead, setActiveLead] = useState<any | null>(null);
  const [agents, setAgents] = useState<any[]>([]);

  const { grouped, counts, loading, error, moving, refetch, moveLead, loadMoreStage } = useKanban({
    search: filters.search || undefined,
    agentId: filters.agentId || undefined,
    source: filters.source || undefined,
  });

  // Load agents for filter
  useMemo(() => {
    supabase.from('users').select('id, full_name, email').in('role', ['agent', 'manager', 'director']).then(({ data }) => {
      if (data) setAgents(data);
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (e: DragStartEvent) => {
    const lead = Object.values(grouped).flat().find((l: any) => l.id === e.active.id);
    setActiveLead(lead || null);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveLead(null);
    const { active, over } = e;
    if (!over) return;

    // Find which column the drop happened in (over.id can be a lead id or a stage id)
    const leadId = String(active.id);
    const overId = String(over.id);

    // Find the lead's current stage
    const allLeads = Object.values(grouped).flat() as any[];
    const lead = allLeads.find((l) => l.id === leadId);
    if (!lead) return;
    const fromStage = lead.stage;

    // Determine target stage: if overId is a stage value, use it; otherwise find which column contains the over lead
    let toStage: KanbanStage | null = null;
    if (KANBAN_STAGES.some((s) => s.value === overId)) {
      toStage = overId as KanbanStage;
    } else {
      // overId is a lead id — find its stage
      const overLead = allLeads.find((l) => l.id === overId);
      if (overLead) toStage = overLead.stage as KanbanStage;
    }
    if (!toStage || toStage === fromStage) return;

    try {
      await moveLead(leadId, fromStage, toStage);
      toast.success(`Lead moved to ${KANBAN_STAGES.find((s) => s.value === toStage)?.label}`);
    } catch (err: any) {
      toast.error(`Failed to move lead: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-5 w-1 bg-gradient-to-b from-gold to-gold/40 rounded-full shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold/80">Sales Pipeline</span>
        </div>
        <h1 className="font-serif text-3xl font-light italic tracking-tight text-aura-platinum mb-3">Lead Kanban</h1>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-aura-platinum/40" />
            <input
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search leads…"
              className="w-full rounded-lg border border-white/8 bg-black/30 py-1.5 pl-9 pr-3 text-[12px] text-aura-platinum placeholder:text-aura-platinum/30 focus:border-gold/40 focus:outline-none"
            />
          </div>
          <select
            value={filters.agentId}
            onChange={(e) => setFilters((f) => ({ ...f, agentId: e.target.value }))}
            className="rounded-lg border border-white/8 bg-black/30 px-3 py-1.5 text-[12px] text-aura-platinum focus:border-gold/40 focus:outline-none"
          >
            <option value="">All Agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.full_name || a.email}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </Button>
          {error && <span className="text-[10px] text-rose-400">{error}</span>}
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-gold/50" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-3 h-full pb-2">
              {KANBAN_STAGES.map((stage) => (
                <KanbanColumn
                  key={stage.value}
                  stage={stage}
                  leads={grouped[stage.value] || []}
                  total={counts[stage.value] ?? (grouped[stage.value]?.length || 0)}
                  movingId={moving}
                  onLoadMore={() => loadMoreStage(stage.value)}
                />
              ))}
            </div>
            <DragOverlay>
              {activeLead ? <LeadCardOverlay lead={activeLead} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
};
