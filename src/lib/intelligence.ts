import { Habit, ProgressLog, IdentityArchetype, SmartInsight } from './types';

const today = () => new Date().toISOString().split('T')[0];
const daysAgoStr = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; };

export function calculateStreak(habitId: string, logs: ProgressLog[]): number {
  const sorted = logs.filter(l => l.habit_id === habitId && l.status === 'done')
    .map(l => l.date).sort((a, b) => b.localeCompare(a));
  if (!sorted.length) return 0;
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().split('T')[0];
    if (sorted.includes(dateStr)) { streak++; d.setDate(d.getDate() - 1); }
    else if (i === 0) { d.setDate(d.getDate() - 1); continue; }
    else break;
  }
  return streak;
}

export function consistencyScore(habitId: string, logs: ProgressLog[], days = 30): number {
  const start = daysAgoStr(days);
  const relevant = logs.filter(l => l.habit_id === habitId && l.date >= start);
  if (!relevant.length) return 0;
  const done = relevant.filter(l => l.status === 'done').length;
  return Math.round((done / Math.max(relevant.length, 1)) * 100);
}

export function overallConsistency(habits: Habit[], logs: ProgressLog[], days = 30): number {
  if (!habits.length) return 0;
  const scores = habits.filter(h => !h.archived).map(h => consistencyScore(h.id, logs, days));
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function isAtRisk(habitId: string, logs: ProgressLog[]): boolean {
  return consistencyScore(habitId, logs, 7) < 60;
}

export function longestStreak(habits: Habit[], logs: ProgressLog[]): { habit: Habit; streak: number } | null {
  let best: { habit: Habit; streak: number } | null = null;
  habits.forEach(h => {
    const s = calculateStreak(h.id, logs);
    if (!best || s > best.streak) best = { habit: h, streak: s };
  });
  return best;
}

export function moodHabitCorrelation(habitId: string, logs: ProgressLog[]): { withHabit: number; withoutHabit: number } {
  const allDates = [...new Set(logs.map(l => l.date))];
  const habitDone = new Set(logs.filter(l => l.habit_id === habitId && l.status === 'done').map(l => l.date));
  let withSum = 0, withCount = 0, withoutSum = 0, withoutCount = 0;
  allDates.forEach(date => {
    const dayLogs = logs.filter(l => l.date === date && l.mood > 0);
    const avgMood = dayLogs.reduce((s, l) => s + l.mood, 0) / Math.max(dayLogs.length, 1);
    if (habitDone.has(date)) { withSum += avgMood; withCount++; }
    else { withoutSum += avgMood; withoutCount++; }
  });
  return {
    withHabit: withCount ? +(withSum / withCount).toFixed(1) : 0,
    withoutHabit: withoutCount ? +(withoutSum / withoutCount).toFixed(1) : 0,
  };
}

export function energyTimeHeatmap(logs: ProgressLog[]): Record<string, Record<string, number>> {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const times = ['morning', 'afternoon', 'evening', 'night'];
  const result: Record<string, Record<string, number>> = {};
  days.forEach(day => {
    result[day] = {};
    times.forEach(time => { result[day][time] = 0; });
  });
  logs.forEach(log => {
    if (log.status !== 'done') return;
    const d = new Date(log.date);
    const dayName = days[d.getDay() === 0 ? 6 : d.getDay() - 1];
    if (result[dayName] && log.time_of_day) {
      result[dayName][log.time_of_day] = (result[dayName][log.time_of_day] || 0) + 1;
    }
  });
  return result;
}

export function identityAlignmentScore(identity: IdentityArchetype, logs: ProgressLog[], date?: string): number {
  const d = date || today();
  const dayLogs = logs.filter(l => l.date === d && identity.linked_habit_ids.includes(l.habit_id));
  if (!identity.linked_habit_ids.length) return 0;
  const done = dayLogs.filter(l => l.status === 'done').length;
  return Math.round((done / identity.linked_habit_ids.length) * 100);
}

export function failurePatterns(logs: ProgressLog[]): { reason: string; count: number }[] {
  const failures = logs.filter(l => l.status === 'failed' || l.status === 'skipped');
  const byTime: Record<string, number> = {};
  failures.forEach(l => {
    const key = l.time_of_day || 'unknown';
    byTime[key] = (byTime[key] || 0) + 1;
  });
  return Object.entries(byTime).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
}

export function generateInsights(habits: Habit[], logs: ProgressLog[], identities: IdentityArchetype[]): SmartInsight[] {
  const insights: SmartInsight[] = [];
  const uid = () => crypto.randomUUID();

  // Best time insight
  const heatmap = energyTimeHeatmap(logs);
  let bestTime = '', bestCount = 0;
  Object.values(heatmap).forEach(times => {
    Object.entries(times).forEach(([time, count]) => {
      if (count > bestCount) { bestTime = time; bestCount = count; }
    });
  });
  if (bestTime) {
    insights.push({ id: uid(), text: `Your most productive time slot is ${bestTime}. Most completions happen then.`, confidence: 0.8, data_points: bestCount, suggestion: `Schedule your hardest habits in the ${bestTime}.`, generated_at: new Date().toISOString(), dismissed: false });
  }

  // Risk insights
  habits.filter(h => !h.archived).forEach(h => {
    if (isAtRisk(h.id, logs)) {
      insights.push({ id: uid(), text: `"${h.name}" is at risk — consistency dropped below 60% this week.`, confidence: 0.9, data_points: 7, suggestion: `Consider reducing difficulty or adjusting the schedule for "${h.name}".`, generated_at: new Date().toISOString(), dismissed: false });
    }
  });

  // Mood correlation
  habits.filter(h => !h.archived).slice(0, 3).forEach(h => {
    const corr = moodHabitCorrelation(h.id, logs);
    if (corr.withHabit > corr.withoutHabit + 0.5) {
      insights.push({ id: uid(), text: `Your mood averages ${corr.withHabit} when you do "${h.name}" vs ${corr.withoutHabit} when you skip it.`, confidence: 0.7, data_points: 14, suggestion: `"${h.name}" seems to boost your mood. Prioritize it on low days.`, generated_at: new Date().toISOString(), dismissed: false });
    }
  });

  return insights;
}
