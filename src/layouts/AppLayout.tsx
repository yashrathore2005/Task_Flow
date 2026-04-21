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
  const [quickTitle, setQuickTitle] = useState('');

  const quickAddTask = async () => {
    setIsQuickAddOpen(false);
    setQuickTitle('');
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
    <div className="flex bg-[#F8F9FA] min-h-screen text-gray-900 font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Sticky Header */}
        <header className="md:hidden sticky top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 z-50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <span className="font-black text-xl tracking-tighter text-gray-900">TaskFlow</span>
          </div>
          <div className="flex items-center gap-2">
             <Link to="/settings" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm hover:ring-2 hover:ring-blue-500/20 transition-all active:scale-95">
                {user?.photoURL ? (
                  <img src={user.photoURL} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <User className="w-5 h-5 text-gray-500" />
                )}
             </Link>
          </div>
        </header>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 pb-28 md:p-8 space-y-6 scroll-smooth">
          <Outlet />
        </div>

        {/* Floating Action Button (Mobile) - Positioned above bottom nav */}
        <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
          <DialogTrigger render={<button className="md:hidden fixed bottom-[96px] right-6 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-center z-50 transform active:scale-95 transition-all outline-none" />}>
             <Plus className="w-7 h-7 stroke-[3]" />
          </DialogTrigger>
          <DialogContent className="rounded-t-3xl sm:rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-xl font-bold">Quick Task</DialogTitle>
            </DialogHeader>
            <div className="p-6 pt-4 flex flex-col gap-4">
              <Input 
                autoFocus
                placeholder="What needs to be done?" 
                value={quickTitle} 
                onChange={e => setQuickTitle(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && quickAddTask()}
                className="h-14 text-lg rounded-2xl border-gray-100 bg-gray-50"
              />
              <Button onClick={quickAddTask} className="h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold text-lg shadow-lg shadow-blue-100">Add Task</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Mobile Bottom Navigation - Redesigned */}
        <div className="md:hidden fixed bottom-1 left-4 right-4 bg-white/95 backdrop-blur-md border border-gray-100 z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] rounded-[2.5rem]">
          <nav className="flex items-center overflow-x-auto no-scrollbar scroll-smooth px-2 h-20 scrollbar-hide">
            <div className="flex items-center min-w-max mx-auto gap-0.5">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[70px] px-1 h-16 gap-1 transition-all duration-300 relative rounded-2xl",
                    isRouteActive(item.path) ? "text-blue-600" : "text-gray-400 group"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-xl transition-all duration-500 relative",
                    isRouteActive(item.path) ? "bg-blue-600 shadow-lg shadow-blue-100 text-white -mt-4 scale-110" : "bg-transparent group-active:scale-90"
                  )}>
                    <item.icon className={cn("w-5 h-5", isRouteActive(item.path) ? "stroke-[2.5]" : "stroke-2")} />
                    
                    {item.badge !== undefined && item.badge !== null && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] tracking-tight transition-all duration-300 uppercase font-black",
                    isRouteActive(item.path) ? "scale-100 opacity-100 mt-2" : "scale-90 opacity-80"
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
