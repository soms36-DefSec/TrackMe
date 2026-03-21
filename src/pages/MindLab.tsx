import { useState, useMemo, useCallback } from 'react';
import { Plus, Brain, Lightbulb, BookOpen, GraduationCap, AlertTriangle, Sparkles } from 'lucide-react';
import { getReflections, saveReflection, getHabits } from '@/lib/store';
import { Reflection, ReflectionType } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';

const typeConfig: Record<ReflectionType, { icon: any; color: string; label: string }> = {
  idea: { icon: Lightbulb, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30', label: 'Idea' },
  reflection: { icon: Brain, color: 'text-secondary bg-secondary/10 border-secondary/30', label: 'Reflection' },
  learning: { icon: GraduationCap, color: 'text-primary bg-primary/10 border-primary/30', label: 'Learning' },
  philosophy: { icon: Sparkles, color: 'text-purple-400 bg-purple-400/10 border-purple-400/30', label: 'Philosophy' },
  failure_analysis: { icon: AlertTriangle, color: 'text-warning bg-warning/10 border-warning/30', label: 'Failure Analysis' },
};

export default function MindLab() {
  const [reflections, setReflections] = useState(getReflections);
  const habits = useMemo(() => getHabits(), []);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editRef, setEditRef] = useState<Partial<Reflection> | null>(null);

  const hour = new Date().getHours();
  const prompt = hour < 12
    ? 'What is your primary intention today?'
    : 'What made today successful? Where did you lose control?';

  const filtered = useMemo(() => {
    return reflections
      .filter(r => typeFilter === 'all' || r.type === typeFilter)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [reflections, typeFilter]);

  const handleSave = useCallback((data: Partial<Reflection>) => {
    const ref: Reflection = {
      id: data.id || crypto.randomUUID(),
      type: data.type || 'reflection',
      content: data.content || '',
      tags: data.tags || [],
      linked_habit_ids: data.linked_habit_ids || [],
      linked_goal_ids: data.linked_goal_ids || [],
      mood_at_time: data.mood_at_time,
      energy_at_time: data.energy_at_time,
      failure_data: data.failure_data,
      created_at: data.created_at || new Date().toISOString(),
    };
    saveReflection(ref);
    setReflections(getReflections());
    setShowCreate(false);
    setEditRef(null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Mind Lab</h1>
        <button onClick={() => { setEditRef({ type: 'reflection', content: '', tags: [] }); setShowCreate(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/90 transition-colors">
          <Plus size={16} /> New Entry
        </button>
      </div>

      {/* Daily Prompt */}
      <div className="p-5 rounded-lg border border-secondary/20 bg-secondary/5 cursor-pointer hover:border-secondary/40 transition-colors"
        onClick={() => { setEditRef({ type: 'reflection', content: '', tags: [] }); setShowCreate(true); }}>
        <p className="font-mono text-xs uppercase tracking-wider text-secondary mb-2">{hour < 12 ? 'Morning' : 'Evening'} Prompt</p>
        <p className="font-serif italic text-foreground/80">{prompt}</p>
        <p className="text-xs text-muted-foreground mt-2">Tap to respond →</p>
      </div>

      {/* Filter */}
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-48 bg-card"><SelectValue placeholder="Filter by type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {Object.entries(typeConfig).map(([key, cfg]) => (
            <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Feed */}
      <div className="space-y-3">
        {filtered.map(ref => {
          const cfg = typeConfig[ref.type];
          const Icon = cfg.icon;
          return (
            <div key={ref.id} className="p-4 rounded-lg bg-card border border-border hover:border-muted transition-colors">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg border ${cfg.color}`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-xs text-muted-foreground">{format(parseISO(ref.created_at), 'MMM d, h:mm a')}</span>
                  </div>
                  <p className="text-sm font-serif leading-relaxed whitespace-pre-wrap">
                    {ref.content.length > 300 ? ref.content.slice(0, 300) + '...' : ref.content}
                  </p>
                  {ref.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {ref.tags.map(t => <span key={t} className="px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] rounded">{t}</span>)}
                    </div>
                  )}
                  {ref.failure_data && (
                    <div className="mt-3 p-3 bg-muted/20 rounded-lg text-xs space-y-1 border border-warning/10">
                      <p><span className="text-warning font-mono">TRIGGER:</span> {ref.failure_data.what_happened}</p>
                      <p><span className="text-warning font-mono">EMOTION:</span> {ref.failure_data.emotion}</p>
                      <p><span className="text-primary font-mono">REFRAME:</span> {ref.failure_data.reframe}</p>
                      <p><span className="text-primary font-mono">NEXT TIME:</span> {ref.failure_data.next_time_plan}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No entries yet. Start with the prompt above.</p>}
      </div>

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={() => { setShowCreate(false); setEditRef(null); }}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Entry</DialogTitle></DialogHeader>
          {editRef && (
            <div className="space-y-4">
              <div><Label>Type</Label>
                <Select value={editRef.type} onValueChange={v => setEditRef({...editRef, type: v as ReflectionType})}>
                  <SelectTrigger className="bg-muted/30 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(typeConfig).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Content</Label><Textarea value={editRef.content} onChange={e => setEditRef({...editRef, content: e.target.value})} rows={6} className="bg-muted/30 mt-1 font-serif" placeholder="Write freely..." /></div>
              <div><Label>Tags (comma-separated)</Label><Input value={editRef.tags?.join(', ')} onChange={e => setEditRef({...editRef, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})} className="bg-muted/30 mt-1" /></div>
              {editRef.type === 'failure_analysis' && (
                <div className="space-y-3 p-3 bg-warning/5 rounded-lg border border-warning/10">
                  <p className="font-mono text-xs uppercase tracking-wider text-warning">Failure Analysis — No judgment. Just data.</p>
                  <div><Label className="text-xs">What happened?</Label><Textarea value={editRef.failure_data?.what_happened || ''} onChange={e => setEditRef({...editRef, failure_data: {...(editRef.failure_data || { what_happened:'', energy_level:3, thought_pattern:'', emotion:'', reframe:'', next_time_plan:'' }), what_happened: e.target.value}})} className="bg-muted/30 mt-1" /></div>
                  <div><Label className="text-xs">What emotion was present?</Label>
                    <Select value={editRef.failure_data?.emotion || ''} onValueChange={v => setEditRef({...editRef, failure_data: {...(editRef.failure_data || { what_happened:'', energy_level:3, thought_pattern:'', emotion:'', reframe:'', next_time_plan:'' }), emotion: v}})}>
                      <SelectTrigger className="bg-muted/30 mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>{['anxious','tired','overwhelmed','bored','distracted','other'].map(e => <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">What would you tell a friend?</Label><Textarea value={editRef.failure_data?.reframe || ''} onChange={e => setEditRef({...editRef, failure_data: {...(editRef.failure_data || { what_happened:'', energy_level:3, thought_pattern:'', emotion:'', reframe:'', next_time_plan:'' }), reframe: e.target.value}})} className="bg-muted/30 mt-1" /></div>
                  <div><Label className="text-xs">What will you do differently?</Label><Textarea value={editRef.failure_data?.next_time_plan || ''} onChange={e => setEditRef({...editRef, failure_data: {...(editRef.failure_data || { what_happened:'', energy_level:3, thought_pattern:'', emotion:'', reframe:'', next_time_plan:'' }), next_time_plan: e.target.value}})} className="bg-muted/30 mt-1" /></div>
                </div>
              )}
              <button onClick={() => handleSave(editRef)}
                className="w-full py-2.5 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/90 transition-colors">
                Save Entry
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
