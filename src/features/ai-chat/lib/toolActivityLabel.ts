import type { ChatActivity } from '../model/types';

const queryOf = (input: unknown): string | undefined => {
  if (typeof input !== 'object' || input === null) return undefined;
  const query = (input as Record<string, unknown>).query;
  return typeof query === 'string' ? query : undefined;
};

export function toolActivityLabel(activity: ChatActivity): string {
  switch (activity.tool) {
    case 'search_notes': {
      const query = queryOf(activity.input);
      return query ? `Searching notes for "${query}"…` : 'Searching notes…';
    }
    case 'get_note':
      return 'Reading a note…';
    case 'list_notes':
      return 'Looking through your notes…';
    default:
      return 'Working…';
  }
}
