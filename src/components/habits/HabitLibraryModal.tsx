import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { HABIT_LIBRARY, HabitTemplate, CATEGORIES, HabitCategory } from '../../lib/habit-library';
import { Input } from '../ui/input';
import { Search, Plus, Star, Zap, Gauge, History, Info, ChevronRight, X, Filter, ArrowUpDown, TrendingUp, Sparkles, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HabitLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHabit: (habit: HabitTemplate) => void;
  onCreateCustom: () => void;
}

export function HabitLibraryModal({ isOpen, onClose, onAddHabit, onCreateCustom }: HabitLibraryModalProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<HabitCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'difficulty' | 'popular'>('popular');

  const filteredHabits = useMemo(() => {
    let list = HABIT_LIBRARY.filter(h => {
      const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase()) || 
                           h.description.toLowerCase().includes(search.toLowerCase());
      const matchesCat = activeCategory === 'all' || h.categoryId === activeCategory;
      return matchesSearch && matchesCat;
    });

    if (sortBy === 'popular') {
      list = [...list].sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    } else if (sortBy === 'difficulty') {
      const rank = { easy: 1, medium: 2, hard: 3 };
      list = [...list].sort((a, b) => rank[a.difficulty] - rank[b.difficulty]);
    } else {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [search, activeCategory, sortBy]);

  const featuredHabits = useMemo(() => 
    HABIT_LIBRARY.filter(h => h.popular).slice(0, 6)
  , []);

  const recentlyAdded = useMemo(() => 
    [...HABIT_LIBRARY].reverse().slice(0, 4)
  , []);

  const categories = [{ id: 'all', label: 'All', icon: '🌟' }, ...CATEGORIES];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] sm:max-w-6xl w-full h-full sm:h-[90vh] flex flex-col p-0 overflow-hidden sm:rounded-[2.5rem] border-none shadow-2xl bg-white transition-all duration-300">
        
        {/* Mobile Header (Fixed) */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-100 bg-white sm:bg-transparent">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Habit Library</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Discover your next ritual</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Global Toolbar */}
        <div className="px-6 sm:px-8 py-4 bg-gray-50/50 flex flex-col sm:flex-row gap-4 sm:items-center sticky top-0 z-10 backdrop-blur-sm border-b border-gray-100">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            <Input 
              placeholder="Search habits, skills, or health routines..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 bg-white border-2 border-gray-100 rounded-2xl font-bold focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all text-sm"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
            <div className="flex bg-white p-1 rounded-2xl border-2 border-gray-100">
              {(['popular', 'name', 'difficulty'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    sortBy === s ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-12">
          {/* Featured Carousel (Simulated with scrolling row) */}
          {!search && activeCategory === 'all' && (
            <div className="mt-8">
              <div className="px-6 sm:px-8 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Featured Habits</h3>
              </div>
              <div className="flex gap-4 overflow-x-auto px-6 sm:px-8 no-scrollbar pb-4">
                {featuredHabits.map(habit => (
                  <div 
                    key={`featured-${habit.id}`}
                    onClick={() => onAddHabit(habit)}
                    className="flex-shrink-0 w-64 p-6 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-100 cursor-pointer active:scale-95 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-3xl mb-4">
                      {habit.icon}
                    </div>
                    <h4 className="font-black text-xl mb-1 truncate">{habit.name}</h4>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-4">{habit.categoryId}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black bg-white/10 px-2 py-1 rounded-lg uppercase">{habit.frequency}</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Chips */}
          <div className="px-6 sm:px-8 mt-12 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Filter className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Browse Categories</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={cn(
                    "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2",
                    activeCategory === cat.id 
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" 
                      : "bg-white border-gray-100 text-gray-500 hover:border-blue-200"
                  )}
                >
                  <span className="text-base">{cat.icon}</span> {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Grid */}
          <div className="px-6 sm:px-8">
            {!search && (
              <div className="flex items-center gap-2 mb-8">
                <Sparkles className="w-5 h-5 text-gray-400" />
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                  {search ? 'Search Results' : 'Explore All'}
                </h3>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHabits.map(habit => (
                <div 
                  key={habit.id} 
                  className="group flex flex-col p-6 rounded-[2.5rem] border-2 border-gray-50 hover:border-blue-100 bg-white hover:shadow-2xl hover:shadow-blue-50/50 transition-all active:scale-[0.98] cursor-pointer"
                  onClick={() => onAddHabit(habit)}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-transform group-hover:scale-110", habit.color)}>
                      {habit.icon}
                    </div>
                    {habit.popular && (
                      <div className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" /> Popular
                      </div>
                    )}
                  </div>

                  <h4 className="font-black text-xl text-gray-900 group-hover:text-blue-600 transition-colors leading-tight mb-2">{habit.name}</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">{habit.categoryId}</p>
                  
                  <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-8 flex-1 leading-relaxed">
                    {habit.description}
                  </p>

                  <div className="flex items-center gap-2 pb-4 border-b border-gray-50 mb-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-xl">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{habit.frequency}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-xl">
                      <Gauge className={cn(
                        "w-3.5 h-3.5",
                        habit.difficulty === 'easy' ? "text-green-500" : habit.difficulty === 'medium' ? "text-orange-500" : "text-red-500"
                      )} />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{habit.difficulty}</span>
                    </div>
                  </div>
                  
                  <Button className="w-full h-12 rounded-2xl bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-900 font-black uppercase tracking-widest text-xs transition-all border-none">
                    <Plus className="w-4 h-4 mr-2" /> Add Template
                  </Button>
                </div>
              ))}

              {filteredHabits.length === 0 && (
                <div className="col-span-full py-24 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-6">
                    <Search className="w-12 h-12 text-gray-200" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900">No habit found</h3>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-3">Try checking our categories or search for something else</p>
                  <Button 
                    variant="link" 
                    onClick={() => { setSearch(''); setActiveCategory('all'); }}
                    className="mt-6 text-blue-600 font-black uppercase tracking-widest"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Recommended Section (If not searching) */}
          {!search && (
            <div className="mt-16 bg-gray-50/50 p-6 sm:p-12">
               <div className="px-6 sm:px-8 max-w-4xl mx-auto text-center mb-12">
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight">Need a custom ritual?</h3>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mt-3">Create your own unique habit from scratch</p>
                  <Button 
                    onClick={onCreateCustom}
                    className="mt-8 h-16 px-12 rounded-[2rem] bg-gray-900 text-white font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-gray-200"
                  >
                    <Plus className="w-6 h-6 mr-3" /> Start Custom
                  </Button>
               </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
