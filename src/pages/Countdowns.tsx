import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Plus, Trash2, Clock, CalendarIcon } from 'lucide-react';
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
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Countdowns</h1>
          <p className="text-gray-500 mt-1">Track your upcoming important days</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 shadow-lg">
              <Plus className="w-6 h-6" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Countdown</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input placeholder="Event Name (e.g. Birthday, Exam)" value={title} onChange={e => setTitle(e.target.value)} />
              <Input type="datetime-local" value={targetDateStr} onChange={e => setTargetDateStr(e.target.value)} />
              <Button className="w-full bg-blue-600" onClick={handleAdd}>Save Event</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div key={c.id} className="relative overflow-hidden bg-white rounded-2xl shadow-sm border p-6 flex flex-col justify-between" style={{ borderTop: `4px solid ${c.color}` }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{c.title}</h3>
                  <p className="text-xs text-gray-500 font-medium tracking-wide uppercase mt-1">{c.category}</p>
                </div>
                <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
              </div>
              
              <div className="my-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tighter" style={{color: c.color}}>{displayNum}</span>
                  <span className="text-gray-500 uppercase font-bold text-sm">{displayUnit}</span>
                </div>
                {hrsLeft >= 0 && daysLeft <= 7 && (
                  <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(10, 100 - (daysLeft / 7) * 100)}%`, backgroundColor: c.color }} />
                  </div>
                )}
              </div>

              <div className="flex items-center text-sm text-gray-600 gap-2 font-medium">
                <CalendarIcon className="w-4 h-4" />
                {format(target, 'MMM dd, yyyy')}
              </div>
            </div>
          );
        })}
        {countdowns.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400">
            <Clock className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No countdowns yet</p>
            <p className="text-sm">Click the + button to add one</p>
          </div>
        )}
      </div>
    </div>
  );
}
