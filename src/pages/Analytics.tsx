import { useMemo, useState } from 'react';
import { getHabits, getProgressLogs, getIdentities } from '@/lib/store';
import { overallConsistency, longestStreak, consistencyScore, energyTimeHeatmap, failurePatterns, generateInsights, identityAlignmentScore } from '@/lib/intelligence';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, Flame, Brain, Shield } from 'lucide-react';

export default function Analytics() {
  const habits = useMemo(() => getHabits().filter(h => !h.archived), []);
  const logs = useMemo(() => getProgressLogs(), []);
  const identities = useMemo(() => getIdentities(), []);
  const [range, setRange] = useState(30);

  const consistency = overallConsistency(habits, logs, range);
  const longest = longestStreak(habits, logs);
  const insights = useMemo(() => generateInsights(habits, logs, identities), [habits, logs, identities]);
  const activeIdentity = identities[0];
  const alignment = activeIdentity ? identityAlignmentScore(activeIdentity, logs) : 0;

  // Mood trend
  const avgMood = useMemo(() => {
    const recent = logs.filter(l => l.mood > 0).slice(-14);
    return recent.length ? +(recent.reduce((s, l) => s + l.mood, 0) / recent.length).toFixed(1) : 0;
  }, [logs]);

  // Consistency over time chart data
  const consistencyData = useMemo(() => {
    const data = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLogs = logs.filter(l => l.date === dateStr);
      const done = dayLogs.filter(l => l.status === 'done').length;
      const total = Math.max(dayLogs.length, 1);
      data.push({ date: dateStr.slice(5), rate: Math.round((done / total) * 100) });
    }
    return data;
  }, [logs, range]);

  // Mood vs productivity scatter
  const scatterData = useMemo(() => {
    const byDate: Record<string, { mood: number[]; done: number }> = {};
    logs.forEach(l => {
      if (!byDate[l.date]) byDate[l.date] = { mood: [], done: 0 };
      if (l.mood > 0) byDate[l.date].mood.push(l.mood);
      if (l.status === 'done') byDate[l.date].done++;
    });
    return Object.entries(byDate).map(([, v]) => ({
      mood: v.mood.length ? +(v.mood.reduce((a, b) => a + b, 0) / v.mood.length).toFixed(1) : 0,
      habits: v.done,
    })).filter(d => d.mood > 0);
  }, [logs]);

  // Radar data
  const radarData = useMemo(() => [
    { subject: 'Consistency', value: consistency },
    { subject: 'Mood', value: avgMood * 20 },
    { subject: 'Energy', value: logs.length ? Math.round(logs.filter(l => l.energy_level >= 3).length / logs.length * 100) : 0 },
    { subject: 'Identity', value: alignment },
    { subject: 'Streaks', value: longest ? Math.min(longest.streak * 10, 100) : 0 },
    { subject: 'Reflection', value: 60 },
  ], [consistency, avgMood, alignment, longest, logs]);

  // Energy-time heatmap
  const heatmapData = useMemo(() => energyTimeHeatmap(logs), [logs]);
  const times = ['morning', 'afternoon', 'evening', 'night'];
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  // Failure patterns
  const failureData = useMemo(() => failurePatterns(logs), [logs]);

  const chartTheme = { stroke: 'hsl(162 100% 50%)', fill: 'hsl(162 100% 50%)' };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Intelligence Deck</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-lg bg-card border border-border text-center">
          <TrendingUp size={18} className="text-primary mx-auto mb-1" />
          <div className="text-2xl font-mono font-bold text-primary">{consistency}%</div>
          <p className="text-[10px] text-muted-foreground">Consistency</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border text-center">
          <Flame size={18} className="text-warning mx-auto mb-1" />
          <div className="text-2xl font-mono font-bold">{longest?.streak || 0}</div>
          <p className="text-[10px] text-muted-foreground truncate">{longest?.habit.name || 'No streaks'}</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border text-center">
          <Brain size={18} className="text-secondary mx-auto mb-1" />
          <div className="text-2xl font-mono font-bold text-secondary">{avgMood}</div>
          <p className="text-[10px] text-muted-foreground">Avg Mood</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border text-center">
          <Shield size={18} className="text-primary mx-auto mb-1" />
          <div className="text-2xl font-mono font-bold text-primary">{alignment}%</div>
          <p className="text-[10px] text-muted-foreground">Identity Score</p>
        </div>
      </div>

      {/* Range Toggle */}
      <div className="flex gap-2">
        {[30, 60, 90].map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors ${range === r ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
            {r}D
          </button>
        ))}
      </div>

      {/* Consistency Chart */}
      <div className="p-4 rounded-lg bg-card border border-border">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">Habit Consistency Over Time</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={consistencyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 21% 15%)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(240 7% 45%)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(240 7% 45%)' }} />
            <Tooltip contentStyle={{ background: 'hsl(240 17% 8%)', border: '1px solid hsl(240 21% 15%)', borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="rate" stroke={chartTheme.stroke} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Mood vs Productivity */}
      <div className="p-4 rounded-lg bg-card border border-border">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">Mood vs Productivity</h3>
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 21% 15%)" />
            <XAxis dataKey="mood" name="Mood" tick={{ fontSize: 10, fill: 'hsl(240 7% 45%)' }} />
            <YAxis dataKey="habits" name="Habits" tick={{ fontSize: 10, fill: 'hsl(240 7% 45%)' }} />
            <Tooltip contentStyle={{ background: 'hsl(240 17% 8%)', border: '1px solid hsl(240 21% 15%)', borderRadius: 8, fontSize: 12 }} />
            <Scatter data={scatterData} fill="hsl(252 100% 69%)" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Radar */}
        <div className="p-4 rounded-lg bg-card border border-border">
          <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">Behavior Fingerprint</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(240 21% 15%)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'hsl(240 7% 45%)' }} />
              <Radar dataKey="value" stroke={chartTheme.stroke} fill={chartTheme.fill} fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Failure Patterns */}
        <div className="p-4 rounded-lg bg-card border border-border">
          <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">Failure Patterns</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={failureData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 21% 15%)" />
              <XAxis dataKey="reason" tick={{ fontSize: 10, fill: 'hsl(240 7% 45%)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(240 7% 45%)' }} />
              <Tooltip contentStyle={{ background: 'hsl(240 17% 8%)', border: '1px solid hsl(240 21% 15%)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="hsl(355 100% 64%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Energy-Time Heatmap */}
      <div className="p-4 rounded-lg bg-card border border-border">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">Energy-Time Heatmap</h3>
        <div className="grid grid-cols-8 gap-1 text-[10px]">
          <div />
          {days.map(d => <div key={d} className="text-center text-muted-foreground font-mono uppercase">{d}</div>)}
          {times.map(time => (
            <>
              <div key={`label-${time}`} className="text-muted-foreground font-mono capitalize text-right pr-2 flex items-center justify-end">{time.slice(0, 4)}</div>
              {days.map(day => {
                const val = heatmapData[day]?.[time] || 0;
                const maxVal = Math.max(...Object.values(heatmapData).flatMap(d => Object.values(d)), 1);
                return (
                  <div key={`${day}-${time}`}
                    className="h-8 rounded border border-border"
                    style={{ backgroundColor: `hsl(162 100% 50% / ${Math.max(0.05, (val / maxVal) * 0.7)})` }}
                    title={`${day} ${time}: ${val} completions`}
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Smart Insights</h3>
          {insights.map(i => (
            <div key={i.id} className="p-4 rounded-lg bg-card border border-secondary/20">
              <p className="text-sm">{i.text}</p>
              <p className="text-xs text-muted-foreground mt-1 font-serif italic">{i.suggestion}</p>
              <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground font-mono">
                <span>Confidence: {Math.round(i.confidence * 100)}%</span>
                <span>Data points: {i.data_points}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
