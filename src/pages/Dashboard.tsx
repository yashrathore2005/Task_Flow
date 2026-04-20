import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTasksStore } from '../store/tasksStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle2, Clock, Calendar as CalendarIcon, Flame, Target, Zap, Timer, CheckSquare, Download, Palette, Activity } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Countdown } from './Countdowns';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { tasks, subscribe, loading } = useTasksStore();
  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [focusMinutes, setFocusMinutes] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.uid) {
      const unsubscribeTasks = subscribe(user.uid);
      
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

      return () => { unsubscribeTasks(); unsubscribeCountdowns(); unsubscribeFocus(); };
    }
  }, [user?.uid, subscribe]);

  const taskStats = {
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status !== 'completed').length,
    total: tasks.length
  };
  const completionRate = taskStats.total === 0 ? 0 : Math.round((taskStats.completed / taskStats.total) * 100);

  const weeklyData = [
    { name: 'Mon', focus: 45, tasks: 4 },
    { name: 'Tue', focus: 90, tasks: 7 },
    { name: 'Wed', focus: 30, tasks: 5 },
    { name: 'Thu', focus: 120, tasks: 8 },
    { name: 'Fri', focus: 60, tasks: 3 },
    { name: 'Sat', focus: 15, tasks: 6 },
    { name: 'Sun', focus: focusMinutes, tasks: taskStats.completed },
  ];

  const pieData = [
    { name: 'Personal', value: 40, color: '#3b82f6' },
    { name: 'Work', value: 30, color: '#f59e0b' },
    { name: 'Study', value: 30, color: '#10b981' },
  ];

  const quotes = [
    "Focus on being productive instead of busy.",
    "The secret of getting ahead is getting started.",
    "Small consistent steps lead to massive results.",
    "Your future is created by what you do today."
  ];

  const habitHeatmap = Array.from({length: 28}).map((_, i) => Math.random() > 0.3 ? Math.floor(Math.random() * 4) + 1 : 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-20 p-4 sm:p-0">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-4 mb-3">
             <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors shadow-sm">
                <Download className="w-3.5 h-3.5" /> Export Report
             </button>
             <button 
               onClick={() => document.documentElement.classList.toggle('dark')}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors shadow-sm"
             >
                <Palette className="w-3.5 h-3.5" /> Theme
             </button>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 leading-tight dark:text-white">
            Good morning,<br/>
            <span className="text-blue-600">{user?.displayName?.split(' ')[0] || user?.email?.split('@')[0]}</span>
          </h1>
          <p className="text-gray-500 mt-2 font-medium bg-gray-100 px-3 py-1 rounded-full inline-block text-sm">
            {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>
          <p className="text-gray-600 mt-4 italic max-w-md border-l-2 border-blue-600 pl-4 text-sm font-serif">
            "{quotes[new Date().getDay() % quotes.length]}"
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white border border-gray-200 px-5 py-3 rounded-2xl shadow-sm text-sm flex flex-col items-end">
            <span className="text-gray-500 font-semibold mb-1 flex items-center gap-1"><Timer className="w-4 h-4"/> Focus Time Today</span>
            <span className="font-black text-2xl text-gray-900">{Math.floor(focusMinutes/60)}h {focusMinutes%60}m</span>
          </div>
          <div className="bg-white border border-gray-200 px-5 py-3 rounded-2xl shadow-sm text-sm flex flex-col items-end">
            <span className="text-gray-500 font-semibold mb-1 flex items-center gap-1"><CheckSquare className="w-4 h-4"/> Tasks Done</span>
            <span className="font-black text-2xl text-gray-900">{taskStats.completed}/{taskStats.total}</span>
          </div>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div onClick={() => navigate('/analytics')} className="cursor-pointer bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:border-blue-200 hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Zap className="w-16 h-16"/></div>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Efficiency</p>
          <h3 className="text-4xl font-black text-blue-600">{completionRate}%</h3>
          <p className="text-xs text-gray-400 mt-2 font-medium">Task completion rate</p>
        </div>
        <div onClick={() => navigate('/analytics')} className="cursor-pointer bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:border-orange-200 hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Flame className="w-16 h-16 text-orange-500"/></div>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Longest Streak</p>
          <h3 className="text-4xl font-black text-orange-500">12</h3>
          <p className="text-xs text-gray-400 mt-2 font-medium">Consecutive logged days</p>
        </div>
        <div onClick={() => navigate('/analytics')} className="cursor-pointer bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:border-green-200 hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Target className="w-16 h-16 text-green-500"/></div>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Weekly Score</p>
          <h3 className="text-4xl font-black text-green-600">84/100</h3>
          <p className="text-xs text-gray-400 mt-2 font-medium">Based on habits & focus</p>
        </div>
        <div onClick={() => navigate('/countdowns')} className="cursor-pointer bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:border-purple-200 hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Clock className="w-16 h-16 text-purple-500"/></div>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Deadlines</p>
          <h3 className="text-4xl font-black text-purple-600">{countdowns.filter(c => c.targetDate > Date.now()).length}</h3>
          <p className="text-xs text-gray-400 mt-2 font-medium">Active upcoming events</p>
        </div>
      </div>

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
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
             <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2">Analytics Summary <Activity className="w-5 h-5 text-gray-400"/></h3>
             <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <span className="text-gray-500 font-medium text-sm">Best Productive Day</span>
                  <span className="font-bold text-gray-900">Thursday</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <span className="text-gray-500 font-medium text-sm">Avg Task Completion</span>
                  <span className="font-bold text-gray-900">2.5 hrs</span>
                </div>
                <div className="flex justify-between items-center pb-1">
                  <span className="text-gray-500 font-medium text-sm">Deadline Success Rate</span>
                  <span className="font-bold text-green-600">92%</span>
                </div>
             </div>
          </div>

          {/* Mood/Productivity Check-in */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <h3 className="font-bold text-gray-900 mb-2">How are you feeling?</h3>
            <p className="text-sm text-gray-500 mb-4">Log your daily mood & energy</p>
            <div className="flex gap-3 mt-2">
              {['😭', '😕', '😐', '🙂', '🤩'].map((emoji, i) => (
                <button key={i} className="text-3xl hover:scale-125 transition-transform origin-center grayscale hover:grayscale-0">
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Smart Suggestions */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500"/> Smart Suggestions
            </h3>
            <div className="space-y-3">
               <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl cursor-pointer hover:bg-blue-100 transition-colors">
                  <p className="font-bold text-sm text-blue-900">Follow up on "Design Review"</p>
                  <p className="text-xs text-blue-600 mt-0.5">Based on your recent completed task</p>
               </div>
               <div className="p-3 bg-purple-50 border border-purple-100 rounded-2xl cursor-pointer hover:bg-purple-100 transition-colors">
                  <p className="font-bold text-sm text-purple-900">Try a 25m Focus Session</p>
                  <p className="text-xs text-purple-600 mt-0.5">You haven't tracked focus today</p>
               </div>
            </div>
          </div>

          {/* Today Habit Goals */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col">
            <h3 className="font-bold text-xl text-gray-900 mb-4">Today Habit Goals</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1 text-sm font-bold">
                   <span className="text-gray-700 flex items-center gap-2"><span className="text-lg">💧</span> Drink Water</span>
                   <span className="text-blue-500">4 / 8 glasses</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '50%'}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1 text-sm font-bold">
                   <span className="text-gray-700 flex items-center gap-2"><span className="text-lg">🏃</span> Morning Run</span>
                   <span className="text-green-500">Done</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '100%'}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1 text-sm font-bold">
                   <span className="text-gray-700 flex items-center gap-2"><span className="text-lg">📚</span> Reading</span>
                   <span className="text-orange-500">15 / 30 mins</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{width: '50%'}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Priority List */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-xl text-gray-900 mb-4">Today's Focus</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
               {loading ? <p className="text-gray-400 text-sm">Loading...</p> : tasks.filter(t => {
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
              {!loading && taskStats.pending === 0 && (
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
