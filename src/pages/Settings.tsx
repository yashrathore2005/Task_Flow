import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  LogOut, Download, Trash2, Smartphone, HardDrive, ShieldCheck, 
  Palette, User, Mail, Lock, Bell, Globe, Calendar, Clock, 
  Settings as SettingsIcon, HelpCircle, MessageSquare, Shield, 
  FileText, ChevronRight, ArrowLeft, RefreshCw, Volume2, Database,
  FileDown, FileUp, Zap, LayoutDashboard, Timer, Check, Send
} from 'lucide-react';
import { auth, db } from '../firebase';
import { updateProfile, updateEmail, updatePassword, deleteUser, reauthenticateWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, query, where, getDocs, writeBatch, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, setTheme, accentColor, setAccentColor } = useThemeStore();
  const { isInstallable, installPWA } = usePWAInstall();
  const isOffline = !navigator.onLine;

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // App Settings State (Persisted in LocalStorage for simplicity or Firestore)
  const [language, setLanguage] = useState(localStorage.getItem('tf-language') || 'en');
  const [timezone, setTimezone] = useState(localStorage.getItem('tf-timezone') || 'UTC-5');
  const [dateFormat, setDateFormat] = useState(localStorage.getItem('tf-date-format') || 'MM/DD/YYYY');
  const [weekStart, setWeekStart] = useState(localStorage.getItem('tf-week-start') || 'Monday');

  useEffect(() => {
    localStorage.setItem('tf-language', language);
    localStorage.setItem('tf-timezone', timezone);
    localStorage.setItem('tf-date-format', dateFormat);
    localStorage.setItem('tf-week-start', weekStart);
  }, [language, timezone, dateFormat, weekStart]);

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    try {
      await updateProfile(auth.currentUser, { displayName });
      
      // Update Firestore user document
      const { doc, updateDoc } = await import('firebase/firestore');
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { displayName });
      
      toast.success("Profile name updated");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update profile");
    }
  };

  const handleReauth = async () => {
    if (!auth.currentUser) return;
    const provider = new GoogleAuthProvider();
    await reauthenticateWithPopup(auth.currentUser, provider);
  };

  const handleWipeAllData = async () => {
    if (!user) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Wiping all your productivity data...");
    try {
      const collections = ['tasks', 'habits', 'moods', 'countdowns', 'focus_sessions', 'notes'];
      let totalDeleted = 0;
      
      for (const coll of collections) {
        const q = query(collection(db, coll), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        
        if (snap.docs.length > 0) {
          const batchSize = 500;
          for (let i = 0; i < snap.docs.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = snap.docs.slice(i, i + batchSize);
            chunk.forEach(d => batch.delete(d.ref));
            await batch.commit();
            totalDeleted += chunk.length;
          }
        }
      }

      toast.success(`Succesfully cleared ${totalDeleted} records. Your workspace is fresh!`, { id: toastId });
      setShowWipeConfirm(false);
    } catch (e) {
      console.error(e);
      toast.error("Wipe failed. Some data might remain.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser || !user) return;
    const toastId = toast.loading("Preparing to delete your account and all data...");
    try {
      setIsSubmitting(true);
      
      // 1. Wipe all associated data first
      const collections = ['tasks', 'habits', 'moods', 'countdowns', 'focus_sessions', 'notes'];
      for (const coll of collections) {
        const q = query(collection(db, coll), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        
        if (snap.docs.length > 0) {
          const batchSize = 500;
          for (let i = 0; i < snap.docs.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = snap.docs.slice(i, i + batchSize);
            chunk.forEach(d => batch.delete(d.ref));
            await batch.commit();
          }
        }
      }

      // 2. Delete user document
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'users', user.uid));

      // 3. Delete the Auth account
      try {
        await deleteUser(auth.currentUser);
      } catch (err: any) {
        if (err.code === 'auth/requires-recent-login') {
          toast.info("Re-authentication required to delete account.", { id: toastId });
          await handleReauth();
          await deleteUser(auth.currentUser!);
        } else {
          throw err;
        }
      }
      
      toast.success("Account and data deleted forever. See you around!", { id: toastId });
      navigate('/');
    } catch (e) {
      console.error(e);
      toast.error("Error deleting account. Please try again.", { id: toastId });
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!feedback.trim()) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user?.uid,
        userEmail: user?.email,
        content: feedback,
        createdAt: serverTimestamp()
      });
      toast.success("Thank you for your feedback!");
      setFeedback('');
      setShowSupportForm(false);
    } catch (e) {
      toast.error("Failed to send feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
         const base64String = reader.result as string;
         if (base64String.length > 512000) { // Keep it small for Auth profile photo if using base64
           toast.error("Image too large. Max 500KB.");
           setUploading(false);
           return;
         }
         await updateProfile(auth.currentUser!, { photoURL: base64String });
         toast.success("Profile photo updated");
         setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      toast.error("Upload failed");
      setUploading(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    const toastId = toast.loading("Preparing your workspace data...");
    try {
      const collections = ['tasks', 'habits', 'moods', 'countdowns', 'focus_sessions'];
      const data: any = {};
      
      for (const coll of collections) {
         const q = query(collection(db, coll), where('userId', '==', user.uid));
         const snap = await getDocs(q);
         data[coll] = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `taskflow_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.dismiss(toastId);
      toast.success("Data exported successfully!");
    } catch (e) {
      toast.error("Backup failed. Data remains secure locally.");
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file || !user) return;
     
     const reader = new FileReader();
     reader.onload = async (event) => {
        try {
           const data = JSON.parse(event.target?.result as string);
           const batch = writeBatch(db);
           let count = 0;
           
           for (const coll in data) {
              data[coll].forEach((item: any) => {
                 const { id, ...rest } = item;
                 const docRef = doc(collection(db, coll));
                 batch.set(docRef, { ...rest, userId: user.uid });
                 count++;
              });
           }
           
           await batch.commit();
           toast.success(`Imported ${count} records successfully!`);
        } catch (e) {
           toast.error("Invalid backup file format");
        }
     };
     reader.readAsText(file);
  };

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

  const Section = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <section className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-border/50 flex items-center gap-3 bg-muted/30">
        <Icon className="w-5 h-5 text-blue-600" />
        <h2 className="font-bold text-foreground">{title}</h2>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </section>
  );

  const Item = ({ label, sublabel, icon: Icon, action, value, children }: { label: string, sublabel?: string, icon?: any, action?: () => void, value?: string, children?: React.ReactNode }) => (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10 group-hover:text-blue-600 transition-colors">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <p className="font-semibold text-foreground leading-tight">{label}</p>
          {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {value && <span className="text-sm font-medium text-muted-foreground">{value}</span>}
        {children}
        {action && (
          <Button variant="ghost" size="icon" onClick={action} className="rounded-full hover:bg-muted">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );

  const accents = [
    { name: 'blue', color: 'bg-blue-600' },
    { name: 'purple', color: 'bg-purple-600' },
    { name: 'emerald', color: 'bg-emerald-600' },
    { name: 'orange', color: 'bg-orange-600' },
    { name: 'rose', color: 'bg-rose-600' },
    { name: 'indigo', color: 'bg-indigo-600' },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto min-h-full pb-32 animate-in fade-in duration-500">
      
      {/* Wipe Confirmation Dialog */}
      <Dialog open={showWipeConfirm} onOpenChange={setShowWipeConfirm}>
        <DialogContent className="rounded-[2.5rem] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-foreground">Wipe All Data?</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              This will erase all your tasks, habits, and progress. You will keep your account but your workspace will be completely empty.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowWipeConfirm(false)} className="rounded-xl font-bold text-muted-foreground hover:text-foreground">Cancel</Button>
            <Button onClick={handleWipeAllData} disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">
              {isSubmitting ? "Wiping..." : "Reset Workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="rounded-[2.5rem] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-foreground">Delete Account?</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              This action is permanent. All your tasks, habits, and productivity data will be erased forever.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} className="rounded-xl font-bold text-muted-foreground hover:text-foreground">Cancel</Button>
            <Button onClick={handleDeleteAccount} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold">
              {isSubmitting ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showSupportForm} onOpenChange={setShowSupportForm}>
        <DialogContent className="rounded-[2.5rem] max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-foreground">Feedback & Support</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Found a bug or have a suggestion? We'd love to hear from you.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <textarea 
               className="w-full h-32 bg-muted border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600/10 outline-none resize-none text-foreground" 
               placeholder="Tell us what's on your mind..."
               value={feedback}
               onChange={(e) => setFeedback(e.target.value)}
             />
          </div>
          <DialogFooter>
            <Button 
              onClick={handleSendFeedback} 
              disabled={isSubmitting || !feedback.trim()} 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold flex items-center justify-center gap-2 text-white"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Settings</h1>
      </div>

      <div className="hidden md:block mb-8">
        <h1 className="text-4xl font-black tracking-tighter text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground font-medium">Manage your account and app preferences.</p>
      </div>

      <div className="space-y-2">
        
        {/* ACCOUNT */}
        <Section title="Account" icon={User}>
          <div className="flex flex-col items-center py-4">
             <div className="relative group overflow-visible">
                <div className={cn(
                  "w-24 h-24 rounded-[2rem] bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-black text-3xl shadow-xl shadow-blue-100 dark:shadow-blue-900/10 border-4 border-card mb-4 overflow-hidden",
                  uploading && "opacity-50 animate-pulse"
                )}>
                  {user?.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : user?.email?.[0].toUpperCase()}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-4 -right-2 w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-card hover:scale-110 transition-transform active:scale-95"
                  title="Upload Photo"
                >
                  <Zap className="w-4 h-4 fill-white" />
                </button>
             </div>
             <p className="font-black text-xl text-foreground">{user?.displayName || 'User'}</p>
             <p className="text-sm text-muted-foreground font-medium">{user?.email}</p>
          </div>

          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Display Name</Label>
              <div className="flex gap-2">
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="rounded-xl border-border h-11 flex-1 bg-card text-foreground" />
                <Button onClick={handleUpdateProfile} className="rounded-xl h-11 bg-blue-600 font-bold shrink-0 text-white">Update</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
              <Input value={email} disabled className="rounded-xl border-border h-11 bg-muted text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-1 pt-4">
            <Button variant="ghost" onClick={() => toast.info("Check your email to change password")} className="w-full justify-between h-12 rounded-xl text-foreground hover:bg-muted">
              <span className="flex items-center gap-3"><Lock className="w-4 h-4" /> Change Password</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
            </Button>
            <Button variant="ghost" onClick={() => auth.signOut()} className="w-full justify-between h-12 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-700">
              <span className="flex items-center gap-3"><LogOut className="w-4 h-4" /> Sign Out</span>
              <ChevronRight className="w-4 h-4 text-red-200" />
            </Button>
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(true)} className="w-full justify-between h-12 rounded-xl text-red-700 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">
              <span className="flex items-center gap-3"><Trash2 className="w-4 h-4" /> Delete Account</span>
              <ChevronRight className="w-4 h-4 text-red-200" />
            </Button>
          </div>
        </Section>

        {/* APP SETTINGS */}
        <Section title="App Settings" icon={Palette}>
          <Item label="Appearance" sublabel="Choose your aesthetic preference" icon={Palette}>
            <select 
              className="bg-muted border-none rounded-xl px-4 py-2 text-sm font-bold text-foreground outline-none cursor-pointer hover:bg-muted/80 transition-colors"
                onChange={(e) => setTheme(e.target.value as any)}
                value={theme}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
            </select>
          </Item>
          
          <Item label="Theme Accent" sublabel="Pick your primary color" icon={Zap}>
             <div className="flex gap-2">
                {accents.map(a => (
                  <button 
                    key={a.name}
                    onClick={() => setAccentColor(a.name as any)}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-75",
                      a.color,
                      accentColor === a.name ? "ring-4 ring-offset-2 ring-muted" : "opacity-30 hover:opacity-100"
                    )}
                  >
                    {accentColor === a.name && <Check className="w-3 h-3 text-white" />}
                  </button>
                ))}
             </div>
          </Item>

          <Item label="Language" icon={Globe}>
             <select 
                className="bg-muted border-none rounded-xl px-4 py-2 text-sm font-bold text-foreground outline-none cursor-pointer"
                value={language}
                onChange={e => setLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
             </select>
          </Item>

          <Item label="Time Zone" icon={Globe}>
             <select 
                className="bg-muted border-none rounded-xl px-4 py-2 text-sm font-bold text-foreground outline-none cursor-pointer"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
              >
                <option value="UTC-5">UTC-5 (EST)</option>
                <option value="UTC+0">UTC+0 (GMT)</option>
                <option value="UTC+5:30">UTC+5:30 (IST)</option>
                <option value="UTC+8">UTC+8 (SGT)</option>
             </select>
          </Item>

          <Item label="Date Format" icon={Calendar}>
             <select 
                className="bg-muted border-none rounded-xl px-4 py-2 text-sm font-bold text-foreground outline-none cursor-pointer"
                value={dateFormat}
                onChange={e => setDateFormat(e.target.value)}
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
             </select>
          </Item>
          
          <Item label="Notifications" sublabel="Push, Email, and In-app" icon={Bell}>
             <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer shadow-inner">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md"></div>
             </div>
          </Item>
        </Section>

        {/* PRODUCTIVITY */}
        <Section title="Productivity" icon={Zap}>
          <Item label="Pomodoro" sublabel="Work/Break intervals" icon={Timer} value="25/5 min" />
          <Item label="Week Start" icon={Calendar}>
             <select 
                className="bg-muted border-none rounded-xl px-4 py-2 text-sm font-bold text-foreground outline-none cursor-pointer"
                value={weekStart}
                onChange={e => setWeekStart(e.target.value)}
              >
                <option value="Monday">Monday</option>
                <option value="Sunday">Sunday</option>
             </select>
          </Item>
        </Section>

        {/* DATA */}
        <Section title="Data & Privacy" icon={Database}>
          <div className="grid grid-cols-2 gap-3">
             <Button onClick={handleExportData} variant="outline" className="h-16 rounded-2xl border-border flex flex-col gap-1 items-start px-4 text-muted-foreground hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-100 hover:text-blue-600">
               <FileDown className="w-4 h-4" />
               <span className="text-xs font-bold">Export JSON</span>
             </Button>
             <div className="relative">
               <input 
                 type="file" 
                 id="import-json" 
                 className="hidden" 
                 accept=".json" 
                 onChange={handleImportData}
               />
               <Button variant="outline" className="h-16 w-full rounded-2xl border-border flex flex-col gap-1 items-start px-4 text-muted-foreground hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-100 hover:text-blue-600 cursor-pointer" onClick={() => document.getElementById('import-json')?.click()}>
                 <FileUp className="w-4 h-4" />
                 <span className="text-xs font-bold">Import JSON</span>
               </Button>
             </div>
          </div>
          <Item label="Sync Status" sublabel="Last synced moments ago" icon={RefreshCw}>
             <div className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">Live</div>
          </Item>
          <Item label="Clear Cache" sublabel="Resets local storage" icon={HardDrive} action={handleClearCache} />
          <Item label="Wipe All Data" sublabel="Permanent reset of all records" icon={Trash2} action={() => setShowWipeConfirm(true)}>
             <Button variant="ghost" onClick={() => setShowWipeConfirm(true)} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/10 text-[10px] font-black uppercase tracking-widest px-3 h-8 rounded-lg">Wipe</Button>
          </Item>
        </Section>

        {/* SUPPORT */}
        <Section title="Support" icon={HelpCircle}>
          <Item label="Help Center" icon={HelpCircle} action={() => toast.info("Opening Help Center...")} />
          <Item label="Send Feedback" icon={MessageSquare} action={() => setShowSupportForm(true)} />
          <Item label="Privacy Policy" icon={Shield} action={() => toast.info("Directing to Privacy Policy...")} />
          <Item label="Terms of Service" icon={FileText} action={() => toast.info("Directing to Terms...")} />
        </Section>

        <p className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] pt-8">
          Crafted with passion by TF Team<br/>
          &copy; 2026 TaskFlow PWA
        </p>
      </div>

    </div>
  );
}

