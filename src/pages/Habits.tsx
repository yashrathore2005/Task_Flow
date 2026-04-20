import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Check, Search, Calendar, BarChart2, CheckCircle2, Flame, RefreshCcw, Sun, Moon, Sunset, CloudMoon } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { HabitOnboarding } from '../components/habits/HabitOnboarding';
import { HabitLibraryModal } from '../components/habits/HabitLibraryModal';
import { HabitTemplate } from '../lib/habit-library';
import { CustomHabitModal } from '../components/habits/CustomHabitModal';
import confetti from 'canvas-confetti';

export interface Habit {
  id: string;
  userId: string;
  name: string;
  categoryId: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'any';
  frequency: string;
  icon: string;
  color: string;
  createdAt: number;
  logs: string[];
  trackType?: string;
  targetNumber?: number;
  unit?: string;
  reminderTime?: string;
}

const calculateStreak = (logs: string[]) => {
  if (!logs || logs.length === 0) return 0;
  const sorted = [...logs].sort().reverse();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  
  if (!sorted.includes(todayStr) && !sorted.includes(yesterdayStr)) return 0;
  
  let streak = 0;
  let checkDate = sorted.includes(todayStr) ? new Date() : subDays(new Date(), 1);
  
  while(true) {
    const dStr = format(checkDate, 'yyyy-MM-dd');
    if (sorted.includes(dStr)) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }
  return streak;
};

