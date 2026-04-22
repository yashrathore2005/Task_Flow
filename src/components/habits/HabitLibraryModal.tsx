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
      <DialogContent className="max-w-[100vw] sm:max-w-6xl w-full h-[95vh] sm:h-[90vh] flex flex-col p-0 overflow-hidden sm:rounded-3xl border-none shadow-2xl bg-white transition-all duration-300">
        
        {/* Mobile Header (Fixed) */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-white sm:bg-transparent">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Habit Library</h2>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5">Discover your next ritual</p>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Toolbar */}
        <div className="px-5 py-3 bg-gray-50/50 flex flex-col sm:flex-row gap-3 sm:items-center sticky top-0 z-10 backdrop-blur-sm border-b border-gray-100">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            <Input 
              placeholder="Search habits..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 sm:h-11 bg-white border-2 border-gray-100 rounded-xl font-bold focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all text-[10px] sm:text-xs"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <div className="flex bg-white p-1 rounded-xl border-2 border-gray-100">
              {(['popular', 'name', 'difficulty'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
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
                    className="flex-shrink-0 w-52 sm:w-64 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-100 cursor-pointer active:scale-95 transition-all group"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center text-2xl sm:text-3xl mb-3 sm:mb-4">
                      {habit.icon}
                    </div>
                    <h4 className="font-black text-lg sm:text-xl mb-1 truncate">{habit.name}</h4>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-3 sm:mb-4">{habit.categoryId}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black bg-white/10 px-2 py-1 rounded-lg uppercase">{habit.frequency}</span>
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Chips */}
          <div className="px-5 sm:px-8 mt-8 sm:mt-12 mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-gray-900">Browse Categories</h3>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={cn(
                    "px-3 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-2 flex items-center gap-1.5 sm:gap-2 shadow-sm",
                    activeCategory === cat.id 
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" 
                      : "bg-white border-gray-100 text-gray-500 hover:border-blue-200"
                  )}
                >
                  <span className="text-sm sm:text-base">{cat.icon}</span> {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Grid View */}
          <div className="px-6 sm:px-8">
            {!search && (
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-gray-400" />
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                  {search ? 'Search Results' : 'Explore All'}
                </h3>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredHabits.map(habit => (
                <div 
                  key={habit.id} 
                  className="group bg-white border-2 border-gray-100 p-3 sm:p-4 rounded-2xl sm:rounded-[2rem] hover:border-blue-600/20 hover:shadow-xl hover:shadow-blue-600/5 transition-all cursor-pointer flex flex-col active:scale-95 duration-300"
                  onClick={() => onAddHabit(habit)}
                >
                  <div className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4 transition-transform group-hover:scale-110 duration-500",
                    habit.color
                  )}>
                    {habit.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-xs sm:text-sm text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {habit.name}
                    </h4>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium line-clamp-2 leading-relaxed mb-3 sm:mb-4">
                      {habit.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 rounded-md">
                      <Clock className="w-2.5 h-2.5 text-gray-400" />
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{habit.frequency}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-7 w-7 p-0 rounded-lg hover:bg-blue-600 hover:text-white transition-all text-gray-400"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </Button>
                  </div>
                </div>
              ))}

              {filteredHabits.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-gray-200" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">No habit found</h3>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] mt-2">Check categories or try another search</p>
                  <Button 
                    variant="link" 
                    onClick={() => { setSearch(''); setActiveCategory('all'); }}
                    className="mt-4 text-blue-600 font-black uppercase tracking-widest text-[10px]"
                  >
                    Clear Filters
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
