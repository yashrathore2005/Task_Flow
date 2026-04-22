import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTasksStore } from '../store/tasksStore';
import { useHabitsStore } from '../store/habitsStore';
import { useMoodStore } from '../store/moodStore';
import { 
  Zap, Flame, Target, Timer, TrendingUp, TrendingDown, 
  ChevronDown, Download, BarChart2, CheckCircle2, 
  Clock, Calendar as CalendarIcon, Activity, Sparkles,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, CartesianGrid 
} from 'recharts';
import { format, subDays, isToday, isSameDay, startOfWeek, endOfWeek, subWeeks, isWithinInterval, startOfMonth, subMonths } from 'date-fns';
import { HabitAnalytics } from '../components/habits/HabitAnalytics';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { cn } from '../lib/utils';

export default function Analytics() {
  const { user } = useAuthStore();
  const { tasks, subscribe: subscribeTasks } = useTasksStore();
  const { habits, subscribe: subscribeHabits } = useHabitsStore();
  const { moods, subscribe: subscribeMoods } = useMoodStore();
  
  const [focusSessions, setFocusSessions] = useState<any[]>([]);
  const [filter, setFilter] = useState('This Week');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user?.uid) {
      const unsubTasks = subscribeTasks(user.uid);
      const unsubHabits = subscribeHabits(user.uid);
      const unsubMoods = subscribeMoods(user.uid);
      
      const qFocus = query(collection(db, 'focus_sessions'), where('userId', '==', user.uid));
      const unsubFocus = onSnapshot(qFocus, (snapshot) => {
        setFocusSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => {
        unsubTasks();
        unsubHabits();
        unsubMoods();
        unsubFocus();
      };
    }
  }, [user?.uid]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'efficiency', label: 'Efficiency & Tasks' },
    { id: 'focus', label: 'Focus & Time' },
    { id: 'habits', label: 'Habits & Streaks' },
  ];

  // AGGREGATION LOGIC
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const efficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    // Habts Streaks
    const streaks = habits.map(h => {
        if (!h.logs || h.logs.length === 0) return 0;
        const sorted = [...h.logs].sort().reverse();
        let s = 0;
        let d = sorted.includes(todayStr) ? today : subDays(today, 1);
        while(sorted.includes(format(d, 'yyyy-MM-dd'))) {
            s++;
            d = subDays(d, 1);
        }
        return s;
    });
    const currentStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
    const maxStreak = streaks.length > 0 ? Math.max(...streaks) : 0; 

    const todayFocusMins = focusSessions
      .filter(s => isToday(new Date(s.createdAt)))
      .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    
    const totalFocusMins = focusSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

    return {
      efficiency,
      currentStreak,
      maxStreak,
      totalFocusMins,
      todayFocusMins,
      score: Math.round((efficiency * 0.6) + (Math.min(currentStreak * 10, 40)))
    };
  }, [tasks, habits, focusSessions]);

  const weeklyTrendData = useMemo(() => {
    return [6, 5, 4, 3, 2, 1, 0].map(daysBack => {
      const date = subDays(new Date(), daysBack);
      const dateStr = format(date, 'yyyy-MM-dd');
      const label = format(date, 'EEE');
      
      const dayTasks = tasks.filter(t => t.status === 'completed' && format(t.updatedAt || t.createdAt, 'yyyy-MM-dd') === dateStr).length;
      const dayFocus = focusSessions
        .filter(s => isSameDay(new Date(s.createdAt), date))
        .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

      return { name: label, focus: dayFocus, tasks: dayTasks };
    });
  }, [tasks, focusSessions]);

  const taskCategoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      const cat = t.category || 'Personal';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const colors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];
    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length]
    })).sort((a,b) => b.value - a.value);
  }, [tasks]);

  return (
    <div className="w-full max-w-6xl mx-auto min-h-screen pb-24 animate-in fade-in duration-500 flex flex-col pt-4 p-3 sm:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 sm:mb-8 gap-3 sm:gap-4 border-b border-gray-200 pb-4 sm:pb-6">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">Analytics Center</h1>
          <p className="text-[10px] sm:text-sm text-gray-500 font-medium mt-1 sm:mt-2 uppercase tracking-widest">Deep insights into your productivity</p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <select 
               className="appearance-none w-full bg-white border border-gray-200 rounded-xl pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 text-[10px] sm:text-sm font-bold text-gray-700 outline-none hover:border-gray-300 transition-colors cursor-pointer"
               value={filter}
               onChange={e => setFilter(e.target.value)}
            >
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-2.5 sm:top-3 pointer-events-none" />
          </div>
          <button className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gray-900 text-white text-[10px] sm:text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-colors flex-1 md:flex-none">
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> Export
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-1.5 sm:gap-2 pb-4 mb-4 scrollbar-hide no-scrollbar">
         {tabs.map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={cn(
               "px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full text-[10px] sm:text-sm font-black uppercase tracking-widest whitespace-nowrap transition-colors",
               activeTab === tab.id ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
             )}
           >
             {tab.label}
           </button>
         ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center text-gray-900">
               <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mb-2 sm:mb-3" />
               <p className="text-[8px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Efficiency</p>
               <h3 className="text-xl sm:text-3xl font-black text-foreground mt-0.5 sm:mt-1">{stats.efficiency}%</h3>
               <p className="text-[8px] sm:text-xs font-medium text-green-500 flex items-center mt-2 bg-green-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full"><TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1"/> Real-time</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center text-gray-900">
               <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mb-2 sm:mb-3" />
               <p className="text-[8px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Current Streak</p>
               <h3 className="text-xl sm:text-3xl font-black text-foreground mt-0.5 sm:mt-1">{stats.currentStreak} Days</h3>
               <p className="text-[8px] sm:text-xs font-medium text-gray-500 mt-2">Best: {stats.maxStreak}d</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center text-gray-900">
               <Target className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mb-2 sm:mb-3" />
               <p className="text-[8px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">TF Score</p>
               <h3 className="text-xl sm:text-3xl font-black text-foreground mt-0.5 sm:mt-1">{stats.score}</h3>
               <p className="text-[8px] sm:text-xs font-medium text-green-500 flex items-center mt-2 bg-green-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full"><Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1"/> Growth</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center text-gray-900">
               <Timer className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 mb-2 sm:mb-3" />
               <p className="text-[8px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">Focus Today</p>
               <h3 className="text-xl sm:text-3xl font-black text-foreground mt-0.5 sm:mt-1">{Math.floor(stats.todayFocusMins/60)}h {stats.todayFocusMins%60}m</h3>
               <p className="text-[8px] sm:text-xs font-medium text-blue-500 flex items-center mt-2 bg-blue-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full"><Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1"/> Deep Work</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
               <div className="mb-6">
                 <h3 className="font-black text-xl text-gray-900">Task Performance</h3>
                 <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Daily completed tasks (7d)</p>
               </div>
               <div className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={weeklyTrendData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                     <YAxis hide />
                     <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                     <Bar dataKey="tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
               <div className="mb-6">
                 <h3 className="font-black text-xl text-gray-900">Task Distribution</h3>
                 <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Items by category</p>
               </div>
               <div className="h-[250px] w-full flex flex-col sm:flex-row items-center gap-8">
                 <div className="flex-1 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={taskCategoryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                          {taskCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="space-y-2 w-full sm:w-auto">
                    {taskCategoryData.length === 0 ? (
                      <p className="text-xs font-bold text-gray-400">No data found</p>
                    ) : (
                      taskCategoryData.map((entry, i) => (
                        <div key={i} className="flex items-center gap-3">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                           <span className="text-xs font-bold text-gray-600 uppercase tracking-tighter">{entry.name}</span>
                           <span className="text-xs font-black text-gray-900 ml-auto">{entry.value}</span>
                        </div>
                      ))
                    )}
                 </div>
               </div>
            </div>
          </div>
          
          {stats.efficiency > 0 && (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
              <h3 className="font-black text-xl text-gray-900 mb-8 flex items-center gap-2">
                 <Activity className="w-5 h-5 text-blue-600" /> AI Productivity Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                   <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-blue-600" />
                      <p className="text-xs font-black text-blue-900 uppercase tracking-wide">Efficiency Peak</p>
                   </div>
                   <p className="text-xs text-blue-700 leading-relaxed font-bold">
                     Currently completing {stats.efficiency}% of your tasks. 
                     {stats.efficiency > 70 ? " You're in a high-productivity zone!" : " Try breaking down complex tasks into smaller subtasks to increase momentum."}
                   </p>
                 </div>
                 <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100">
                   <div className="flex items-center gap-2 mb-2">
                      <Flame className="w-4 h-4 text-orange-600" />
                      <p className="text-xs font-black text-orange-900 uppercase tracking-wide">Momentum</p>
                   </div>
                   <p className="text-xs text-orange-700 leading-relaxed font-bold">
                     {stats.currentStreak > 0 
                       ? `You've maintained a ${stats.currentStreak}-day streak! Keep this consistency to build unstoppable momentum.` 
                       : "Start a new habit streak today to kickstart your growth machine."}
                   </p>
                 </div>
                 <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100">
                   <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-purple-600" />
                      <p className="text-xs font-black text-purple-900 uppercase tracking-wide">Focus Quality</p>
                   </div>
                   <p className="text-xs text-purple-700 leading-relaxed font-bold">
                     {stats.todayFocusMins > 60 
                       ? `Great deep work session today! You've logged ${Math.floor(stats.todayFocusMins/60)}h ${stats.todayFocusMins%60}m of focus.` 
                       : "Short on focus? Even a 20-minute deep work session can significantly boost your output."}
                   </p>
                 </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'efficiency' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                 <h3 className="text-xl font-black mb-6 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-blue-600" /> Complete vs Incomplete</h3>
                 <div className="h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie 
                         data={[
                           { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: '#3b82f6' },
                           { name: 'Pending', value: tasks.filter(t => t.status !== 'completed').length, color: '#f1f5f9' }
                         ]} 
                         innerRadius={80} 
                         outerRadius={100} 
                         dataKey="value"
                       >
                         <Cell fill="#3b82f6" />
                         <Cell fill="#f1f5f9" />
                       </Pie>
                       <Tooltip />
                     </PieChart>
                   </ResponsiveContainer>
                 </div>
              </div>
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-center text-center">
                 <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600 mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                 </div>
                 <h4 className="text-4xl font-black text-gray-900">{tasks.filter(t => t.status === 'completed').length}</h4>
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">Life-time tasks completed</p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'focus' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black mb-6">Weekly Focus Sessions</h3>
            <div className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={weeklyTrendData}>
                   <defs>
                     <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                   <YAxis hide />
                   <Tooltip />
                   <Area type="monotone" dataKey="focus" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorFocus)" />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 text-center">
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2">Total Focus</p>
                <h4 className="text-2xl font-black text-purple-900">{Math.floor(stats.totalFocusMins/60)}h {stats.totalFocusMins%60}m</h4>
             </div>
             <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 text-center">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Sessions</p>
                <h4 className="text-2xl font-black text-blue-900">{focusSessions.length}</h4>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'habits' && (
        <HabitAnalytics habits={habits} />
      )}
    </div>
  );
}

