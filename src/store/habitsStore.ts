import { create } from 'zustand';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';

export interface Habit {
  id: string;
  userId: string;
  name: string;
  categoryId: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'any';
  frequency: string;
  icon: string;
  color: string;
  createdAt: number;
  logs: string[];
  trackType?: string;
  targetNumber?: number;
  unit?: string;
  reminderTime?: string;
}

interface HabitsState {
  habits: Habit[];
  loading: boolean;
  subscribe: (userId: string) => () => void;
  addHabit: (habit: Partial<Habit>) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleLog: (habitId: string, dateStr: string) => Promise<void>;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  loading: true,
  subscribe: (userId) => {
    set({ loading: true });
    const q = query(
      collection(db, 'habits'),
      where('userId', '==', userId)
    );
    
    return onSnapshot(q, (snapshot) => {
      const habits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Habit));
      set({ habits, loading: false });
    });
  },
  addHabit: async (habit) => {
    await addDoc(collection(db, 'habits'), {
      ...habit,
      createdAt: Date.now(),
      logs: []
    });
  },
  updateHabit: async (id, updates) => {
    await updateDoc(doc(db, 'habits', id), updates);
  },
  deleteHabit: async (id) => {
    await deleteDoc(doc(db, 'habits', id));
  },
  toggleLog: async (habitId, dateStr) => {
    const habit = get().habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const isAdding = !habit.logs.includes(dateStr);
    const newLogs = isAdding 
      ? [...habit.logs, dateStr]
      : habit.logs.filter(d => d !== dateStr);
      
    await updateDoc(doc(db, 'habits', habitId), { logs: newLogs });
  }
}));
