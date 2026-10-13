import { describe, expect, it, vi } from 'vitest';
import { RefreshQueueManager } from './RefreshQueueManager';

describe('RefreshQueueManager', () => {
  it('tracks whether a refresh is running', () => {
    const manager = new RefreshQueueManager();
    expect(manager.isRefreshing).toBe(false);

    manager.setRefreshing(true);
    expect(manager.isRefreshing).toBe(true);
  });

  it('resolves every queued request after a successful refresh', () => {
    const manager = new RefreshQueueManager();
    const first = { resolve: vi.fn(), reject: vi.fn() };
    const second = { resolve: vi.fn(), reject: vi.fn() };
    manager.add(first.resolve, first.reject);
    manager.add(second.resolve, second.reject);

    manager.process(null);

    expect(first.resolve).toHaveBeenCalledOnce();
    expect(second.resolve).toHaveBeenCalledOnce();
    expect(first.reject).not.toHaveBeenCalled();
  });

  it('rejects every queued request with the refresh error', () => {
    const manager = new RefreshQueueManager();
    const item = { resolve: vi.fn(), reject: vi.fn() };
    const error = new Error('refresh failed');
    manager.add(item.resolve, item.reject);

    manager.process(error);

    expect(item.reject).toHaveBeenCalledWith(error);
    expect(item.resolve).not.toHaveBeenCalled();
  });

  it('empties the queue, so a request is settled only once', () => {
    const manager = new RefreshQueueManager();
    const item = { resolve: vi.fn(), reject: vi.fn() };
    manager.add(item.resolve, item.reject);

    manager.process(null);
    manager.process(new Error('later'));

    expect(item.resolve).toHaveBeenCalledOnce();
    expect(item.reject).not.toHaveBeenCalled();
  });
});
