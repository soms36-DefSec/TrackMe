import { Habit, ProgressLog, Goal, Reflection, IdentityArchetype } from './types';
import { saveHabit, logProgress, saveGoal, saveReflection, saveIdentity, markSeeded } from './store';

const uid = () => crypto.randomUUID();
const daysAgo = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

const HABIT_IDS = { meditation: uid(), deepWork: uid(), exercise: uid(), reading: uid(), journaling: uid() };
const GOAL_IDS = { mastery: uid(), fitness: uid() };

const habits: Habit[] = [
  { id: HABIT_IDS.meditation, name: 'Morning Meditation', category: 'mind', frequency: 'daily', difficulty: 2, energy_required: 'low', tags: ['mindfulness', 'morning'], linked_goal_ids: [GOAL_IDS.mastery], identity_archetype: 'Mindful Strategist', cue: 'After waking up, sit on the mat', routine: '10 minutes guided meditation', reward: 'Mental clarity and calm', implementation_intention: 'I will meditate at 6:30 AM in my bedroom', created_at: daysAgo(30), archived: false },
  { id: HABIT_IDS.deepWork, name: 'Deep Work Block', category: 'work', frequency: 'daily', specific_days: ['mon','tue','wed','thu','fri'], difficulty: 4, energy_required: 'high', tags: ['focus', 'productivity'], linked_goal_ids: [GOAL_IDS.mastery], identity_archetype: 'Deep Worker', cue: 'After morning coffee, close all tabs', routine: '90 minutes of focused coding/writing', reward: 'Sense of progress and mastery', implementation_intention: 'I will do deep work at 9:00 AM at my desk', created_at: daysAgo(30), archived: false },
  { id: HABIT_IDS.exercise, name: 'Physical Training', category: 'health', frequency: 'specific_days', specific_days: ['mon','wed','fri','sat'], difficulty: 3, energy_required: 'high', tags: ['fitness', 'strength'], linked_goal_ids: [GOAL_IDS.fitness], identity_archetype: 'Resilient Builder', cue: 'Put on workout clothes at 5 PM', routine: '45 min strength training', reward: 'Endorphin rush and physical confidence', implementation_intention: 'I will train at 5:00 PM in the gym', created_at: daysAgo(25), archived: false },
  { id: HABIT_IDS.reading, name: 'Read 20 Pages', category: 'skill', frequency: 'daily', difficulty: 1, energy_required: 'low', tags: ['learning', 'evening'], linked_goal_ids: [GOAL_IDS.mastery], identity_archetype: 'Lifelong Learner', cue: 'After dinner, pick up the book', routine: 'Read 20 pages of current book', reward: 'New knowledge and relaxation', implementation_intention: 'I will read at 8:30 PM on the couch', created_at: daysAgo(20), archived: false },
  { id: HABIT_IDS.journaling, name: 'Evening Journal', category: 'mind', frequency: 'daily', difficulty: 2, energy_required: 'low', tags: ['reflection', 'evening'], linked_goal_ids: [], identity_archetype: 'Mindful Strategist', cue: 'After reading, open journal', routine: 'Write 3 wins, 1 lesson, tomorrow plan', reward: 'Closure and self-awareness', implementation_intention: 'I will journal at 9:00 PM at my desk', created_at: daysAgo(20), archived: false },
];

const statuses: Array<'done' | 'skipped' | 'failed'> = ['done', 'done', 'done', 'done', 'skipped', 'done', 'failed'];
const times: Array<'morning' | 'afternoon' | 'evening' | 'night'> = ['morning', 'morning', 'afternoon', 'evening', 'night'];

function generateLogs(): ProgressLog[] {
  const logs: ProgressLog[] = [];
  for (let day = 0; day < 14; day++) {
    const date = daysAgo(day);
    Object.values(HABIT_IDS).forEach((habitId, hi) => {
      const shouldLog = Math.random() > 0.15;
      if (!shouldLog) return;
      logs.push({
        id: uid(),
        habit_id: habitId,
        date,
        status: statuses[(day + hi) % statuses.length],
        mood: Math.min(5, Math.max(1, 3 + Math.floor(Math.random() * 3) - 1)),
        energy_level: Math.min(5, Math.max(1, 3 + Math.floor(Math.random() * 3) - 1)),
        time_of_day: times[hi % times.length],
        notes: '',
      });
    });
  }
  return logs;
}

