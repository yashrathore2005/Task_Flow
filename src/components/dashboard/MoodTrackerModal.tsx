import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useMoodStore, MoodLog } from '../../store/moodStore';
import { useTasksStore } from '../../store/tasksStore';
import { Smile, Frown, Meh, Zap, Book, Calendar, TrendingUp, BarChart3, LineChart, MessageSquare, Info, History } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subDays } from 'date-fns';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

interface MoodTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOODS = [
  { id: 'sad', emoji: '😭', label: 'Sad', color: 'text-blue-500', bg: 'bg-blue-100', value: 1 },
  { id: 'stressed', emoji: '😕', label: 'Stressed', color: 'text-orange-500', bg: 'bg-orange-100', value: 2 },
  { id: 'tired', emoji: '😫', label: 'Tired', color: 'text-purple-500', bg: 'bg-purple-100', value: 2 },
  { id: 'neutral', emoji: '😐', label: 'Neutral', color: 'text-gray-500', bg: 'bg-gray-100', value: 3 },
  { id: 'good', emoji: '🙂', label: 'Good', color: 'text-green-500', bg: 'bg-green-100', value: 4 },
  { id: 'great', emoji: '🤩', label: 'Great', color: 'text-yellow-500', bg: 'bg-yellow-100', value: 5 },
] as const;

