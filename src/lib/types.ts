export type HabitCategory = 'health' | 'mind' | 'skill' | 'work' | 'social' | 'custom';
export type Frequency = 'daily' | 'specific_days' | 'weekly' | 'custom';
export type EnergyLevel = 'low' | 'medium' | 'high';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type LogStatus = 'done' | 'skipped' | 'failed';
export type GoalType = 'short_term' | 'long_term';
export type ReflectionType = 'idea' | 'reflection' | 'learning' | 'philosophy' | 'failure_analysis';
export type ThemeMode = 'dark' | 'light' | 'focus';

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  frequency: Frequency;
  specific_days?: string[];
  difficulty: number;
  energy_required: EnergyLevel;
  tags: string[];
  linked_goal_ids: string[];
  identity_archetype: string;
  cue: string;
  routine: string;
  reward: string;
  implementation_intention: string;
  created_at: string;
  archived: boolean;
}

export interface ProgressLog {
  id: string;
  habit_id: string;
  date: string;
  status: LogStatus;
  mood: number;
  energy_level: number;
  time_of_day: TimeOfDay;
  notes: string;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completed_at?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: GoalType;
  deadline: string;
  milestones: Milestone[];
  linked_habit_ids: string[];
  identity_connection: string;
  progress_percentage: number;
  created_at: string;
}

export interface FailureAnalysis {
  what_happened: string;
  energy_level: number;
  thought_pattern: string;
  emotion: string;
  reframe: string;
  next_time_plan: string;
}

export interface Reflection {
  id: string;
  type: ReflectionType;
  content: string;
  tags: string[];
  linked_habit_ids: string[];
  linked_goal_ids: string[];
  mood_at_time?: number;
  energy_at_time?: number;
  failure_data?: FailureAnalysis;
  created_at: string;
}

export interface IdentityArchetype {
  id: string;
  name: string;
  core_belief: string;
  linked_habit_ids: string[];
  days_aligned: number;
  created_at: string;
}

export interface SmartInsight {
  id: string;
  text: string;
  confidence: number;
  data_points: number;
  suggestion: string;
  generated_at: string;
  dismissed: boolean;
}

export interface UserSettings {
  display_name: string;
  timezone: string;
  theme: ThemeMode;
  pin_lock?: string;
  notification_preferences: {
    habit_reminders: boolean;
    weekly_review: boolean;
    reflection_prompts: boolean;
  };
}

export const CATEGORY_COLORS: Record<HabitCategory, string> = {
  health: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  mind: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  skill: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  work: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  social: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  custom: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};