const goals: Goal[] = [
  { id: GOAL_IDS.mastery, title: 'Achieve Deep Work Mastery', description: 'Build the capacity for 4 hours of daily deep work across creative and technical domains.', type: 'long_term', deadline: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0], milestones: [{ id: uid(), title: 'Complete 7-day streak of 90-min blocks', completed: true, completed_at: daysAgo(5) }, { id: uid(), title: 'Reach 2-hour continuous focus', completed: false }, { id: uid(), title: 'Build morning routine around deep work', completed: true, completed_at: daysAgo(10) }], linked_habit_ids: [HABIT_IDS.deepWork, HABIT_IDS.meditation, HABIT_IDS.reading], identity_connection: 'Becoming a Deep Worker means I produce exceptional output consistently.', progress_percentage: 45, created_at: daysAgo(30) },
  { id: GOAL_IDS.fitness, title: 'Build Functional Strength', description: 'Develop a consistent strength training practice and reach baseline fitness benchmarks.', type: 'short_term', deadline: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0], milestones: [{ id: uid(), title: 'Train 4x per week for 3 weeks', completed: false }, { id: uid(), title: 'Complete first 5K run', completed: false }], linked_habit_ids: [HABIT_IDS.exercise], identity_connection: 'A Resilient Builder takes care of the machine.', progress_percentage: 20, created_at: daysAgo(15) },
];

const reflections: Reflection[] = [
  { id: uid(), type: 'idea', content: 'What if I stack my meditation directly before deep work? The calm state might enhance focus duration. Need to test for a week.', tags: ['experiment', 'stacking'], linked_habit_ids: [HABIT_IDS.meditation, HABIT_IDS.deepWork], linked_goal_ids: [GOAL_IDS.mastery], mood_at_time: 4, energy_at_time: 4, created_at: daysAgo(3) },
  { id: uid(), type: 'learning', content: 'Discovered that my evening reading retention drops significantly after 9:30 PM. Moving it to 8 PM made a noticeable difference in comprehension and enjoyment.', tags: ['optimization', 'timing'], linked_habit_ids: [HABIT_IDS.reading], linked_goal_ids: [], mood_at_time: 4, energy_at_time: 3, created_at: daysAgo(7) },
  { id: uid(), type: 'failure_analysis', content: 'Skipped deep work for 3 days in a row.', tags: ['failure', 'recovery'], linked_habit_ids: [HABIT_IDS.deepWork], linked_goal_ids: [GOAL_IDS.mastery], mood_at_time: 2, energy_at_time: 2, failure_data: { what_happened: 'Got pulled into reactive work — emails and Slack consumed the morning window.', energy_level: 2, thought_pattern: 'I told myself "I\'ll do it after this one thing" but it never ended.', emotion: 'overwhelmed', reframe: 'Reactive work feels urgent but deep work creates lasting value. I can block notifications for 90 minutes — the world won\'t end.', next_time_plan: 'Tomorrow: Phone on airplane mode at 8:55 AM. Laptop opens to code editor, not email.' }, created_at: daysAgo(5) },
];

const identities: IdentityArchetype[] = [
  { id: uid(), name: 'Deep Worker', core_belief: 'I show up and do focused, meaningful work every day. Distractions are data, not destiny.', linked_habit_ids: [HABIT_IDS.deepWork, HABIT_IDS.meditation, HABIT_IDS.reading], days_aligned: 18, created_at: daysAgo(30) },
];

export function seedAllData() {
  habits.forEach(saveHabit);
  generateLogs().forEach(logProgress);
  goals.forEach(saveGoal);
  reflections.forEach(saveReflection);
  identities.forEach(saveIdentity);
  markSeeded();
}
