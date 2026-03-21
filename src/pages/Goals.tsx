import { useState, useMemo, useCallback } from 'react';
import { Plus, Target, Calendar, CheckCircle2, Circle } from 'lucide-react';
import { getGoals, saveGoal, deleteGoal, getHabits } from '@/lib/store';
import { Goal, Milestone } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Progress } from '@/components/ui/progress';

export default function Goals() {
  const [goals, setGoals] = useState(getGoals);
  const habits = useMemo(() => getHabits(), []);
  const [showCreate, setShowCreate] = useState(false);
  const [editGoal, setEditGoal] = useState<Partial<Goal> | null>(null);
  const [detailGoal, setDetailGoal] = useState<Goal | null>(null);

  const toggleMilestone = useCallback((goal: Goal, milestoneId: string) => {
    const updated = {
      ...goal,
      milestones: goal.milestones.map(m =>
        m.id === milestoneId ? { ...m, completed: !m.completed, completed_at: !m.completed ? new Date().toISOString() : undefined } : m
      ),
    };
    updated.progress_percentage = Math.round((updated.milestones.filter(m => m.completed).length / Math.max(updated.milestones.length, 1)) * 100);
    saveGoal(updated);
    setGoals(getGoals());
    if (detailGoal?.id === goal.id) setDetailGoal(updated);
  }, [detailGoal]);

  const handleSave = useCallback((data: Partial<Goal>) => {
    const goal: Goal = {
      id: data.id || crypto.randomUUID(),
      title: data.title || 'Untitled Goal',
      description: data.description || '',
      type: data.type || 'short_term',
      deadline: data.deadline || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      milestones: data.milestones || [],
      linked_habit_ids: data.linked_habit_ids || [],
      identity_connection: data.identity_connection || '',
      progress_percentage: data.progress_percentage || 0,
      created_at: data.created_at || new Date().toISOString(),
    };
    saveGoal(goal);
    setGoals(getGoals());
    setShowCreate(false);
    setEditGoal(null);
  }, []);

  const addMilestone = () => {
    if (!editGoal) return;
    setEditGoal({
      ...editGoal,
      milestones: [...(editGoal.milestones || []), { id: crypto.randomUUID(), title: '', completed: false }],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Goals Nexus</h1>
        <button onClick={() => { setEditGoal({ title: '', type: 'short_term', milestones: [], linked_habit_ids: [] }); setShowCreate(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus size={16} /> New Goal
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {goals.map(goal => {
          const daysLeft = differenceInDays(parseISO(goal.deadline), new Date());
          return (
            <div key={goal.id} onClick={() => setDetailGoal(goal)}
              className="p-5 rounded-lg bg-card border border-border hover:border-primary/20 cursor-pointer transition-all hover:scale-[1.01]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${
                    goal.type === 'long_term' ? 'text-secondary border-secondary/30 bg-secondary/10' : 'text-primary border-primary/30 bg-primary/10'
                  }`}>{goal.type.replace('_', ' ')}</span>
                  <h3 className="font-semibold mt-2">{goal.title}</h3>
                </div>
                <Target size={18} className="text-muted-foreground" />
              </div>
              <Progress value={goal.progress_percentage} className="h-1.5 mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="font-mono">{goal.progress_percentage}%</span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                </span>
              </div>
              <div className="mt-3 space-y-1">
                {goal.milestones.slice(0, 3).map(m => (
                  <div key={m.id} className="flex items-center gap-2 text-xs">
                    {m.completed ? <CheckCircle2 size={12} className="text-primary" /> : <Circle size={12} className="text-muted-foreground" />}
                    <span className={m.completed ? 'line-through text-muted-foreground' : ''}>{m.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!detailGoal} onOpenChange={() => setDetailGoal(null)}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
          {detailGoal && (
            <>
              <DialogHeader><DialogTitle>{detailGoal.title}</DialogTitle></DialogHeader>
              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground">{detailGoal.description}</p>
                <Progress value={detailGoal.progress_percentage} className="h-2" />
                <p className="text-xs font-mono text-muted-foreground">{detailGoal.progress_percentage}% complete</p>
                <div className="space-y-2">
                  <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Milestones</p>
                  {detailGoal.milestones.map(m => (
                    <button key={m.id} onClick={() => toggleMilestone(detailGoal, m.id)}
                      className="flex items-center gap-2 w-full text-left p-2 rounded hover:bg-muted/30 transition-colors">
                      {m.completed ? <CheckCircle2 size={14} className="text-primary shrink-0" /> : <Circle size={14} className="text-muted-foreground shrink-0" />}
                      <span className={m.completed ? 'line-through text-muted-foreground' : ''}>{m.title}</span>
                    </button>
                  ))}
                </div>
                {detailGoal.identity_connection && (
                  <p className="font-serif italic text-muted-foreground border-l-2 border-secondary pl-3">{detailGoal.identity_connection}</p>
                )}
                {detailGoal.linked_habit_ids.length > 0 && (
                  <div>
                    <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1">Linked Habits</p>
                    <div className="flex flex-wrap gap-1">
                      {detailGoal.linked_habit_ids.map(hid => {
                        const h = habits.find(x => x.id === hid);
                        return h ? <span key={hid} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">{h.name}</span> : null;
                      })}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => { setEditGoal(detailGoal); setShowCreate(true); setDetailGoal(null); }}
                    className="px-4 py-2 bg-muted rounded text-sm hover:bg-muted/80">Edit</button>
                  <button onClick={() => { deleteGoal(detailGoal.id); setGoals(getGoals()); setDetailGoal(null); }}
                    className="px-4 py-2 bg-destructive/10 text-destructive rounded text-sm hover:bg-destructive/20">Delete</button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Modal */}
      <Dialog open={showCreate} onOpenChange={() => { setShowCreate(false); setEditGoal(null); }}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editGoal?.id ? 'Edit Goal' : 'Create Goal'}</DialogTitle></DialogHeader>
          {editGoal && (
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={editGoal.title} onChange={e => setEditGoal({...editGoal, title: e.target.value})} className="bg-muted/30 mt-1" /></div>
              <div><Label>Description</Label><Textarea value={editGoal.description} onChange={e => setEditGoal({...editGoal, description: e.target.value})} className="bg-muted/30 mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Type</Label>
                  <Select value={editGoal.type} onValueChange={v => setEditGoal({...editGoal, type: v as any})}>
                    <SelectTrigger className="bg-muted/30 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="short_term">Short Term</SelectItem><SelectItem value="long_term">Long Term</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Deadline</Label><Input type="date" value={editGoal.deadline} onChange={e => setEditGoal({...editGoal, deadline: e.target.value})} className="bg-muted/30 mt-1" /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2"><Label>Milestones</Label>
                  <button onClick={addMilestone} className="text-xs text-primary hover:underline">+ Add</button>
                </div>
                {editGoal.milestones?.map((m, i) => (
                  <Input key={m.id} value={m.title} onChange={e => {
                    const ms = [...(editGoal.milestones || [])];
                    ms[i] = { ...ms[i], title: e.target.value };
                    setEditGoal({ ...editGoal, milestones: ms });
                  }} placeholder={`Milestone ${i + 1}`} className="bg-muted/30 mb-2" />
                ))}
              </div>
              <div><Label>Identity Connection</Label><Textarea value={editGoal.identity_connection} onChange={e => setEditGoal({...editGoal, identity_connection: e.target.value})} placeholder="Achieving this goal means I am becoming..." className="bg-muted/30 mt-1" /></div>
              <button onClick={() => handleSave(editGoal)}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                {editGoal.id ? 'Save Changes' : 'Create Goal'}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
