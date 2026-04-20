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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Second Brain</h1>
          <p className="text-muted-foreground mt-1 text-sm">Capture your ideas and notes.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openEditor()}>
              <Plus className="w-4 h-4 mr-2" /> New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{currentNote?.id ? 'Edit Note' : 'Create Note'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Title..."
                value={currentNote?.title || ''}
                onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                className="text-lg font-semibold"
              />
              <Textarea
                placeholder="Jot down your thoughts..."
                value={currentNote?.content || ''}
                onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                className="min-h-[200px] resize-none"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!currentNote?.title?.trim()}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-sm text-muted-foreground col-span-full">Loading notes...</p>
        ) : notes.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-dashed">
            <p className="text-muted-foreground text-sm">No notes yet. Start capturing!</p>
          </div>
        ) : (
          notes.map(note => (
            <Card 
              key={note.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors h-48 dark:bg-card/50 flex flex-col group relative overflow-hidden"
              onClick={() => openEditor(note)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg leading-tight truncate">{note.title}</CardTitle>
                  <button 
                    onClick={(e) => togglePin(e, note)}
                    className={`shrink-0 p-1 rounded-md transition-colors ${note.pinned ? 'text-primary bg-primary/10' : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted'}`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                </div>
                <CardDescription className="text-xs">
                  {format(new Date(note.updatedAt), 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                  {note.content}
                </p>
              </CardContent>
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => handleDelete(e, note.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
