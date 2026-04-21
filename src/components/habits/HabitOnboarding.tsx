import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { GOAL_RECOMMENDATIONS, HABIT_LIBRARY } from '../../lib/habit-library';

export function HabitOnboarding({ onComplete }: { onComplete: (selectedHabits: any[]) => void }) {
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const goals = Object.keys(GOAL_RECOMMENDATIONS);

  const handleComplete = () => {
    if (!selectedGoal) return;
    const recommendedIds = GOAL_RECOMMENDATIONS[selectedGoal];
    const habitsToAdd = recommendedIds.map(id => HABIT_LIBRARY.find(h => h.id === id)).filter(Boolean);
    onComplete(habitsToAdd);
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[600px] pointer-events-auto" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Welcome to your Habit Tracker</DialogTitle>
          <DialogDescription className="text-center text-lg">
            {step === 1 ? 'What is your primary goal right now?' : `Recommended habits for ${selectedGoal}`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-6">
            {goals.map(goal => (
              <button
                key={goal}
                onClick={() => setSelectedGoal(goal)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${selectedGoal === goal ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
              >
                <div className="font-semibold">{goal}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {selectedGoal && GOAL_RECOMMENDATIONS[selectedGoal].map(id => {
              const habit = HABIT_LIBRARY.find(h => h.id === id);
              if (!habit) return null;
              return (
                <div key={id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${habit.color}`}>
                    {habit.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold">{habit.name}</h4>
                    <p className="text-xs text-muted-foreground">{habit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter className="flex w-full sm:justify-between">
          {step === 2 && (
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
          )}
          <div className="flex-1" />
          {step === 1 ? (
            <Button onClick={() => setStep(2)} disabled={!selectedGoal}>Next</Button>
          ) : (
            <Button onClick={handleComplete}>Start Tracking</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
