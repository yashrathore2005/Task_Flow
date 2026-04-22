import React from 'react';

interface TaskHeaderProps {
  totalTasks: number;
  completedToday: number;
  urgentTasks: number;
  importantTasks: number;
}

export const TaskHeader: React.FC<TaskHeaderProps> = React.memo(({ 
  totalTasks, 
  completedToday, 
  urgentTasks, 
  importantTasks 
}) => {
  return (
    <div className="bg-card p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-border mb-4 hidden md:block">
      <h1 className="text-xl font-black tracking-tight text-foreground mb-1">Tasks Overview</h1>
      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-4">Manage your daily priorities</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-blue-100 dark:border-blue-800 flex flex-col items-start px-4">
           <span className="text-lg sm:text-xl font-black text-foreground">{totalTasks}</span>
           <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total</span>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-green-100 dark:border-green-800 flex flex-col items-start px-4">
           <span className="text-lg sm:text-xl font-black text-foreground">{completedToday}</span>
           <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Done Today</span>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-orange-100 dark:border-orange-800 flex flex-col items-start px-4">
           <span className="text-lg sm:text-xl font-black text-foreground">{urgentTasks}</span>
           <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Urgent</span>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-purple-100 dark:border-purple-800 flex flex-col items-start px-4">
           <span className="text-lg sm:text-xl font-black text-foreground">{importantTasks}</span>
           <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Important</span>
        </div>
      </div>
    </div>
  );
});

TaskHeader.displayName = 'TaskHeader';