export function MoodTrackerModal({ isOpen, onClose }: MoodTrackerModalProps) {
  const { moods, addMood } = useMoodStore();
  const { tasks } = useTasksStore();
  
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [energyLevel, setEnergyLevel] = useState(5);
  const [view, setView] = useState<'log' | 'analytics'>('log');

  const handleSave = async () => {
    if (!selectedMood) {
      toast.error("Please select how you feel!");
      return;
    }
    try {
      await addMood({
        mood: selectedMood as any,
        note,
        energyLevel: energyLevel,
      });
      toast.success("Mood logged successfully!");
      setNote('');
      setSelectedMood(null);
      setView('analytics');
    } catch (e) {
      toast.error("Failed to log mood");
    }
  };

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), 6 - i));
    return last7Days.map(date => {
      const dStr = format(date, 'yyyy-MM-dd');
      const dayMoods = moods.filter(m => format(m.createdAt, 'yyyy-MM-dd') === dStr);
      const avgMood = dayMoods.length ? dayMoods.reduce((acc, m) => {
        const moodVal = MOODS.find(mood => mood.id === m.mood)?.value || 3;
        return acc + moodVal;
      }, 0) / dayMoods.length : null;
      
      const dayTasks = tasks.filter(t => t.status === 'completed' && format(t.updatedAt || t.createdAt, 'yyyy-MM-dd') === dStr).length;

      return {
        label: format(date, 'EEE'),
        mood: avgMood,
        productivity: dayTasks
      };
    });
  }, [moods, tasks]);

  const moodSuggestions = useMemo(() => {
    if (!selectedMood) return ["Take a deep breath.", "Stay hydrated."];
    if (selectedMood === 'sad') return ["Listen to your favorite music.", "Call a friend.", "Watch something lighthearted."];
    if (selectedMood === 'stressed') return ["Try a 5-minute meditation.", "Take a walk outside.", "De-clutter your desk."];
    if (selectedMood === 'tired') return ["Power nap for 20 mins.", "Get away from screens.", "Gentle stretching."];
    if (selectedMood === 'great') return ["Keep up the momentum!", "Share your positive energy.", "Set a bold goal for tomorrow."];
    return ["You're doing great!", "Consistency is key.", "Stay focused on your journey."];
  }, [selectedMood]);

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-8 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-background">
        <DialogHeader className="mb-6 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-3xl font-black tracking-tight text-foreground">Mindful Check-in</DialogTitle>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">Track your wellbeing & performance</p>
          </div>
          <div className="flex bg-muted p-1 rounded-2xl">
            <button onClick={() => setView('log')} className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", view === 'log' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Log</button>
            <button onClick={() => setView('analytics')} className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", view === 'analytics' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Charts</button>
          </div>
        </DialogHeader>

        {view === 'log' ? (
          <div className="flex-1 overflow-y-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pr-2 no-scrollbar">
            <section>
              <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-6 flex items-center gap-2"><Smile className="w-4 h-4 text-blue-500" /> How are you feeling right now?</h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {MOODS.map(m => (
                  <button 
                    key={m.id}
                    onClick={() => setSelectedMood(m.id)}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all active:scale-95",
                      selectedMood === m.id 
                        ? cn(m.bg, "border-blue-600 scale-105") 
                        : "bg-card border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <span className="text-4xl grow flex items-center justify-center">{m.emoji}</span>
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", selectedMood === m.id ? "text-blue-900" : "text-muted-foreground")}>{m.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-6 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" /> Energy Level: {energyLevel}/10</h3>
              <div className="px-4">
                <input 
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">
                  <span>Drained</span>
                  <span>Charged</span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-purple-500" /> Notes / Journal</h3>
              <Textarea 
                placeholder="What's causing these feelings? Any wins today?" 
                value={note}
                onChange={e => setNote(e.target.value)}
                className="rounded-[2rem] h-32 bg-muted border-none focus:ring-2 focus:ring-blue-600/10 transition-all p-6 text-lg resize-none text-foreground"
              />
            </section>

            <div className="flex gap-4">
               <Button onClick={handleSave} className="flex-1 rounded-[1.5rem] h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-lg shadow-xl shadow-blue-100">Save Daily Reflection</Button>
            </div>
            
            <section className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-[2rem] border border-blue-100/50 dark:border-blue-900/30 flex items-start gap-4">
               <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0"><Info className="w-5 h-5"/></div>
               <div>
                  <h4 className="font-black text-blue-900 dark:text-blue-400 uppercase tracking-widest text-xs mb-2">Personal Tip</h4>
                  <ul className="space-y-1">
                    {moodSuggestions.map((s, i) => (
                      <li key={i} className="text-sm font-bold text-blue-700/70 dark:text-blue-300/70 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-blue-400" /> {s}
                      </li>
                    ))}
                  </ul>
               </div>
            </section>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 pr-2 scrollbar-hide">
             <section className="space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" /> Weekly Wellbeing</h3>
                   <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div> Mood</div>
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Productivity</div>
                   </div>
                </div>
                <div className="h-[250px] w-full bg-card p-4 rounded-3xl border border-border">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                      <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={20} domain={[0, 10]} hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: 'var(--card)', color: 'var(--foreground)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '16px' }}
                        itemStyle={{ fontWeight: 'black', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="mood" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorMood)" name="Mood (1-5)" />
                      <Area type="monotone" dataKey="productivity" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorProd)" name="Tasks Done" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </section>

             <section>
               <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-6 flex items-center gap-2"><History className="w-4 h-4 text-muted-foreground" /> Recent reflections</h3>
               <div className="space-y-4">
                 {moods.slice(0, 5).map(m => {
                   const config = MOODS.find(mood => mood.id === m.mood);
                   return (
                     <div key={m.id} className="p-5 bg-card border border-border rounded-3xl flex gap-5">
                       <div className="text-3xl shrink-0 flex items-center justify-center w-14 h-14 bg-background rounded-2xl shadow-sm">{config?.emoji}</div>
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                             <h4 className="font-black text-foreground text-lg uppercase tracking-tight">{config?.label} <span className="text-muted-foreground font-bold ml-2">/ Energy {m.energyLevel}</span></h4>
                             <span className="text-[10px] font-black text-muted-foreground uppercase">{format(m.createdAt, 'MMM d, h:mm a')}</span>
                          </div>
                          <p className="text-sm text-muted-foreground font-bold leading-relaxed line-clamp-2 italic">"{m.note || 'No notes added'}"</p>
                       </div>
                     </div>
                   );
                 })}
                 {moods.length === 0 && <p className="text-center py-10 text-muted-foreground font-bold uppercase tracking-widest text-xs">No moods logged yet</p>}
               </div>
             </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
