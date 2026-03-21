import { useState, useMemo, useCallback } from 'react';
import { Plus, Flame, Search, Filter, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { getHabits, getProgressLogs, saveHabit, logProgress, deleteHabit } from '@/lib/store';
import { calculateStreak, consistencyScore, isAtRisk } from '@/lib/intelligence';
import { Habit, ProgressLog, HabitCategory, CATEGORY_COLORS } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

const today = () => new Date().toISOString().split('T')[0];
const emptyHabit = (): Partial<Habit> => ({
  name: '', category: 'health', frequency: 'daily', difficulty: 2, energy_required: 'medium',
  tags: [], linked_goal_ids: [], identity_archetype: '', cue: '', routine: '', reward: '',
  implementation_intention: '', archived: false,
});

export default function Habits() {
  const [habits, setHabits] = useState(getHabits);
  const [logs, setLogs] = useState(getProgressLogs);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editHabit, setEditHabit] = useState<Partial<Habit> | null>(null);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);

  const todayStr = today();
  const filtered = useMemo(() => {
    return habits.filter(h => !h.archived)
      .filter(h => !search || h.name.toLowerCase().includes(search.toLowerCase()))
      .filter(h => categoryFilter === 'all' || h.category === categoryFilter);
  }, [habits, search, categoryFilter]);

  const toggleComplete = useCallback((habit: Habit) => {
    const existing = logs.find(l => l.habit_id === habit.id && l.date === todayStr);
    if (existing?.status === 'done') return;
    const log: ProgressLog = {
      id: existing?.id || crypto.randomUUID(), habit_id: habit.id, date: todayStr, status: 'done',
      mood: 3, energy_level: 3, time_of_day: new Date().getHours() < 12 ? 'morning' : 'afternoon', notes: '',
    };
    logProgress(log);
    setLogs(getProgressLogs());
  }, [logs, todayStr]);

  const handleSave = useCallback((data: Partial<Habit>) => {
    const habit: Habit = {
      id: data.id || crypto.randomUUID(),
      name: data.name || 'Untitled',
      category: data.category || 'custom',
      frequency: data.frequency || 'daily',
      specific_days: data.specific_days,
      difficulty: data.difficulty || 2,
      energy_required: data.energy_required || 'medium',
      tags: data.tags || [],
      linked_goal_ids: data.linked_goal_ids || [],
      identity_archetype: data.identity_archetype || '',
      cue: data.cue || '',
      routine: data.routine || '',
      reward: data.reward || '',
      implementation_intention: data.implementation_intention || '',
      created_at: data.created_at || new Date().toISOString(),
      archived: false,
    };
    saveHabit(habit);
    setHabits(getHabits());
    setShowCreate(false);
    setEditHabit(null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Habits Command</h1>
        <button onClick={() => { setEditHabit(emptyHabit()); setShowCreate(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus size={16} /> New Habit
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search habits..." className="pl-9 bg-card" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(['health','mind','skill','work','social','custom'] as HabitCategory[]).map(c => (
              <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Habit Grid */}
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map(habit => {
          const isDone = logs.some(l => l.habit_id === habit.id && l.date === todayStr && l.status === 'done');
          const streak = calculateStreak(habit.id, logs);
          const consistency = consistencyScore(habit.id, logs);
          const atRisk = isAtRisk(habit.id, logs);
          return (
            <div key={habit.id}
              onClick={() => setDetailHabit(habit)}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
                isDone ? 'bg-primary/5 border-primary/20' : 'bg-card border-border hover:border-primary/20'
              }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${CATEGORY_COLORS[habit.category]}`}>
                      {habit.category}
                    </span>
                    {atRisk && <AlertCircle size={12} className="text-warning" />}
                  </div>
                  <p className="font-medium text-sm">{habit.name}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Flame size={12} className="text-primary" /> {streak}</span>
                    <span className="font-mono">{consistency}%</span>
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); toggleComplete(habit); }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 transition-all ${
                    isDone ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30 hover:border-primary/50'
                  }`}>
                  {isDone && <CheckCircle2 size={14} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!detailHabit} onOpenChange={() => setDetailHabit(null)}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
          {detailHabit && (
            <>
              <DialogHeader>
                <DialogTitle>{detailHabit.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${CATEGORY_COLORS[detailHabit.category]}`}>{detailHabit.category}</span>
                  <span className="text-muted-foreground capitalize">{detailHabit.frequency}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-muted/30 rounded text-center">
                    <div className="font-mono text-lg font-bold text-primary">{calculateStreak(detailHabit.id, logs)}</div>
                    <p className="text-[10px] text-muted-foreground">Streak</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded text-center">
                    <div className="font-mono text-lg font-bold">{consistencyScore(detailHabit.id, logs)}%</div>
                    <p className="text-[10px] text-muted-foreground">Consistency</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded text-center">
                    <div className="font-mono text-lg font-bold">{detailHabit.difficulty}/5</div>
                    <p className="text-[10px] text-muted-foreground">Difficulty</p>
                  </div>
                </div>
                {(detailHabit.cue || detailHabit.routine || detailHabit.reward) && (
                  <div className="space-y-2 p-3 bg-muted/20 rounded-lg">
                    <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Habit Loop</p>
                    {detailHabit.cue && <p><span className="text-primary font-mono text-xs">CUE →</span> {detailHabit.cue}</p>}
                    {detailHabit.routine && <p><span className="text-secondary font-mono text-xs">ROUTINE →</span> {detailHabit.routine}</p>}
                    {detailHabit.reward && <p><span className="text-primary font-mono text-xs">REWARD →</span> {detailHabit.reward}</p>}
                  </div>
                )}
                {detailHabit.implementation_intention && (
                  <p className="font-serif italic text-muted-foreground">{detailHabit.implementation_intention}</p>
                )}
                <div className="flex gap-2">
                  <button onClick={() => { setEditHabit(detailHabit); setShowCreate(true); setDetailHabit(null); }}
                    className="px-4 py-2 bg-muted rounded text-sm hover:bg-muted/80 transition-colors">Edit</button>
                  <button onClick={() => { deleteHabit(detailHabit.id); setHabits(getHabits()); setDetailHabit(null); }}
                    className="px-4 py-2 bg-destructive/10 text-destructive rounded text-sm hover:bg-destructive/20 transition-colors">Delete</button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Modal */}
      <Dialog open={showCreate} onOpenChange={() => { setShowCreate(false); setEditHabit(null); }}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editHabit?.id ? 'Edit Habit' : 'Create Habit'}</DialogTitle>
          </DialogHeader>
          {editHabit && (
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={editHabit.name} onChange={e => setEditHabit({...editHabit, name: e.target.value})} className="bg-muted/30 mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Category</Label>
                  <Select value={editHabit.category} onValueChange={v => setEditHabit({...editHabit, category: v as HabitCategory})}>
                    <SelectTrigger className="bg-muted/30 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{(['health','mind','skill','work','social','custom'] as HabitCategory[]).map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Frequency</Label>
                  <Select value={editHabit.frequency} onValueChange={v => setEditHabit({...editHabit, frequency: v as any})}>
                    <SelectTrigger className="bg-muted/30 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="specific_days">Specific Days</SelectItem><SelectItem value="weekly">Weekly</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Difficulty ({editHabit.difficulty}/5)</Label><Slider value={[editHabit.difficulty || 2]} onValueChange={v => setEditHabit({...editHabit, difficulty: v[0]})} min={1} max={5} step={1} className="mt-2" /></div>
              <div><Label>Energy Required</Label>
                <Select value={editHabit.energy_required} onValueChange={v => setEditHabit({...editHabit, energy_required: v as any})}>
                  <SelectTrigger className="bg-muted/30 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-3 p-3 bg-muted/10 rounded-lg border border-border">
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Habit Loop Design</p>
                <div><Label className="text-xs">Cue — What triggers this?</Label><Input value={editHabit.cue} onChange={e => setEditHabit({...editHabit, cue: e.target.value})} className="bg-muted/30 mt-1" /></div>
                <div><Label className="text-xs">Routine — What exactly will you do?</Label><Input value={editHabit.routine} onChange={e => setEditHabit({...editHabit, routine: e.target.value})} className="bg-muted/30 mt-1" /></div>
                <div><Label className="text-xs">Reward — How will you feel?</Label><Input value={editHabit.reward} onChange={e => setEditHabit({...editHabit, reward: e.target.value})} className="bg-muted/30 mt-1" /></div>
              </div>
              <div><Label>Implementation Intention</Label><Textarea value={editHabit.implementation_intention} onChange={e => setEditHabit({...editHabit, implementation_intention: e.target.value})} placeholder="I will [habit] at [time] in [location]" className="bg-muted/30 mt-1" /></div>
              <button onClick={() => handleSave(editHabit)}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                {editHabit.id ? 'Save Changes' : 'Create Habit'}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
