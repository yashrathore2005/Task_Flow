import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Button } from '../components/ui/button';
import { LogOut, Download, Trash2, Smartphone, HardDrive, ShieldCheck, Palette } from 'lucide-react';
import { auth } from '../firebase';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { isInstallable, installPWA } = usePWAInstall();
  const isOffline = !navigator.onLine;

  const handleClearCache = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        toast.success("Cache cleared successfully. Reloading...");
        setTimeout(() => window.location.reload(), 1000);
      } catch (e) {
        toast.error("Failed to clear cache");
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto min-h-full pb-20 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tighter text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-500">Manage your app experience and offline data.</p>
      </div>

      <div className="space-y-6">
        
        {/* Account Info */}
        <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{user?.displayName || 'User'}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full rounded-xl text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700" onClick={() => auth.signOut()}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </section>

        {/* PWA Settings */}
        <section className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-gray-600" />
            App Experience
          </h2>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <p className="font-semibold text-gray-900">Install App</p>
              <p className="text-sm text-gray-500">Get the full fullscreen experience</p>
            </div>
            <div className="mt-3 sm:mt-0">
              {isInstallable ? (
                 <Button onClick={installPWA} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                    <Download className="w-4 h-4 mr-2" />
                    Install Now
                 </Button>
              ) : (
                <div className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-bold rounded-lg flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Installed
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <p className="font-semibold text-gray-900 flex items-center gap-2"><Palette className="w-4 h-4 text-gray-600"/> Theme</p>
              <p className="text-sm text-gray-500">Choose your preferred appearance</p>
            </div>
            <div className="mt-3 sm:mt-0">
              <select 
                className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-900 outline-none cursor-pointer hover:border-gray-300 transition-colors shadow-sm"
                onChange={(e) => setTheme(e.target.value as any)}
                value={theme}
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
                <option value="system">System Default</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                Offline Mode Status
                {isOffline ? (
                   <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                ) : (
                   <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </p>
              <p className="text-sm text-gray-500">{isOffline ? 'Working offline. Sync paused.' : 'Online and syncing.'}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <p className="font-semibold text-gray-900">Storage & Cache</p>
              <p className="text-sm text-gray-500">Free up space or force update</p>
            </div>
            <div className="mt-3 sm:mt-0">
               <Button onClick={handleClearCache} variant="outline" className="rounded-xl text-orange-600 border-orange-100 hover:bg-orange-50 hover:text-orange-700 w-full sm:w-auto">
                  <HardDrive className="w-4 h-4 mr-2" />
                  Clear Cache
               </Button>
            </div>
          </div>

        </section>

        <p className="text-center text-xs text-gray-400">
          TaskFlow Suite v1.0.1 <br/>
          Built with PWA Technology
        </p>
      </div>

    </div>
  );
}