const TIME_BLOCKS = [
  { id: 'morning', label: 'Morning Routine', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'afternoon', label: 'Afternoon Routine', icon: RefreshCcw, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'evening', label: 'Evening Routine', icon: Sunset, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'night', label: 'Night Routine', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { id: 'any', label: 'Anytime', icon: CloudMoon, color: 'text-slate-500', bg: 'bg-slate-500/10' }
] as const;

export default function Habits() {
  const { user } = useAuthStore();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'routine' | 'weekly' | 'progress'>('routine');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'habits'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Habit));
      setHabits(fetched);
      setLoading(false);
      
      // If user has no habits, assume new and show onboarding
      if (fetched.length === 0 && !localStorage.getItem('habitOnboardingDone')) {
        setShowOnboarding(true);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleOnboardingComplete = async (selectedTemplates: HabitTemplate[]) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      selectedTemplates.forEach(template => {
        const hRef = doc(collection(db, 'habits'));
        batch.set(hRef, {
          userId: user.uid,
          name: template.name,
          categoryId: template.categoryId,
          timeOfDay: template.timeOfDay,
          frequency: template.frequency,
          icon: template.icon,
          color: template.color || 'bg-primary',
          createdAt: Date.now(),
          logs: []
        });
      });
      await batch.commit();
      localStorage.setItem('habitOnboardingDone', 'true');
      setShowOnboarding(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddFromLibrary = async (template: HabitTemplate) => {
    if (!user) return;
    await addDoc(collection(db, 'habits'), {
      userId: user.uid,
      name: template.name,
      categoryId: template.categoryId || 'health',
      timeOfDay: template.timeOfDay,
      frequency: template.frequency,
      icon: template.icon,
      color: template.color || 'bg-blue-500',
      createdAt: Date.now(),
      logs: []
    });
    setShowLibrary(false);
  };

  const handleCreateCustomHabit = async (habitData: any) => {
    if (!user) return;
    await addDoc(collection(db, 'habits'), {
      userId: user.uid,
      name: habitData.name || 'New Habit',
      categoryId: habitData.category.toLowerCase(),
      timeOfDay: 'any',
      frequency: habitData.frequency.toLowerCase(),
      icon: habitData.icon,
      color: habitData.color,
      createdAt: Date.now(),
      logs: [],
      trackType: habitData.trackType,
      targetNumber: habitData.targetNumber,
      unit: habitData.unit,
      reminderTime: habitData.reminderTime
    });
    setShowCustomModal(false);
  };

  const toggleLog = async (habitId: string, dateStr: string, currentLogs: string[]) => {
    const isAdding = !currentLogs.includes(dateStr);
    const newLogs = isAdding 
      ? [...currentLogs, dateStr]
      : currentLogs.filter(d => d !== dateStr);
      
    if (isAdding) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
      });
    }
    
    await updateDoc(doc(db, 'habits', habitId), { logs: newLogs });
  };

  const handleDragStart = (e: React.DragEvent, habitId: string) => {
    e.dataTransfer.setData('habitId', habitId);
  };

  const handleDrop = async (e: React.DragEvent, timeOfDay: string) => {
    e.preventDefault();
    const habitId = e.dataTransfer.getData('habitId');
    if (!habitId) return;
    const habit = habits.find(h => h.id === habitId);
    if (habit && habit.timeOfDay !== timeOfDay) {
      await updateDoc(doc(db, 'habits', habitId), { timeOfDay });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // allow drop
  };

  const deleteHabit = async (habitId: string) => {
    if (confirm("Are you sure you want to remove this habit?")) {
      await deleteDoc(doc(db, 'habits', habitId));
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const completedToday = habits.filter(h => h.logs.includes(todayStr)).length;
  const progressPercent = habits.length ? Math.round((completedToday / habits.length) * 100) : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {showOnboarding && <HabitOnboarding onComplete={handleOnboardingComplete} />}
      <HabitLibraryModal isOpen={showLibrary} onClose={() => setShowLibrary(false)} onAddHabit={handleAddFromLibrary} />
      <CustomHabitModal isOpen={showCustomModal} onClose={() => setShowCustomModal(false)} onSave={handleCreateCustomHabit} />

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Habit Tracker</h1>
          <p className="text-muted-foreground mt-1">Focused, intentional, and ready.</p>
        </div>
        
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex gap-2 bg-muted p-1 rounded-xl">
            <Button variant={activeTab === 'routine' ? 'default' : 'ghost'} onClick={() => setActiveTab('routine')} size="sm"><CheckCircle2 className="w-4 h-4 mr-2"/> Routine</Button>
            <Button variant={activeTab === 'weekly' ? 'default' : 'ghost'} onClick={() => setActiveTab('weekly')} size="sm"><Calendar className="w-4 h-4 mr-2"/> Weekly</Button>
            <Button variant={activeTab === 'progress' ? 'default' : 'ghost'} onClick={() => setActiveTab('progress')} size="sm"><BarChart2 className="w-4 h-4 mr-2"/> Progress</Button>
          </div>
          <Button variant="outline" onClick={() => setShowLibrary(true)}>
            Browse Library
          </Button>
          <Button onClick={() => setShowCustomModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Habit
          </Button>
        </div>
      </header>

      {/* Stats Summary Module */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-card/40 border-border group">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Progress</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black">{progressPercent}%</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-muted relative flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="30" cy="30" r="28" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="175" strokeDashoffset={175 - (175 * progressPercent) / 100} className="text-primary transition-all duration-1000" />
              </svg>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-card/40 border-border">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-3xl font-black mt-1">{completedToday} / {habits.length}</p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-card/40 border-border">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Longest Streak</p>
              <p className="text-3xl font-black mt-1">
                {Math.max(0, ...habits.map(h => calculateStreak(h.logs)))} <span className="text-lg text-muted-foreground font-medium">days</span>
              </p>
            </div>
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
              <Flame className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-card/40 border-border">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Logs</p>
              <p className="text-3xl font-black mt-1">{habits.reduce((acc, h) => acc + h.logs.length, 0)}</p>
            </div>
            <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
              <BarChart2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {activeTab === 'routine' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {TIME_BLOCKS.map(block => {
            const blockHabits = habits.filter(h => h.timeOfDay === block.id);
            if (block.id === 'any' && blockHabits.length === 0) return null; // hide Anytime if empty
            
            const blockProgress = blockHabits.length > 0 
              ? Math.round((blockHabits.filter(h => h.logs.includes(todayStr)).length / blockHabits.length) * 100)
              : 0;

            return (
              <div 
                key={block.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, block.id)}
                className="bg-card/50 border border-border rounded-2xl p-6 transition-colors"
                style={{ minHeight: '200px' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${block.bg} ${block.color}`}>
                      <block.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{block.label}</h3>
                      <p className="text-xs text-muted-foreground">{blockHabits.length} habits</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold">{blockProgress}%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {blockHabits.length === 0 ? (
                    <div className="text-center p-8 border-2 border-dashed rounded-xl border-border/50 text-muted-foreground text-sm">
                      Drag habits here
                    </div>
                  ) : (
                    blockHabits.map(habit => {
                      const isDone = habit.logs.includes(todayStr);
                      return (
                        <div 
                          key={habit.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, habit.id)}
                          className={`group flex items-center justify-between p-4 rounded-xl border cursor-grab active:cursor-grabbing transition-all ${isDone ? 'bg-muted/50 border-transparent opacity-60' : 'bg-card border-border hover:border-primary/50 shadow-sm'}`}
                        >
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => toggleLog(habit.id, todayStr, habit.logs)}
                              className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center transition-colors border-2 ${isDone ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30 hover:border-primary'}`}
                            >
                              {isDone && <Check className="w-4 h-4" />}
                            </button>
                            <div className="flex items-center gap-3">
                              <span className={`text-xl w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-white ${habit.color || 'bg-blue-500'} shadow-sm`}>{habit.icon}</span>
                              <div>
                                <h4 className={`font-medium ${isDone ? 'line-through text-muted-foreground' : ''}`}>{habit.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{habit.frequency}</span>
                                  {habit.reminderTime && (
                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">
                                      {habit.reminderTime}
                                    </span>
                                  )}
                                  {habit.trackType && habit.trackType !== 'Yes/No Complete' && (
                                    <span className="text-[10px] text-gray-500 font-medium">Goal: {habit.targetNumber} {habit.unit}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="hidden sm:flex flex-col items-end mr-2">
                              {calculateStreak(habit.logs) > 0 ? (
                                <>
                                  <span className="text-xs font-bold text-orange-500 flex items-center gap-1"><Flame className="w-3 h-3 fill-orange-500"/> {calculateStreak(habit.logs)} Day</span>
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Streak</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-xs font-bold text-blue-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {habit.logs.length}</span>
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Days</span>
                                </>
                              )}
                            </div>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteHabit(habit.id)}>
                              <MinusIcon />
                            </Button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'weekly' && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
          <CardHeader>
            <CardTitle>March Tracker</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/30">
                <tr>
                  <th className="px-6 py-4 font-medium w-[250px] sticky left-0 z-10 bg-card">Daily Habit</th>
                  {Array.from({ length: 7 }).map((_, i) => {
                    const d = subDays(new Date(), 6 - i);
                    return <th key={i} className="px-2 py-4 font-medium text-center">{format(d, 'EE dd')}</th>;
                  })}
                  <th className="px-6 py-4 font-medium text-right">Progress</th>
                </tr>
              </thead>
              <tbody>
                {habits.map((habit, idx) => {
                  const weekLogs = Array.from({ length: 7 }).map((_, i) => {
                    const d = subDays(new Date(), 6 - i);
                    return habit.logs.includes(format(d, 'yyyy-MM-dd'));
                  });
                  const weekTotal = weekLogs.filter(Boolean).length;
                  const weekProgress = Math.round((weekTotal / 7) * 100);

                  return (
                    <tr key={habit.id} className="border-b border-border/50 hover:bg-muted/10">
                      <td className="px-6 py-4 font-medium sticky left-0 z-10 bg-card flex items-center gap-3">
                        <span className="text-muted-foreground w-4 text-right text-xs">{idx + 1}</span>
                        {habit.icon} {habit.name}
                      </td>
                      {Array.from({ length: 7 }).map((_, i) => {
                        const d = subDays(new Date(), 6 - i);
                        const dateStr = format(d, 'yyyy-MM-dd');
                        const isDone = habit.logs.includes(dateStr);
                        return (
                          <td key={i} className="px-2 py-4 text-center">
                            <button onClick={() => toggleLog(habit.id, dateStr, habit.logs)} className="hover:scale-110 transition-transform">
                              <div className={`w-5 h-5 rounded flex items-center justify-center mx-auto border ${isDone ? `bg-primary border-primary text-primary-foreground` : 'border-border bg-card'}`}>
                                {isDone && <Check className="w-3 h-3" />}
                              </div>
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${weekProgress}%` }} />
                          </div>
                          <span className="text-xs font-semibold w-8">{weekProgress}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'progress' && (
        <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground">More charts coming soon...</p>
        </div>
      )}
    </div>
  );
}

const MinusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
);
