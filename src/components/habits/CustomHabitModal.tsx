import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Plus, X, Calendar, Flag, Settings, Palette } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface CustomHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: any) => void;
  initialData?: any;
}

const CATEGORIES = ['Health', 'Fitness', 'Study', 'Productivity', 'Mindfulness', 'Finance', 'Home', 'Social', 'Growth', 'Custom'];
const TRACK_TYPES = ['Yes/No Complete', 'Count Based', 'Time Based'];
const FREQUENCIES = ['Daily', 'Weekly', 'Custom Days'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const VISIBILITIES = ['Private', 'Shared'];

const ICONS = ['💧', '🏃', '📚', '🧘', '💊', '💻', '💰', '🍎', '💤', '📝', '🧘‍♀️', '😴', '👣', '🧗‍♂️', '🥗', '☕', '🪴', '🧹', '📞', '💡', '🌅'];
const COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-purple-500', 
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
];

export function CustomHabitModal({ isOpen, onClose, onSave, initialData }: CustomHabitModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Health',
    icon: '💧',
    color: 'bg-blue-500',
    startDate: new Date().toISOString().split('T')[0],
    targetGoal: '',
    frequency: 'Daily',
    reminderTime: '08:00',
    multipleReminders: false,
    priority: 'Medium',
    notes: '',
    motivationText: '',
    trackType: 'Yes/No Complete',
    targetNumber: 1,
    unit: '',
    visibility: 'Private',
    streakEnabled: true,
  });

  // Effect to handle initialData
  React.useEffect(() => {
    if (initialData && isOpen) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Map category if needed
        category: initialData.categoryId ? initialData.categoryId.charAt(0).toUpperCase() + initialData.categoryId.slice(1).replace('-', ' ') : prev.category,
        frequency: initialData.frequency ? initialData.frequency.charAt(0).toUpperCase() + initialData.frequency.slice(1) : prev.frequency,
      }));
    } else if (!isOpen) {
      // Reset if closed
      setFormData({
        name: '',
        description: '',
        category: 'Health',
        icon: '💧',
        color: 'bg-blue-500',
        startDate: new Date().toISOString().split('T')[0],
        targetGoal: '',
        frequency: 'Daily',
        reminderTime: '08:00',
        multipleReminders: false,
        priority: 'Medium',
        notes: '',
        motivationText: '',
        trackType: 'Yes/No Complete',
        targetNumber: 1,
        unit: '',
        visibility: 'Private',
        streakEnabled: true,
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    setStep(1);
  };

  const renderPreview = () => (
    <div className="border border-border p-4 rounded-xl flex items-center justify-between bg-card mb-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl text-white ${formData.color} shadow-inner`}>
          {formData.icon}
        </div>
        <div>
          <h4 className="font-bold text-base text-gray-900 dark:text-white leading-tight">
            {formData.name || 'Habit Name'}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">{formData.frequency} • {formData.category}</p>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md mb-1">
          {formData.reminderTime}
        </span>
        {formData.streakEnabled && <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span> Streak On</span>}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto w-11/12 p-0 rounded-3xl border-none">
        
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-border p-6 z-10 flex justify-between items-center rounded-t-3xl">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Plus className="w-6 h-6 text-blue-500" />
            Create Custom Habit
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-500">
            <X className="w-4 h-4"/>
          </Button>
        </div>

        <div className="p-6 space-y-8 bg-gray-50 dark:bg-gray-900">
          
          {/* Preivew */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">Preview</Label>
            {renderPreview()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Core Info */}
            <div className="space-y-4">
              <div>
                <Label>Habit Name</Label>
                <Input placeholder="e.g. Drink Water" value={formData.name} onChange={e => handleChange('name', e.target.value)} className="mt-1.5 bg-white shadow-sm rounded-xl" />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea placeholder="Why this habit?" value={formData.description} onChange={e => handleChange('description', e.target.value)} className="mt-1.5 bg-white shadow-sm rounded-xl resize-none h-20" />
              </div>

              <div>
                <Label>Motivation Text</Label>
                <Input placeholder="Stay hydrated for health!" value={formData.motivationText} onChange={e => handleChange('motivationText', e.target.value)} className="mt-1.5 bg-white shadow-sm rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={v => handleChange('category', v)}>
                    <SelectTrigger className="mt-1.5 bg-white shadow-sm rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={v => handleChange('priority', v)}>
                    <SelectTrigger className="mt-1.5 bg-white shadow-sm rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Tracking Settings */}
            <div className="space-y-4">
              <div>
                <Label>Track Type</Label>
                <Select value={formData.trackType} onValueChange={v => handleChange('trackType', v)}>
                  <SelectTrigger className="mt-1.5 bg-white shadow-sm rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{TRACK_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {formData.trackType !== 'Yes/No Complete' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Target Number</Label>
                    <Input type="number" min="1" value={formData.targetNumber} onChange={e => handleChange('targetNumber', parseInt(e.target.value))} className="mt-1.5 bg-white shadow-sm rounded-xl" />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Input placeholder="e.g. glasses, mins" value={formData.unit} onChange={e => handleChange('unit', e.target.value)} className="mt-1.5 bg-white shadow-sm rounded-xl" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Frequency</Label>
                  <Select value={formData.frequency} onValueChange={v => handleChange('frequency', v)}>
                    <SelectTrigger className="mt-1.5 bg-white shadow-sm rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{FREQUENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={formData.startDate} onChange={e => handleChange('startDate', e.target.value)} className="mt-1.5 bg-white shadow-sm rounded-xl" />
                </div>
              </div>

              <div>
                <Label>Reminder Time</Label>
                <Input type="time" value={formData.reminderTime} onChange={e => handleChange('reminderTime', e.target.value)} className="mt-1.5 bg-white shadow-sm rounded-xl" />
              </div>
            </div>
          </div>

          {/* Icon & Color Selection */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
            <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 block">Visuals</Label>
            
            <div className="space-y-6">
              <div>
                <span className="text-sm font-semibold mb-2 block">Choose Icon</span>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(emoji => (
                    <button key={emoji} onClick={() => handleChange('icon', emoji)}
                      className={`text-2xl w-12 h-12 rounded-xl flex items-center justify-center transition-all ${formData.icon === emoji ? 'bg-blue-50 border-2 border-blue-500 scale-110 shadow-sm' : 'bg-gray-50 hover:bg-gray-100 border border-transparent'}`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-sm font-semibold mb-2 block">Choose Color</span>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(color => (
                    <button key={color} onClick={() => handleChange('color', color)}
                      className={`w-10 h-10 rounded-full transition-all ${color} ${formData.color === color ? 'ring-4 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 items-center">
             <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
               <input type="checkbox" checked={formData.multipleReminders} onChange={e => handleChange('multipleReminders', e.target.checked)} className="w-4 h-4 rounded text-blue-600 border-gray-300" />
               Multiple Reminders
             </label>
             <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
               <input type="checkbox" checked={formData.streakEnabled} onChange={e => handleChange('streakEnabled', e.target.checked)} className="w-4 h-4 rounded text-blue-600 border-gray-300" />
               Enable Streaks
             </label>
          </div>

        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-border p-4 flex justify-end gap-3 rounded-b-3xl">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
          <Button onClick={handleSave} className="rounded-xl font-bold px-8 shadow-md">Save Habit</Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
