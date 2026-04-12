export const normalizeError = (error: unknown): Error => {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);

  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;
    if (typeof record.message === 'string') {
      return new Error(record.message);
    }
    try {
      return new Error(JSON.stringify(error));
    } catch {
      return new Error('Unserializable object error');
    }
  }

  return new Error(String(error));
};
