import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTasksStore } from '../store/tasksStore';
import { useHabitsStore } from '../store/habitsStore';
import { useMoodStore } from '../store/moodStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle2, Clock, Calendar as CalendarIcon, Flame, Target, Zap, Timer, CheckSquare, Download, Palette, Activity, Smile, Frown, Meh, Star, Sparkles, ChevronRight } from 'lucide-react';
import { format, differenceInDays, isToday, subDays, isSameDay } from 'date-fns';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Countdown } from './Countdowns';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { CompletedTasksModal } from '../components/dashboard/CompletedTasksModal';
import { MoodTrackerModal } from '../components/dashboard/MoodTrackerModal';
import { HabitDetailsModal } from '../components/dashboard/HabitDetailsModal';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';
import { Button } from '../components/ui/button';
import confetti from 'canvas-confetti';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { tasks, subscribe: subscribeTasks, loading: tasksLoading, updateTask } = useTasksStore();
  const { habits, subscribe: subscribeHabits, loading: habitsLoading, toggleLog } = useHabitsStore();
  const { moods, subscribe: subscribeMoods, loading: moodsLoading } = useMoodStore();
  
  const handleToggleHabit = async (habitId: string, logs: string[]) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    await toggleLog(habitId, todayStr);
    if (!logs.includes(todayStr)) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };
  
  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.uid) {
      const unsubTasks = subscribeTasks(user.uid);
      const unsubHabits = subscribeHabits(user.uid);
      const unsubMoods = subscribeMoods(user.uid);
      
      const qCountdowns = query(collection(db, 'countdowns'), where('userId', '==', user.uid));
      const unsubscribeCountdowns = onSnapshot(qCountdowns, (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Countdown));
        setCountdowns(fetched.sort((a, b) => a.targetDate - b.targetDate));
      });

      const qFocus = query(collection(db, 'focus_sessions'), where('userId', '==', user.uid));
      const unsubscribeFocus = onSnapshot(qFocus, (snapshot) => {
        let mins = 0;
        const today = new Date().toDateString();
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (new Date(data.createdAt).toDateString() === today) {
            mins += data.durationMinutes || 0;
          }
        });
        setFocusMinutes(mins);
      });

      // Check onboarding - disabled for clean start per user request
      // if (!localStorage.getItem('onboardingComplete')) {
      //   setShowOnboarding(true);
      // }

      return () => { 
        unsubTasks(); 
        unsubHabits(); 
        unsubMoods(); 
        unsubscribeCountdowns(); 
        unsubscribeFocus(); 
      };
    }
  }, [user?.uid, subscribeTasks, subscribeHabits, subscribeMoods]);

  const taskStats = useMemo(() => ({
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status !== 'completed').length,
    completedToday: tasks.filter(t => t.status === 'completed' && isToday(t.updatedAt || t.createdAt)).length,
    total: tasks.length
  }), [tasks]);

  const completionRate = taskStats.total === 0 ? 0 : Math.round((taskStats.completed / taskStats.total) * 100);

  const habitStats = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const total = habits.length;
    const completed = habits.filter(h => h.logs.includes(todayStr)).length;
    return {
      total,
      completed,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [habits]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayHabits = useMemo(() => habits.filter(h => h.frequency === 'daily' || h.frequency === 'Daily'), [habits]);
  const todayTasks = useMemo(() => tasks.filter(t => t.status !== 'completed' && (t.dueDate ? isSameDay(t.dueDate, new Date()) : true)).slice(0, 5), [tasks]);

  const latestMood = moods[0];

  const weeklyData = useMemo(() => {
    return [6, 5, 4, 3, 2, 1, 0].map(daysBack => {
       const date = subDays(new Date(), daysBack);
       const dateStr = format(date, 'yyyy-MM-dd');
       const label = format(date, 'EEE');
       
       const dailyCompletedTasks = tasks.filter(t => t.status === 'completed' && format(t.updatedAt || t.createdAt, 'yyyy-MM-dd') === dateStr).length;
       // Mock focus for old days since we don't have a full history store yet, but use real for today
       const focusValue = daysBack === 0 ? focusMinutes : 0; 
       
       return { name: label, focus: Math.round(focusValue), tasks: dailyCompletedTasks };
    });
  }, [tasks, focusMinutes]);

  const pieData = useMemo(() => {
    const categories = Array.from(new Set(tasks.map(t => t.listId || 'Inbox')));
    return categories.map(cat => ({
      name: cat,
      value: tasks.filter(t => (t.listId || 'Inbox') === cat).length,
      color: '#' + Math.floor(Math.random()*16777215).toString(16) // Random enough for now
    })).slice(0, 5);
  }, [tasks]);

  const habitHeatmap = useMemo(() => {
     return Array.from({length: 28}).map((_, i) => {
        const date = subDays(new Date(), 27 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        return habits.filter(h => h.logs.includes(dateStr)).length;
     });
  }, [habits]);

  const emptyState = tasks.length === 0 && habits.length === 0;

  return (
    <div className="space-y-5 sm:space-y-8 animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-24 p-3 sm:p-6 lg:p-0">
      <CompletedTasksModal isOpen={showCompletedModal} onClose={() => setShowCompletedModal(false)} />
      <MoodTrackerModal isOpen={showMoodModal} onClose={() => setShowMoodModal(false)} />
      <HabitDetailsModal isOpen={showHabitModal} onClose={() => setShowHabitModal(false)} />
      <OnboardingFlow isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />

      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
             <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all shadow-sm active:scale-95 uppercase tracking-wider">
                <Download className="w-3.5 h-3.5 text-blue-600" /> <span className="hidden sm:inline">Export Report</span><span className="sm:hidden">Export</span>
             </button>
             <button 
               onClick={() => document.documentElement.classList.toggle('dark')}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all shadow-sm active:scale-95 uppercase tracking-wider"
             >
                <Palette className="w-3.5 h-3.5 text-purple-600" /> <span className="hidden sm:inline">Theme</span><span className="sm:hidden">Theme</span>
             </button>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
            Hello, <span className="text-blue-600">{user?.displayName?.split(' ')[0] || user?.email?.split('@')[0]}</span>
          </h1>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-muted-foreground font-bold bg-card border border-border px-2.5 py-1 rounded-lg text-[10px] shadow-sm uppercase tracking-wider">
              {format(new Date(), 'EEEE, MMM do')}
            </span>
            <span className="text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider">
              {taskStats.pending} pending
            </span>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <div onClick={() => navigate('/focus')} className="cursor-pointer group active:scale-95 transition-all bg-card border border-border px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl shadow-sm text-sm flex flex-col min-w-[110px] border-b-2 border-b-blue-600">
            <span className="text-muted-foreground font-bold text-[8px] sm:text-[9px] uppercase tracking-wider mb-1 flex items-center gap-1"><Timer className="w-3 h-3"/> Focus Today</span>
            <span className="font-black text-lg sm:text-xl text-foreground leading-none group-hover:text-blue-600 transition-colors">{Math.floor(focusMinutes/60)}h {focusMinutes%60}m</span>
          </div>
          <div onClick={() => setShowCompletedModal(true)} className="cursor-pointer group active:scale-95 transition-all bg-card border border-border px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl shadow-sm text-sm flex flex-col min-w-[110px] border-b-2 border-b-green-500">
            <span className="text-muted-foreground font-bold text-[8px] sm:text-[9px] uppercase tracking-wider mb-1 flex items-center gap-1"><CheckSquare className="w-3 h-3"/> Tasks Done</span>
            <span className="font-black text-lg sm:text-xl text-foreground leading-none group-hover:text-green-600 transition-colors">{taskStats.completed}/{taskStats.total}</span>
          </div>
        </div>
      </header>

      {emptyState && !tasksLoading && (
        <div className="p-8 sm:p-12 text-center bg-card rounded-2xl sm:rounded-[3rem] border border-dashed border-border shadow-sm">
            <div className="w-20 h-20 rounded-[2rem] bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-600 mx-auto mb-8">
               <Star className="w-10 h-10 fill-blue-600" />
            </div>
            <h2 className="text-3xl font-black text-foreground mb-4 tracking-tight">Your clean slate awaits</h2>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mb-8 italic">No tasks, no habits, just endless possibilities</p>
            <div className="flex justify-center gap-4">
               <button onClick={() => navigate('/tasks')} className="px-8 h-14 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 transition-all hover:scale-105 active:scale-95">Add First Task</button>
               <button onClick={() => navigate('/habits')} className="px-8 h-14 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95">Build Habits</button>
            </div>
            <button 
              onClick={() => setShowOnboarding(true)}
              className="mt-8 text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2 group mx-auto"
            >
              <Sparkles className="w-3 h-3 transition-transform group-hover:rotate-12" /> New here? Take a guided tour
            </button>
        </div>
      )}

      {/* KPI GRID */}
      {!emptyState && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div onClick={() => navigate('/analytics')} className="cursor-pointer bg-card rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-sm border border-border relative overflow-hidden group hover:border-blue-200 hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><Zap className="w-10 h-10 sm:w-12 sm:h-12 text-foreground"/></div>
            <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Efficiency</p>
            <h3 className="text-xl sm:text-3xl font-black text-blue-600 leading-tight">{completionRate}%</h3>
          </div>
          <div onClick={() => setShowCompletedModal(true)} className="cursor-pointer bg-card rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-sm border border-border relative overflow-hidden group hover:border-orange-200 hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><Flame className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500"/></div>
            <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Done Today</p>
            <h3 className="text-xl sm:text-3xl font-black text-orange-500 leading-tight">{taskStats.completedToday}</h3>
          </div>
          <div onClick={() => setShowHabitModal(true)} className="cursor-pointer bg-card rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-sm border border-border relative overflow-hidden group hover:border-green-200 hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><Target className="w-10 h-10 sm:w-12 sm:h-12 text-green-500"/></div>
            <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Habits</p>
            <h3 className="text-xl sm:text-3xl font-black text-green-600 leading-tight">{habitStats.percent}%</h3>
          </div>
          <div onClick={() => navigate('/countdowns')} className="cursor-pointer bg-card rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-sm border border-border relative overflow-hidden group hover:border-purple-200 hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><Clock className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500"/></div>
            <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Deadlines</p>
            <h3 className="text-xl sm:text-3xl font-black text-purple-600 leading-tight">{countdowns.filter(c => c.targetDate > Date.now()).length}</h3>
          </div>
        </div>
      )}

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TODAY'S HABITS */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <div className="bg-card p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border border-border shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center">
                  <Activity className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-foreground tracking-tight">Today Habits</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{todayHabits.filter(h => h.logs.includes(todayStr)).length}/{todayHabits.length} Done</p>
                </div>
              </div>
              <button onClick={() => navigate('/habits')} className="text-muted-foreground hover:text-blue-600 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] no-scrollbar">
              {todayHabits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/30">
                  <p className="text-xs font-bold uppercase tracking-widest">No habits for today</p>
                </div>
              ) : (
                todayHabits.map(habit => {
                  const isDone = habit.logs.includes(todayStr);
                  return (
                    <button 
                      key={habit.id}
                      onClick={() => handleToggleHabit(habit.id, habit.logs)}
                      className={cn(
                        "w-full flex items-center gap-4 p-3 rounded-2xl border transition-all active:scale-95 group",
                        isDone 
                          ? "bg-blue-50/50 dark:bg-blue-900/10 border-transparent" 
                          : "bg-background border-border hover:border-blue-100 shadow-sm"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all",
                        isDone ? "bg-muted grayscale" : habit.color || "bg-blue-500"
                      )}>
                        {habit.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={cn(
                          "text-sm font-bold line-clamp-1",
                          isDone ? "text-muted-foreground line-through" : "text-foreground"
                        )}>{habit.name}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{habit.timeOfDay}</p>
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        isDone ? "bg-blue-600 border-blue-600 text-white" : "border-border group-hover:border-blue-400"
                      )}>
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* TODAY'S TASKS */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <div className="bg-card p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border border-border shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center">
                  <CheckSquare className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-foreground tracking-tight">Today Tasks</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Next priorities</p>
                </div>
              </div>
              <button onClick={() => navigate('/tasks')} className="text-muted-foreground hover:text-blue-600 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] no-scrollbar">
              {todayTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/30">
                  <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">All clear!</p>
                </div>
              ) : (
                todayTasks.map(task => (
                  <div 
                    key={task.id}
                    className="group flex items-center gap-4 p-3 rounded-2xl bg-background border border-border hover:border-blue-100 transition-all shadow-sm"
                  >
                    <button 
                      onClick={() => {
                        updateTask(task.id, { status: 'completed' });
                        confetti({ particleCount: 40, spread: 40, origin: { y: 0.7 } });
                      }}
                      className="w-6 h-6 rounded-full border-2 border-border hover:border-blue-500 transition-colors flex items-center justify-center group/check"
                    >
                      <CheckCircle2 className="w-4 h-4 text-transparent group-hover/check:text-blue-100 transition-colors" />
                    </button>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{task.title}</p>
                      <div className="flex items-center gap-2">
                         {task.priority !== 'none' && (
                           <span className={cn(
                             "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md",
                             task.priority === 'urgent' ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"
                           )}>{task.priority}</span>
                         )}
                         <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate">{task.category || 'Personal'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <Button 
              variant="ghost" 
              onClick={() => navigate('/tasks')}
              className="mt-6 w-full h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10"
            >
              Manage Tasks
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN - Stats & Growth */}
        <div className="space-y-4 sm:space-y-6">
          {/* QUICK FOCUS */}
          <div className="bg-foreground p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] text-background shadow-xl shadow-muted group cursor-pointer overflow-hidden relative" onClick={() => navigate('/focus')}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -mr-10 -mt-10 blur-3xl group-hover:bg-blue-500/30 transition-all" />
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2 sm:mb-3">Deep Work</p>
            <h3 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 leading-tight">Ready for a focus session?</h3>
            <button className="h-11 sm:h-12 px-6 sm:px-8 bg-blue-600 hover:bg-blue-500 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-900/50">
              Start Timer <Timer className="w-4 h-4" />
            </button>
          </div>

          {/* KPI Mini Stats */}
          <div className="bg-card p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border border-border shadow-sm">
             <h3 className="font-bold text-lg sm:text-xl text-foreground mb-4 sm:mb-6 px-1">Performance</h3>
             <div className="space-y-4">
                <div className="bg-muted p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Focus Today</p>
                    <p className="text-lg font-black text-foreground">{Math.floor(focusMinutes/60)}h {focusMinutes%60}m</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-blue-600 shadow-sm">
                    <Timer className="w-5 h-5" />
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Success Rate</p>
                    <p className="text-lg font-black text-foreground">{completionRate}%</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-green-600 shadow-sm">
                    <Zap className="w-5 h-5" />
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
