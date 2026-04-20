import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { CalendarIcon, Flame, Target, Zap, Timer, CheckSquare, Clock, Filter, ChevronDown, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

export default function Analytics() {
  const { user } = useAuthStore();
  const [filter, setFilter] = useState('This Week');
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'efficiency', label: 'Efficiency & Tasks' },
    { id: 'focus', label: 'Focus & Time' },
    { id: 'habits', label: 'Habits & Streaks' },
  ];

  const weeklyData = [
    { name: 'Mon', focus: 45, tasks: 4 },
    { name: 'Tue', focus: 90, tasks: 7 },
    { name: 'Wed', focus: 30, tasks: 5 },
    { name: 'Thu', focus: 120, tasks: 8 },
    { name: 'Fri', focus: 60, tasks: 3 },
    { name: 'Sat', focus: 15, tasks: 6 },
    { name: 'Sun', focus: 40, tasks: 2 },
  ];

  const pieData = [
    { name: 'Personal', value: 40, color: '#3b82f6' },
    { name: 'Work', value: 30, color: '#f59e0b' },
    { name: 'Study', value: 30, color: '#10b981' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto min-h-screen pb-20 animate-in fade-in duration-500 flex flex-col pt-4 p-4 sm:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Analytics Center</h1>
          <p className="text-gray-500 font-medium mt-2">Deep insights into your productivity</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <select 
               className="appearance-none w-full bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold text-gray-700 outline-none hover:border-gray-300 transition-colors cursor-pointer"
               value={filter}
               onChange={e => setFilter(e.target.value)}
            >
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
              <option>Custom Range</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors flex-1 md:flex-none">
            <Download className="w-4 h-4"/> Export
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-4 mb-4 scrollbar-hide">
         {tabs.map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
           >
             {tab.label}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
           <Zap className="w-8 h-8 text-blue-500 mb-3" />
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Efficiency</p>
           <h3 className="text-3xl font-black text-gray-900 mt-1">82%</h3>
           <p className="text-xs font-medium text-green-500 flex items-center mt-2 bg-green-50 px-2 py-1 rounded-full"><TrendingUp className="w-3 h-3 mr-1"/> +4% this week</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
           <Flame className="w-8 h-8 text-orange-500 mb-3" />
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Streak</p>
           <h3 className="text-3xl font-black text-gray-900 mt-1">12 Days</h3>
           <p className="text-xs font-medium text-gray-500 mt-2">Personal best: 21 days</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
           <Target className="w-8 h-8 text-green-500 mb-3" />
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Weekly Score</p>
           <h3 className="text-3xl font-black text-gray-900 mt-1">84</h3>
           <p className="text-xs font-medium text-green-500 flex items-center mt-2 bg-green-50 px-2 py-1 rounded-full"><TrendingUp className="w-3 h-3 mr-1"/> Top 10%</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
           <Timer className="w-8 h-8 text-purple-500 mb-3" />
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Focus Time</p>
           <h3 className="text-3xl font-black text-gray-900 mt-1">14h 30m</h3>
           <p className="text-xs font-medium text-red-500 flex items-center mt-2 bg-red-50 px-2 py-1 rounded-full"><TrendingDown className="w-3 h-3 mr-1"/> -2h this week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
           <div className="mb-6">
             <h3 className="font-bold text-xl text-gray-900">Task Completion Trend</h3>
             <p className="text-sm text-gray-500 font-medium">Completed vs Planned</p>
           </div>
           <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={weeklyData}>
                 <defs>
                   <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                 <Area type="monotone" dataKey="tasks" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorTasks)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
           <div className="mb-6">
             <h3 className="font-bold text-xl text-gray-900">Focus Distribution</h3>
             <p className="text-sm text-gray-500 font-medium">Time spent by category</p>
           </div>
           <div className="h-[250px] w-full flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                   {pieData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-xl text-gray-900 mb-6">AI Suggestions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
             <p className="text-sm font-bold text-blue-900 mb-1">Optimize Mornings</p>
             <p className="text-xs text-blue-700 leading-relaxed">You complete 60% of your tasks before 12 PM. Try to schedule Deep Work blocks during this peak time.</p>
           </div>
           <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
             <p className="text-sm font-bold text-orange-900 mb-1">Habit Warning</p>
             <p className="text-xs text-orange-700 leading-relaxed">Your "Read 30 mins" habit is slipping. You missed it 3 times this week. Consider moving it to your morning routine.</p>
           </div>
           <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
             <p className="text-sm font-bold text-green-900 mb-1">Excellent Focus</p>
             <p className="text-xs text-green-700 leading-relaxed">Your average focus session length increased by 15% this week. Keep up the great work in your Pomodoro blocks!</p>
           </div>
        </div>
      </div>

    </div>
  );
}
