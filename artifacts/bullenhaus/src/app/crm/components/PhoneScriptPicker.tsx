import { useState } from 'react';
import { useScripts, SCRIPT_CATEGORIES } from '../hooks/useScripts';

export function PhoneScriptPicker() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const { scripts, loading, error, refetch } = useScripts();
  const matches = scripts.filter((script) => `${script.title} ${script.body}`.toLocaleLowerCase('de').includes(search.toLocaleLowerCase('de')));
  const selected = scripts.find((script) => script.id === selectedId);
  return (
    <section className="p-4 space-y-3 overflow-y-auto custom-scrollbar" aria-label="Gesprächsskripte">
      <label className="block text-[10px] text-aura-platinum/70" htmlFor="phone-script-search">Skript suchen</label>
      <input id="phone-script-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Titel, Thema oder Einwand …" className="w-full rounded-lg border border-glass-border bg-black/30 px-3 py-2 text-xs text-aura-platinum" />
      {loading ? <p className="text-xs text-aura-platinum/60" role="status">Skripte werden geladen …</p> : error ? (
        <div role="alert" className="text-xs text-aura-ruby"><p>Skripte konnten nicht geladen werden.</p><button type="button" onClick={refetch} className="mt-2 px-3 py-2 rounded-lg">Erneut versuchen</button></div>
      ) : (
        <>
          <label className="block text-[10px] text-aura-platinum/70" htmlFor="phone-sales-script">Skript auswählen ({matches.length})</label>
          <select id="phone-sales-script" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="w-full rounded-lg border border-glass-border bg-black/80 px-2 py-2 text-xs text-aura-platinum">
            <option value="">Bitte auswählen …</option>
            {selected && !matches.some((script) => script.id === selectedId) && <option value={selected.id}>{selected.title}</option>}
            {matches.map((script) => <option key={script.id} value={script.id}>{script.title}</option>)}
          </select>
          {!matches.length && <p className="text-xs text-aura-platinum/50">Keine passenden Skripte gefunden.</p>}
          {selected && (
            <article className="glass-card rounded-lg border border-glass-border p-3 space-y-2">
              <p className="text-[9px] uppercase text-aura-gold">{SCRIPT_CATEGORIES.find((category) => category.value === selected.category)?.label}</p>
              <h3 className="text-xs font-bold text-aura-platinum">{selected.title}</h3>
              <p lang="de" className="text-xs leading-relaxed whitespace-pre-wrap text-aura-platinum/90">{selected.body}</p>
              {!!selected.objections?.length && <div><p className="text-[10px] font-bold text-aura-gold mb-1">Passende Einwände</p><p className="text-[10px] text-aura-platinum/65">{selected.objections.join(' · ')}</p></div>}
            </article>
          )}
        </>
      )}
    </section>
  );
}
