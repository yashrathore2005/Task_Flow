import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Trash2, Pin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export default function Notes() {
  const { user } = useAuthStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState<Partial<Note> | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'notes'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchedNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      fetchedNotes = fetchedNotes.sort((a, b) => {
        if (a.pinned === b.pinned) return b.updatedAt - a.updatedAt;
        return a.pinned ? -1 : 1;
      });
      setNotes(fetchedNotes);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSave = async () => {
    if (!user || !currentNote?.title?.trim()) return;
    try {
      if (currentNote.id) {
        await updateDoc(doc(db, 'notes', currentNote.id), {
          title: currentNote.title.trim(),
          content: currentNote.content || '',
          updatedAt: Date.now()
        });
      } else {
        await addDoc(collection(db, 'notes'), {
          userId: user.uid,
          title: currentNote.title.trim(),
          content: currentNote.content || '',
          pinned: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      setIsDialogOpen(false);
      setCurrentNote(null);
    } catch (e) {
      console.error(e);
    }
  };

  const togglePin = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    await updateDoc(doc(db, 'notes', note.id), {
      pinned: !note.pinned,
      updatedAt: Date.now()
    });
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this note?")) {
      await deleteDoc(doc(db, 'notes', id));
    }
  };

  const openEditor = (note?: Note) => {
    setCurrentNote(note ? { ...note } : { title: '', content: '' });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex items-end justify-between px-2 sm:px-0">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900">Notes</h1>
          <p className="text-gray-400 font-bold mt-1 uppercase tracking-widest text-xs">Capture your thoughts</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="rounded-2xl h-11 px-6 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 hidden sm:flex font-bold" />}>
             <Plus className="w-5 h-5 mr-2 stroke-[3]" /> Add Note
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-2xl font-black text-gray-900">{currentNote?.id ? 'Edit Note' : 'New Note'}</DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-4">
              <Input
                placeholder="Title"
                value={currentNote?.title || ''}
                onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                className="text-xl font-bold bg-gray-50 border-none h-14 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500"
              />
              <Textarea
                placeholder="What's on your mind?"
                value={currentNote?.content || ''}
                onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                className="min-h-[250px] resize-none bg-gray-50 border-none rounded-2xl p-4 text-base focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
            <DialogFooter className="p-6 bg-gray-50 flex-row gap-3 sm:gap-0">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button onClick={handleSave} disabled={!currentNote?.title?.trim()} className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 px-8">Save Note</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-2 sm:p-0">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center">
             <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : notes.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
               <Plus className="w-10 h-10 text-gray-200" />
            </div>
            <p className="text-gray-400 font-bold text-lg">Your second brain is empty</p>
            <Button onClick={() => openEditor()} variant="ghost" className="mt-4 text-blue-600 font-bold hover:bg-blue-50">Create your first note</Button>
          </div>
        ) : (
          notes.map(note => (
            <div 
              key={note.id} 
              className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-gray-100 transition-all cursor-pointer group relative h-[220px] flex flex-col active:scale-[0.98]"
              onClick={() => openEditor(note)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-black text-gray-900 leading-tight line-clamp-2 pr-6">{note.title}</h3>
                <button 
                  onClick={(e) => togglePin(e, note)}
                  className={cn(
                    "absolute top-5 right-5 p-2 rounded-xl transition-all",
                    note.pinned 
                      ? "text-blue-600 bg-blue-50 scale-110" 
                      : "text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-gray-100"
                  )}
                >
                  <Pin className="w-4 h-4 fill-current" />
                </button>
              </div>
              
              <p className="text-sm text-gray-500 font-medium line-clamp-4 flex-1">
                {note.content || "Empty note..."}
              </p>
              
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  {format(new Date(note.updatedAt), 'MMM d, h:mm a')}
                </span>
                <button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" 
                  onClick={(e) => handleDelete(e, note.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
