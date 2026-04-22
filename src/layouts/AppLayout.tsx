import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useTasksStore } from '../store/tasksStore';
import { 
  Menu, Plus, CheckSquare, Activity, Timer, Clock, MoreHorizontal, 
  Calendar as CalendarIcon, BookText, LayoutDashboard, User, Settings as SettingsIcon, Zap
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import { cn } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { useGlobalKeyboardShortcuts } from '../lib/useGlobalShortcuts';
import { useAuthStore } from '../store/authStore';
import { motion } from 'motion/react';
import { TaskModal } from '../components/tasks/TaskModal';

export default function AppLayout() {
  useGlobalKeyboardShortcuts();
  const { user } = useAuthStore();
  const { tasks, subscribe: subscribeTasks } = useTasksStore();
  
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (user?.uid) {
      const unsub = subscribeTasks(user.uid);
      return () => unsub();
    }
  }, [user?.uid, subscribeTasks]);

  const isRouteActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const pendingTasksCount = tasks.filter(t => t.status !== 'completed').length;

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [showMobileOptions, setShowMobileOptions] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');

  const { addTask } = useTasksStore();

  const quickAddTask = async () => {
    if (!quickTitle.trim() || !user) return;
    await addTask({
      userId: user.uid,
      title: quickTitle,
      status: 'todo',
      priority: 'none',
      category: 'Personal',
      order: Date.now(),
      tags: []
    });
    setIsQuickAddOpen(false);
    setQuickTitle('');
  };

  const handleSaveFullTask = async (formData: any) => {
    if (!user) return;
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
    setIsTaskModalOpen(false);
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare, badge: pendingTasksCount > 0 ? pendingTasksCount : null },
    { path: '/calendar', label: 'Calendar', icon: CalendarIcon },
    { path: '/habits', label: 'Habits', icon: Activity },
    { path: '/focus', label: 'Focus', icon: Timer },
    { path: '/countdowns', label: 'Countdown', icon: Clock },
    { path: '/notes', label: 'Notes', icon: BookText },
  ];

  return (
    <div className="flex bg-background min-h-screen text-foreground font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Sticky Header */}
        <header className="md:hidden sticky top-0 left-0 right-0 h-14 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 z-50">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <span className="font-black text-lg tracking-tighter text-foreground">TaskFlow</span>
          </div>
          <div className="flex items-center gap-2">
             <Link to="/settings" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border shadow-sm hover:ring-2 hover:ring-blue-500/20 transition-all active:scale-95">
                {user?.photoURL ? (
                  <img src={user.photoURL} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <User className="w-4 h-4 text-muted-foreground" />
                )}
             </Link>
          </div>
        </header>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 lg:p-7 space-y-3 lg:space-y-6 scroll-smooth">
          <Outlet />
        </div>

        {/* Floating Action Button (Mobile) - Positioned above bottom nav */}
        <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
          <DialogContent className="rounded-t-3xl sm:rounded-2xl p-0 overflow-hidden border-none shadow-2xl bg-card">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-xl font-bold text-foreground">Quick Task Add</DialogTitle>
            </DialogHeader>
            <div className="p-6 pt-4 flex flex-col gap-4">
              <Input 
                autoFocus
                placeholder="What needs to be done?" 
                value={quickTitle} 
                onChange={e => setQuickTitle(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && quickAddTask()}
                className="h-14 text-lg rounded-2xl border-border bg-background"
              />
              <Button onClick={quickAddTask} className="h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold text-lg shadow-lg shadow-blue-100 text-white">Add Task</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Mobile Action Menu */}
        {showMobileOptions && (
          <div className="md:hidden fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowMobileOptions(false)}>
            <div className="fixed bottom-[140px] right-5 flex flex-col items-end gap-3 animate-in slide-in-from-bottom-4 duration-300">
               <button 
                 onClick={() => { setShowMobileOptions(false); setIsTaskModalOpen(true); }}
                 className="flex items-center gap-3 bg-card px-5 py-3 rounded-2xl shadow-xl border border-border active:scale-95 transition-all"
               >
                 <span className="text-sm font-bold text-foreground">Complete Task Setup</span>
                 <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center"><CheckSquare className="w-5 h-5"/></div>
               </button>
               <button 
                 onClick={() => { setShowMobileOptions(false); setIsQuickAddOpen(true); }}
                 className="flex items-center gap-3 bg-card px-5 py-3 rounded-2xl shadow-xl border border-border active:scale-95 transition-all"
               >
                 <span className="text-sm font-bold text-foreground">Quick Task Add</span>
                 <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center"><Plus className="w-5 h-5"/></div>
               </button>
            </div>
          </div>
        )}

        {/* Main Floating Button */}
        <button 
          onClick={() => setShowMobileOptions(!showMobileOptions)}
          className={cn(
            "md:hidden fixed bottom-[84px] right-5 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-200 flex items-center justify-center z-[70] transform transition-all duration-300 active:scale-90 outline-none",
            showMobileOptions ? "rotate-45 bg-foreground text-background shadow-none" : "hover:scale-110"
          )}
        >
           <Plus className={cn("w-7 h-7 stroke-[3]", showMobileOptions ? "text-background" : "text-white")} />
        </button>

        <TaskModal 
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={handleSaveFullTask}
        />

        {/* Mobile Bottom Navigation - Optimized */}
        <div className="md:hidden fixed bottom-1.5 left-2 right-2 bg-card/95 backdrop-blur-md border border-border z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] rounded-2xl">
          <nav className="flex items-center overflow-x-auto no-scrollbar scroll-smooth h-14 scrollbar-hide">
            <div className="flex items-center min-w-max mx-auto px-2">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[58px] h-12 gap-0.5 transition-all duration-300 relative",
                    isRouteActive(item.path) ? "text-blue-600" : "text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-lg transition-all duration-300",
                    isRouteActive(item.path) ? "bg-blue-600 shadow-md shadow-blue-100 text-white -mt-2 scale-105" : "bg-transparent"
                  )}>
                    <item.icon className={cn("w-4 h-4", isRouteActive(item.path) ? "stroke-[2.5]" : "stroke-2")} />
                    
                    {item.badge !== undefined && item.badge !== null && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[7px] font-black min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center border border-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[8px] tracking-tight truncate max-w-[50px] transition-all duration-300 uppercase font-black",
                    isRouteActive(item.path) ? "opacity-100 mt-0.5" : "opacity-70"
                  )}>
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </main>
    </div>
  );
}
