import { create } from 'zustand';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';

export interface Task {
  id: string;
  userId: string;
  listId: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'none' | 'low' | 'medium' | 'high' | 'urgent';
  dueDate: number;
  tags: string[];
  order: number;
  createdAt: number;
  updatedAt: number;
  estimatedTime?: number; // in minutes
  energy?: 'low' | 'medium' | 'high';
  category?: string;
  subtasks?: { id: string; title: string; completed: boolean }[];
  repeat?: string;
  notes?: string;
}

interface TasksState {
  tasks: Task[];
  loading: boolean;
  subscribe: (userId: string) => () => void;
  addTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: true,
  subscribe: (userId) => {
    set({ loading: true });
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', userId)
    );
    
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      set({ tasks: tasks.sort((a,b) => a.order - b.order), loading: false });
    });
  },
  addTask: async (task) => {
    await addDoc(collection(db, 'tasks'), {
      ...task,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  },
  updateTask: async (id, updates) => {
    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: Date.now()
    });
  },
  deleteTask: async (id) => {
    await deleteDoc(doc(db, 'tasks', id));
  }
}));
