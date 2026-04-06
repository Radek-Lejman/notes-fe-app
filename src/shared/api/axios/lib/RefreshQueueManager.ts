interface QueueItem {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}

/**
 * Logic for queueing failed requests during a token refresh.
 */
export class RefreshQueueManager {
  private _isRefreshing: boolean = false;
  private _queue: QueueItem[] = [];

  public get isRefreshing(): boolean {
    return this._isRefreshing;
  }

  public setRefreshing(status: boolean): void {
    this._isRefreshing = status;
  }

  public add(resolve: (value?: unknown) => void, reject: (reason?: unknown) => void): void {
    this._queue.push({ resolve, reject });
  }

  public process(error: Error | null): void {
    this._queue.forEach((item) => {
      if (error) {
        item.reject(error);
      } else {
        item.resolve();
      }
    });
    this._queue = [];
  }
}
