export type HabitCategory = 
  | 'health' 
  | 'fitness' 
  | 'study' 
  | 'productivity' 
  | 'mindfulness' 
  | 'finance' 
  | 'personal-growth' 
  | 'home' 
  | 'social' 
  | 'custom-picks';

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
  popular?: boolean;
}

export const HABIT_LIBRARY: HabitTemplate[] = [
  // HEALTH (1-15)
  { id: 'h1', name: 'Drink 8 Glasses Water', categoryId: 'health', timeOfDay: 'any', icon: '💧', color: 'bg-blue-500', description: 'Stay hydrated for energy and focus.', difficulty: 'easy', frequency: 'daily', popular: true },
  { id: 'h2', name: 'Sleep Before 11 PM', categoryId: 'health', timeOfDay: 'night', icon: '😴', color: 'bg-indigo-600', description: 'Ensure quality rest for recovery.', difficulty: 'medium', frequency: 'daily', popular: true },
  { id: 'h3', name: 'Morning Walk', categoryId: 'health', timeOfDay: 'morning', icon: '🚶‍♀️', color: 'bg-green-500', description: 'Start your day with light cardio.', difficulty: 'easy', frequency: 'daily' },
  { id: 'h4', name: 'Take Vitamins', categoryId: 'health', timeOfDay: 'morning', icon: '💊', color: 'bg-yellow-500', description: 'Supplement your diet for optimal health.', difficulty: 'easy', frequency: 'daily' },
  { id: 'h5', name: 'Eat Fruit Daily', categoryId: 'health', timeOfDay: 'any', icon: '🍎', color: 'bg-red-500', description: 'Get your daily dose of fiber and vitamins.', difficulty: 'easy', frequency: 'daily' },
  { id: 'h6', name: 'No Sugary Drinks', categoryId: 'health', timeOfDay: 'any', icon: '🥤', color: 'bg-orange-500', description: 'Avoid liquid sugar for better metabolism.', difficulty: 'hard', frequency: 'daily' },
  { id: 'h7', name: 'Stretch 10 Minutes', categoryId: 'health', timeOfDay: 'morning', icon: '🧘‍♀️', color: 'bg-teal-500', description: 'Maintain flexibility and reduce tension.', difficulty: 'easy', frequency: 'daily' },
  { id: 'h8', name: 'Track Calories', categoryId: 'health', timeOfDay: 'any', icon: '⚖️', color: 'bg-pink-500', description: 'Be mindful of your energy intake.', difficulty: 'medium', frequency: 'daily' },
  { id: 'h9', name: 'Healthy Breakfast', categoryId: 'health', timeOfDay: 'morning', icon: '🥣', color: 'bg-orange-400', description: 'Fuel your day with nutritious food.', difficulty: 'medium', frequency: 'daily' },
  { id: 'h10', name: 'Reduce Junk Food', categoryId: 'health', timeOfDay: 'any', icon: '🍔', color: 'bg-red-600', description: 'Limit processed foods for better health.', difficulty: 'hard', frequency: 'daily' },
  { id: 'h11', name: 'Posture Check', categoryId: 'health', timeOfDay: 'any', icon: '📏', color: 'bg-slate-500', description: 'Sit and stand straighter throughout the day.', difficulty: 'easy', frequency: 'daily' },
  { id: 'h12', name: 'Deep Breathing', categoryId: 'health', timeOfDay: 'any', icon: '🌬️', color: 'bg-cyan-400', description: 'Reduce stress with conscious breaths.', difficulty: 'easy', frequency: 'daily' },
  { id: 'h13', name: 'Evening Walk', categoryId: 'health', timeOfDay: 'evening', icon: '🌙', color: 'bg-indigo-400', description: 'Wind down after your day with a stroll.', difficulty: 'easy', frequency: 'daily' },
  { id: 'h14', name: 'Limit Caffeine', categoryId: 'health', timeOfDay: 'morning', icon: '☕', color: 'bg-amber-700', description: 'Keep coffee/tea intake under control.', difficulty: 'medium', frequency: 'daily' },
  { id: 'h15', name: 'Regular Health Check', categoryId: 'health', timeOfDay: 'any', icon: '🏥', color: 'bg-rose-500', description: 'Monitor your health vitals.', difficulty: 'medium', frequency: 'weekly' },

  // FITNESS (16-30)
  { id: 'f1', name: '30 Min Workout', categoryId: 'fitness', timeOfDay: 'any', icon: '🏋️‍♂️', color: 'bg-orange-600', description: 'Intense exercise to keep fit.', difficulty: 'medium', frequency: 'daily', popular: true },
  { id: 'f2', name: '10,000 Steps', categoryId: 'fitness', timeOfDay: 'any', icon: '👟', color: 'bg-emerald-500', description: 'Stay active throughout the day.', difficulty: 'medium', frequency: 'daily', popular: true },
  { id: 'f3', name: 'Push-Ups Daily', categoryId: 'fitness', timeOfDay: 'any', icon: '💪', color: 'bg-slate-700', description: 'Build upper body strength.', difficulty: 'medium', frequency: 'daily' },
  { id: 'f4', name: 'Yoga Session', categoryId: 'fitness', timeOfDay: 'any', icon: '🧘', color: 'bg-purple-500', description: 'Mind-body spiritual connection.', difficulty: 'medium', frequency: 'weekly' },
  { id: 'f5', name: 'Plank 2 Minutes', categoryId: 'fitness', timeOfDay: 'any', icon: '🥪', color: 'bg-amber-600', description: 'Core stability and endurance.', difficulty: 'medium', frequency: 'daily' },
  { id: 'f6', name: 'Run 3 KM', categoryId: 'fitness', timeOfDay: 'morning', icon: '🏃‍♂️', color: 'bg-blue-600', description: 'Build cardiovascular endurance.', difficulty: 'hard', frequency: 'weekly' },
  { id: 'f7', name: 'Cycle Ride', categoryId: 'fitness', timeOfDay: 'any', icon: '🚲', color: 'bg-sky-500', description: 'Fun way to get cardio in.', difficulty: 'medium', frequency: 'weekly' },
  { id: 'f8', name: 'Leg Day Workout', categoryId: 'fitness', timeOfDay: 'any', icon: '🍗', color: 'bg-red-500', description: 'Don\'t skip leg day.', difficulty: 'hard', frequency: 'weekly' },
  { id: 'f9', name: 'Full Body Stretch', categoryId: 'fitness', timeOfDay: 'any', icon: '🤸‍♀️', color: 'bg-lime-500', description: 'Improve range of motion.', difficulty: 'easy', frequency: 'daily' },
  { id: 'f10', name: 'Home Workout', categoryId: 'fitness', timeOfDay: 'any', icon: '🏠', color: 'bg-zinc-600', description: 'No gym? No problem.', difficulty: 'medium', frequency: 'daily' },
  { id: 'f11', name: 'Jump Rope', categoryId: 'fitness', timeOfDay: 'any', icon: '🪢', color: 'bg-rose-600', description: 'High-intensity cardio.', difficulty: 'hard', frequency: 'daily' },
  { id: 'f12', name: 'Mobility Routine', categoryId: 'fitness', timeOfDay: 'morning', icon: '🦴', color: 'bg-stone-500', description: 'Joint health and movement.', difficulty: 'medium', frequency: 'daily' },
  { id: 'f13', name: 'Core Training', categoryId: 'fitness', timeOfDay: 'any', icon: '🛡️', color: 'bg-indigo-700', description: 'Focus on your abs and back.', difficulty: 'medium', frequency: 'weekly' },
  { id: 'f14', name: 'Strength Training', categoryId: 'fitness', timeOfDay: 'any', icon: '🔩', color: 'bg-gray-800', description: 'Lift heavy and build muscle.', difficulty: 'hard', frequency: 'weekly' },
  { id: 'f15', name: 'Weekend Sports', categoryId: 'fitness', timeOfDay: 'any', icon: '⚽', color: 'bg-green-600', description: 'Play football, cricket, or any sport.', difficulty: 'medium', frequency: 'weekly' },

  // STUDY (31-45)
  { id: 's1', name: 'Read 20 Pages', categoryId: 'study', timeOfDay: 'evening', icon: '📚', color: 'bg-amber-600', description: 'Expand your knowledge through books.', difficulty: 'medium', frequency: 'daily', popular: true },
  { id: 's2', name: 'Practice Coding', categoryId: 'study', timeOfDay: 'any', icon: '💻', color: 'bg-blue-700', description: 'Build something new every day.', difficulty: 'hard', frequency: 'daily', popular: true },
  { id: 's3', name: 'Revise Notes', categoryId: 'study', timeOfDay: 'evening', icon: '📝', color: 'bg-yellow-600', description: 'Reinforce what you learned.', difficulty: 'medium', frequency: 'daily' },
  { id: 's4', name: '1 Hour Deep Study', categoryId: 'study', timeOfDay: 'any', icon: '🎯', color: 'bg-rose-700', description: 'Focused learning without distraction.', difficulty: 'hard', frequency: 'daily' },
  { id: 's5', name: 'Solve 10 Questions', categoryId: 'study', timeOfDay: 'any', icon: '❓', color: 'bg-purple-600', description: 'Test your understanding.', difficulty: 'medium', frequency: 'daily' },
  { id: 's6', name: 'Learn New Topic', categoryId: 'study', timeOfDay: 'any', icon: '💡', color: 'bg-cyan-600', description: 'Keep your curiosities alive.', difficulty: 'hard', frequency: 'daily' },
  { id: 's7', name: 'Flashcards Review', categoryId: 'study', timeOfDay: 'any', icon: '📇', color: 'bg-orange-600', description: 'Active recall for better memory.', difficulty: 'medium', frequency: 'daily' },
  { id: 's8', name: 'Watch Educational Video', categoryId: 'study', timeOfDay: 'any', icon: '📺', color: 'bg-red-500', description: 'Learn through visual content.', difficulty: 'easy', frequency: 'daily' },
  { id: 's9', name: 'Write Summary Notes', categoryId: 'study', timeOfDay: 'evening', icon: '🖋️', color: 'bg-slate-600', description: 'Consolidate information.', difficulty: 'medium', frequency: 'weekly' },
  { id: 's10', name: 'Practice Math', categoryId: 'study', timeOfDay: 'any', icon: '➕', color: 'bg-indigo-600', description: 'Keep your logical skills sharp.', difficulty: 'medium', frequency: 'daily' },
  { id: 's11', name: 'Mock Test', categoryId: 'study', timeOfDay: 'any', icon: '⏱️', color: 'bg-zinc-700', description: 'Simulate exam conditions.', difficulty: 'hard', frequency: 'weekly' },
  { id: 's12', name: 'Vocabulary Learning', categoryId: 'study', timeOfDay: 'morning', icon: '🗣️', color: 'bg-emerald-600', description: 'Learn 5 new words daily.', difficulty: 'easy', frequency: 'daily' },
  { id: 's13', name: 'Research Topic', categoryId: 'study', timeOfDay: 'any', icon: '🔍', color: 'bg-sky-600', description: 'Go deep into a specific subject.', difficulty: 'hard', frequency: 'weekly' },
  { id: 's14', name: 'Daily Journal Learning', categoryId: 'study', timeOfDay: 'night', icon: '📓', color: 'bg-lime-700', description: 'Log what you learned today.', difficulty: 'easy', frequency: 'daily' },
  { id: 's15', name: 'Attend Class on Time', categoryId: 'study', timeOfDay: 'morning', icon: '🏫', color: 'bg-stone-600', description: 'Consistency starts with punctuality.', difficulty: 'easy', frequency: 'daily' },

  // PRODUCTIVITY (46-60)
  { id: 'p1', name: 'Plan Your Day', categoryId: 'productivity', timeOfDay: 'morning', icon: '🗓️', color: 'bg-blue-600', description: 'Outline your tasks for clarity.', difficulty: 'medium', frequency: 'daily', popular: true },
  { id: 'p2', name: 'Inbox Zero', categoryId: 'productivity', timeOfDay: 'any', icon: '📧', color: 'bg-indigo-500', description: 'Keep your communications organized.', difficulty: 'medium', frequency: 'daily' },
  { id: 'p3', name: 'No Social Media 2 Hours', categoryId: 'productivity', timeOfDay: 'any', icon: '📱', color: 'bg-pink-600', description: 'Reclaim your focus time.', difficulty: 'hard', frequency: 'daily', popular: true },
  { id: 'p4', name: 'Journal Daily', categoryId: 'productivity', timeOfDay: 'night', icon: '✍️', color: 'bg-emerald-600', description: 'Reflect on your progress.', difficulty: 'medium', frequency: 'daily' },
  { id: 'p5', name: 'Clear Workspace', categoryId: 'productivity', timeOfDay: 'evening', icon: '🧹', color: 'bg-teal-600', description: 'Outer order, inner calm.', difficulty: 'easy', frequency: 'daily' },
  { id: 'p6', name: 'Top 3 Priorities', categoryId: 'productivity', timeOfDay: 'morning', icon: '🥇', color: 'bg-amber-600', description: 'Focus on what matters most.', difficulty: 'medium', frequency: 'daily' },
  { id: 'p7', name: 'Review Goals', categoryId: 'productivity', timeOfDay: 'any', icon: '🎯', color: 'bg-red-600', description: 'Stay aligned with your vision.', difficulty: 'medium', frequency: 'weekly' },
  { id: 'p8', name: 'Weekly Planning', categoryId: 'productivity', timeOfDay: 'any', icon: '📅', color: 'bg-violet-600', description: 'Prepare for the week ahead.', difficulty: 'medium', frequency: 'weekly' },
  { id: 'p9', name: 'Time Blocking', categoryId: 'productivity', timeOfDay: 'any', icon: '🧱', color: 'bg-cyan-700', description: 'Dedicate blocks to specific tasks.', difficulty: 'hard', frequency: 'daily' },
  { id: 'p10', name: 'Declutter Desktop', categoryId: 'productivity', timeOfDay: 'any', icon: '📂', color: 'bg-zinc-600', description: 'Organize your digital files.', difficulty: 'easy', frequency: 'weekly' },
  { id: 'p11', name: 'Process Emails', categoryId: 'productivity', timeOfDay: 'any', icon: '✉️', color: 'bg-sky-500', description: 'Dedicated time for responses.', difficulty: 'medium', frequency: 'daily' },
  { id: 'p12', name: 'End Day Review', categoryId: 'productivity', timeOfDay: 'night', icon: '🌜', color: 'bg-blue-900', description: 'Reflect on today\'s wins.', difficulty: 'easy', frequency: 'daily' },
  { id: 'p13', name: 'Focus Session', categoryId: 'productivity', timeOfDay: 'any', icon: '🌊', color: 'bg-cyan-500', description: 'Work in deep flow states.', difficulty: 'hard', frequency: 'daily' },
  { id: 'p14', name: 'Organize Files', categoryId: 'productivity', timeOfDay: 'any', icon: '🗄️', color: 'bg-slate-700', description: 'Keep your system clean.', difficulty: 'medium', frequency: 'weekly' },
  { id: 'p15', name: 'Daily Reflection', categoryId: 'productivity', timeOfDay: 'any', icon: '🤔', color: 'bg-stone-500', description: 'A moment to pause and think.', difficulty: 'easy', frequency: 'daily' },

  // MINDFULNESS (61-70)
  { id: 'm1', name: 'Meditation', categoryId: 'mindfulness', timeOfDay: 'morning', icon: '🧘‍♂️', color: 'bg-indigo-500', description: 'Train your mind for peace.', difficulty: 'medium', frequency: 'daily', popular: true },
  { id: 'm2', name: 'Gratitude Journal', categoryId: 'mindfulness', timeOfDay: 'night', icon: '🙏', color: 'bg-orange-400', description: 'Focus on the positive.', difficulty: 'easy', frequency: 'daily', popular: true },
  { id: 'm3', name: 'Breathing Exercise', categoryId: 'mindfulness', timeOfDay: 'any', icon: '🌬️', color: 'bg-cyan-500', description: 'Instant calm and focus.', difficulty: 'easy', frequency: 'daily' },
  { id: 'm4', name: 'Mindful Walk', categoryId: 'mindfulness', timeOfDay: 'any', icon: '🌳', color: 'bg-green-600', description: 'Walk without distraction.', difficulty: 'easy', frequency: 'daily' },
  { id: 'm5', name: 'Digital Detox 1 Hour', categoryId: 'mindfulness', timeOfDay: 'any', icon: '🔌', color: 'bg-red-500', description: 'Unplug and reconnect.', difficulty: 'hard', frequency: 'daily' },
  { id: 'm6', name: 'Positive Affirmations', categoryId: 'mindfulness', timeOfDay: 'any', icon: '✨', color: 'bg-amber-400', description: 'Reinforce your self-worth.', difficulty: 'easy', frequency: 'daily' },
  { id: 'm7', name: 'Silence 10 Minutes', categoryId: 'mindfulness', timeOfDay: 'any', icon: '🤫', color: 'bg-slate-500', description: 'Sit in quiet contemplation.', difficulty: 'medium', frequency: 'daily' },
  { id: 'm8', name: 'Nature Time', categoryId: 'mindfulness', timeOfDay: 'any', icon: '🏔️', color: 'bg-emerald-500', description: 'Spend time outdoors.', difficulty: 'easy', frequency: 'weekly' },
  { id: 'm9', name: 'Mood Check-in', categoryId: 'mindfulness', timeOfDay: 'any', icon: '😃', color: 'bg-pink-400', description: 'Be aware of your emotions.', difficulty: 'easy', frequency: 'daily' },
  { id: 'm10', name: 'Pray / Spiritual Time', categoryId: 'mindfulness', timeOfDay: 'any', icon: '🕯️', color: 'bg-amber-700', description: 'Connect with your faith.', difficulty: 'easy', frequency: 'daily' },

  // FINANCE (71-80)
  { id: 'fi1', name: 'Track Expenses', categoryId: 'finance', timeOfDay: 'evening', icon: '💸', color: 'bg-pink-500', description: 'Know where your money goes.', difficulty: 'medium', frequency: 'daily', popular: true },
  { id: 'fi2', name: 'Save Money', categoryId: 'finance', timeOfDay: 'any', icon: '🐷', color: 'bg-emerald-400', description: 'Build your future nest egg.', difficulty: 'medium', frequency: 'daily', popular: true },
  { id: 'fi3', name: 'No Impulse Spending', categoryId: 'finance', timeOfDay: 'any', icon: '🚫', color: 'bg-red-500', description: 'Stick to your shopping list.', difficulty: 'hard', frequency: 'daily' },
  { id: 'fi4', name: 'Budget Review', categoryId: 'finance', timeOfDay: 'any', icon: '📊', color: 'bg-blue-600', description: 'Stay on top of your plan.', difficulty: 'medium', frequency: 'weekly' },
  { id: 'fi5', name: 'Record Income', categoryId: 'finance', timeOfDay: 'any', icon: '📈', color: 'bg-green-600', description: 'Log all earnings clearly.', difficulty: 'easy', frequency: 'weekly' },
  { id: 'fi6', name: 'Pay Bills On Time', categoryId: 'finance', timeOfDay: 'any', icon: '🧾', color: 'bg-indigo-600', description: 'Avoid late fees and stress.', difficulty: 'easy', frequency: 'weekly' },
  { id: 'fi7', name: 'Investment Learning', categoryId: 'finance', timeOfDay: 'any', icon: '📚', color: 'bg-amber-600', description: 'Learn about assets and markets.', difficulty: 'medium', frequency: 'weekly' },
  { id: 'fi8', name: 'Check Bank Balance', categoryId: 'finance', timeOfDay: 'any', icon: '🏦', color: 'bg-slate-700', description: 'Stay aware of your position.', difficulty: 'easy', frequency: 'daily' },
  { id: 'fi9', name: 'Expense Categorization', categoryId: 'finance', timeOfDay: 'any', icon: '🏷️', color: 'bg-teal-500', description: 'Organize your spending.', difficulty: 'medium', frequency: 'weekly' },
  { id: 'fi10', name: 'Weekly Savings Transfer', categoryId: 'finance', timeOfDay: 'any', icon: '↪️', color: 'bg-cyan-600', description: 'Automate your savings.', difficulty: 'medium', frequency: 'weekly' },

  // PERSONAL GROWTH (81-90)
  { id: 'pg1', name: 'Read Nonfiction', categoryId: 'personal-growth', timeOfDay: 'any', icon: '📖', color: 'bg-orange-600', description: 'Learn from experts.', difficulty: 'hard', frequency: 'daily', popular: true },
  { id: 'pg2', name: 'Learn Communication Skill', categoryId: 'personal-growth', timeOfDay: 'any', icon: '💬', color: 'bg-blue-500', description: 'Improve your interactions.', difficulty: 'medium', frequency: 'weekly' },
  { id: 'pg3', name: 'Practice Public Speaking', categoryId: 'personal-growth', timeOfDay: 'any', icon: '🎤', color: 'bg-red-500', description: 'Build your confidence.', difficulty: 'hard', frequency: 'weekly' },
  { id: 'pg4', name: 'Write Ideas', categoryId: 'personal-growth', timeOfDay: 'any', icon: '💡', color: 'bg-yellow-500', description: 'Capture your creativity.', difficulty: 'easy', frequency: 'daily' },
  { id: 'pg5', name: 'Build Portfolio', categoryId: 'personal-growth', timeOfDay: 'any', icon: '📂', color: 'bg-indigo-600', description: 'Showcase your work.', difficulty: 'hard', frequency: 'weekly' },
  { id: 'pg6', name: 'Learn New Skill', categoryId: 'personal-growth', timeOfDay: 'any', icon: '🛠️', color: 'bg-emerald-600', description: 'Stay adaptable and skilled.', difficulty: 'hard', frequency: 'weekly' },
  { id: 'pg7', name: 'Network with People', categoryId: 'personal-growth', timeOfDay: 'any', icon: '🤝', color: 'bg-violet-500', description: 'Build valuable connections.', difficulty: 'medium', frequency: 'weekly' },
  { id: 'pg8', name: 'Wake Up Early', categoryId: 'personal-growth', timeOfDay: 'morning', icon: '☀️', color: 'bg-amber-500', description: 'Win the morning, win the day.', difficulty: 'hard', frequency: 'daily', popular: true },
  { id: 'pg9', name: 'Weekly Self Review', categoryId: 'personal-growth', timeOfDay: 'any', icon: '🔍', color: 'bg-slate-600', description: 'Evaluate your performance.', difficulty: 'medium', frequency: 'weekly' },
  { id: 'pg10', name: 'Create Content', categoryId: 'personal-growth', timeOfDay: 'any', icon: '📸', color: 'bg-pink-500', description: 'Share your voice online.', difficulty: 'hard', frequency: 'weekly' },

  // HOME & SOCIAL (91-100)
  { id: 'ho1', name: 'Clean Room', categoryId: 'home', timeOfDay: 'morning', icon: '🧹', color: 'bg-teal-500', description: 'Maintain a clean living space.', difficulty: 'medium', frequency: 'weekly', popular: true },
  { id: 'ho2', name: 'Laundry Routine', categoryId: 'home', timeOfDay: 'any', icon: '🧺', color: 'bg-blue-400', description: 'Stay ahead of your chores.', difficulty: 'medium', frequency: 'weekly' },
  { id: 'so1', name: 'Family Call', categoryId: 'social', timeOfDay: 'any', icon: '📞', color: 'bg-green-500', description: 'Keep in touch with loved ones.', difficulty: 'easy', frequency: 'weekly', popular: true },
  { id: 'so2', name: 'Help Someone', categoryId: 'social', timeOfDay: 'any', icon: '🤲', color: 'bg-rose-400', description: 'Acts of kindness matter.', difficulty: 'easy', frequency: 'daily' },
  { id: 'ho3', name: 'Organize Desk', categoryId: 'home', timeOfDay: 'any', icon: '🖥️', color: 'bg-slate-500', description: 'Clean desk for focused work.', difficulty: 'easy', frequency: 'daily' },
  { id: 'ho4', name: 'Water Plants', categoryId: 'home', timeOfDay: 'morning', icon: '🪴', color: 'bg-green-400', description: 'Keep your green friends alive.', difficulty: 'easy', frequency: 'weekly' },
  { id: 'ho5', name: 'Meal Prep', categoryId: 'home', timeOfDay: 'any', icon: '🍱', color: 'bg-orange-500', description: 'Plan your meals for efficiency.', difficulty: 'hard', frequency: 'weekly' },
  { id: 'ho6', name: 'Limit Screen Time', categoryId: 'home', timeOfDay: 'any', icon: '📵', color: 'bg-amber-600', description: 'Reduce digital consumption.', difficulty: 'medium', frequency: 'daily' },
  { id: 'so3', name: 'Meet a Friend', categoryId: 'social', timeOfDay: 'any', icon: '☕', color: 'bg-blue-600', description: 'Social interaction for health.', difficulty: 'easy', frequency: 'weekly' },
  { id: 'so4', name: 'Donate / Give Back', categoryId: 'social', timeOfDay: 'any', icon: '🎁', color: 'bg-amber-700', description: 'Support a cause you believe in.', difficulty: 'easy', frequency: 'weekly' },
];


export const CATEGORIES = [
  { id: 'health', label: 'Health', icon: '🍎' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'study', label: 'Study', icon: '📖' },
  { id: 'productivity', label: 'Productivity', icon: '⚡' },
  { id: 'mindfulness', label: 'Mindfulness', icon: '🧘' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'personal-growth', label: 'Growth', icon: '🚀' },
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'social', label: 'Social', icon: '🤝' },
];

export const GOAL_RECOMMENDATIONS: Record<string, string[]> = {
  'Healthier Life': ['h1', 'h2', 'h3', 'h4'],
  'Fitness Fast': ['f1', 'f2', 'f3', 'h1'],
  'Deep Study': ['s4', 's1', 's2', 'p3'],
  'Peak Productivity': ['p1', 'p2', 'p3', 'ho2'],
  'Mental Peace': ['m1', 'm2', 'm3', 'so1'],
  'Better Home': ['ho1', 'ho2', 'ho3', 'fi1'],
};
