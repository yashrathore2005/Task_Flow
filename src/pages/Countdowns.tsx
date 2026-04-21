import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { Plus, Trash2, Clock, CalendarIcon, Timer, LayoutDashboard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { differenceInDays, differenceInHours, format } from 'date-fns';

export interface Countdown {
  id: string;
  userId: string;
  title: string;
  targetDate: number;
  category: string;
  priority: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

export default function Countdowns() {
  const { user } = useAuthStore();
  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // New countdown form state
  const [title, setTitle] = useState('');
  const [targetDateStr, setTargetDateStr] = useState('');
  const [category, setCategory] = useState('Personal');
  const [priority, setPriority] = useState('Medium');
  const [color, setColor] = useState('#3b82f6'); // default blue

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'countdowns'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Countdown));
      setCountdowns(fetched.sort((a, b) => a.targetDate - b.targetDate));
    });
    return () => unsubscribe();
  }, [user]);

  const handleAdd = async () => {
    if (!user || !title.trim() || !targetDateStr) return;
    try {
      await addDoc(collection(db, 'countdowns'), {
        userId: user.uid,
        title,
        targetDate: new Date(targetDateStr).getTime(),
        category,
        priority,
        color,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      setIsAdding(false);
      setTitle('');
      setTargetDateStr('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'countdowns', id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex items-end justify-between px-2 sm:px-0">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 leading-none">Countdowns</h1>
          <p className="text-gray-400 font-bold mt-1 uppercase tracking-widest text-xs">Track your deadlines</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger render={<Button className="rounded-2xl h-11 px-6 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 hidden sm:flex font-bold" />}>
             <Plus className="w-5 h-5 mr-2 stroke-[3]" /> Add Event
          </DialogTrigger>
          
          <DialogTrigger render={<button className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100 active:scale-90 sm:hidden" />}>
             <Plus className="w-7 h-7 stroke-[3]" />
          </DialogTrigger>
          <DialogContent className="rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-2xl font-black text-gray-900">New Countdown</DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Event Name</label>
                <Input placeholder="e.g. Project Deadline" value={title} onChange={e => setTitle(e.target.value)} className="h-14 rounded-2xl bg-gray-50 border-none font-bold text-lg" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Target Date</label>
                <Input type="datetime-local" value={targetDateStr} onChange={e => setTargetDateStr(e.target.value)} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Category</label>
                    <Input value={category} onChange={e => setCategory(e.target.value)} className="h-12 rounded-2xl bg-gray-50 border-none font-bold" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Priority</label>
                    <Input value={priority} onChange={e => setPriority(e.target.value)} className="h-12 rounded-2xl bg-gray-50 border-none font-bold" />
                 </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
               <Button variant="ghost" onClick={() => setIsAdding(false)} className="flex-1 rounded-xl font-bold">Cancel</Button>
               <Button className="flex-1 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 h-12" onClick={handleAdd}>Save Event</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-2 sm:p-0">
        {countdowns.map(c => {
          const target = new Date(c.targetDate);
          const now = new Date();
          const daysLeft = differenceInDays(target, now);
          const hrsLeft = differenceInHours(target, now);
          
          let displayNum = daysLeft;
          let displayUnit = "days";
          if (daysLeft === 0) { displayNum = hrsLeft; displayUnit = "hours"; }
          if (hrsLeft < 0) { displayNum = 0; displayUnit = "overdue"; }

          return (
            <div 
              key={c.id} 
              className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col justify-between group hover:shadow-xl hover:shadow-gray-100 hover:border-blue-100 transition-all active:scale-[0.98]"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-black text-2xl text-gray-900 leading-tight pr-4">{c.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 py-1 bg-gray-50 rounded-lg">{c.category}</span>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2 py-1 bg-blue-50 rounded-lg">{c.priority}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-5 h-5"/>
                </button>
              </div>
              
              <div className="my-8">
                <div className="flex items-baseline gap-3">
                  <span className="text-7xl font-black tracking-tighter text-blue-600 tabular-nums">{displayNum}</span>
                  <span className="text-gray-400 uppercase font-black text-xs tracking-[0.2em]">{displayUnit}</span>
                </div>
                {hrsLeft >= 0 && daysLeft <= 14 && (
                  <div className="w-full bg-gray-50 h-3 rounded-full mt-6 overflow-hidden p-0.5 border border-gray-100">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 bg-blue-600 shadow-sm" 
                      style={{ width: `${Math.max(5, 100 - (daysLeft / 14) * 100)}%` }} 
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-gray-50 pt-6">
                <div className="flex items-center text-xs text-gray-400 gap-2 font-bold uppercase tracking-widest">
                  <CalendarIcon className="w-4 h-4 text-gray-300" />
                  {format(target, 'MMM dd, yyyy')}
                </div>
                <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
                  Target Date
                </div>
              </div>
            </div>
          );
        })}
        {countdowns.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8">
               <Clock className="w-12 h-12 text-gray-200" />
            </div>
            <p className="font-black text-xl text-gray-900">No active countdowns</p>
            <p className="text-sm font-bold text-gray-400 mt-2">Track milestones and deadlines here.</p>
            <Button onClick={() => setIsAdding(true)} variant="ghost" className="mt-6 text-blue-600 font-bold hover:bg-blue-50">Create Countdown</Button>
          </div>
        )}
      </div>
    </div>
  );
}
