import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAutoSave } from './useAutoSave';

describe('useAutoSave', () => {
  const onSave = vi.fn<(data: string) => void>();

  beforeEach(() => {
    vi.useFakeTimers();
    onSave.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts idle', () => {
    const { result } = renderHook(() => useAutoSave({ onSave }));
    expect(result.current.syncStatus).toBe('idle');
  });

  it('saves after the debounce and reports the status', () => {
    const { result } = renderHook(() => useAutoSave({ onSave, debounceMs: 500 }));

    act(() => result.current.markDirty('v1'));
    expect(result.current.syncStatus).toBe('unsaved');
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(onSave).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onSave).toHaveBeenCalledWith('v1');
    expect(result.current.syncStatus).toBe('saved');
  });

  it('saves only the last value of a burst of edits', () => {
    const { result } = renderHook(() => useAutoSave({ onSave, debounceMs: 500 }));

    act(() => {
      result.current.markDirty('v1');
      result.current.markDirty('v2');
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    act(() => result.current.markDirty('v3'));
    act(() => {
      vi.runAllTimers();
    });

    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith('v3');
  });

  it('commits right away and drops the pending save', () => {
    const { result } = renderHook(() => useAutoSave({ onSave }));

    act(() => result.current.markDirty('typed'));
    act(() => result.current.forceCommit('typed'));
    act(() => {
      vi.runAllTimers();
    });

    expect(onSave).toHaveBeenCalledOnce();
    expect(result.current.syncStatus).toBe('saved');
  });

  it('cancels a pending save when marked clean', () => {
    const { result } = renderHook(() => useAutoSave({ onSave }));

    act(() => result.current.markDirty('typed'));
    act(() => result.current.markClean());
    act(() => {
      vi.runAllTimers();
    });

    expect(onSave).not.toHaveBeenCalled();
    expect(result.current.syncStatus).toBe('idle');
  });

  it('calls the latest onSave passed in', () => {
    const latest = vi.fn();
    const { result, rerender } = renderHook((props) => useAutoSave(props), {
      initialProps: { onSave },
    });

    act(() => result.current.markDirty('v1'));
    rerender({ onSave: latest });
    act(() => {
      vi.runAllTimers();
    });

    expect(onSave).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledWith('v1');
  });

  it('does not save after unmount', () => {
    const { result, unmount } = renderHook(() => useAutoSave({ onSave }));

    act(() => result.current.markDirty('typed'));
    unmount();
    vi.runAllTimers();

    expect(onSave).not.toHaveBeenCalled();
  });
});
