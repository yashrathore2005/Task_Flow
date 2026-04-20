export type HabitCategory = 'health' | 'productivity' | 'study' | 'mental-wellness' | 'lifestyle';

export interface HabitTemplate {
  id: string;
  name: string;
  categoryId: HabitCategory;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'any';
  icon: string;
  color: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  frequency: 'daily' | 'weekly';
}

export const HABIT_LIBRARY: HabitTemplate[] = [
  // HEALTH & FITNESS
  { id: 'h1', name: 'Drink Water', categoryId: 'health', timeOfDay: 'morning', icon: '💧', color: 'bg-blue-500', description: 'Start the day hydrated', difficulty: 'easy', frequency: 'daily' },
  { id: 'h2', name: 'Morning Walk', categoryId: 'health', timeOfDay: 'morning', icon: '🚶‍♂️', color: 'bg-green-500', description: '30 mins of brisk walking', difficulty: 'easy', frequency: 'daily' },
  { id: 'h3', name: 'Gym Workout', categoryId: 'health', timeOfDay: 'evening', icon: '🏋️', color: 'bg-zinc-800', description: 'Hit the weights', difficulty: 'hard', frequency: 'daily' },
  { id: 'h4', name: 'Yoga', categoryId: 'health', timeOfDay: 'morning', icon: '🧘', color: 'bg-emerald-400', description: 'Stretching and grounding', difficulty: 'medium', frequency: 'daily' },
  { id: 'h5', name: 'Stretching', categoryId: 'health', timeOfDay: 'any', icon: '🤸', color: 'bg-teal-400', description: 'Keep muscles flexible', difficulty: 'easy', frequency: 'daily' },
  { id: 'h6', name: 'Meditation', categoryId: 'health', timeOfDay: 'morning', icon: '🌸', color: 'bg-pink-400', description: '10 minutes of silence', difficulty: 'medium', frequency: 'daily' },
  { id: 'h7', name: 'Sleep 8 Hours', categoryId: 'health', timeOfDay: 'night', icon: '😴', color: 'bg-indigo-400', description: 'Rest well for recovery', difficulty: 'medium', frequency: 'daily' },
  { id: 'h8', name: 'Healthy Breakfast', categoryId: 'health', timeOfDay: 'morning', icon: '🍳', color: 'bg-orange-400', description: 'High protein breakfast', difficulty: 'medium', frequency: 'daily' },
  { id: 'h9', name: 'No Sugar', categoryId: 'health', timeOfDay: 'any', icon: '🚫', color: 'bg-red-400', description: 'Avoid refined sugars', difficulty: 'hard', frequency: 'daily' },
  { id: 'h10', name: 'Track Calories', categoryId: 'health', timeOfDay: 'evening', icon: '📝', color: 'bg-yellow-500', description: 'Log all meals', difficulty: 'medium', frequency: 'daily' },

  // PRODUCTIVITY
  { id: 'p1', name: 'Wake Up Early', categoryId: 'productivity', timeOfDay: 'morning', icon: '🌅', color: 'bg-yellow-400', description: 'Rise before 6 AM', difficulty: 'hard', frequency: 'daily' },
  { id: 'p2', name: 'Plan My Day', categoryId: 'productivity', timeOfDay: 'morning', icon: '📋', color: 'bg-slate-500', description: 'Set Top 3 tasks', difficulty: 'medium', frequency: 'daily' },
  { id: 'p3', name: 'Deep Work', categoryId: 'productivity', timeOfDay: 'afternoon', icon: '🧠', color: 'bg-purple-600', description: '2 hours of uninterrupted work', difficulty: 'hard', frequency: 'daily' },
  { id: 'p4', name: 'No Procrastination', categoryId: 'productivity', timeOfDay: 'afternoon', icon: '⚡', color: 'bg-red-500', description: 'Do it now', difficulty: 'hard', frequency: 'daily' },
  { id: 'p5', name: 'Inbox Zero', categoryId: 'productivity', timeOfDay: 'evening', icon: '✉️', color: 'bg-blue-400', description: 'Clear all emails', difficulty: 'medium', frequency: 'daily' },
  { id: 'p6', name: 'Review Goals', categoryId: 'productivity', timeOfDay: 'night', icon: '🎯', color: 'bg-red-600', description: 'Check trajectory', difficulty: 'easy', frequency: 'weekly' },
  { id: 'p7', name: 'Clean Workspace', categoryId: 'productivity', timeOfDay: 'evening', icon: '🧹', color: 'bg-zinc-400', description: 'Clear desk, clear mind', difficulty: 'easy', frequency: 'daily' },
  { id: 'p8', name: 'Journal', categoryId: 'productivity', timeOfDay: 'night', icon: '📓', color: 'bg-stone-500', description: 'Reflect on the day', difficulty: 'medium', frequency: 'daily' },
  { id: 'p9', name: 'Read 10 Pages', categoryId: 'productivity', timeOfDay: 'evening', icon: '📚', color: 'bg-amber-600', description: 'Non-fiction reading', difficulty: 'medium', frequency: 'daily' },
  { id: 'p10', name: 'Learn New Skill', categoryId: 'productivity', timeOfDay: 'afternoon', icon: '💡', color: 'bg-yellow-400', description: '30 mins of dedicated learning', difficulty: 'hard', frequency: 'daily' },

  // STUDY
  { id: 's1', name: 'Study 1 Hour', categoryId: 'study', timeOfDay: 'afternoon', icon: '📖', color: 'bg-blue-600', description: 'Focused studying', difficulty: 'medium', frequency: 'daily' },
  { id: 's2', name: 'Revision', categoryId: 'study', timeOfDay: 'evening', icon: '🔄', color: 'bg-green-600', description: 'Review previous notes', difficulty: 'hard', frequency: 'daily' },
  { id: 's3', name: 'Practice Coding', categoryId: 'study', timeOfDay: 'afternoon', icon: '💻', color: 'bg-zinc-700', description: 'Write or read code', difficulty: 'hard', frequency: 'daily' },
  { id: 's4', name: 'Solve Questions', categoryId: 'study', timeOfDay: 'afternoon', icon: '✏️', color: 'bg-orange-500', description: 'Do practice sets', difficulty: 'medium', frequency: 'daily' },
  { id: 's5', name: 'Watch Lecture', categoryId: 'study', timeOfDay: 'morning', icon: '📺', color: 'bg-red-500', description: 'Learn new concepts', difficulty: 'medium', frequency: 'daily' },
  { id: 's6', name: 'Make Notes', categoryId: 'study', timeOfDay: 'afternoon', icon: '📝', color: 'bg-yellow-500', description: 'Summarize topics', difficulty: 'medium', frequency: 'daily' },
  { id: 's7', name: 'Mock Test', categoryId: 'study', timeOfDay: 'afternoon', icon: '⏱️', color: 'bg-red-600', description: 'Simulate exam environment', difficulty: 'hard', frequency: 'weekly' },
  { id: 's8', name: 'Reading Practice', categoryId: 'study', timeOfDay: 'evening', icon: '📖', color: 'bg-amber-700', description: 'Improve comprehension', difficulty: 'medium', frequency: 'daily' },
  { id: 's9', name: 'Vocabulary', categoryId: 'study', timeOfDay: 'morning', icon: '🔤', color: 'bg-purple-500', description: 'Learn 5 new words', difficulty: 'easy', frequency: 'daily' },
  { id: 's10', name: 'Research Topic', categoryId: 'study', timeOfDay: 'afternoon', icon: '🔍', color: 'bg-cyan-600', description: 'Deep dive into a subject', difficulty: 'medium', frequency: 'weekly' },

  // MENTAL WELLNESS
  { id: 'm1', name: 'Gratitude Practice', categoryId: 'mental-wellness', timeOfDay: 'morning', icon: '🙏', color: 'bg-pink-500', description: 'List 3 things you are grateful for', difficulty: 'easy', frequency: 'daily' },
  { id: 'm2', name: 'Breath Exercise', categoryId: 'mental-wellness', timeOfDay: 'any', icon: '😮‍💨', color: 'bg-sky-400', description: 'Box breathing for 5 mins', difficulty: 'easy', frequency: 'daily' },
  { id: 'm3', name: 'No Negative Thinking', categoryId: 'mental-wellness', timeOfDay: 'any', icon: '🛡️', color: 'bg-slate-600', description: 'Catch and reframe', difficulty: 'hard', frequency: 'daily' },
  { id: 'm4', name: 'Digital Detox', categoryId: 'mental-wellness', timeOfDay: 'evening', icon: '📵', color: 'bg-zinc-800', description: '1 hour without screens', difficulty: 'hard', frequency: 'daily' },
  { id: 'm5', name: 'Nature Time', categoryId: 'mental-wellness', timeOfDay: 'afternoon', icon: '🌳', color: 'bg-green-600', description: 'Spend time outside', difficulty: 'medium', frequency: 'daily' },
  { id: 'm6', name: 'Positive Affirmations', categoryId: 'mental-wellness', timeOfDay: 'morning', icon: '✨', color: 'bg-yellow-400', description: 'Say them out loud', difficulty: 'easy', frequency: 'daily' },
  { id: 'm7', name: 'Smile More', categoryId: 'mental-wellness', timeOfDay: 'any', icon: '😊', color: 'bg-orange-400', description: 'Be approachable', difficulty: 'easy', frequency: 'daily' },
  { id: 'm8', name: 'Stress Check', categoryId: 'mental-wellness', timeOfDay: 'afternoon', icon: '❤️‍🩹', color: 'bg-rose-500', description: 'Assess and release tension', difficulty: 'medium', frequency: 'daily' },
  { id: 'm9', name: 'Mindfulness', categoryId: 'mental-wellness', timeOfDay: 'any', icon: '👁️', color: 'bg-indigo-500', description: 'Stay present', difficulty: 'medium', frequency: 'daily' },
  { id: 'm10', name: 'Family Time', categoryId: 'mental-wellness', timeOfDay: 'evening', icon: '👨‍👩‍👧‍👦', color: 'bg-fuchsia-500', description: 'Connect with loved ones', difficulty: 'medium', frequency: 'daily' },

  // LIFESTYLE
  { id: 'l1', name: 'Clean Room', categoryId: 'lifestyle', timeOfDay: 'morning', icon: '🛏️', color: 'bg-sky-500', description: 'Make the bed', difficulty: 'easy', frequency: 'daily' },
  { id: 'l2', name: 'Budget Tracking', categoryId: 'lifestyle', timeOfDay: 'evening', icon: '💰', color: 'bg-emerald-500', description: 'Log expenses', difficulty: 'medium', frequency: 'daily' },
  { id: 'l3', name: 'Save Money', categoryId: 'lifestyle', timeOfDay: 'any', icon: '🏦', color: 'bg-green-500', description: 'Put aside some cash', difficulty: 'medium', frequency: 'weekly' },
  { id: 'l4', name: 'Skin Care', categoryId: 'lifestyle', timeOfDay: 'night', icon: '🧴', color: 'bg-pink-300', description: 'Wash and moisturize', difficulty: 'easy', frequency: 'daily' },
  { id: 'l5', name: 'Prayer', categoryId: 'lifestyle', timeOfDay: 'morning', icon: '🕊️', color: 'bg-amber-400', description: 'Spiritual connection', difficulty: 'easy', frequency: 'daily' },
  { id: 'l6', name: 'Call Parents', categoryId: 'lifestyle', timeOfDay: 'evening', icon: '📞', color: 'bg-blue-400', description: 'Check in on them', difficulty: 'easy', frequency: 'weekly' },
  { id: 'l7', name: 'No Junk Food', categoryId: 'lifestyle', timeOfDay: 'any', icon: '🍔', color: 'bg-red-500', description: 'Skip the snacks', difficulty: 'hard', frequency: 'daily' },
  { id: 'l8', name: 'Limit Screen Time', categoryId: 'lifestyle', timeOfDay: 'any', icon: '📱', color: 'bg-purple-500', description: 'Under 2 hours total', difficulty: 'hard', frequency: 'daily' },
  { id: 'l9', name: 'Evening Walk', categoryId: 'lifestyle', timeOfDay: 'evening', icon: '🚶‍♀️', color: 'bg-emerald-600', description: 'Wind down outside', difficulty: 'medium', frequency: 'daily' },
  { id: 'l10', name: 'Sleep On Time', categoryId: 'lifestyle', timeOfDay: 'night', icon: '⏰', color: 'bg-indigo-600', description: 'In bed by 10:30 PM', difficulty: 'medium', frequency: 'daily' }
];

export const GOAL_RECOMMENDATIONS: Record<string, string[]> = {
  'Fitness': ['h1', 'h2', 'h3', 'h5', 'h7'],
  'Study': ['p3', 's2', 's6', 'm4', 's4'],
  'Mental Health': ['m1', 'm2', 'm4', 'm5', 'm9'],
  'Productivity': ['p1', 'p2', 'p3', 'p5', 'p7'],
  'Better Sleep': ['h7', 'm4', 'l4', 'l10', 'm8'],
  'Self Discipline': ['p1', 'h3', 'p4', 'l7', 'm3'],
};
