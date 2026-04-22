import React from 'react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { Task } from '../../store/tasksStore';

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  search: string;
  showCompleted: boolean;
  setShowCompleted: (show: boolean) => void;
  onUpdate: (id: string, updates: Partial<Task>) => Promise<void> | void;
  onEdit: (task: Task) => void;
}

export const TaskList: React.FC<TaskListProps> = React.memo(({ 
  tasks, 
  loading, 
  search, 
  showCompleted, 
  setShowCompleted,
  onUpdate,
  onEdit 
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const activeTasks = React.useMemo(() => 
    tasks.filter(t => t.status !== 'completed').sort((a,b) => a.order - b.order)
  , [tasks]);

  const completedTasks = React.useMemo(() => 
    tasks.filter(t => t.status === 'completed').sort((a,b) => b.updatedAt - a.updatedAt)
  , [tasks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const oldIndex = activeTasks.findIndex(t => t.id === active.id);
    const newIndex = activeTasks.findIndex(t => t.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
       const newOrder = arrayMove(activeTasks, oldIndex, newIndex);
       newOrder.forEach((task: Task, index: number) => {
         if (task.order !== index) onUpdate(task.id, { order: index });
       });
    }
  };

  if (!loading && activeTasks.length === 0 && search === '' && completedTasks.length === 0) {
    return (
       <div className="py-12 text-center text-muted-foreground">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-20 text-muted-foreground" />
          <p className="font-semibold text-lg text-foreground">Inbox Zero!</p>
          <p className="text-sm">Enjoy your clean slate.</p>
       </div>
    );
  }

  return (
    <div className="space-y-6">
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <SortableContext items={activeTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {activeTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onUpdate={onUpdate} 
                onEdit={onEdit} 
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {completedTasks.length > 0 && (
        <div className="mt-10">
          <button 
            onClick={() => setShowCompleted(!showCompleted)} 
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 uppercase tracking-wider transition-colors mb-4"
          >
            {showCompleted ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
            Completed ({completedTasks.length})
          </button>
          
          {showCompleted && (
            <div className="space-y-1 animate-in slide-in-from-top-2 duration-200 opacity-60">
              {completedTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onUpdate={onUpdate} 
                  onEdit={onEdit} 
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

TaskList.displayName = 'TaskList';
