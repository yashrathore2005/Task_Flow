import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Play, Pause, Square, RefreshCcw, Save, Volume2, VolumeX, Maximize2, Minimize2, CloudRain, Coffee, Trees, Wind, AlertCircle, History, TrendingUp, Target, Settings, SkipForward } from 'lucide-react';
import { addDoc, collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { cn } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import confetti from 'canvas-confetti';

const SOUNDS = [
  { id: 'none', label: 'No Sound', icon: VolumeX },
  { id: 'rain', label: 'Rain', icon: CloudRain },
  { id: 'cafe', label: 'Cafe', icon: Coffee },
  { id: 'forest', label: 'Forest', icon: Trees },
  { id: 'white_noise', label: 'White Noise', icon: Wind }
];

export default function Focus() {
  const [mode, setMode] = useState<'pomodoro' | 'stopwatch' | 'countdown' | 'deep_work'>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [distractions, setDistractions] = useState(0);
  const [sound, setSound] = useState('none');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Advanced Focus State
  const [sessionCount, setSessionCount] = useState(4);
  const [currentSession, setCurrentSession] = useState(1);
  const [sessionDuration, setSessionDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [isBreak, setIsBreak] = useState(false);
  const [autoStartNext, setAutoStartNext] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [productivityRating, setProductivityRating] = useState(5);
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [focusMinutesToday, setFocusMinutesToday] = useState(0);
  const [distractionsToday, setDistractionsToday] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'focus_sessions'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setSessions(fetched);
      
      const todayString = new Date().toDateString();
      let minsToday = 0;
      let distToday = 0;
      fetched.forEach((s: any) => {
        if (new Date(s.createdAt).toDateString() === todayString) {
          minsToday += s.durationMinutes || 0;
          distToday += s.distractions || 0;
        }
      });
      setFocusMinutesToday(minsToday);
      setDistractionsToday(distToday);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    let interval: any;
    if (isActive) {
      if (mode === 'pomodoro' || mode === 'countdown' || mode === 'deep_work') {
        if (timeLeft > 0) {
          interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
        } else {
          setIsActive(false);
          handleTimerComplete();
        }
      } else {
        interval = setInterval(() => setElapsedTime((t) => t + 10), 10);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const handleTimerComplete = () => {
    if (mode === 'countdown') {
      handleSessionSave(sessionDuration);
      return;
    }
    // Pomodoro / Deep Work Advanced Flow
    if (isBreak) {
      // Finished break
      if (currentSession < sessionCount) {
        setCurrentSession(s => s + 1);
        setIsBreak(false);
        setTimeLeft(sessionDuration * 60);
        if (autoStartNext) setIsActive(true);
      } else {
        // Should not really happen (break after last session), but just in case
        finishTotalSession();
      }
    } else {
      // Finished work block
      if (currentSession < sessionCount) {
        setIsBreak(true);
        setTimeLeft(breakDuration * 60);
        if (autoStartNext) setIsActive(true);
        toast("Focus block done, time for a break!", { icon: "☕" });
      } else {
        // Finished all sessions
        finishTotalSession();
      }
    }
  };

  const finishTotalSession = () => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    setShowCompletionModal(true);
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen({ navigationUI: 'hide' }).catch(err => console.error(err));
    } else {
      await document.exitFullscreen().catch(err => console.error(err));
    }
  };

  const handleSessionSave = async (overrideDuration?: number) => {
    if (!user) return;
    try {
      let duration = overrideDuration;
      if (duration === undefined) {
         duration = (mode === 'stopwatch') ? Math.floor(elapsedTime / 60000) : 
                    (mode === 'countdown') ? Math.floor(sessionDuration) : 
                    Math.floor(sessionDuration * currentSession); 
      }
      if (duration === 0) duration = 1;

      await addDoc(collection(db, 'focus_sessions'), {
        userId: user.uid,
        durationMinutes: duration,
        type: mode,
        laps: laps,
        distractions: distractions,
        notes: completionNotes,
        rating: productivityRating,
        sessionCount: currentSession,
        createdAt: Date.now()
      });
      toast.success("Focus session saved!");
      resetTimer();
      setShowCompletionModal(false);
      setCompletionNotes('');
      setProductivityRating(5);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save session");
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setDistractions(0);
    setCurrentSession(1);
    setIsBreak(false);
    if (mode === 'pomodoro' || mode === 'deep_work' || mode === 'countdown') setTimeLeft(sessionDuration * 60);
    else { setElapsedTime(0); setLaps([]); }
  };

  const skipBreak = () => {
    setIsBreak(false);
    if (currentSession < sessionCount) {
      setCurrentSession(s => s + 1);
      setTimeLeft(sessionDuration * 60);
      if (autoStartNext) setIsActive(true);
    } else {
      finishTotalSession();
    }
  };

  const changeMode = (newMode: 'pomodoro' | 'stopwatch' | 'countdown' | 'deep_work') => {
    setMode(newMode);
    setIsActive(false);
    setDistractions(0);
    setCurrentSession(1);
    setIsBreak(false);
    
    if (newMode === 'pomodoro') {
      setSessionCount(4);
      setSessionDuration(25);
      setBreakDuration(5);
      setTimeLeft(25 * 60);
    }
    else if (newMode === 'deep_work') {
      setSessionCount(1);
      setSessionDuration(90);
      setBreakDuration(15);
      setTimeLeft(90 * 60);
    }
    else if (newMode === 'countdown') {
      setSessionCount(1);
      setSessionDuration(15);
      setTimeLeft(15 * 60);
    }
    else { setElapsedTime(0); setLaps([]); }
  };

  const addLap = () => setLaps(prev => [...prev, elapsedTime]);
  const logDistraction = () => setDistractions(prev => prev + 1);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const formatMs = (ms: number) => {
    const m = Math.floor(ms / 60000).toString().padStart(2, '0');
    const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    const msStr = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
    return `${m}:${s}.${msStr}`;
  };

  const weeklyChartData = [
    { day: 'Mon', mins: 45 }, { day: 'Tue', mins: 90 },
    { day: 'Wed', mins: 120 }, { day: 'Thu', mins: 60 },
    { day: 'Fri', mins: 110 }, { day: 'Sat', mins: 30 },
    { day: 'Sun', mins: focusMinutesToday }
  ];

  return (
    <div ref={containerRef} className={`w-full max-w-5xl mx-auto min-h-full pb-20 animate-in fade-in duration-500 flex flex-col pt-4 px-2 sm:px-0 ${isFullscreen ? 'bg-gray-100 p-8 justify-center items-center shadow-black/50 overflow-y-auto' : ''}`}>
           {!isFullscreen && (
        <header className="mb-6 text-center sm:text-left">
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 leading-none">Focus</h1>
          <p className="text-gray-400 font-bold mt-0.5 uppercase tracking-widest text-[10px]">Deep work sessions</p>
        </header>
      )}

      {!isFullscreen && (
        <div className="flex flex-wrap gap-1.5 justify-center bg-gray-100 p-1 rounded-xl mb-8 self-center w-full sm:w-auto">
          {['pomodoro', 'deep_work', 'countdown', 'stopwatch'].map((m) => (
            <button 
              key={m}
              onClick={() => changeMode(m as any)} 
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {m.replace('_',' ')}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <div className={`lg:col-span-2 bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-sm border border-gray-100 flex flex-col items-center relative overflow-hidden transition-all ${isFullscreen ? 'w-full max-w-3xl transform scale-105 shadow-lg mx-auto' : 'w-full'}`}>
          <div onClick={toggleFullscreen} className="absolute top-6 right-6 text-gray-300 hover:text-gray-600 cursor-pointer transition-colors z-10">
            {isFullscreen ? <Minimize2 className="w-5 h-5"/> : <Maximize2 className="w-5 h-5" />}
          </div>
          
          <Popover>
            <PopoverTrigger className={`absolute top-6 left-6 cursor-pointer transition-colors border-none bg-transparent z-10 ${sound !== 'none' ? 'text-blue-500' : 'text-gray-300 hover:text-gray-600'}`}>
              {sound === 'none' ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2 rounded-xl border-gray-100 shadow-xl" align="start">
              <h4 className="font-black text-[9px] text-gray-400 uppercase tracking-widest mb-2 px-2">Ambient Sounds</h4>
              <div className="space-y-1">
                {SOUNDS.map(s => {
                  const Icon = s.icon;
                  return (
                    <button key={s.id} onClick={() => setSound(s.id)} className={`w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${sound === s.id ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'}`}>
                      <Icon className="w-3.5 h-3.5" />{s.label}
                    </button>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>

          {isConfiguring ? (
            <div className="w-full flex flex-col items-center flex-1 animate-in slide-in-from-bottom-4 fade-in py-6">
               <h3 className="text-xl font-black mb-6 text-gray-900">Setup Session</h3>
               <div className="w-full max-w-xs space-y-6">
                 {(mode === 'pomodoro' || mode === 'deep_work') && (
                   <div className="space-y-2">
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Sessions</label>
                     <div className="flex gap-2">
                       {[1, 2, 4, 8].map(n => (
                         <button key={n} onClick={() => setSessionCount(n)} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${sessionCount === n ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>{n}</button>
                       ))}
                     </div>
                   </div>
                 )}
                 <div className="space-y-2">
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Work (mins)</label>
                   <Input type="number" min={1} max={180} value={sessionDuration} onChange={(e) => { setSessionDuration(Number(e.target.value)); setTimeLeft(Number(e.target.value)*60); }} className="h-12 rounded-xl bg-gray-50 border-none font-black text-xl text-center focus:bg-white focus:ring-2 focus:ring-blue-600/20 transition-all" />
                 </div>
                 {(mode === 'pomodoro' || mode === 'deep_work') && (
                   <div className="space-y-2">
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Break (mins)</label>
                     <Input type="number" min={1} max={60} value={breakDuration} onChange={(e) => setBreakDuration(Number(e.target.value))} className="h-12 rounded-xl bg-gray-50 border-none font-black text-xl text-center focus:bg-white focus:ring-2 focus:ring-blue-600/20 transition-all" />
                   </div>
                 )}
               </div>
               <Button onClick={() => setIsConfiguring(false)} className="mt-8 rounded-xl px-8 h-12 text-sm font-bold bg-gray-900 text-white hover:bg-gray-800 shadow-lg transition-all active:scale-95">Apply</Button>
            </div>
          ) : (
            <>
              <div className="absolute top-6 right-16 text-gray-300 hover:text-gray-600 cursor-pointer transition-colors z-10" onClick={() => setIsConfiguring(true)}>
                <Settings className="w-5 h-5"/>
              </div>
              <div className="flex flex-col items-center mt-2">
                <p className={cn(
                  "font-black uppercase tracking-[0.3em] text-[9px] mb-1 px-2.5 py-0.5 rounded-full",
                  isBreak ? 'text-orange-500 bg-orange-50' : 'text-blue-600 bg-blue-50'
                )}>
                  {mode === 'stopwatch' ? 'Stopwatch' : mode === 'countdown' ? 'Countdown' : isBreak ? `Break ${currentSession}/${sessionCount}` : `${mode.replace('_',' ')} ${currentSession}/${sessionCount}`}
                </p>
                <h4 className="text-[11px] font-bold text-gray-400 mb-8 sm:mb-12 uppercase tracking-widest">Focus Mode Active</h4>
              </div>

              <div className={cn(
                "w-56 h-56 sm:w-64 sm:h-64 border-[10px] flex items-center justify-center rounded-full mb-10 sm:mb-16 shadow-inner relative transition-all duration-700",
                isFullscreen ? 'scale-110 my-8' : '',
                isBreak ? 'border-orange-50' : 'border-blue-50'
              )}>
                <div className={cn(
                  "absolute inset-0 rounded-full border-[10px] border-t-transparent animate-[spin_4s_linear_infinite] opacity-0 transition-opacity duration-1000",
                  isActive && "opacity-100",
                  isBreak ? 'border-orange-500' : 'border-blue-600'
                )} style={{ animationPlayState: isActive ? 'running' : 'paused' }}/>
                <span className={cn(
                  "text-[4rem] sm:text-[4.5rem] font-black tracking-tighter tabular-nums transition-colors duration-700",
                  isActive ? (isBreak ? 'text-orange-500' : 'text-blue-600') : 'text-gray-900'
                )}>
                  {mode !== 'stopwatch' ? formatTime(timeLeft) : formatMs(elapsedTime).slice(0,5)}
                </span>
                {mode === 'stopwatch' && (
                  <span className="absolute bottom-12 text-xs sm:text-sm font-black text-gray-300 tabular-nums uppercase tracking-widest tracking-tighter">.{formatMs(elapsedTime).slice(-2)}</span>
                )}
              </div>

              <div className="flex flex-col items-center w-full max-w-sm">
                <div className="flex justify-center flex-wrap gap-6 w-full mb-8 relative">
                  {isActive ? (
                    <Button size="icon" onClick={toggleTimer} className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 hover:bg-orange-100 shadow-sm border border-orange-100 transition-all active:scale-95">
                      <Pause className="w-7 h-7 fill-current" />
                    </Button>
                  ) : (
                    <Button size="icon" onClick={toggleTimer} className="w-16 h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-100 transition-all active:scale-95">
                      <Play className="w-7 h-7 fill-current ml-1" />
                    </Button>
                  )}

                  {mode === 'stopwatch' && isActive ? (
                    <Button size="icon" onClick={addLap} className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100 transition-all active:scale-95">
                      <RefreshCcw className="w-7 h-7" />
                    </Button>
                  ) : (
                    <Button size="icon" onClick={resetTimer} className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100 transition-all active:scale-95">
                      <Square className="w-7 h-7 fill-current" />
                    </Button>
                  )}

                  {isBreak && (
                    <Button size="icon" onClick={skipBreak} className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-900 border border-gray-100 transition-all active:scale-95" title="Skip Break">
                      <SkipForward className="w-7 h-7" />
                    </Button>
                  )}
                </div>

                <div className="h-10 flex items-center justify-center">
                  {isActive && !isBreak && (
                     <button onClick={logDistraction} className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-red-50 text-red-600 font-black text-[9px] uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95">
                       <AlertCircle className="w-3.5 h-3.5" /> Distractions: {distractions}
                     </button>
                  )}
                  {isBreak && (
                    <p className="text-orange-500 font-black text-[9px] uppercase tracking-[0.2em] animate-pulse">Recharging...</p>
                  )}
                  {!isActive && (elapsedTime > 0 || (mode !== 'stopwatch' && timeLeft < sessionDuration*60)) && (
                    <Button onClick={() => handleSessionSave()} size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] h-10 px-6 shadow-md shadow-emerald-50 active:scale-95">
                      <Save className="w-3.5 h-3.5 mr-2" /> Finish
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {!isFullscreen && (
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-blue-500"/> Day Hub</h3>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-gray-400 uppercase tracking-widest text-[9px]">Focus</span>
                <span className="text-gray-900 text-[10px]">{focusMinutesToday} / 120m</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                 <div className="bg-blue-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (focusMinutesToday / 120) * 100)}%`}} />
              </div>
              
              <div className="flex justify-between text-xs font-bold mb-1.5 mt-4">
                <span className="text-gray-400 uppercase tracking-widest text-[9px]">Distractions</span>
                <span className="text-gray-900 text-[10px]">{distractionsToday}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500"/> Consistency</h3>
              <div className="h-28 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData}>
                    <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -10px rgb(0 0 0 / 0.1)', fontSize: '10px' }} />
                    <Bar dataKey="mins" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
              <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2"><History className="w-4 h-4 text-gray-500"/> Logs</h3>
              <div className="space-y-2 overflow-y-auto pr-1 flex-1 scrollbar-hide">
                {sessions.length === 0 ? (
                  <p className="text-gray-400 text-[10px] text-center font-bold uppercase tracking-widest py-4">No data</p>
                ) : sessions.slice(0, 4).map(session => (
                  <div key={session.id} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl border border-gray-100 transition-colors hover:border-blue-100">
                     <div className="flex flex-col">
                       <span className="font-black text-[10px] text-gray-900 capitalize tracking-tight">{session.type.replace('_',' ')}</span>
                       <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{new Date(session.createdAt).toLocaleDateString()}</span>
                     </div>
                     <div className="flex flex-col items-end">
                       <span className="font-black text-blue-600 text-[11px]">{session.durationMinutes}m</span>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
        <DialogContent className="sm:max-w-md bg-white border-none shadow-2xl rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center text-gray-900">Session Complete!</DialogTitle>
            <DialogDescription className="text-center font-medium">
              You crushed it. Log your notes and rating below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <label className="text-sm font-bold text-gray-500 mb-2 block">Productivity Rating</label>
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded-2xl">
                {[1, 2, 3, 4, 5].map(star => (
                   <button 
                     key={star} 
                     onClick={() => setProductivityRating(star)}
                     className={`text-2xl transition-transform hover:scale-110 ${productivityRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                   >
                     ★
                   </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-500 mb-2 block">Session Notes</label>
              <Textarea 
                placeholder="What did you get done? Any roadblocks?" 
                value={completionNotes}
                onChange={e => setCompletionNotes(e.target.value)}
                className="rounded-2xl resize-none h-24"
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => handleSessionSave()} className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 text-lg">Save Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
