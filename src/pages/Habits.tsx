import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Check, Search, Calendar, BarChart2, CheckCircle2, Flame, RefreshCcw, Sun, Moon, Sunset, CloudMoon, Timer, Activity, Trash2, LayoutGrid, Sparkles } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { cn } from '../lib/utils';
import { HabitOnboarding } from '../components/habits/HabitOnboarding';
import { HabitLibraryModal } from '../components/habits/HabitLibraryModal';
import { HabitTemplate } from '../lib/habit-library';
import { CustomHabitModal } from '../components/habits/CustomHabitModal';
import confetti from 'canvas-confetti';

import { HabitAnalytics } from '../components/habits/HabitAnalytics';
import { useHabitsStore, Habit } from '../store/habitsStore';

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
  const { habits, loading, subscribe, addHabit, updateHabit, deleteHabit, toggleLog } = useHabitsStore();
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<HabitTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'routine' | 'weekly' | 'progress'>('routine');

  useEffect(() => {
    if (user?.uid) {
      const unsub = subscribe(user.uid);
      return () => unsub();
    }
  }, [user?.uid, subscribe]);

  useEffect(() => {
    // We no longer show onboarding automatically to ensure a clean start.
    // User can trigger it manually from the empty state if they want guidance.
  }, []);

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

  const handleAddFromLibrary = (template: HabitTemplate) => {
    setSelectedTemplate(template);
    setShowLibrary(false);
    setShowCustomModal(true);
  };

  const handleNewHabit = () => {
    setSelectedTemplate(null);
    setShowCustomModal(true);
  };

  const handleCreateCustomHabit = async (habitData: any) => {
    if (!user) return;
    await addHabit({
      userId: user.uid,
      name: habitData.name || 'New Habit',
      categoryId: habitData.category.toLowerCase(),
      timeOfDay: 'any',
      frequency: habitData.frequency.toLowerCase(),
      icon: habitData.icon,
      color: habitData.color,
      trackType: habitData.trackType,
      targetNumber: habitData.targetNumber,
      unit: habitData.unit,
      reminderTime: habitData.reminderTime
    });
    setShowCustomModal(false);
  };

  const handleToggleLog = async (habitId: string, dateStr: string, currentLogs: string[]) => {
    const isAdding = !currentLogs.includes(dateStr);
    if (isAdding) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
      });
    }
    await toggleLog(habitId, dateStr);
  };

  const onDragStart = (e: React.DragEvent, habitId: string) => {
    e.dataTransfer.setData('habitId', habitId);
  };

  const onDrop = async (e: React.DragEvent, timeOfDay: string) => {
    e.preventDefault();
    const habitId = e.dataTransfer.getData('habitId');
    if (!habitId) return;
    const habit = habits.find(h => h.id === habitId);
    if (habit && habit.timeOfDay !== timeOfDay) {
      await updateHabit(habitId, { timeOfDay: timeOfDay as any });
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
  };

  const onDeleteHabit = async (habitId: string) => {
    if (confirm("Are you sure you want to remove this habit?")) {
      await deleteHabit(habitId);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const completedToday = habits.filter(h => h.logs.includes(todayStr)).length;
  const progressPercent = habits.length ? Math.round((completedToday / habits.length) * 100) : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      {showOnboarding && <HabitOnboarding onComplete={handleOnboardingComplete} />}
      <HabitLibraryModal 
        isOpen={showLibrary} 
        onClose={() => setShowLibrary(false)} 
        onAddHabit={handleAddFromLibrary}
        onCreateCustom={() => {
          setShowLibrary(false);
          handleNewHabit();
        }}
      />
      <CustomHabitModal 
        isOpen={showCustomModal} 
        onClose={() => { setShowCustomModal(false); setSelectedTemplate(null); }} 
        onSave={handleCreateCustomHabit} 
        initialData={selectedTemplate}
      />

      {/* Hero Header */}
      <div className="px-4 py-4 md:px-0">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter leading-none mb-1">
          Habit Master
        </h1>
        <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Small steps every day</p>
      </div>

      {/* Sticky Action Toolbar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 -mx-4 px-4 py-2.5 mb-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-3">
          <div className="grid grid-cols-2 lg:flex gap-2 items-center w-full">
            <Button 
              onClick={handleNewHabit} 
              className="h-12 lg:h-11 lg:flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center justify-center font-black text-[11px] uppercase tracking-wider transition-all active:scale-95 gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> 
              <span>Add</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowLibrary(true)} 
              className="h-12 lg:h-11 lg:flex-1 rounded-xl border-gray-100 font-black text-[11px] uppercase tracking-wider bg-white hover:bg-gray-50 flex items-center justify-center text-gray-700 active:scale-95 transition-all gap-2"
            >
              <Search className="w-4 h-4 stroke-[3]" /> 
              <span>Library</span>
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab('routine')}
              className={cn(
                "h-12 lg:h-11 lg:flex-1 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2",
                activeTab === 'routine' ? "bg-gray-100 text-gray-900" : "text-gray-400"
              )}
            >
              <LayoutGrid className="w-4 h-4" /> 
              <span>Habits</span>
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab('progress')}
              className={cn(
                "h-12 lg:h-11 lg:flex-1 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2",
                activeTab === 'progress' ? "bg-gray-100 text-gray-900" : "text-gray-400"
              )}
            >
              <BarChart2 className="w-4 h-4" /> 
              <span>Stats</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Summary Module */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-2 sm:px-0">
        <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Today</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-blue-600 leading-none">{progressPercent}%</h3>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><CheckCircle2 className="w-3.5 h-3.5" /></div>
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Streak</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-orange-500 leading-none">{Math.max(0, ...habits.map(h => calculateStreak(h.logs)))}</h3>
            <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500"><Flame className="w-3.5 h-3.5" /></div>
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col justify-between hidden md:flex">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Active</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-gray-900 leading-none">{habits.length}</h3>
            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"><Calendar className="w-3.5 h-3.5" /></div>
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col justify-between hidden md:flex">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Total Logs</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-gray-900 leading-none">{habits.reduce((acc, h) => acc + h.logs.length, 0)}</h3>
            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"><BarChart2 className="w-3.5 h-3.5" /></div>
          </div>
        </div>
      </div>

      {activeTab === 'routine' && habits.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 mx-2 sm:mx-0">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
             <Sparkles className="w-10 h-10 text-blue-300" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Build Your Routine</h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-8">No habits active yet</p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-6 sm:px-0">
             <Button onClick={() => setShowLibrary(true)} className="flex-1 sm:flex-none h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-xs px-8 shadow-xl shadow-blue-100">
               Browse Library
             </Button>
             <Button onClick={handleNewHabit} variant="outline" className="flex-1 sm:flex-none h-14 rounded-2xl border-2 font-black uppercase tracking-widest text-xs px-8">
               Custom Habit
             </Button>
          </div>
          <button 
            onClick={() => setShowOnboarding(true)}
            className="mt-8 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-3 h-3" /> Need inspiration? Try Guided Setup
          </button>
        </div>
      )}

      {activeTab === 'routine' && habits.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 px-2 sm:px-0">
          {TIME_BLOCKS.map(block => {
            const blockHabits = habits.filter(h => h.timeOfDay === block.id);
            if (block.id === 'any' && blockHabits.length === 0) return null; // hide Anytime if empty
            
            const blockProgress = blockHabits.length > 0 
              ? Math.round((blockHabits.filter(h => h.logs.includes(todayStr)).length / blockHabits.length) * 100)
              : 0;

            return (
              <div 
                key={block.id}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, block.id)}
                className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm shadow-gray-50 flex flex-col"
                style={{ minHeight: '300px' }}
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-4 rounded-2xl shadow-sm", block.bg, block.color)}>
                      <block.icon className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-gray-900">{block.label}</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{blockHabits.length} items</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-blue-600">{blockProgress}%</span>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  {blockHabits.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl border-gray-50 text-gray-300">
                      <p className="text-sm font-bold uppercase tracking-widest">No habits planned</p>
                    </div>
                  ) : (
                    blockHabits.map(habit => {
                      const isDone = habit.logs.includes(todayStr);
                      return (
                        <div 
                          key={habit.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, habit.id)}
                          className={cn(
                            "group flex items-center justify-between p-4 rounded-3xl border transition-all active:scale-95",
                            isDone 
                              ? 'bg-blue-50/30 border-transparent' 
                              : 'bg-white border-gray-100 hover:border-blue-200 shadow-sm'
                          )}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <button 
                              onClick={() => handleToggleLog(habit.id, todayStr, habit.logs)}
                              className={cn(
                                "w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all border-2",
                                isDone 
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                                  : 'bg-white border-gray-200 hover:border-blue-400'
                              )}
                            >
                              {isDone && <Check className="w-5 h-5 stroke-[4]" />}
                            </button>
                            <div className="flex items-center gap-4 overflow-hidden">
                              <span className={cn(
                                "text-2xl w-12 h-12 flex items-center justify-center rounded-2xl shrink-0 transition-grayscale duration-500",
                                !isDone ? habit.color || 'bg-blue-500' : 'bg-gray-100 scale-90 grayscale'
                              )}>{habit.icon}</span>
                              <div className="truncate">
                                <h4 className={cn(
                                  "font-black text-lg truncate",
                                  isDone ? 'line-through text-gray-400' : 'text-gray-900 group-hover:text-blue-600 transition-colors'
                                )}>{habit.name}</h4>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{habit.frequency}</span>
                                  {habit.reminderTime && (
                                    <span className="flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase">
                                      <Timer className="w-3 h-3" /> {habit.reminderTime}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0 ml-2">
                             <div className="bg-gray-50 px-2 py-1 rounded-lg flex items-center gap-1">
                               <Flame className={cn("w-3.5 h-3.5", isDone ? "text-orange-500 fill-orange-500" : "text-gray-300")} />
                               <span className="text-xs font-black text-gray-500">{calculateStreak(habit.logs)}</span>
                             </div>
                             <button onClick={() => deleteHabit(habit.id)} className="p-2 text-gray-200 hover:text-red-500 transition-colors">
                               <Trash2 className="w-4 h-4" />
                             </button>
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
                            <button onClick={() => handleToggleLog(habit.id, dateStr, habit.logs)} className="hover:scale-110 transition-transform">
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

      {activeTab === 'progress' && <HabitAnalytics habits={habits} />}
    </div>
  );
}

const MinusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
);
