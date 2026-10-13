import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { noteQueries, useCreateNote, type Notes } from '@entities/notes';
import { AiChatApi } from '@entities/ai-chat';
import { rankByQuery } from '@shared/lib/editor/commands';
import { NoteLinkSuggestion } from '@shared/lib/editor/extensions/NoteLinkSuggestion';
import type { NoteLinkTarget } from '@shared/ui/RichEditor/NoteLink/types';
import type { AskAi } from '@shared/ui/RichEditor/types';

const MAX_PATH_DEPTH = 3;

/** "Parent / Child" titles above the note, so notes with the same title can be told apart. */
const pathOf = (note: Notes, byId: Map<string, Notes>): string | undefined => {
  const titles: string[] = [];
  let parent = note.parentId ? byId.get(note.parentId) : undefined;
  while (parent && titles.length < MAX_PATH_DEPTH) {
    titles.unshift(parent.title || 'Untitled');
    parent = parent.parentId ? byId.get(parent.parentId) : undefined;
  }
  return titles.length ? titles.join(' / ') : undefined;
};

interface EditorIntegrationsProps {
  /** The note being edited: left out of `[[` results. */
  currentNoteId?: string;
}

/**
 * What the note editor needs from the rest of the app: `[[` note links (searched in the note
 * list the side panel already loaded, created with the regular create mutation) and Ask AI.
 */
export const useEditorIntegrations = ({ currentNoteId }: EditorIntegrationsProps = {}) => {
  const queryClient = useQueryClient();
  const createNote = useCreateNote();

  // The editor reads its extensions once; they call the latest values through this ref.
  const latest = useRef({ currentNoteId, createNote: createNote.mutateAsync });
  useEffect(() => {
    latest.current = { currentNoteId, createNote: createNote.mutateAsync };
  }, [currentNoteId, createNote.mutateAsync]);

  const [extensions] = useState(() => [
    NoteLinkSuggestion.configure({
      findNotes: async (query: string): Promise<NoteLinkTarget[]> => {
        const notes = await queryClient.ensureQueryData(noteQueries.list());
        const byId = new Map(notes.map((note) => [note.id, note]));
        const candidates = notes
          .filter((note) => note.id !== latest.current.currentNoteId)
          .map((note) => ({
            id: note.id,
            title: note.title,
            label: note.title || 'Untitled',
            path: pathOf(note, byId),
          }));
        return rankByQuery(candidates, query);
      },
      createNote: async (title: string) => {
        const note = await latest.current.createNote({ title, content: '' });
        return { id: note.id, title: note.title };
      },
    }),
  ]);

  const askAi: AskAi = async (request, signal) => {
    const { text } = await AiChatApi.assist(request, signal);
    return text;
  };

  return { extensions, askAi };
};
