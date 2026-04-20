import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasksStore } from './store/tasksStore';

export function useGlobalKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      const activeTagName = document.activeElement?.tagName.toLowerCase();
      if (activeTagName === 'input' || activeTagName === 'textarea') return;

      if (e.key === 'c' || e.key === 'n') {
        const fab = document.getElementById('global-fab');
        if (fab) fab.click();
      }

      if (e.key === '1') navigate('/');
      if (e.key === '2') navigate('/habits');
      if (e.key === '3') navigate('/focus');
      if (e.key === '4') navigate('/countdowns');
      if (e.key === '5') navigate('/dashboard');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}
