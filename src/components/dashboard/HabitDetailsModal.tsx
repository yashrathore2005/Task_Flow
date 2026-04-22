import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useHabitsStore, Habit } from '../../store/habitsStore';
import { Check, Flame, Calendar, Activity, TrendingUp, Edit3, FastForward, StickyNote, Activity as ActivityIcon } from 'lucide-react';
import { format, isToday, subDays } from 'date-fns';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

interface HabitDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HabitDetailsModal({ isOpen, onClose }: HabitDetailsModalProps) {
  const { habits, toggleLog, loading } = useHabitsStore();
  const navigate = useNavigate();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const habitsList = useMemo(() => {
    const dueToday = habits.filter(h => {
      // Basic frequency check (stub)
      return true; 
    });
    const completed = dueToday.filter(h => h.logs.includes(todayStr));
    const pending = dueToday.filter(h => !h.logs.includes(todayStr));
    
    return { dueToday, completed, pending };
  }, [habits, todayStr]);

  const stats = useMemo(() => {
    const total = habitsList.dueToday.length;
    const completed = habitsList.completed.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, percent };
  }, [habitsList]);

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
      if (sorted.includes(dStr)) { streak++; checkDate = subDays(checkDate, 1); } else break;
      if (streak > 365) break;
    }
    return streak;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-8 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-background">
        <DialogHeader className="mb-8 flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 dark:border-blue-900/30">
                <ActivityIcon className="w-7 h-7 stroke-[2.5]" />
             </div>
             <div>
               <DialogTitle className="text-3xl font-black tracking-tight text-foreground">Today's Habits</DialogTitle>
               <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">Focus on what matters</p>
             </div>
          </div>
          <div className="text-right">
             <span className="text-4xl font-black text-blue-600">{stats.percent}%</span>
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Daily Progress</p>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-8 pr-2 no-scrollbar">
           {/* PROGRESS BAR */}
           <div className="w-full bg-muted h-4 rounded-full overflow-hidden shadow-inner">
              <div 
                className="bg-blue-600 h-full transition-all duration-1000 ease-out shadow-lg shadow-blue-200" 
                style={{ width: `${stats.percent}%` }}
              />
           </div>

           <div className="space-y-6">
              {/* PENDING SECTION */}
              {habitsList.pending.length > 0 && (
                <section>
                   <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">Pending <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 px-2 py-0.5 rounded-lg text-[10px]">{habitsList.pending.length}</span></h3>
                   <div className="space-y-3">
                      {habitsList.pending.map(habit => (
                        <div key={habit.id} className="group p-5 bg-card border border-border rounded-3xl hover:border-blue-200 hover:shadow-md transition-all flex items-center justify-between">
                           <div className="flex items-center gap-4 flex-1">
                              <button 
                                onClick={() => toggleLog(habit.id, todayStr)}
                                className="w-12 h-12 rounded-2xl border-4 border-muted flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-all active:scale-90"
                              >
                                 <div className="w-2 h-2 rounded-full bg-muted-foreground/30 group-hover:bg-blue-600" />
                              </button>
                              <div className="flex items-center gap-4">
                                 <span className="text-2xl w-14 h-14 flex items-center justify-center rounded-2xl bg-muted border border-border shadow-sm group-hover:bg-background group-hover:scale-110 transition-transform">{habit.icon}</span>
                                 <div>
                                    <h4 className="font-black text-lg text-foreground group-hover:text-blue-600 transition-colors uppercase tracking-tight">{habit.name}</h4>
                                    <div className="flex items-center gap-4">
                                       <span className="flex items-center gap-1.5 text-[10px] font-black text-orange-500 uppercase"><Flame className="w-3.5 h-3.5 fill-orange-500" /> {calculateStreak(habit.logs)} Day Streak</span>
                                       <span className="w-1 h-1 bg-border rounded-full" />
                                       <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{habit.frequency}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => navigate('/habits')} className="p-3 rounded-xl bg-muted text-muted-foreground hover:bg-blue-50 hover:text-blue-600 transition-all"><Edit3 className="w-4 h-4" /></button>
                              <button className="p-3 rounded-xl bg-muted text-muted-foreground hover:bg-orange-50 hover:text-orange-600 transition-all"><FastForward className="w-4 h-4" /></button>
                           </div>
                        </div>
                      ))}
                   </div>
                </section>
              )}

              {/* COMPLETED SECTION */}
              {habitsList.completed.length > 0 && (
                <section>
                   <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4">Completed ({habitsList.completed.length})</h3>
                   <div className="space-y-3">
                      {habitsList.completed.map(habit => (
                        <div key={habit.id} className="p-5 bg-muted/30 border border-transparent rounded-3xl flex items-center justify-between opacity-60">
                           <div className="flex items-center gap-4 flex-1">
                              <button 
                                onClick={() => toggleLog(habit.id, todayStr)}
                                className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-100"
                              >
                                 <Check className="w-6 h-6 stroke-[4]" />
                              </button>
                              <div className="flex items-center gap-4">
                                 <span className="text-2xl w-14 h-14 flex items-center justify-center rounded-2xl bg-background grayscale scale-90 opacity-50">{habit.icon}</span>
                                 <div>
                                    <h4 className="font-black text-lg text-muted-foreground line-through decoration-muted-foreground uppercase tracking-tight">{habit.name}</h4>
                                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Great work! You hit your goal.</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </section>
              )}

              {habitsList.dueToday.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                   <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6 opacity-50">
                      <Calendar className="w-10 h-10" />
                   </div>
                   <p className="font-black text-sm uppercase tracking-widest text-muted-foreground mb-6">No habits scheduled for today</p>
                   <Button onClick={() => navigate('/habits')} className="rounded-[1.5rem] px-8 h-12 bg-blue-600 font-black uppercase tracking-widest text-xs">Browse Library</Button>
                </div>
              )}
           </div>
        </div>

        <div className="mt-8 flex gap-4">
           <Button variant="outline" onClick={() => navigate('/habits')} className="flex-1 rounded-[1.5rem] h-14 border-border text-foreground font-black uppercase tracking-widest text-xs hover:bg-muted transition-all">Daily Overview</Button>
           <Button onClick={onClose} className="px-10 h-14 rounded-[1.5rem] bg-foreground text-background font-black uppercase tracking-widest text-xs hover:brightness-110">Dismiss</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
