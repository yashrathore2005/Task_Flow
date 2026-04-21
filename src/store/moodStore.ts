import { create } from 'zustand';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy, limit, doc, getDocs } from 'firebase/firestore';

export interface MoodLog {
  id: string;
  userId: string;
  mood: 'great' | 'good' | 'neutral' | 'tired' | 'stressed' | 'sad';
  note: string;
  energyLevel: number;
  createdAt: number;
}

interface MoodState {
  moods: MoodLog[];
  loading: boolean;
  subscribe: (userId: string) => () => void;
  addMood: (mood: Partial<MoodLog>) => Promise<void>;
}

export const useMoodStore = create<MoodState>((set) => ({
  moods: [],
  loading: true,
  subscribe: (userId) => {
    set({ loading: true });
    const q = query(
      collection(db, 'moods'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    return onSnapshot(q, (snapshot) => {
      const moods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MoodLog));
      set({ moods, loading: false });
    });
  },
  addMood: async (mood) => {
    await addDoc(collection(db, 'moods'), {
      ...mood,
      createdAt: Date.now()
    });
  }
}));
