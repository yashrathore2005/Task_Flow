import React, { useState, useEffect } from 'react';
import { useTasksStore } from '../store/tasksStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2, Coffee, Plus, Bell, Calendar as CalendarIcon, List as ListIcon, X, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { TaskModal } from '../components/tasks/TaskModal';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';

interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  date: number;
}

type CalendarView = 'month' | 'week' | 'day' | 'year' | 'agenda';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('month');

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetView, setSheetView] = useState<'menu' | 'addReminder' | 'addEvent' | 'addMeeting' | 'viewTasks'>('menu');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  const { tasks, updateTask, addTask } = useTasksStore();
  const { user } = useAuthStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  // We will need state for reminders and meetings later
  const [reminders, setReminders] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const qEvents = query(collection(db, 'events'), where('userId', '==', user.uid));
    const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent)));
    });

    const qReminders = query(collection(db, 'reminders'), where('userId', '==', user.uid));
    const unsubscribeReminders = onSnapshot(qReminders, (snapshot) => {
      setReminders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qMeetings = query(collection(db, 'meetings'), where('userId', '==', user.uid));
    const unsubscribeMeetings = onSnapshot(qMeetings, (snapshot) => {
      setMeetings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeEvents();
      unsubscribeReminders();
      unsubscribeMeetings();
    };
  }, [user]);

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    setSheetView('menu');
    setIsSheetOpen(true);
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const tasksByDate = tasks.reduce((acc, task) => {
    if (!task.dueDate) return acc;
    const dateKey = new Date(task.dueDate).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  const eventsByDate = events.reduce((acc, ev) => {
    const dateKey = new Date(ev.date).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(ev);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    if (!title.trim() || !user) return;
    
    await addDoc(collection(db, 'events'), {
      userId: user.uid,
      title,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      location: formData.get('location') as string,
      date: selectedDate.getTime()
    });
    setIsSheetOpen(false);
  };

  const handleSaveModalTask = async (formData: any) => {
    if (!user) return;
    await addTask({
       userId: user.uid,
       title: formData.title,
       description: formData.description,
       status: 'todo',
       priority: formData.priority,
       category: formData.category,
       dueDate: selectedDate.getTime(), // force to selected Calendar Date
       estimatedTime: parseInt(formData.estimatedTime) || undefined,
       energy: formData.energy,
       subtasks: formData.subtasks,
       order: Date.now(),
       tags: []
    });
  };

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSheetOpen(false);
  };

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const location = formData.get('location') as string;

    if (user && title) {
      const { collection, addDoc, getFirestore } = await import('firebase/firestore');
      const db = getFirestore();
      await addDoc(collection(db, 'events'), {
        userId: user.uid,
        title,
        startTime,
        endTime,
        location,
        date: selectedDate.getTime()
      });
      setIsSheetOpen(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto min-h-full pb-20 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 leading-none">
            {format(currentDate, 'MMMM')}
          </h1>
          <p className="text-gray-400 font-bold mt-0.5 uppercase tracking-widest text-[10px]">
            {format(currentDate, 'yyyy')}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between w-full md:w-auto gap-2">
          <Select value={calendarView} onValueChange={(v: any) => setCalendarView(v)}>
            <SelectTrigger className="w-[100px] h-9 rounded-xl border-gray-100 bg-white shadow-sm font-bold text-[10px]">
              <SelectValue placholder="View" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="year">Year</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="agenda">Agenda</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="rounded-lg w-8 h-8 hover:bg-gray-100"><ChevronLeft className="w-4 h-4"/></Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="rounded-lg px-3 h-8 hover:bg-gray-100 font-bold text-[10px] text-blue-600">Today</Button>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="rounded-lg w-8 h-8 hover:bg-gray-100"><ChevronRight className="w-4 h-4"/></Button>
          </div>
        </div>
      </div>

      {calendarView === 'month' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-7 gap-y-3 gap-x-1">
            {['S','M','T','W','T','F','S'].map((d,i) => (
              <div key={i} className="text-center text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2">{d}</div>
            ))}
            {daysInMonth.map((day, i) => {
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const dayTasks = tasksByDate[day.toDateString()] || [];
              const dayEvents = events.filter(e => isSameDay(new Date(e.date), day));
              const dayMeetings = meetings.filter(m => isSameDay(new Date(m.date), day));
              
              return (
                <div key={i} className="flex flex-col items-center justify-start h-12 relative group">
                  <button 
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center text-xs transition-all duration-300 active:scale-95",
                      isSelected 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-100 font-black scale-105' 
                        : isToday 
                          ? 'bg-blue-50 text-blue-600 font-black border border-blue-100' 
                          : 'text-gray-700 hover:bg-gray-50 font-bold'
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                  <div className="flex gap-0.5 mt-1 h-0.5 items-center">
                    {dayTasks.length > 0 && <div className="w-0.5 h-0.5 rounded-full bg-blue-500" />}
                    {dayEvents.length > 0 && <div className="w-0.5 h-0.5 rounded-full bg-orange-500" />}
                    {dayMeetings.length > 0 && <div className="w-0.5 h-0.5 rounded-full bg-purple-500" />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="py-2 text-center">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full inline-block">
          Tap any date to plan your day
        </p>
      </div>

      {/* ACTION SHEET */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl border-t border-gray-200 p-6 shadow-2xl pb-safe">
          <SheetHeader className="mb-6 flex flex-row items-center justify-between">
             <SheetTitle className="text-xl font-bold">
               {sheetView === 'menu' && format(selectedDate, 'EEEE, d MMMM')}
               {sheetView === 'addTask' && 'Add Task'}
               {sheetView === 'addReminder' && 'Add Reminder'}
               {sheetView === 'addEvent' && 'Add Event'}
               {sheetView === 'viewTasks' && `Tasks for ${format(selectedDate, 'MMM d')}`}
             </SheetTitle>
             <Button variant="ghost" size="icon" onClick={() => setIsSheetOpen(false)} className="rounded-full w-8 h-8 -mr-2"><X className="w-5 h-5"/></Button>
          </SheetHeader>

          {sheetView === 'menu' && (
            <div className="space-y-3">
              <button onClick={() => { setIsSheetOpen(false); setIsTaskModalOpen(true); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Plus className="w-5 h-5" /></div>
                <div className="text-left"><p className="font-bold text-gray-900">Add Task</p><p className="text-xs text-gray-500">To-dos & checklists</p></div>
              </button>
              <button onClick={() => setSheetView('addReminder')} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><Bell className="w-5 h-5" /></div>
                <div className="text-left"><p className="font-bold text-gray-900">Add Reminder</p><p className="text-xs text-gray-500">Quick alerts & alarms</p></div>
              </button>
              <button onClick={() => setSheetView('addMeeting')} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center"><CalendarIcon className="w-5 h-5" /></div>
                <div className="text-left"><p className="font-bold text-gray-900">Add Meeting</p><p className="text-xs text-gray-500">With participants</p></div>
              </button>
              <button onClick={() => setSheetView('addEvent')} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><CalendarIcon className="w-5 h-5" /></div>
                <div className="text-left"><p className="font-bold text-gray-900">Add Event</p><p className="text-xs text-gray-500">General blocking</p></div>
              </button>
              <button onClick={() => setSheetView('viewTasks')} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center"><ListIcon className="w-5 h-5" /></div>
                <div className="text-left"><p className="font-bold text-gray-900">Day Schedule</p><p className="text-xs text-gray-500">View timeline</p></div>
              </button>
            </div>
          )}

          {sheetView === 'addTask' && (
            <form onSubmit={handleAddTask} className="space-y-4">
              <div><Label>Task Title</Label><Input name="title" autoFocus required className="mt-1 rounded-xl" /></div>
              <div><Label>Description</Label><Textarea name="description" className="mt-1 rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select name="category" defaultValue="personal">
                    <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="study">Study</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full rounded-xl font-bold">Save Task</Button>
            </form>
          )}

          {sheetView === 'addReminder' && (
            <form onSubmit={async (e) => { 
                e.preventDefault(); 
                const fd = new FormData(e.currentTarget);
                const title = fd.get('title') as string;
                if(!user || !title) return;
                const { collection, addDoc, getFirestore } = await import('firebase/firestore');
                await addDoc(collection(getFirestore(), 'reminders'), {
                  userId: user.uid, title, 
                  date: selectedDate.getTime(),
                  time: fd.get('time'),
                  repeat: fd.get('repeat'),
                  snooze: 0, status: 'pending', createdAt: Date.now()
                });
                setIsSheetOpen(false); 
              }} className="space-y-4">
              <div><Label>Reminder Title</Label><Input name="title" required className="mt-1 rounded-xl" /></div>
              <div><Label>Time</Label><Input name="time" type="time" required className="mt-1 rounded-xl" /></div>
              <div>
                 <Label>Repeat</Label>
                 <Select name="repeat" defaultValue="none">
                    <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Never</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
              <Button type="submit" className="w-full rounded-xl font-bold bg-orange-500 hover:bg-orange-600">Save Reminder</Button>
            </form>
          )}

          {sheetView === 'addEvent' && (
             <form onSubmit={handleAddSubmit} className="space-y-4">
              <div><Label>Event Name</Label><Input name="title" required className="mt-1 rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Time</Label><Input name="startTime" type="time" required className="mt-1 rounded-xl" /></div>
                <div><Label>End Time</Label><Input name="endTime" type="time" required className="mt-1 rounded-xl" /></div>
              </div>
              <div><Label>Location</Label><Input name="location" className="mt-1 rounded-xl" /></div>
              <Button type="submit" className="w-full rounded-xl font-bold bg-purple-600 hover:bg-purple-700">Save Event</Button>
            </form>
          )}

          {sheetView === 'addMeeting' && (
             <form onSubmit={async (e) => {
               e.preventDefault();
               const fd = new FormData(e.currentTarget);
               const title = fd.get('title') as string;
               if (!title || !user) return;
               const { collection, addDoc, getFirestore } = await import('firebase/firestore');
               await addDoc(collection(getFirestore(), 'meetings'), {
                  userId: user.uid, title,
                  date: selectedDate.getTime(),
                  startTime: fd.get('startTime'),
                  endTime: fd.get('endTime'),
                  location: fd.get('location') || '',
                  participants: (fd.get('participants') as string).split(',').map(p=>p.trim()).filter(Boolean),
                  notes: fd.get('notes') || '',
                  createdAt: Date.now()
               });
               setIsSheetOpen(false);
             }} className="space-y-4">
              <div><Label>Meeting Title</Label><Input name="title" required className="mt-1 rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Time</Label><Input name="startTime" type="time" required className="mt-1 rounded-xl" /></div>
                <div><Label>End Time</Label><Input name="endTime" type="time" required className="mt-1 rounded-xl" /></div>
              </div>
              <div><Label>Participants (comma separated)</Label><Input name="participants" placeholder="jane@example.com, john..." className="mt-1 rounded-xl" /></div>
              <div><Label>Location / Link</Label><Input name="location" placeholder="Zoom link or room" className="mt-1 rounded-xl" /></div>
              <div><Label>Notes</Label><Textarea name="notes" className="mt-1 rounded-xl max-h-32" /></div>
              <Button type="submit" className="w-full rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700">Save Meeting</Button>
            </form>
          )}

          {sheetView === 'viewTasks' && (
             <div className="space-y-3 max-h-[60vh] overflow-y-auto pb-4">
                {tasksByDate[selectedDate.toDateString()]?.map(task => (
                  <div key={task.id} className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4">
                    <button 
                      className={`flex-shrink-0 transition-colors h-6 w-6 flex items-center justify-center rounded-full ${task.status === 'completed' ? 'bg-blue-600 border-none' : 'border-2 border-gray-300'}`}
                      onClick={() => updateTask(task.id, { status: task.status === 'completed' ? 'todo' : 'completed' })}
                    >
                      {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />}
                    </button>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</h3>
                      <p className="text-xs text-gray-500 font-medium capitalize">{task.priority} Priority Task</p>
                    </div>
                  </div>
                ))}

                {eventsByDate[selectedDate.toDateString()]?.map(ev => (
                  <div key={ev.id} className="bg-purple-50 border border-purple-100 p-4 rounded-2xl flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-bold text-gray-900">{ev.title}</h3>
                      <p className="text-xs font-semibold text-purple-600 uppercase tracking-widest">{ev.startTime} - {ev.endTime}</p>
                      {ev.location && <p className="text-xs text-gray-500">{ev.location}</p>}
                    </div>
                    <button 
                      onClick={async () => {
                        const { deleteDoc, doc } = await import('firebase/firestore');
                        await deleteDoc(doc(db, 'events', ev.id));
                      }}
                      className="text-gray-400 hover:text-red-500 rounded p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {reminders.filter(r => new Date(r.date).toDateString() === selectedDate.toDateString()).map(r => (
                  <div key={r.id} className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-orange-500" />
                      <div>
                        <h3 className="font-bold text-gray-900">{r.title}</h3>
                        <p className="text-xs font-semibold text-orange-600 uppercase tracking-widest">{r.time} • {r.repeat !== 'none' ? `Repeats ${r.repeat}` : 'No repeat'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        const { deleteDoc, doc } = await import('firebase/firestore');
                        await deleteDoc(doc(db, 'reminders', r.id));
                      }}
                      className="text-gray-400 hover:text-red-500 rounded p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {meetings.filter(m => new Date(m.date).toDateString() === selectedDate.toDateString()).map(m => (
                  <div key={m.id} className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-bold text-gray-900">{m.title}</h3>
                      <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">{m.startTime} - {m.endTime}</p>
                      {m.participants?.length > 0 && <p className="text-xs text-gray-600">{m.participants.join(', ')}</p>}
                      {m.location && <p className="text-xs text-gray-500">{m.location}</p>}
                    </div>
                    <button 
                      onClick={async () => {
                        const { deleteDoc, doc } = await import('firebase/firestore');
                        await deleteDoc(doc(db, 'meetings', m.id));
                      }}
                      className="text-gray-400 hover:text-red-500 rounded p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {(!tasksByDate[selectedDate.toDateString()] && !eventsByDate[selectedDate.toDateString()] && 
                   meetings.filter(m => new Date(m.date).toDateString() === selectedDate.toDateString()).length === 0 &&
                   reminders.filter(r => new Date(r.date).toDateString() === selectedDate.toDateString()).length === 0) && (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <Coffee className="w-8 h-8 text-blue-300 mb-4" />
                    <h3 className="font-bold text-gray-900">You have a free day</h3>
                    <p className="text-gray-500 text-sm">No tasks, events, reminders or meetings scheduled.</p>
                  </div>
                )}
             </div>
          )}
        </SheetContent>
      </Sheet>

      <TaskModal 
         isOpen={isTaskModalOpen} 
         onClose={() => setIsTaskModalOpen(false)} 
         onSave={handleSaveModalTask} 
      />
    </div>
  );
}
