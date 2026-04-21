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
    <div ref={setNodeRef} style={style} className={`bg-white border hover:border-blue-200 transition-colors shadow-sm rounded-2xl mb-3 flex items-center p-3 relative group ${isDragging ? 'shadow-xl' : ''}`}>
      <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 mr-2 px-1">
        <GripVertical className="w-5 h-5" />
      </div>
      
      <button 
        className={`mr-3 rounded-full flex-shrink-0 transition-colors h-6 w-6 flex items-center justify-center ${isCompleted ? 'bg-blue-600 text-white border-blue-600' : 'border-2 border-gray-300 hover:border-blue-400'}`}
        onClick={() => {
          onUpdate(task.id, { status: isCompleted ? 'todo' : 'completed' });
          if (!isCompleted) confetti({ particleCount: 60, spread: 50, origin: { y: 0.8 }, colors: ['#3b82f6', '#60a5fa', '#ffffff'] });
        }}
      >
        {isCompleted && <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />}
      </button>
      
      <div className="flex-1 min-w-0 pr-4 cursor-pointer" onClick={() => onEdit(task)}>
        <p className={`text-base font-semibold truncate transition-colors ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {task.title}
        </p>
        
        {/* Render subtasks progress if they exist */}
        {task.subtasks && task.subtasks.length > 0 && !isCompleted && (
           <div className="flex items-center gap-2 mt-1">
             <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
               <div className="h-full bg-blue-400" style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}></div>
             </div>
             <span className="text-[10px] text-gray-400 font-bold">{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
           </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
           <Link to="/focus" className="text-gray-400 hover:text-blue-500 bg-gray-50 hover:bg-blue-50 w-7 h-7 rounded-full flex items-center justify-center transition-colors">
              <PlaySquare className="w-3.5 h-3.5"/>
           </Link>
        </div>
        
        {task.energy && task.energy !== 'medium' && (
           <span className="text-lg" title={`Energy: ${task.energy}`}>{task.energy === 'high' ? '⚡' : '🔋'}</span>
        )}
        
        {task.priority !== 'none' && (
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${task.priority === 'urgent' ? 'bg-red-100 text-red-700' : task.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
            {task.priority}
          </span>
        )}
        
        {task.dueDate ? (
          <div className="flex flex-col items-end">
            <span className={`text-xs font-medium flex items-center gap-1 ${isCompleted ? 'text-gray-400' : isBefore(task.dueDate, new Date()) && !isSameDay(task.dueDate, new Date()) ? 'text-red-500 font-bold' : 'text-blue-600'}`}>
               <CalendarIcon className="w-3 h-3"/> {format(task.dueDate, 'MMM d')}
            </span>
          </div>
        ) : (
          <div className="w-[60px]" />
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
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-6 hidden md:block">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-2">Tasks Overview</h1>
        <p className="text-gray-500 font-medium mb-6">Manage your daily priorities efficiently.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col items-start">
             <div className="p-2 bg-white rounded-xl mb-3 text-blue-500 shadow-sm"><LayoutGrid className="w-4 h-4"/></div>
             <span className="text-2xl font-black text-gray-900">{tasks.length}</span>
             <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total</span>
          </div>
          <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex flex-col items-start">
             <div className="p-2 bg-white rounded-xl mb-3 text-green-500 shadow-sm"><CheckSquare className="w-4 h-4"/></div>
             <span className="text-2xl font-black text-gray-900">{completedCount}</span>
             <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Done Today</span>
          </div>
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex flex-col items-start">
             <div className="p-2 bg-white rounded-xl mb-3 text-orange-500 shadow-sm"><AlertCircle className="w-4 h-4"/></div>
             <span className="text-2xl font-black text-gray-900">{urgentCount}</span>
             <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Urgent</span>
          </div>
          <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 flex flex-col items-start">
             <div className="p-2 bg-white rounded-xl mb-3 text-purple-500 shadow-sm"><Settings2 className="w-4 h-4"/></div>
             <span className="text-2xl font-black text-gray-900">{activeTasks.filter(t => t.estimatedTime && t.estimatedTime <= 15).length}</span>
             <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quick Wins</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* SMART LISTS - Horizontal on mobile, sidebar on desktop */}
        <div className="md:w-64 shrink-0 overflow-visible">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 ml-2 hidden md:block">Smart Lists</h3>
          <div className="flex md:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0 scroll-smooth">
            {SMART_LISTS.map(list => (
              <button 
                key={list}
                onClick={() => setActiveList(list)}
                className={cn(
                  "whitespace-nowrap px-5 py-3 rounded-2xl font-bold transition-all flex items-center group active:scale-95",
                  activeList === list 
                    ? "bg-gray-900 text-white shadow-xl shadow-gray-200" 
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-gray-900">{activeList}</h2>
              <p className="text-sm font-medium text-gray-500">{activeTasks.length} tasks matching</p>
            </div>
            <Button onClick={() => setIsTaskModalOpen(true)} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 h-12 font-bold shadow-lg shadow-blue-100 hidden md:flex">
               <Plus className="w-5 h-5 mr-2 stroke-[3]"/> Add Task
            </Button>
          </div>

          <div className="relative mb-6">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Search in your tasks..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl text-base ring-1 ring-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
            />
          </div>

          <div className="mt-8 relative">
            <form onSubmit={handleAddTask} className="mb-6">
              <div className="relative">
                <Input 
                  placeholder="+ Add a new task..." 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="h-16 bg-white shadow-md shadow-gray-100 border-2 border-transparent focus-visible:border-blue-500 rounded-2xl text-lg font-medium pl-6 pr-16 transition-all"
                />
                <button 
                  type="submit" 
                  disabled={!newTaskTitle.trim()}
                  className="absolute right-3 top-3 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100 active:scale-95 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none transition-all"
                >
                   <Plus className="w-6 h-6 stroke-[3]" />
                </button>
              </div>
            </form>

        <div className="flex gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-2xl mb-6 overflow-x-auto border border-blue-100 items-center scrollbar-hide">
          <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-2 shadow-sm">
             <Sparkles className="w-4 h-4" />
          </div>
          {AI_SUGGESTIONS.map(s => (
             <button 
                key={s}
                onClick={(e) => handleAddTask(e, s)}
                className="whitespace-nowrap flex-shrink-0 text-sm font-semibold px-3 py-1.5 rounded-xl bg-white border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors shadow-sm"
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
