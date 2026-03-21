import { useState, useMemo, useCallback } from 'react';
import { Shield, Plus, Zap, CheckCircle2 } from 'lucide-react';
import { getIdentities, saveIdentity, deleteIdentity, getHabits, getProgressLogs } from '@/lib/store';
import { identityAlignmentScore } from '@/lib/intelligence';
import { IdentityArchetype } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const PREBUILT = [
  { name: 'Deep Worker', belief: 'I show up and do focused work daily.' },
  { name: 'Resilient Builder', belief: 'I persist through discomfort and build.' },
  { name: 'Mindful Strategist', belief: 'I think before I act and reflect after.' },
  { name: 'Disciplined Mind', belief: 'I do what I said I would do.' },
  { name: 'Lifelong Learner', belief: 'I grow my knowledge every day.' },
];

export default function Identity() {
  const [identities, setIdentities] = useState(getIdentities);
  const habits = useMemo(() => getHabits().filter(h => !h.archived), []);
  const logs = useMemo(() => getProgressLogs(), []);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<Partial<IdentityArchetype> | null>(null);

  const handleSave = useCallback((data: Partial<IdentityArchetype>) => {
    const identity: IdentityArchetype = {
      id: data.id || crypto.randomUUID(),
      name: data.name || 'Untitled',
      core_belief: data.core_belief || '',
      linked_habit_ids: data.linked_habit_ids || [],
      days_aligned: data.days_aligned || 0,
      created_at: data.created_at || new Date().toISOString(),
    };
    saveIdentity(identity);
    setIdentities(getIdentities());
    setShowCreate(false);
    setEditId(null);
  }, []);

  const selectPrebuilt = (p: typeof PREBUILT[0]) => {
    setEditId({ name: p.name, core_belief: p.belief, linked_habit_ids: [], days_aligned: 0 });
    setShowCreate(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Identity Forge</h1>
        <button onClick={() => { setEditId({ name: '', core_belief: '', linked_habit_ids: [] }); setShowCreate(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus size={16} /> New Identity
        </button>
      </div>

      {/* Active Identities */}
      <div className="grid gap-4 md:grid-cols-2">
        {identities.map(id => {
          const score = identityAlignmentScore(id, logs);
          const linkedHabits = habits.filter(h => id.linked_habit_ids.includes(h.id));
          return (
            <div key={id.id} className="p-5 rounded-lg bg-card border border-primary/20 glow-mint relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={18} className="text-primary" />
                  <h3 className="font-mono text-sm tracking-[0.15em] uppercase text-primary glow-text-mint">{id.name}</h3>
                </div>
                <p className="font-serif italic text-sm text-foreground/80 mb-4">{id.core_belief}</p>
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-xl font-mono font-bold text-primary">{id.days_aligned}</div>
                    <p className="text-[10px] text-muted-foreground">Days Aligned</p>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-mono font-bold text-secondary">{score}%</div>
                    <p className="text-[10px] text-muted-foreground">Today's Score</p>
                  </div>
                </div>
                {linkedHabits.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {linkedHabits.map(h => (
                      <span key={h.id} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded font-mono">{h.name}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setEditId(id); setShowCreate(true); }}
                    className="px-3 py-1.5 bg-muted rounded text-xs hover:bg-muted/80 transition-colors">Edit</button>
                  <button onClick={() => { deleteIdentity(id.id); setIdentities(getIdentities()); }}
                    className="px-3 py-1.5 bg-destructive/10 text-destructive rounded text-xs hover:bg-destructive/20 transition-colors">Remove</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prebuilt Archetypes */}
      <div className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Available Archetypes</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {PREBUILT.filter(p => !identities.some(i => i.name === p.name)).map(p => (
            <button key={p.name} onClick={() => selectPrebuilt(p)}
              className="p-4 rounded-lg bg-card border border-border hover:border-primary/20 text-left transition-all hover:scale-[1.01]">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={14} className="text-muted-foreground" />
                <span className="font-mono text-xs tracking-wider uppercase">{p.name}</span>
              </div>
              <p className="text-xs text-muted-foreground font-serif italic">{p.belief}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showCreate} onOpenChange={() => { setShowCreate(false); setEditId(null); }}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle>{editId?.id ? 'Edit Identity' : 'Forge Identity'}</DialogTitle></DialogHeader>
          {editId && (
            <div className="space-y-4">
              <div><Label>Archetype Name</Label><Input value={editId.name} onChange={e => setEditId({...editId, name: e.target.value})} className="bg-muted/30 mt-1 font-mono uppercase" /></div>
              <div><Label>Core Belief</Label><Textarea value={editId.core_belief} onChange={e => setEditId({...editId, core_belief: e.target.value})} className="bg-muted/30 mt-1 font-serif" placeholder="I am someone who..." /></div>
              <div>
                <Label>Link Habits</Label>
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {habits.map(h => {
                    const linked = editId.linked_habit_ids?.includes(h.id);
                    return (
                      <button key={h.id} onClick={() => {
                        const ids = editId.linked_habit_ids || [];
                        setEditId({ ...editId, linked_habit_ids: linked ? ids.filter(x => x !== h.id) : [...ids, h.id] });
                      }}
                        className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded text-sm transition-colors ${linked ? 'bg-primary/10 text-primary' : 'hover:bg-muted/30'}`}>
                        {linked ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 rounded border border-muted-foreground/30" />}
                        {h.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button onClick={() => handleSave(editId)}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                {editId.id ? 'Save Changes' : 'Forge Identity'}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
