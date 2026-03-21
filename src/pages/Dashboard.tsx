import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Plus, BookOpen, CalendarDays, Flame, Battery, BatteryMedium, BatteryLow, CheckCircle2, Zap, TrendingUp } from 'lucide-react';
import { getHabits, getProgressLogs, getIdentities, logProgress, getReflections } from '@/lib/store';
import { calculateStreak, consistencyScore, isAtRisk, identityAlignmentScore, overallConsistency, generateInsights } from '@/lib/intelligence';
import { Habit, ProgressLog } from '@/lib/types';
import { useNavigate } from 'react-router-dom';

const today = () => new Date().toISOString().split('T')[0];

export default function Dashboard() {
  const navigate = useNavigate();
  const [habits, setHabits] = useState(getHabits);
  const [logs, setLogs] = useState(getProgressLogs);
  const identities = useMemo(() => getIdentities(), []);
  const activeIdentity = identities[0];

  const todayStr = today();
  const todayLogs = useMemo(() => logs.filter(l => l.date === todayStr), [logs, todayStr]);

  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);
  const todayHabits = useMemo(() => {
    const dayName = ['sun','mon','tue','wed','thu','fri','sat'][new Date().getDay()];
    return activeHabits.filter(h => {
      if (h.frequency === 'daily') return true;
      if (h.frequency === 'specific_days' && h.specific_days?.includes(dayName)) return true;
      return false;
    });
  }, [activeHabits]);

  const completionRate = useMemo(() => {
    if (!todayHabits.length) return 0;
    const done = todayHabits.filter(h => todayLogs.some(l => l.habit_id === h.id && l.status === 'done')).length;
    return Math.round((done / todayHabits.length) * 100);
  }, [todayHabits, todayLogs]);

  const toggleHabit = useCallback((habit: Habit) => {
    const existing = logs.find(l => l.habit_id === habit.id && l.date === todayStr);
    if (existing?.status === 'done') return;
    const log: ProgressLog = {
      id: existing?.id || crypto.randomUUID(),
      habit_id: habit.id,
      date: todayStr,
      status: 'done',
      mood: 3,
      energy_level: 3,
      time_of_day: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : new Date().getHours() < 21 ? 'evening' : 'night',
      notes: '',
    };
    logProgress(log);
    setLogs(getProgressLogs());
  }, [logs, todayStr]);

  const insights = useMemo(() => generateInsights(activeHabits, logs, identities).slice(0, 2), [activeHabits, logs, identities]);
  const alignmentScore = useMemo(() => activeIdentity ? identityAlignmentScore(activeIdentity, logs) : 0, [activeIdentity, logs]);

  // Weekly heatmap
  const weekData = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLogs = logs.filter(l => l.date === dateStr);
      const done = dayLogs.filter(l => l.status === 'done').length;
      const total = Math.max(todayHabits.length, 1);
      result.push({ date: dateStr, day: format(d, 'EEE'), ratio: done / total });
    }
    return result;
  }, [logs, todayHabits]);

  const recentReflection = useMemo(() => {
    const refs = getReflections().sort((a, b) => b.created_at.localeCompare(a.created_at));
    return refs[0];
  }, []);

  const EnergyIcon = ({ level }: { level: string }) => {
    if (level === 'high') return <Battery className="text-destructive" size={14} />;
    if (level === 'medium') return <BatteryMedium className="text-warning" size={14} />;
    return <BatteryLow className="text-primary" size={14} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-mono text-sm font-bold border border-primary/30">
          OP
        </div>
      </div>

      {/* Identity Badge */}
      {activeIdentity && (
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-primary/20 bg-primary/5 glow-mint">
          <Zap className="text-primary" size={16} />
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-primary glow-text-mint">
            {activeIdentity.name}
          </span>
          <span className="text-muted-foreground text-xs">— Day {activeIdentity.days_aligned}</span>
        </div>
      )}

      {/* Today's Mission */}
      <div className="space-y-3">
        <h2 className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground">Today's Mission</h2>
        <div className="grid gap-3">
          {todayHabits.slice(0, 5).map(habit => {
            const isDone = todayLogs.some(l => l.habit_id === habit.id && l.status === 'done');
            const streak = calculateStreak(habit.id, logs);
            const atRisk = isAtRisk(habit.id, logs);
            return (
              <div
                key={habit.id}
                className={`p-4 rounded-lg border transition-all duration-200 hover:scale-[1.01] ${
                  isDone ? 'bg-primary/5 border-primary/30' : 'bg-card border-border hover:border-primary/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleHabit(habit)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      isDone
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/30 hover:border-primary/50'
                    }`}
                  >
                    {isDone && <CheckCircle2 size={16} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${isDone ? 'line-through text-muted-foreground' : ''}`}>{habit.name}</p>
                    <p className="text-xs text-muted-foreground font-serif italic truncate">{habit.implementation_intention}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {atRisk && <span className="w-2 h-2 rounded-full bg-warning animate-glow-pulse" />}
                    {streak > 0 && (
                      <span className="flex items-center gap-1 text-xs font-mono text-primary">
                        <Flame size={12} /> {streak}
                      </span>
                    )}
                    <EnergyIcon level={habit.energy_required} />
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < habit.difficulty ? 'bg-foreground/60' : 'bg-foreground/15'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {todayHabits.length === 0 && (
            <p className="text-muted-foreground text-sm py-8 text-center">No habits scheduled for today.</p>
          )}
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-lg bg-card border border-border text-center">
          <div className="text-2xl font-mono font-bold text-primary">{completionRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">Today's Completion</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border text-center">
          <div className="text-2xl font-mono font-bold text-foreground">{overallConsistency(activeHabits, logs)}%</div>
          <p className="text-xs text-muted-foreground mt-1">30-Day Consistency</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border text-center">
          <div className="text-2xl font-mono font-bold text-secondary">{alignmentScore}%</div>
          <p className="text-xs text-muted-foreground mt-1">Identity Alignment</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border text-center">
          <div className="text-2xl font-mono font-bold text-warning">{activeHabits.filter(h => isAtRisk(h.id, logs)).length}</div>
          <p className="text-xs text-muted-foreground mt-1">At Risk</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={() => navigate('/habits')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-sm hover:border-primary/30 transition-colors">
          <Plus size={14} className="text-primary" /> New Habit
        </button>
        <button onClick={() => navigate('/mindlab')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-sm hover:border-secondary/30 transition-colors">
          <BookOpen size={14} className="text-secondary" /> Log Reflection
        </button>
        <button onClick={() => navigate('/analytics')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-sm hover:border-muted-foreground/30 transition-colors">
          <CalendarDays size={14} /> Review Week
        </button>
      </div>

      {/* Weekly Heatmap */}
      <div className="space-y-2">
        <h3 className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground">This Week</h3>
        <div className="flex gap-2">
          {weekData.map(d => (
            <div key={d.date} className="flex-1 text-center">
              <div
                className="h-8 rounded-md border border-border transition-colors"
                style={{
                  backgroundColor: `hsl(162 100% 50% / ${Math.max(0.05, d.ratio * 0.6)})`,
                }}
                title={`${d.date}: ${Math.round(d.ratio * 100)}%`}
              />
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">{d.day}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground">Insights</h3>
          {insights.map(insight => (
            <div key={insight.id} className="p-4 rounded-lg bg-card border border-secondary/20 hover:border-secondary/40 transition-colors">
              <div className="flex items-start gap-3">
                <TrendingUp size={16} className="text-secondary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm">{insight.text}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-serif italic">{insight.suggestion}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Reflection Quote */}
      {recentReflection && (
        <div className="p-4 rounded-lg border border-border bg-card/50">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">From your journal</p>
          <p className="text-sm font-serif italic text-foreground/80 leading-relaxed">
            "{recentReflection.content.slice(0, 150)}{recentReflection.content.length > 150 ? '...' : ''}"
          </p>
        </div>
      )}
    </div>
  );
}
