import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, X, Calendar as CalendarIcon, Clock, Tag, AlignLeft, CheckSquare, Zap, Paperclip } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: any) => void;
  initialData?: any;
}

export function TaskModal({ isOpen, onClose, onSave, initialData }: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Personal',
    priority: 'none',
    dueDate: '',
    estimatedTime: '',
    energy: 'medium',
    notes: '',
    subtasks: [] as { id: string, title: string, completed: boolean }[]
  });

  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({ 
        ...formData, 
        ...initialData,
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'Personal',
        priority: 'none',
        dueDate: '',
        estimatedTime: '',
        energy: 'medium',
        notes: '',
        subtasks: []
      });
    }
  }, [isOpen, initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setFormData(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, { id: Math.random().toString(), title: newSubtask, completed: false }]
    }));
    setNewSubtask('');
  };

  const removeSubtask = (id: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(s => s.id !== id)
    }));
  };

  const handleSave = () => {
    if (!formData.title.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-11/12 p-0 rounded-3xl border-none bg-gray-50">
        <div className="sticky top-0 bg-white border-b border-border p-5 z-10 flex justify-between items-center rounded-t-3xl shadow-sm">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-500" />
            {initialData ? 'Edit Task' : 'Create Task'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100">
            <X className="w-4 h-4"/>
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div>
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Task Title</Label>
              <Input autoFocus placeholder="What needs to be done?" value={formData.title} onChange={e => handleChange('title', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1"><AlignLeft className="w-3 h-3"/> Description</Label>
              <Textarea placeholder="Add details..." value={formData.description} onChange={e => handleChange('description', e.target.value)} className="mt-1 resize-none h-20" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-4">
               <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                 <div>
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Priority</Label>
                    <Select value={formData.priority} onValueChange={v => handleChange('priority', v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent 🔥</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
                 <div>
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest text-gray-500">Category</Label>
                    <Select value={formData.category} onValueChange={v => handleChange('category', v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Work">Work</SelectItem>
                        <SelectItem value="Study">Study</SelectItem>
                        <SelectItem value="Shopping">Shopping</SelectItem>
                        <SelectItem value="Home">Home</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
                 <div>
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest"><CalendarIcon className="w-3 h-3 inline"/> Due Date</Label>
                    <Input type="date" value={formData.dueDate} onChange={e => handleChange('dueDate', e.target.value)} className="mt-1" />
                 </div>
               </div>
             </div>

             <div className="space-y-4">
               <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                 <div>
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest"><Clock className="w-3 h-3 inline"/> Est. Time (mins)</Label>
                    <Input type="number" placeholder="30" value={formData.estimatedTime} onChange={e => handleChange('estimatedTime', e.target.value)} className="mt-1" />
                 </div>
                 <div>
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest"><Zap className="w-3 h-3 inline"/> Energy Required</Label>
                    <Select value={formData.energy} onValueChange={v => handleChange('energy', v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Easy)</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High (Deep Focus)</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
               </div>
               
               <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Subtasks ({formData.subtasks.length})</Label>
                  <div className="space-y-2 mb-3">
                    {formData.subtasks.map(s => (
                       <div key={s.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg text-sm border border-gray-100">
                         <span>{s.title}</span>
                         <button onClick={() => removeSubtask(s.id)} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3"/></button>
                       </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Add subtask..." value={newSubtask} onChange={e => setNewSubtask(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}/>
                    <Button onClick={handleAddSubtask} size="icon" variant="outline"><Plus className="w-4 h-4"/></Button>
                  </div>
               </div>
             </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-border p-5 flex justify-end gap-3 rounded-b-3xl">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
          <Button onClick={handleSave} className="rounded-xl font-bold px-8 shadow-md">Save Task</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
