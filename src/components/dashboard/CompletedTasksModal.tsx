import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useTasksStore, Task } from '../../store/tasksStore';
import { Search, RotateCcw, Trash2, Calendar, Filter, CheckCircle2, History, TrendingUp, Zap } from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth, subDays } from 'date-fns';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';

interface CompletedTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CompletedTasksModal({ isOpen, onClose }: CompletedTasksModalProps) {
  const { tasks, updateTask, deleteTask } = useTasksStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const completedTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'completed');
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return completedTasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
      const date = task.updatedAt || task.createdAt; 
      
      if (filter === 'today') return matchesSearch && isToday(date);
      if (filter === 'week') return matchesSearch && isThisWeek(date);
      if (filter === 'month') return matchesSearch && isThisMonth(date);
      return matchesSearch;
    }).sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
  }, [completedTasks, search, filter]);

  const stats = useMemo(() => {
    const todayCount = completedTasks.filter(t => isToday(t.updatedAt || t.createdAt)).length;
    
    // Calculate streak (consecutive days with at least one completion)
    const completionDates = Array.from(new Set(completedTasks.map(t => format(t.updatedAt || t.createdAt, 'yyyy-MM-dd')))).sort().reverse();
    let streak = 0;
    let checkDate = new Date();
    
    while(true) {
       const dStr = format(checkDate, 'yyyy-MM-dd');
       if (completionDates.includes(dStr)) {
         streak++;
         checkDate = subDays(checkDate, 1);
       } else if (streak > 0 && dStr === format(new Date(), 'yyyy-MM-dd')) {
         // If nothing today, but we have a streak, check yesterday
         checkDate = subDays(checkDate, 1);
       } else {
         break;
       }
       if (streak > 365) break; // sanity
    }

    return {
      total: completedTasks.length,
      today: todayCount,
      streak
    };
  }, [completedTasks]);

  const handleRestore = async (taskId: string) => {
    await updateTask(taskId, { status: 'todo' });
    toast.success("Task restored to your list");
  };

  const handleDeletePermanently = async (taskId: string) => {
    if (confirm("Permanently delete this task? This cannot be undone.")) {
      await deleteTask(taskId);
      toast.success("Task deleted forever");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-background">
        <DialogHeader className="p-8 pb-4 bg-card sticky top-0 z-10 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                <History className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight text-foreground">Archive</DialogTitle>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Your Hall of Fame</p>
              </div>
            </div>
            <div className="flex gap-2">
              {['today', 'week', 'month', 'all'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    filter === f ? "bg-foreground text-background shadow-lg" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-900/30">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total</p>
              <h4 className="text-2xl font-black text-blue-600">{stats.total}</h4>
            </div>
            <div className="bg-green-50/50 dark:bg-green-900/10 p-4 rounded-2xl border border-green-100/50 dark:border-green-900/30">
              <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Today</p>
              <h4 className="text-2xl font-black text-green-600">{stats.today}</h4>
            </div>
            <div className="bg-orange-50/50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100/50 dark:border-orange-900/30">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Streak</p>
              <h4 className="text-2xl font-black text-orange-600">{stats.streak}d</h4>
            </div>
          </div>

          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search through your achievements..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-11 h-12 bg-muted border-none rounded-2xl font-medium focus:ring-2 focus:ring-blue-600/10 transition-all text-foreground"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-3 mt-4">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <CheckCircle2 className="w-16 h-16 mb-4 opacity-10" />
              <p className="font-bold uppercase tracking-widest text-sm">No completed tasks found</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div key={task.id} className="group flex items-center justify-between p-5 bg-card border border-border rounded-3xl hover:border-blue-200 hover:shadow-sm transition-all hover:translate-x-1">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="font-black text-foreground group-hover:text-blue-600 transition-colors line-through decoration-muted-foreground opacity-70">{task.title}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span className="uppercase tracking-widest text-muted-foreground">{task.listId || 'Inbox'}</span>
                      <span className="w-1 h-1 bg-border rounded-full" />
                      <span>Completed {format(task.updatedAt || task.createdAt, 'MMM d, h:mm a')}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleRestore(task.id)}
                    title="Restore Task"
                    className="p-3 rounded-xl bg-muted text-muted-foreground hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-90"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeletePermanently(task.id)}
                    title="Delete Forever"
                    className="p-3 rounded-xl bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
