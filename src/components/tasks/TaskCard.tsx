import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, CheckCircle2, Calendar as CalendarIcon, PlaySquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, isSameDay, isBefore } from 'date-fns';
import confetti from 'canvas-confetti';
import { cn } from '../../lib/utils';
import { Task } from '../../store/tasksStore';

interface TaskCardProps {
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => Promise<void> | void;
  onEdit: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = React.memo(({ task, onUpdate, onEdit }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 50 : 1
  };

  const isCompleted = task.status === 'completed';

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(task.id, { status: isCompleted ? 'todo' : 'completed' });
    if (!isCompleted) {
      confetti({ 
        particleCount: 60, 
        spread: 50, 
        origin: { y: 0.8 }, 
        colors: ['#3b82f6', '#60a5fa', '#ffffff'] 
      });
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "bg-card border border-border hover:border-blue-200 transition-colors shadow-sm rounded-xl mb-2 flex items-center p-2.5 relative group",
        isDragging && "shadow-xl border-blue-400"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground mr-1 px-1">
        <GripVertical className="w-4 h-4" />
      </div>
      
      <button 
        className={cn(
          "mr-2.5 rounded-full flex-shrink-0 transition-all h-5.5 w-5.5 flex items-center justify-center border",
          isCompleted 
            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' 
            : 'border-border hover:border-blue-400'
        )}
        onClick={handleToggle}
      >
        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
      </button>
      
      <div className="flex-1 min-w-0 pr-3 cursor-pointer" onClick={() => onEdit(task)}>
        <p className={cn(
          "text-sm font-bold truncate transition-colors",
          isCompleted ? 'line-through text-muted-foreground' : 'text-foreground group-hover:text-blue-600'
        )}>
          {task.title}
        </p>
        
        {task.subtasks && task.subtasks.length > 0 && !isCompleted && (
           <div className="flex items-center gap-1.5 mt-0.5">
             <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
               <div 
                 className="h-full bg-blue-400 transition-all duration-500" 
                 style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}
               ></div>
             </div>
             <span className="text-[9px] text-muted-foreground font-bold">
               {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
             </span>
           </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <Link 
             to="/focus" 
             className="text-muted-foreground hover:text-blue-600 bg-muted hover:bg-blue-50 dark:hover:bg-blue-900/10 w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
             onClick={(e) => e.stopPropagation()}
           >
              <PlaySquare className="w-3 h-3"/>
           </Link>
        </div>
        
        {task.energy && task.energy !== 'medium' && (
           <span className="text-sm" title={`Energy: ${task.energy}`}>{task.energy === 'high' ? '⚡' : '🔋'}</span>
        )}
        
        {task.priority !== 'none' && (
          <span className={cn(
            "text-[8px] uppercase font-black px-1.5 py-0.5 rounded-md",
            task.priority === 'urgent' ? 'bg-red-500 text-white' : 
            task.priority === 'high' ? 'bg-orange-500 text-white' : 
            'bg-muted text-muted-foreground'
          )}>
            {task.priority}
          </span>
        )}
        
        {task.dueDate ? (
          <div className="flex flex-col items-end min-w-[50px]">
            <span className={cn(
              "text-[10px] font-bold flex items-center gap-1",
              isCompleted 
                ? 'text-muted-foreground' 
                : isBefore(task.dueDate, new Date()) && !isSameDay(task.dueDate, new Date()) 
                  ? 'text-red-500' 
                  : 'text-blue-600'
            )}>
               <CalendarIcon className="w-2.5 h-2.5"/> {format(task.dueDate, 'MMM d')}
            </span>
          </div>
        ) : (
          <div className="w-[50px]" />
        )}
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';
