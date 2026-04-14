import { useState, useRef, useEffect, useCallback } from 'react';

type UseAutoSaveProps<T> = {
  onSave: (data: T) => void;
  debounceMs?: number;
};

export function useAutoSave<T>({ onSave, debounceMs = 1500 }: UseAutoSaveProps<T>) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'unsaved' | 'saved'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const markDirty = useCallback(
    (data: T) => {
      setSyncStatus('unsaved');
      clearTimer();

      timerRef.current = setTimeout(() => {
        onSaveRef.current(data);
        setSyncStatus('saved');
      }, debounceMs);
    },
    [debounceMs],
  );

  const markClean = useCallback(() => {
    clearTimer();
    setSyncStatus('idle');
  }, []);

  const forceCommit = useCallback((data: T) => {
    clearTimer();
    onSaveRef.current(data);
    setSyncStatus('saved');
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, []);

  return {
    syncStatus,
    markDirty,
    markClean,
    forceCommit,
  };
}
