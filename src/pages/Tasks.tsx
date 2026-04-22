import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTasksStore, Task } from '../store/tasksStore';
import { Button } from '../components/ui/button';
import { Plus, Search, Sparkles } from 'lucide-react';
import { Input } from '../components/ui/input';
import { isSameDay, isBefore } from 'date-fns';
import { TaskModal } from '../components/tasks/TaskModal';
import { TaskHeader } from '../components/tasks/TaskHeader';
import { TaskFilters, TaskFilterKey } from '../components/tasks/TaskFilters';
import { TaskList } from '../components/tasks/TaskList';

const AI_SUGGESTIONS: string[] = [];

const FILTERS: TaskFilterKey[] = [
  { key: 'Today', label: 'Today' },
  { key: 'Upcoming', label: 'Upcoming' },
  { key: 'Overdue', label: 'Overdue' },
  { key: 'Important', label: 'Important' },
  { key: 'All', label: 'All' }
];

export default function Tasks() {
  const user = useAuthStore(state => state.user);
  const tasks = useTasksStore(state => state.tasks);
  const subscribe = useTasksStore(state => state.subscribe);
  const addTask = useTasksStore(state => state.addTask);
  const updateTask = useTasksStore(state => state.updateTask);
  const loading = useTasksStore(state => state.loading);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [search, setSearch] = useState('');
  const [activeList, setActiveList] = useState('Today');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (user?.uid) {
      const unsubscribeConnection = subscribe(user.uid);
      return () => unsubscribeConnection();
    }
  }, [user?.uid, subscribe]);

  const handleAddTask = useCallback(async (e?: React.FormEvent, providedTitle?: string) => {
    if (e) e.preventDefault();
    const title = providedTitle || newTaskTitle;
    if (!title.trim() || !user) return;
    
    await addTask({
      title: title,
      status: 'todo',
      userId: user.uid,
      listId: 'Personal',
      order: Date.now(),
      priority: 'none',
      tags: [],
      category: 'Personal',
    });
    setNewTaskTitle('');
  }, [addTask, newTaskTitle, user]);

  const handleSaveModalTask = useCallback(async (formData: any) => {
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
    setIsTaskModalOpen(false);
    setEditingTask(null);
  }, [addTask, updateTask, editingTask, user]);

  const stats = useMemo(() => {
    const today = new Date();
    return {
      total: tasks.length,
      completedToday: tasks.filter(t => t.status === 'completed' && isSameDay(new Date(t.updatedAt), today)).length,
      urgent: tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length,
      important: tasks.filter(t => (t.priority === 'high' || t.priority === 'urgent') && t.status !== 'completed').length
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const now = new Date();
    const searchLower = search.toLowerCase();
    
    return tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;

      if (activeList === 'All') return true;
      if (activeList === 'Today') return t.dueDate && isSameDay(t.dueDate, now);
      if (activeList === 'Upcoming') return t.dueDate && t.dueDate > now.getTime() && !isSameDay(t.dueDate, now);
      if (activeList === 'Important') return t.priority === 'urgent' || t.priority === 'high';
      if (activeList === 'Overdue') return t.dueDate && isBefore(t.dueDate, now) && !isSameDay(t.dueDate, now);
      
      return true;
    });
  }, [tasks, search, activeList]);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-24 p-3 sm:p-0 animate-in fade-in duration-500">
      <TaskModal 
         isOpen={isTaskModalOpen} 
         onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }} 
         onSave={handleSaveModalTask} 
         initialData={editingTask} 
      />

      <TaskHeader 
        totalTasks={stats.total}
        completedToday={stats.completedToday}
        urgentTasks={stats.urgent}
        importantTasks={stats.important}
      />

      <div className="flex flex-col md:flex-row gap-4">
        <TaskFilters 
          filters={FILTERS}
          activeFilter={activeList}
          onFilterChange={setActiveList}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground leading-none">{activeList}</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                {filteredTasks.filter(t => t.status !== 'completed').length} tasks
              </p>
            </div>
            <Button onClick={() => setIsTaskModalOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 h-10 font-bold shadow-md shadow-blue-100 hidden md:flex border-none">
               <Plus className="w-4 h-4 mr-1.5 stroke-[3]"/> Add Task
            </Button>
          </div>

          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search tasks..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-11 bg-card border-none shadow-sm rounded-xl text-sm ring-1 ring-border focus-visible:ring-2 focus-visible:ring-blue-500 transition-all font-medium"
            />
          </div>

          <div className="mt-6 relative">
            <form onSubmit={(e) => handleAddTask(e)} className="mb-4">
              <div className="relative">
                <Input 
                  placeholder="+ Add a new task..." 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="h-14 bg-card shadow-sm border border-border focus-visible:border-blue-500 rounded-xl text-sm font-bold pl-4 pr-12 transition-all"
                />
                <button 
                  type="submit" 
                  disabled={!newTaskTitle.trim()}
                  className="absolute right-2 top-2 w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-100 active:scale-95 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none transition-all"
                >
                   <Plus className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            </form>

            <div className="flex gap-1.5 bg-muted/30 p-2 rounded-xl mb-4 overflow-x-auto border border-border items-center scrollbar-hide">
              <div className="flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 mr-1 opacity-60">
                 <Sparkles className="w-3 h-3" />
              </div>
              {AI_SUGGESTIONS.map(s => (
                 <button 
                    key={s}
                    onClick={(e) => handleAddTask(undefined, s)}
                    className="whitespace-nowrap flex-shrink-0 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-card border border-border text-muted-foreground hover:bg-card hover:text-blue-600 transition-colors shadow-sm"
                  >
                    {s}
                 </button>
              ))}
            </div>

            <TaskList 
              tasks={filteredTasks}
              loading={loading}
              search={search}
              showCompleted={showCompleted}
              setShowCompleted={setShowCompleted}
              onUpdate={updateTask}
              onEdit={handleEditTask}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
