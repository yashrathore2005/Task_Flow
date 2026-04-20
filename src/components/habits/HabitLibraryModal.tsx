import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { HABIT_LIBRARY, HabitTemplate } from '../../lib/habit-library';
import { Input } from '../ui/input';
import { Search, Plus } from 'lucide-react';

export function HabitLibraryModal({ isOpen, onClose, onAddHabit }: { isOpen: boolean, onClose: () => void, onAddHabit: (habit: HabitTemplate) => void }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = ['all', 'health', 'productivity', 'study', 'mental-wellness', 'lifestyle'];

  const filteredHabits = HABIT_LIBRARY.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === 'all' || h.categoryId === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl">Habit Library</DialogTitle>
        </DialogHeader>

        <div className="px-6 flex gap-4 border-b border-border pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search habits..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex px-6 gap-2 pt-4 pb-2 overflow-x-auto hide-scrollbar">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="capitalize whitespace-nowrap"
            >
              {cat.replace('-', ' ')}
            </Button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHabits.map(habit => (
            <div key={habit.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 bg-card transition-all group">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${habit.color} text-white shadow-sm`}>
                  {habit.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{habit.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">{habit.description}</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onAddHabit(habit)}>
                <Plus className="w-5 h-5 text-primary" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
