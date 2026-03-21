import { useState, useCallback } from 'react';
import { getSettings, saveSettings, clearAllData, getHabits, getProgressLogs, getGoals, getReflections, getIdentities } from '@/lib/store';
import { UserSettings } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Trash2, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState(getSettings);
  const [showReset, setShowReset] = useState(false);

  const update = useCallback((patch: Partial<UserSettings>) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    saveSettings(updated);
  }, [settings]);

  const exportData = useCallback((format: 'json' | 'csv') => {
    const data = {
      habits: getHabits(),
      logs: getProgressLogs(),
      goals: getGoals(),
      reflections: getReflections(),
      identities: getIdentities(),
      settings: getSettings(),
    };
    let content: string, mime: string, ext: string;
    if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      mime = 'application/json';
      ext = 'json';
    } else {
      const rows = data.habits.map(h => [h.name, h.category, h.frequency, h.difficulty].join(','));
      content = 'name,category,frequency,difficulty\n' + rows.join('\n');
      mime = 'text/csv';
      ext = 'csv';
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `trackme-soms-export.${ext}`; a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleReset = () => {
    clearAllData();
    window.location.reload();
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      {/* Profile */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Profile</h2>
        <div className="p-4 rounded-lg bg-card border border-border space-y-4">
          <div><Label>Display Name</Label><Input value={settings.display_name} onChange={e => update({ display_name: e.target.value })} className="bg-muted/30 mt-1" /></div>
          <div><Label>Timezone</Label><Input value={settings.timezone} onChange={e => update({ timezone: e.target.value })} className="bg-muted/30 mt-1" /></div>
        </div>
      </section>

      {/* Appearance */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Appearance</h2>
        <div className="p-4 rounded-lg bg-card border border-border">
          <Label>Theme</Label>
          <Select value={settings.theme} onValueChange={v => update({ theme: v as any })}>
            <SelectTrigger className="bg-muted/30 mt-1 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="focus">Focus</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Notifications */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Notifications</h2>
        <div className="p-4 rounded-lg bg-card border border-border space-y-4">
          {[
            { key: 'habit_reminders' as const, label: 'Habit Reminders' },
            { key: 'weekly_review' as const, label: 'Weekly Review' },
            { key: 'reflection_prompts' as const, label: 'Reflection Prompts' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <Label>{item.label}</Label>
              <Switch checked={settings.notification_preferences[item.key]}
                onCheckedChange={v => update({ notification_preferences: { ...settings.notification_preferences, [item.key]: v } })} />
            </div>
          ))}
        </div>
      </section>

      {/* Data Export */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Data Export</h2>
        <div className="p-4 rounded-lg bg-card border border-border flex gap-3">
          <button onClick={() => exportData('json')}
            className="flex items-center gap-2 px-4 py-2 bg-muted rounded text-sm hover:bg-muted/80 transition-colors">
            <Download size={14} /> Export JSON
          </button>
          <button onClick={() => exportData('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-muted rounded text-sm hover:bg-muted/80 transition-colors">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </section>

      {/* Reset */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-destructive">Danger Zone</h2>
        <div className="p-4 rounded-lg bg-card border border-destructive/20">
          <p className="text-sm text-muted-foreground mb-3">This will permanently delete all your data. Export first if you want to keep it.</p>
          <button onClick={() => setShowReset(true)}
            className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded text-sm hover:bg-destructive/20 transition-colors">
            <Trash2 size={14} /> Reset All Data
          </button>
        </div>
      </section>

      {/* About */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">About</h2>
        <div className="p-4 rounded-lg bg-card border border-border">
          <p className="font-mono text-sm text-primary glow-text-mint">TrackMe — SOMS Edition v1.0</p>
          <p className="text-xs text-muted-foreground mt-1">Self-Optimization & Mindset System</p>
          <p className="text-xs text-muted-foreground mt-3 font-serif italic">"You don't track habits. You engineer identity."</p>
          <p className="text-xs text-muted-foreground mt-3">All data stored locally. No cloud. No accounts. Your data is yours.</p>
        </div>
      </section>

      {/* Reset Confirmation */}
      <Dialog open={showReset} onOpenChange={setShowReset}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive" size={18} /> Confirm Reset</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone. All habits, goals, reflections, and progress will be permanently deleted.</p>
          <div className="flex gap-3 mt-4">
            <button onClick={() => exportData('json')} className="flex-1 py-2 bg-muted rounded text-sm hover:bg-muted/80">Export First</button>
            <button onClick={handleReset} className="flex-1 py-2 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90">Delete Everything</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
