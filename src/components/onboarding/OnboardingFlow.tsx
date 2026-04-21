import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Rocket, CheckSquare, Activity, Palette, Sparkles, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to TaskFlow',
    description: 'The premium workspace for high-achievers. Ready to transform your productivity?',
    icon: Rocket,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    id: 'tasks',
    title: 'Master Your Tasks',
    description: 'Capture everything. Organize by priority, set deadlines, and feel the rush of checking things off.',
    icon: CheckSquare,
    color: 'text-green-600',
    bg: 'bg-green-50',
    action: { label: 'Go to Tasks', link: '/tasks' }
  },
  {
    id: 'habits',
    title: 'Build Better Habits',
    description: 'Track consistency. Our visual streak system keeps you motivated to build lasting change.',
    icon: Activity,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    action: { label: 'Go to Habits', link: '/habits' }
  },
  {
    id: 'theme',
    title: 'Your Style, Your Rules',
    description: 'Choose your vibe. We support high-contrast light mode and a focus-driven sleek dark mode.',
    icon: Palette,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    action: { label: 'Go to Settings', link: '/settings' }
  },
  {
    id: 'ready',
    title: "You're All Set!",
    description: "Your journey starts now. Take the first step and create something amazing today.",
    icon: Sparkles,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
  }
];

export function OnboardingFlow({ isOpen, onClose }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  
  const step = STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      localStorage.setItem('onboardingComplete', 'true');
      onClose();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboardingComplete', 'true');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && handleSkip()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
        <div className="relative p-12 flex flex-col items-center text-center">
          <button onClick={handleSkip} className="absolute top-8 right-8 p-2 text-gray-300 hover:text-gray-900 transition-colors">
            <X className="w-6 h-6" />
          </button>

          <AnimatePresence mode="wait">
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="flex flex-col items-center"
            >
              <div className={cn("w-24 h-24 rounded-[2rem] flex items-center justify-center mb-10 shadow-lg shadow-blue-50 transition-all duration-500", step.bg, step.color)}>
                 <step.icon className="w-12 h-12 stroke-[2.5]" />
              </div>

              <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-4">
                {step.title}
              </h2>
              
              <p className="text-lg font-bold text-gray-400 max-w-sm leading-relaxed mb-12 italic">
                "{step.description}"
              </p>

              {step.action && (
                <button 
                  onClick={() => { navigate(step.action!.link); handleSkip(); }}
                  className="mb-8 font-black text-xs uppercase tracking-widest text-blue-600 flex items-center gap-2 hover:gap-3 transition-all"
                >
                  {step.action.label} <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-2 mb-12">
             {STEPS.map((_, i) => (
               <div key={i} className={cn("h-1.5 rounded-full transition-all duration-500", i === currentStep ? "w-8 bg-blue-600 shadow-sm" : "w-1.5 bg-gray-100")} />
             ))}
          </div>

          <div className="flex w-full gap-4">
             {currentStep < STEPS.length - 1 ? (
               <>
                 <Button variant="ghost" onClick={handleSkip} className="flex-1 h-16 rounded-3xl font-black uppercase tracking-widest text-xs text-gray-400 hover:text-gray-900">Skip Intro</Button>
                 <Button onClick={handleNext} className="flex-1 h-16 rounded-3xl bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100">Continue</Button>
               </>
             ) : (
               <Button onClick={handleNext} className="w-full h-16 rounded-3xl bg-gray-900 hover:bg-black font-black uppercase tracking-widest text-xs shadow-xl shadow-gray-200">Start My Journey</Button>
             )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
