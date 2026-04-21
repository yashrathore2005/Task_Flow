import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTasksStore, Task } from '../store/tasksStore';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '../components/ui/button';
import { Plus, GripVertical, CheckCircle2, Circle, ChevronDown, ChevronRight, Search, Calendar as CalendarIcon, Tag, Sparkles, Clock, AlertCircle, PlaySquare, CheckSquare, Settings2, BarChart3, LayoutGrid } from 'lucide-react';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';
import { format, isSameDay, isBefore } from 'date-fns';
import confetti from 'canvas-confetti';
import { TaskModal } from '../components/tasks/TaskModal';

const AI_SUGGESTIONS = [
  "Review upcoming deadlines",
  "Clear email inbox",
  "Plan tomorrow's schedule",
  "Drink 2 liters of water",
  "30-min stretch"
];

import { Link } from 'react-router-dom';

const SortableTaskItem: React.FC<{ task: Task, onUpdate: (id: string, updates: Partial<Task>) => Promise<void> | void, onEdit: (task: Task) => void }> = ({ task, onUpdate, onEdit }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 50 : 1
  };

  const isCompleted = task.status === 'completed';

  return (
    <div ref={setNodeRef} style={style} className={`bg-white border hover:border-blue-200 transition-colors shadow-sm rounded-xl mb-2 flex items-center p-2.5 relative group ${isDragging ? 'shadow-xl' : ''}`}>
      <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 mr-2 px-1">
        <GripVertical className="w-4 h-4" />
      </div>
      
      <button 
        className={`mr-2.5 rounded-full flex-shrink-0 transition-all h-5.5 w-5.5 flex items-center justify-center ${isCompleted ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'border border-gray-300 hover:border-blue-400'}`}
        onClick={() => {
          onUpdate(task.id, { status: isCompleted ? 'todo' : 'completed' });
          if (!isCompleted) confetti({ particleCount: 60, spread: 50, origin: { y: 0.8 }, colors: ['#3b82f6', '#60a5fa', '#ffffff'] });
        }}
      >
        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
      </button>
      
      <div className="flex-1 min-w-0 pr-3 cursor-pointer" onClick={() => onEdit(task)}>
        <p className={`text-sm font-bold truncate transition-colors ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900 group-hover:text-blue-600'}`}>
          {task.title}
        </p>
        
        {/* Render subtasks progress if they exist */}
        {task.subtasks && task.subtasks.length > 0 && !isCompleted && (
           <div className="flex items-center gap-1.5 mt-0.5">
             <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
               <div className="h-full bg-blue-400" style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}></div>
             </div>
             <span className="text-[9px] text-gray-400 font-bold">{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
           </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <Link to="/focus" className="text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 w-6 h-6 rounded-lg flex items-center justify-center transition-colors">
              <PlaySquare className="w-3 h-3"/>
           </Link>
        </div>
        
        {task.energy && task.energy !== 'medium' && (
           <span className="text-sm" title={`Energy: ${task.energy}`}>{task.energy === 'high' ? '⚡' : '🔋'}</span>
        )}
        
        {task.priority !== 'none' && (
          <span className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded-md ${task.priority === 'urgent' ? 'bg-red-50 text-red-600' : task.priority === 'high' ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
            {task.priority}
          </span>
        )}
        
        {task.dueDate ? (
          <div className="flex flex-col items-end">
            <span className={`text-[10px] font-bold flex items-center gap-1 ${isCompleted ? 'text-gray-300' : isBefore(task.dueDate, new Date()) && !isSameDay(task.dueDate, new Date()) ? 'text-red-500' : 'text-blue-600'}`}>
               <CalendarIcon className="w-2.5 h-2.5"/> {format(task.dueDate, 'MMM d')}
            </span>
          </div>
        ) : (
          <div className="w-[40px]" />
        )}
      </div>
    </div>
  );
}

export default function Tasks() {
  const { user } = useAuthStore();
  const { tasks, subscribe, addTask, updateTask, loading } = useTasksStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [search, setSearch] = useState('');
  
  const [activeList, setActiveList] = useState('All');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const SMART_LISTS = ['All', 'Today', 'Upcoming', 'Urgent', 'Overdue', 'Quick (<15m)', 'Study', 'Work', 'Personal'];
  
  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = subscribe(user.uid);
      return () => unsubscribe();
    }
  }, [user?.uid, subscribe]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    // We only drag within active tasks
    const activeTasks = filteredTasks.filter(t => t.status !== 'completed').sort((a,b) => a.order - b.order);
    const oldIndex = activeTasks.findIndex(t => t.id === active.id);
    const newIndex = activeTasks.findIndex(t => t.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
       const newOrder = arrayMove(activeTasks, oldIndex, newIndex);
       // Simple order update (in real app, distribute weights mathematically to avoid O(N) updates)
       newOrder.forEach((task, index) => {
         if(task.order !== index) updateTask(task.id, { order: index });
       });
    }
  };

  const handleAddTask = async (e: React.FormEvent, providedTitle?: string) => {
    if (e) e.preventDefault();
    const title = providedTitle || newTaskTitle;
    if (!title.trim() || !user) return;
    
    await addTask({
      title: title,
      status: 'todo',
      userId: user.uid,
      listId: activeList === 'All' || activeList === 'Today' || activeList === 'Upcoming' || activeList === 'Urgent' || activeList === 'Overdue' || activeList === 'Quick (<15m)' ? 'Personal' : activeList,
      order: Date.now(),
      priority: 'none',
      tags: [],
      category: activeList === 'All' || activeList === 'Today' || activeList === 'Upcoming' || activeList === 'Urgent' || activeList === 'Overdue' || activeList === 'Quick (<15m)' ? 'Personal' : activeList,
    });
    setNewTaskTitle('');
  };

  const handleSaveModalTask = async (formData: any) => {
    if (!user) return;
    if (editingTask) {
      await updateTask(editingTask.id, {
         title: formData.title,
         description: formData.description,
         priority: formData.priority,
         category: formData.category,
         dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : undefined,
         estimatedTime: parseInt(formData.estimatedTime) || undefined,
         energy: formData.energy,
         subtasks: formData.subtasks
      });
    } else {
      await addTask({
         userId: user.uid,
         title: formData.title,
         description: formData.description,
         status: 'todo',
         priority: formData.priority,
         category: formData.category,
         dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : undefined,
         estimatedTime: parseInt(formData.estimatedTime) || undefined,
         energy: formData.energy,
         subtasks: formData.subtasks,
         order: Date.now(),
         tags: []
      });
    }
  };

  const completedCount = tasks.filter(t => t.status === 'completed' && isSameDay(new Date(t.updatedAt), new Date())).length;
  const pendingCount = tasks.filter(t => t.status !== 'completed').length;
  const urgentCount = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;

  const now = new Date();
  
  const baseFiltered = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  const filteredTasks = baseFiltered.filter(t => {
    if (activeList === 'All') return true;
    if (activeList === 'Today') return t.dueDate && isSameDay(t.dueDate, now);
    if (activeList === 'Upcoming') return t.dueDate && t.dueDate > now.getTime() && !isSameDay(t.dueDate, now);
    if (activeList === 'Urgent') return t.priority === 'urgent' || t.priority === 'high';
    if (activeList === 'Overdue') return t.dueDate && isBefore(t.dueDate, now) && !isSameDay(t.dueDate, now);
    if (activeList === 'Quick (<15m)') return t.estimatedTime && t.estimatedTime <= 15;
    if (activeList === 'Study') return t.category === 'Study' || t.listId === 'Study';
    if (activeList === 'Work') return t.category === 'Work' || t.listId === 'Work';
    if (activeList === 'Personal') return t.category === 'Personal' || t.listId === 'Personal';
    return true;
  });

  const activeTasks = filteredTasks.filter(t => t.status !== 'completed').sort((a,b) => a.order - b.order);
  const completedTasks = filteredTasks.filter(t => t.status === 'completed').sort((a,b) => b.updatedAt - a.updatedAt);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <TaskModal 
         isOpen={isTaskModalOpen} 
         onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }} 
         onSave={handleSaveModalTask} 
         initialData={editingTask} 
      />

      {/* DASHBOARD HEADER - Improved for mobile */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4 hidden md:block">
        <h1 className="text-xl font-black tracking-tight text-gray-900 mb-1">Tasks Overview</h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">Manage your daily priorities</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex flex-col items-start px-4">
             <span className="text-xl font-black text-gray-900">{tasks.length}</span>
             <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Total</span>
          </div>
          <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex flex-col items-start px-4">
             <span className="text-xl font-black text-gray-900">{completedCount}</span>
             <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Done Today</span>
          </div>
          <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex flex-col items-start px-4">
             <span className="text-xl font-black text-gray-900">{urgentCount}</span>
             <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Urgent</span>
          </div>
          <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex flex-col items-start px-4">
             <span className="text-xl font-black text-gray-900">{activeTasks.filter(t => t.estimatedTime && t.estimatedTime <= 15).length}</span>
             <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Quick Wins</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* SMART LISTS - Horizontal on mobile, sidebar on desktop */}
        <div className="md:w-52 shrink-0 overflow-visible">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 ml-2 hidden md:block">Smart Lists</h3>
          <div className="flex md:flex-col gap-1.5 overflow-x-auto no-scrollbar pb-2 md:pb-0 scroll-smooth">
            {SMART_LISTS.map(list => (
              <button 
                key={list}
                onClick={() => setActiveList(list)}
                className={cn(
                  "whitespace-nowrap px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center group active:scale-95",
                  activeList === list 
                    ? "bg-gray-900 text-white shadow-lg shadow-gray-200" 
                    : "bg-white border border-gray-100 text-gray-500 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
                )}
              >
                <span>{list}</span>
              </button>
            ))}
          </div>
        </div>

        {/* MAIN TASK AREA */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-gray-900 leading-none">{activeList}</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{activeTasks.length} tasks</p>
            </div>
            <Button onClick={() => setIsTaskModalOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 h-10 font-bold shadow-md shadow-blue-100 hidden md:flex">
               <Plus className="w-4 h-4 mr-1.5 stroke-[3]"/> Add Task
            </Button>
          </div>

          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Search tasks..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-11 bg-white border-none shadow-sm rounded-xl text-sm ring-1 ring-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all font-medium"
            />
          </div>

          <div className="mt-6 relative">
            <form onSubmit={handleAddTask} className="mb-4">
              <div className="relative">
                <Input 
                  placeholder="+ Add a new task..." 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="h-14 bg-white shadow-sm border border-gray-100 focus-visible:border-blue-500 rounded-xl text-sm font-bold pl-4 pr-12 transition-all"
                />
                <button 
                  type="submit" 
                  disabled={!newTaskTitle.trim()}
                  className="absolute right-2 top-2 w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-100 active:scale-95 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none transition-all"
                >
                   <Plus className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            </form>

        <div className="flex gap-1.5 bg-gray-50/50 p-2 rounded-xl mb-4 overflow-x-auto border border-gray-100 items-center scrollbar-hide">
          <div className="flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 mr-1 opacity-60">
             <Sparkles className="w-3 h-3" />
          </div>
          {AI_SUGGESTIONS.map(s => (
             <button 
                key={s}
                onClick={(e) => handleAddTask(e, s)}
                className="whitespace-nowrap flex-shrink-0 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-white border border-gray-100 text-gray-500 hover:bg-white hover:text-blue-600 transition-colors shadow-sm"
              >
                {s}
             </button>
          ))}
        </div>

        {!loading && activeTasks.length === 0 && search === '' && (
           <div className="py-12 text-center text-gray-400">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-20 text-gray-500" />
              <p className="font-semibold text-lg text-gray-500">Inbox Zero!</p>
              <p className="text-sm">Enjoy your clean slate.</p>
           </div>
        )}

        {/* Active Tasks List */}
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <SortableContext items={activeTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {activeTasks.map(task => (
                <SortableTaskItem 
                  key={task.id} 
                  task={task} 
                  onUpdate={updateTask} 
                  onEdit={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }} 
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

          {/* Completed Section (Collapsible) */}
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
                    <SortableTaskItem 
                      key={task.id} 
                      task={task} 
                      onUpdate={updateTask} 
                      onEdit={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }} 
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
       </div>
      </div>
    </div>
  );
}
