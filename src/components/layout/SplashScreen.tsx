import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

export function SplashScreen({ onFinish, ready }: { onFinish: () => void, ready: boolean }) {
  const [show, setShow] = useState(true);
  const [minTimeDone, setMinTimeDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeDone(true);
    }, 2000); // Minimum time to show splash
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (minTimeDone && ready && show) {
      setShow(false);
      setTimeout(onFinish, 500); // Animation duration
    }
  }, [minTimeDone, ready, show, onFinish]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
        >
          <div className="relative">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2
              }}
              className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-200"
            >
              <Zap className="w-12 h-12 text-white fill-white" />
            </motion.div>
            
            {/* Pulsing Glow */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.2, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-blue-600 rounded-[2.5rem] -z-10 blur-xl"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-8 text-center"
          >
            <h1 className="text-4xl font-black tracking-tighter text-gray-900">
              Task<span className="text-blue-600">Flow</span>
            </h1>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.3em] text-gray-400">
              Your Second Brain for Productivity
            </p>
          </motion.div>

          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 200 }}
            transition={{ delay: 0.8, duration: 1.5, ease: "linear" }}
            className="mt-12 h-1 bg-gray-100 rounded-full overflow-hidden"
          >
            <motion.div 
              className="h-full bg-blue-600"
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 1.5, ease: "linear" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
