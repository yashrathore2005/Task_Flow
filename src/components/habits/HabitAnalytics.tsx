import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { format, subDays, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Habit } from '../../store/habitsStore';
import { cn } from '../../lib/utils';
import { TrendingUp, Award, Clock, Calendar, CheckCircle2, AlertCircle, BarChart2, Flame, Zap } from 'lucide-react';

interface HabitAnalyticsProps {
  habits: Habit[];
}

export function HabitAnalytics({ habits }: HabitAnalyticsProps) {
  // 1. Stats Summary
  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayCompleted = habits.filter(h => h.logs.includes(today)).length;
    const totalLogs = habits.reduce((acc, h) => acc + h.logs.length, 0);
    const completionRate = habits.length > 0 ? Math.round((todayCompleted / habits.length) * 100) : 0;
    
    // Streaks
    const streaks = habits.map(h => {
        if (h.logs.length === 0) return 0;
        const sorted = [...h.logs].sort().reverse();
        let s = 0;
        let d = sorted.includes(today) ? new Date() : subDays(new Date(), 1);
        while(sorted.includes(format(d, 'yyyy-MM-dd'))) {
            s++;
            d = subDays(d, 1);
        }
        return s;
    });
    
    const currentStreak = Math.max(0, ...streaks);
    
    return {
      total: habits.length,
      completedToday: todayCompleted,
      completionRate,
      currentStreak,
      totalLogs
    };
  }, [habits]);

  // 2. Daily Completion Chart (Last 7 days)
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    return days.map(day => {
      const dStr = format(day, 'yyyy-MM-dd');
      const completed = habits.filter(h => h.logs.includes(dStr)).length;
      return {
        name: format(day, 'EEE'),
        completed,
        full: habits.length
      };
    });
  }, [habits]);

  // 3. Weekly Consistency (Last 4 weeks)
  const weeklyData = useMemo(() => {
    return Array.from({ length: 4 }).map((_, i) => {
      const start = startOfWeek(subWeeks(new Date(), 3 - i));
      const end = endOfWeek(subWeeks(new Date(), 3 - i));
      const completedCount = habits.reduce((acc, h) => {
        return acc + h.logs.filter(date => isWithinInterval(new Date(date), { start, end })).length;
      }, 0);
      return {
        name: `Week ${i + 1}`,
        completed: completedCount
      };
    });
  }, [habits]);

  // 4. Monthly Trend (Last 6 months)
  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const completedCount = habits.reduce((acc, h) => {
        return acc + h.logs.filter(date => isWithinInterval(new Date(date), { start, end })).length;
      }, 0);
      return {
        name: format(date, 'MMM'),
        completed: completedCount
      };
    });
  }, [habits]);

  // 5. Best Habits Leaderboard
  const leaderboard = useMemo(() => {
    return habits
      .map(h => ({
        name: h.name,
        icon: h.icon,
        count: h.logs.length,
        rate: Math.round((h.logs.length / 30) * 100) // Mock rate based on last 30 days
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [habits]);

  // 6. Activity Heatmap (Last 5 weeks grid)
  const heatmapData = useMemo(() => {
    const today = new Date();
    const startDate = subWeeks(startOfWeek(today), 4);
    const days = eachDayOfInterval({ start: startDate, end: today });
    
    return days.map(day => {
      const dStr = format(day, 'yyyy-MM-dd');
      const count = habits.filter(h => h.logs.includes(dStr)).length;
      const intensity = habits.length > 0 ? count / habits.length : 0;
      return { date: dStr, count, intensity };
    });
  }, [habits]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Current Streak', value: stats.currentStreak, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Total Done', value: stats.totalLogs, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Active Habits', value: stats.total, icon: BarChart2, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((m, i) => (
          <div key={i} className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{m.label}</span>
              <div className={cn("p-2 rounded-xl", m.bg, m.color)}><m.icon className="w-4 h-4" /></div>
            </div>
            <h3 className="text-3xl font-black text-gray-900 leading-none">{m.value}</h3>
          </div>
        ))}
      </div>

      {/* Heatmap Section */}
      <Card className="rounded-[2.5rem] border-gray-100 overflow-hidden shadow-sm">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-xl font-black flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" /> Activity Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-0">
           <div className="flex flex-wrap gap-1.5">
              {heatmapData.map((d, i) => (
                <div 
                  key={i} 
                  title={`${d.date}: ${d.count} habits`}
                  className={cn(
                    "w-4 h-4 sm:w-6 sm:h-6 rounded-md transition-colors",
                    d.intensity === 0 ? "bg-gray-100" :
                    d.intensity < 0.3 ? "bg-blue-200" :
                    d.intensity < 0.6 ? "bg-blue-400" :
                    d.intensity < 0.9 ? "bg-blue-600" : "bg-blue-800"
                  )}
                />
              ))}
           </div>
           <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-gray-100 rounded-sm" />
                <div className="w-3 h-3 bg-blue-200 rounded-sm" />
                <div className="w-3 h-3 bg-blue-400 rounded-sm" />
                <div className="w-3 h-3 bg-blue-600 rounded-sm" />
                <div className="w-3 h-3 bg-blue-800 rounded-sm" />
              </div>
              <span>More</span>
           </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Daily Completion Bar Chart */}
        <Card className="rounded-[2.5rem] border-gray-100 overflow-hidden shadow-sm">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" /> Daily Completion
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={dailyData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                 <YAxis hide />
                 <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                 />
                 <Bar dataKey="completed" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40}>
                    {dailyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.completed === entry.full && entry.full > 0 ? '#10b981' : '#3b82f6'} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Consistency Line Chart */}
        <Card className="rounded-[2.5rem] border-gray-100 overflow-hidden shadow-sm">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" /> Weekly Consistency
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={weeklyData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                 <YAxis hide />
                 <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                 />
                 <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#3b82f6', strokeWidth: 3, stroke: '#fff' }} 
                    activeDot={{ r: 8, fill: '#3b82f6' }}
                 />
               </LineChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend Area Chart */}
        <Card className="rounded-[2.5rem] border-gray-100 overflow-hidden shadow-sm">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" /> Monthly Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={monthlyData}>
                 <defs>
                   <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                     <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                 <YAxis hide />
                 <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                 <Area type="monotone" dataKey="completed" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorComp)" />
               </AreaChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Habits Leaderboard */}
        <Card className="rounded-[2.5rem] border-gray-100 overflow-hidden shadow-sm">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
             <div className="space-y-6">
               {leaderboard.map((h, i) => (
                 <div key={i} className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl">{h.icon}</div>
                     <div>
                       <h4 className="font-black text-gray-900">{h.name}</h4>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{h.count} Total Logs</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="font-black text-blue-600">{h.rate}%</span>
                     <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-600 rounded-full" style={{ width: `${h.rate}%` }} />
                     </div>
                   </div>
                 </div>
               ))}
               {leaderboard.length === 0 && (
                 <div className="py-10 text-center">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No data available yet</p>
                 </div>
               )}
             </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
