import { Habit, ProgressLog, Goal, Reflection, IdentityArchetype, SmartInsight, UserSettings } from './types';

const KEYS = {
  habits: 'soms_habits',
  logs: 'soms_logs',
  goals: 'soms_goals',
  reflections: 'soms_reflections',
  identities: 'soms_identities',
  insights: 'soms_insights',
  settings: 'soms_settings',
  seeded: 'soms_seeded',
};

function get<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
}

function set<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Habits
export const getHabits = (): Habit[] => get<Habit>(KEYS.habits);
export const saveHabit = (habit: Habit) => {
  const habits = getHabits();
  const idx = habits.findIndex(h => h.id === habit.id);
  if (idx >= 0) habits[idx] = habit; else habits.push(habit);
  set(KEYS.habits, habits);
};
export const deleteHabit = (id: string) => set(KEYS.habits, getHabits().filter(h => h.id !== id));

// Progress Logs
export const getProgressLogs = (): ProgressLog[] => get<ProgressLog>(KEYS.logs);
export const logProgress = (log: ProgressLog) => {
  const logs = getProgressLogs();
  const idx = logs.findIndex(l => l.habit_id === log.habit_id && l.date === log.date);
  if (idx >= 0) logs[idx] = log; else logs.push(log);
  set(KEYS.logs, logs);
};

// Goals
export const getGoals = (): Goal[] => get<Goal>(KEYS.goals);
export const saveGoal = (goal: Goal) => {
  const goals = getGoals();
  const idx = goals.findIndex(g => g.id === goal.id);
  if (idx >= 0) goals[idx] = goal; else goals.push(goal);
  set(KEYS.goals, goals);
};
export const deleteGoal = (id: string) => set(KEYS.goals, getGoals().filter(g => g.id !== id));

// Reflections
export const getReflections = (): Reflection[] => get<Reflection>(KEYS.reflections);
export const saveReflection = (r: Reflection) => {
  const refs = getReflections();
  const idx = refs.findIndex(x => x.id === r.id);
  if (idx >= 0) refs[idx] = r; else refs.push(r);
  set(KEYS.reflections, refs);
};

// Identities
export const getIdentities = (): IdentityArchetype[] => get<IdentityArchetype>(KEYS.identities);
export const saveIdentity = (i: IdentityArchetype) => {
  const ids = getIdentities();
  const idx = ids.findIndex(x => x.id === i.id);
  if (idx >= 0) ids[idx] = i; else ids.push(i);
  set(KEYS.identities, ids);
};
export const deleteIdentity = (id: string) => set(KEYS.identities, getIdentities().filter(i => i.id !== id));

// Insights
export const getInsights = (): SmartInsight[] => get<SmartInsight>(KEYS.insights);
export const saveInsights = (insights: SmartInsight[]) => set(KEYS.insights, insights);

// Settings
const DEFAULT_SETTINGS: UserSettings = {
  display_name: 'Operator',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  theme: 'dark',
  notification_preferences: { habit_reminders: true, weekly_review: true, reflection_prompts: true },
};
export const getSettings = (): UserSettings => {
  try {
    const s = localStorage.getItem(KEYS.settings);
    return s ? JSON.parse(s) : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
};
export const saveSettings = (s: UserSettings) => localStorage.setItem(KEYS.settings, JSON.stringify(s));

// Seed check
export const isSeeded = (): boolean => localStorage.getItem(KEYS.seeded) === 'true';
export const markSeeded = () => localStorage.setItem(KEYS.seeded, 'true');

// Clear all
export const clearAllData = () => {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
};
