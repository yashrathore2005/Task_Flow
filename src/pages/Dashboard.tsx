import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTasksStore } from '../store/tasksStore';
import { useHabitsStore } from '../store/habitsStore';
import { useMoodStore } from '../store/moodStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle2, Clock, Calendar as CalendarIcon, Flame, Target, Zap, Timer, CheckSquare, Download, Palette, Activity, Smile, Frown, Meh, Star } from 'lucide-react';
import { format, differenceInDays, isToday, subDays } from 'date-fns';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Countdown } from './Countdowns';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { CompletedTasksModal } from '../components/dashboard/CompletedTasksModal';
import { MoodTrackerModal } from '../components/dashboard/MoodTrackerModal';
import { HabitDetailsModal } from '../components/dashboard/HabitDetailsModal';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { tasks, subscribe: subscribeTasks, loading: tasksLoading } = useTasksStore();
  const { habits, subscribe: subscribeHabits, loading: habitsLoading } = useHabitsStore();
  const { moods, subscribe: subscribeMoods, loading: moodsLoading } = useMoodStore();
  
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

      // Check onboarding
      if (!localStorage.getItem('onboardingComplete')) {
        setShowOnboarding(true);
      }

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

  const latestMood = moods[0];

  const weeklyData = useMemo(() => {
    return [6, 5, 4, 3, 2, 1, 0].map(daysBack => {
       const date = subDays(new Date(), daysBack);
       const dateStr = format(date, 'yyyy-MM-dd');
       const label = format(date, 'EEE');
       
       const dailyCompletedTasks = tasks.filter(t => t.status === 'completed' && format(t.updatedAt || t.createdAt, 'yyyy-MM-dd') === dateStr).length;
       // Mock focus for old days since we don't have a full history store yet, but use real for today
       const focusValue = daysBack === 0 ? focusMinutes : (Math.random() * 60 + 20); 
       
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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-20 p-4 sm:p-0">
      <CompletedTasksModal isOpen={showCompletedModal} onClose={() => setShowCompletedModal(false)} />
      <MoodTrackerModal isOpen={showMoodModal} onClose={() => setShowMoodModal(false)} />
      <HabitDetailsModal isOpen={showHabitModal} onClose={() => setShowHabitModal(false)} />
      <OnboardingFlow isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />

      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-100 text-xs font-bold text-gray-500 hover:text-gray-900 transition-all shadow-sm active:scale-95">
                <Download className="w-4 h-4 text-blue-600" /> <span className="hidden sm:inline">Export Report</span><span className="sm:hidden">Export</span>
             </button>
             <button 
               onClick={() => document.documentElement.classList.toggle('dark')}
               className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-100 text-xs font-bold text-gray-500 hover:text-gray-900 transition-all shadow-sm active:scale-95"
             >
                <Palette className="w-4 h-4 text-purple-600" /> <span className="hidden sm:inline">Change Theme</span><span className="sm:hidden">Theme</span>
             </button>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-gray-900 leading-tight dark:text-white">
            Hello, <span className="text-blue-600">{user?.displayName?.split(' ')[0] || user?.email?.split('@')[0]}</span>
          </h1>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-gray-500 font-bold bg-white border border-gray-100 px-3 py-1.5 rounded-xl text-xs shadow-sm">
              {format(new Date(), 'EEEE, MMMM do')}
            </span>
            <span className="text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-xl text-xs">
              {taskStats.pending} tasks pending
            </span>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          <div onClick={() => navigate('/focus')} className="cursor-pointer group active:scale-95 transition-all bg-white border border-gray-100 px-5 py-4 rounded-3xl shadow-sm text-sm flex flex-col min-w-[140px] border-b-4 border-b-blue-600">
            <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1"><Timer className="w-3.5 h-3.5"/> Focus Today</span>
            <span className="font-black text-2xl text-gray-900 leading-none group-hover:text-blue-600 transition-colors">{Math.floor(focusMinutes/60)}h {focusMinutes%60}m</span>
          </div>
          <div onClick={() => setShowCompletedModal(true)} className="cursor-pointer group active:scale-95 transition-all bg-white border border-gray-100 px-5 py-4 rounded-3xl shadow-sm text-sm flex flex-col min-w-[140px] border-b-4 border-b-green-500">
            <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1"><CheckSquare className="w-3.5 h-3.5"/> Tasks Done</span>
            <span className="font-black text-2xl text-gray-900 leading-none group-hover:text-green-600 transition-colors">{taskStats.completed}/{taskStats.total}</span>
          </div>
        </div>
      </header>

      {emptyState && !tasksLoading && (
        <div className="p-12 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
            <div className="w-20 h-20 rounded-[2rem] bg-blue-50 flex items-center justify-center text-blue-600 mx-auto mb-8">
               <Star className="w-10 h-10 fill-blue-600" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Your clean slate awaits</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-8 italic">No tasks, no habits, just endless possibilities</p>
            <div className="flex justify-center gap-4">
               <button onClick={() => navigate('/tasks')} className="px-8 h-14 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100">Add First Task</button>
               <button onClick={() => navigate('/habits')} className="px-8 h-14 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs">Build Habits</button>
            </div>
        </div>
      )}

      {/* KPI GRID */}
      {!emptyState && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div onClick={() => navigate('/analytics')} className="cursor-pointer bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:border-blue-200 hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Zap className="w-16 h-16"/></div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Efficiency</p>
            <h3 className="text-4xl font-black text-blue-600">{completionRate}%</h3>
            <p className="text-xs text-gray-400 mt-2 font-medium">Task completion rate</p>
          </div>
          <div onClick={() => setShowCompletedModal(true)} className="cursor-pointer bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:border-orange-200 hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Flame className="w-16 h-16 text-orange-500"/></div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Today Done</p>
            <h3 className="text-4xl font-black text-orange-500">{taskStats.completedToday}</h3>
            <p className="text-xs text-gray-400 mt-2 font-medium">Archived today</p>
          </div>
          <div onClick={() => setShowHabitModal(true)} className="cursor-pointer bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:border-green-200 hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Target className="w-16 h-16 text-green-500"/></div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Habits</p>
            <h3 className="text-4xl font-black text-green-600">{habitStats.percent}%</h3>
            <p className="text-xs text-gray-400 mt-2 font-medium">Daily habit progress</p>
          </div>
          <div onClick={() => navigate('/countdowns')} className="cursor-pointer bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:border-purple-200 hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Clock className="w-16 h-16 text-purple-500"/></div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Deadlines</p>
            <h3 className="text-4xl font-black text-purple-600">{countdowns.filter(c => c.targetDate > Date.now()).length}</h3>
            <p className="text-xs text-gray-400 mt-2 font-medium">Active upcoming events</p>
          </div>
        </div>
      )}

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (Wider) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weekly Focus Area Chart */}
            <div onClick={() => navigate('/analytics')} className="cursor-pointer bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h3 className="font-bold text-xl text-gray-900">Focus Hours</h3>
                  <p className="text-sm text-gray-500 mt-1 font-medium">Focus minutes by day</p>
                </div>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} width={40} />
                    <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
                    <Area type="monotone" dataKey="focus" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorFocus)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Tasks Bar Chart */}
            <div onClick={() => navigate('/analytics')} className="cursor-pointer bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition-all">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h3 className="font-bold text-xl text-gray-900">Task Completion</h3>
                  <p className="text-sm text-gray-500 mt-1 font-medium">Tasks completed by day</p>
                </div>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} width={30} />
                    <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{fill: '#f3f4f6'}} />
                    <Bar dataKey="tasks" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div onClick={() => navigate('/analytics')} className="cursor-pointer bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center hover:border-yellow-200 hover:shadow-md transition-all">
              <h3 className="font-bold text-xl text-gray-900 mb-2">Category Breakdown</h3>
              <div className="h-[180px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                  <span className="text-3xl font-black text-gray-900">{taskStats.total}</span>
                  <span className="text-xs text-gray-500 font-medium">Tasks</span>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                     <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                     {d.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Habit Consistency Heatmap */}
            <div onClick={() => navigate('/analytics')} className="cursor-pointer bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col hover:border-blue-200 hover:shadow-md transition-all">
              <div className="mb-4">
                <h3 className="font-bold text-xl text-gray-900">Habit Consistency</h3>
                <p className="text-sm text-gray-500 mt-1 font-medium">Activity over the last 28 days</p>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-7 gap-2">
                  {habitHeatmap.map((val, i) => (
                    <div 
                      key={i} 
                      className={`aspect-square rounded-md ${val === 0 ? 'bg-gray-100' : val === 1 ? 'bg-blue-200' : val === 2 ? 'bg-blue-400' : val === 3 ? 'bg-blue-600' : 'bg-blue-800'}`}
                      title={`${val} habits completed`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 mt-2">
                  <span>Less</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm bg-gray-100"></div>
                    <div className="w-3 h-3 rounded-sm bg-blue-200"></div>
                    <div className="w-3 h-3 rounded-sm bg-blue-400"></div>
                    <div className="w-3 h-3 rounded-sm bg-blue-600"></div>
                    <div className="w-3 h-3 rounded-sm bg-blue-800"></div>
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Next Reminder Alert */}
          <div className="bg-orange-50 border border-orange-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                <Clock className="w-5 h-5"/>
              </div>
              <div>
                <p className="font-bold text-orange-900 leading-tight">Read 10 Pages</p>
                <p className="text-xs text-orange-600 font-semibold mt-0.5">Upcoming in 45 mins</p>
              </div>
            </div>
            <button className="text-orange-500 bg-white border border-orange-200 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-orange-500 hover:text-white transition-colors">Complete</button>
          </div>

          {/* Calendar Mini Preview */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-xl text-gray-900">{format(new Date(), 'MMMM')}</h3>
               <button className="text-blue-600 rounded-full bg-blue-50 w-8 h-8 flex items-center justify-center hover:bg-blue-100 transition-colors">
                 <CalendarIcon className="w-4 h-4"/>
               </button>
             </div>
             {/* Simple Calendar grid stub */}
             <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-gray-400">
               {['S','M','T','W','T','F','S'].map((d,i) => <div key={i}>{d}</div>)}
             </div>
             <div className="grid grid-cols-7 gap-y-3 font-semibold text-sm text-center">
               {Array.from({length: 31}).map((_, i) => {
                 const day = i + 1;
                 const isToday = day === new Date().getDate();
                 return (
                   <div key={i} className="flex justify-center">
                     <span className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${isToday ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}>
                       {day}
                     </span>
                   </div>
                 )
               })}
             </div>
          </div>

          {/* Analytics Summary */}
          {tasks.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
               <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2">Analytics Summary <Activity className="w-5 h-5 text-gray-400"/></h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <span className="text-gray-500 font-medium text-sm">Best Productive Day</span>
                    <span className="font-bold text-gray-900">
                      {weeklyData.reduce((prev, current) => (prev.tasks > current.tasks) ? prev : current).name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <span className="text-gray-500 font-medium text-sm">Tasks Done (7d)</span>
                    <span className="font-bold text-gray-900">{weeklyData.reduce((acc, d) => acc + d.tasks, 0)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-gray-500 font-medium text-sm">Completion Rate</span>
                    <span className={cn("font-bold", completionRate > 70 ? "text-green-600" : "text-orange-500")}>
                      {completionRate}%
                    </span>
                  </div>
               </div>
            </div>
          )}

          {/* Mood/Productivity Check-in */}
          <div 
            onClick={() => setShowMoodModal(true)}
            className="cursor-pointer group active:scale-95 transition-all bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:border-blue-200"
          >
            <h3 className="font-bold text-gray-900 mb-2">How are you feeling?</h3>
            {latestMood ? (
              <div className="flex flex-col items-center gap-2">
                 <span className="text-5xl group-hover:scale-110 transition-transform">{latestMood.mood === 'great' ? '🤩' : latestMood.mood === 'good' ? '🙂' : latestMood.mood === 'tired' ? '😫' : latestMood.mood === 'stressed' ? '😕' : latestMood.mood === 'sad' ? '😭' : '😐'}</span>
                 <p className="text-xs font-black uppercase tracking-widest text-blue-600 mt-2">Latest: {latestMood.mood}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">Log your daily mood & energy</p>
                <div className="flex gap-3 mt-2">
                  {['😭', '😕', '😐', '🙂', '🤩'].map((emoji, i) => (
                    <button key={i} className="text-3xl hover:scale-125 transition-transform origin-center grayscale hover:grayscale-0">
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Today Habit Goals */}
          <div 
            onClick={() => setShowHabitModal(true)}
            className="cursor-pointer group active:scale-95 transition-all bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col hover:border-blue-200"
          >
            <h3 className="font-bold text-xl text-gray-900 mb-4">Today Habit Goals</h3>
            <div className="space-y-4">
              {habits.length === 0 ? (
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest text-center py-4">No habits yet</p>
              ) : habits.slice(0, 3).map(habit => {
                const todayStr = format(new Date(), 'yyyy-MM-dd');
                const isDone = habit.logs.includes(todayStr);
                return (
                  <div key={habit.id}>
                    <div className="flex justify-between items-center mb-1 text-sm font-bold">
                       <span className={cn("text-gray-700 flex items-center gap-2", isDone && "text-gray-400")}>
                          <span className="text-lg">{habit.icon}</span> {habit.name}
                       </span>
                       <span className={cn("text-xs font-black", isDone ? "text-green-500" : "text-blue-500")}>
                          {isDone ? 'Done' : 'Pending'}
                       </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-500", isDone ? "bg-green-500" : "bg-blue-500")} 
                        style={{width: isDone ? '100%' : '30%'}}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Focus */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-xl text-gray-900 mb-4">Today's Focus</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 no-scrollbar">
               {tasksLoading ? <p className="text-gray-400 text-sm">Loading...</p> : tasks.filter(t => {
                 if (t.status === 'completed') return false;
                 if (!t.dueDate) return true;
                 return new Date(t.dueDate).toDateString() === new Date().toDateString();
               }).slice(0, 5).map(task => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-colors group">
                  <div className={`w-3 h-3 mt-1.5 rounded-full shrink-0 ${task.priority === 'urgent' ? 'bg-red-500' : task.priority === 'high' ? 'bg-orange-500' : 'bg-gray-300'}`} />
                  <div className="flex-1 truncate">
                    <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{task.title}</p>
                    <p className="text-xs text-gray-500 font-medium tracking-wide mt-0.5 capitalize">{task.listId || 'Inbox'}</p>
                  </div>
                </div>
              ))}
              {!tasksLoading && taskStats.pending === 0 && (
                <div className="flex flex-col items-center justify-center text-gray-400 py-10">
                  <CheckCircle2 className="w-12 h-12 mb-3 opacity-20 text-blue-600" />
                  <p className="text-sm font-bold">All caught up!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
