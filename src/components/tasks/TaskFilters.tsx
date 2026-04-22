import React from 'react';
import { cn } from '../../lib/utils';

export interface TaskFilterKey {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

interface TaskFiltersProps {
  filters: TaskFilterKey[];
  activeFilter: string;
  onFilterChange: (key: string) => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = React.memo(({ filters, activeFilter, onFilterChange }) => {
  return (
    <div className="md:w-52 shrink-0 overflow-visible">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-2 hidden md:block">Smart Lists</h3>
      <div className="flex md:flex-col gap-1.5 overflow-x-auto no-scrollbar pb-2 md:pb-0 scroll-smooth">
        {filters.map(filter => (
          <button 
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={cn(
              "whitespace-nowrap px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center group active:scale-95",
              activeFilter === filter.key 
                ? "bg-foreground text-background shadow-lg" 
                : "bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground shadow-sm"
            )}
          >
            {filter.icon && <span className="mr-2">{filter.icon}</span>}
            <span>{filter.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

TaskFilters.displayName = 'TaskFilters';
