import { useEffect } from 'react';
import { useActions } from './useActions';

export const useKeyboardEvents = () => {
  const { deleteSelection, duplicateSelection, undo, redo } = useActions();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelection();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelection();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelection, duplicateSelection, redo, undo]);
};
