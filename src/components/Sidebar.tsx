import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Activity, 
  Timer, 
  BookText, 
  LogOut,
  Settings,
  Download,
  BarChart2,
  Zap
} from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { auth } from '../firebase';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function Sidebar({ mobile, onNavigate }: { mobile?: boolean, onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const { isInstallable, installPWA } = usePWAInstall();

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/analytics', icon: BarChart2, label: 'Analytics' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/habits', icon: Activity, label: 'Habits' },
    { to: '/focus', icon: Timer, label: 'Focus Tracker' },
    { to: '/countdowns', icon: Timer, label: 'Countdowns' },
    { to: '/notes', icon: BookText, label: 'Notes' },
  ];

  return (
    <aside className={cn("w-[200px] bg-sidebar text-sidebar-foreground flex flex-col h-full", mobile ? "" : "border-r border-sidebar-border hidden md:flex")}>
      <div className={cn("mb-4 px-5 pt-5 flex items-center gap-2", mobile ? "hidden" : "flex")}>
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
           <Zap className="w-5 h-5 fill-white" />
        </div>
        <div className="font-black text-gray-900 text-xl tracking-tighter leading-none">TaskFlow</div>
      </div>

      <div className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 mt-2">
        My Space
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {links.map((link) => {
          const active = pathname.startsWith(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                active 
                  ? "bg-sidebar-accent text-sidebar-primary font-semibold" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <link.icon className="w-4 h-4" strokeWidth={2} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-1 mt-auto">
        {isInstallable && (
          <Button onClick={installPWA} size="sm" className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm mb-3 h-9">
            <Download className="w-3.5 h-3.5" />
            Install App
          </Button>
        )}
        <div className="px-3 text-[11px] text-muted-foreground truncate mb-1">
          {user?.email}
        </div>
        <Link to="/settings" onClick={onNavigate}>
          <Button variant="ghost" size="sm" className={cn(
               "w-full justify-start gap-2.5 px-3 h-9",
               pathname === '/settings' ? "bg-sidebar-accent text-sidebar-primary font-semibold" : "text-muted-foreground"
            )}>
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            auth.signOut();
            onNavigate?.();
          }} 
          className="w-full justify-start gap-2.5 px-3 h-9 text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
