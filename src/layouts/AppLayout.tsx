import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Menu, Plus, CheckSquare, Activity, Timer, Clock, MoreHorizontal, Calendar as CalendarIcon, BookText, LayoutDashboard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import { cn } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { useGlobalKeyboardShortcuts } from '../lib/useGlobalShortcuts';

export default function AppLayout() {
  useGlobalKeyboardShortcuts();
  
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const isRouteActive = (path: string) => location.pathname.startsWith(path);

  // Floating button quick add logic could go here
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');

  const quickAddTask = async () => {
    // Quick add task implementation
    setIsQuickAddOpen(false);
    setQuickTitle('');
  };

  return (
    <div className="flex bg-[#f5f5f5] min-h-screen text-gray-900 font-sans">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Desktop Header / Top Nav replacement could go here if needed, but keeping it minimal */}

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 space-y-6">
          <Outlet />
        </div>

        {/* Floating Action Button (Mobile) */}
        <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
          <DialogTrigger asChild>
            <button className="md:hidden absolute bottom-[84px] right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 transform hover:scale-105 transition-transform">
              <Plus className="w-6 h-6" />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quick Add Task</DialogTitle>
            </DialogHeader>
            <div className="pt-4 flex gap-4">
              <Input placeholder="What needs to be done?" value={quickTitle} onChange={e => setQuickTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && quickAddTask()}/>
              <Button onClick={quickAddTask} className="bg-blue-600">Add</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-40 pb-safe">
          <Link to="/tasks" className={cn("flex flex-col items-center gap-1", isRouteActive('/tasks') ? "text-blue-600" : "text-gray-400")}>
            <CheckSquare className="w-6 h-6" fill={isRouteActive('/tasks') ? "currentColor" : "none"} strokeWidth={isRouteActive('/tasks') ? 1.5 : 2} />
            <span className="text-[10px] font-medium">Tasks</span>
          </Link>
          <Link to="/habits" className={cn("flex flex-col items-center gap-1", isRouteActive('/habits') ? "text-blue-600" : "text-gray-400")}>
            <Activity className="w-6 h-6" />
            <span className="text-[10px] font-medium">Habits</span>
          </Link>
          <Link to="/focus" className={cn("flex flex-col items-center gap-1", isRouteActive('/focus') ? "text-blue-600" : "text-gray-400")}>
            <Timer className="w-6 h-6" />
            <span className="text-[10px] font-medium">Focus</span>
          </Link>
          <Link to="/countdowns" className={cn("flex flex-col items-center gap-1", isRouteActive('/countdowns') ? "text-blue-600" : "text-gray-400")}>
            <Clock className="w-6 h-6" />
            <span className="text-[10px] font-medium">Countdown</span>
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className={cn("flex flex-col items-center gap-1", isRouteActive('/dashboard') || isRouteActive('/calendar') || isRouteActive('/notes') ? "text-blue-600" : "text-gray-400")}>
                <MoreHorizontal className="w-6 h-6" />
                <span className="text-[10px] font-medium">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="p-0 rounded-t-3xl h-[60vh]">
              <div className="p-6">
                <h3 className="font-bold text-xl mb-6 text-gray-900 border-b pb-4">Menu</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <LayoutDashboard className="w-5 h-5 text-blue-600" /><span className="font-medium text-gray-700">Dashboard</span>
                  </Link>
                  <Link to="/calendar" onClick={() => setOpen(false)} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <CalendarIcon className="w-5 h-5 text-blue-600" /><span className="font-medium text-gray-700">Calendar</span>
                  </Link>
                  <Link to="/notes" onClick={() => setOpen(false)} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <BookText className="w-5 h-5 text-blue-600" /><span className="font-medium text-gray-700">Notes</span>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </main>
    </div>
  );
}
