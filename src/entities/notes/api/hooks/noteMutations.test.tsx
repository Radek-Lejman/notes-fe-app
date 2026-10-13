import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { renderHookWithProviders } from '@shared/lib/test/render';
import { NotesApi } from '../notesApi';
import { noteKeys } from '../notesKeys';
import type { Notes } from '../../model/types';
import { useCreateNote } from './useCreateNote';
import { useUpdateNote } from './useUpdateNote';
import { useSearchNotes } from './useSearchNotes';

const note = (id: string, title: string): Notes => ({ id, title, createdAt: '2026-01-01' });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useCreateNote', () => {
  it('caches the new note and appends it to the loaded list', async () => {
    const created = note('n2', 'Kubernetes');
    vi.spyOn(NotesApi, 'createNote').mockResolvedValue(created);
    const { result, queryClient } = renderHookWithProviders(() => useCreateNote());
    queryClient.setQueryData(noteKeys.notes.list(), [note('n1', 'Docker')]);

    await act(() => result.current.mutateAsync({ title: 'Kubernetes', content: '' }));

    expect(queryClient.getQueryData(noteKeys.notes.detail('n2'))).toEqual(created);
    expect(queryClient.getQueryData(noteKeys.notes.list())).toEqual([
      note('n1', 'Docker'),
      created,
    ]);
  });

  it('starts the list when none is cached yet', async () => {
    const created = note('n2', 'Kubernetes');
    vi.spyOn(NotesApi, 'createNote').mockResolvedValue(created);
    const { result, queryClient } = renderHookWithProviders(() => useCreateNote());

    await act(() => result.current.mutateAsync({ title: 'Kubernetes', content: '' }));

    expect(queryClient.getQueryData(noteKeys.notes.list())).toEqual([created]);
  });

  it('leaves the cache alone when creating fails', async () => {
    vi.spyOn(NotesApi, 'createNote').mockRejectedValue(new Error('offline'));
    const { result, queryClient } = renderHookWithProviders(() => useCreateNote());
    queryClient.setQueryData(noteKeys.notes.list(), [note('n1', 'Docker')]);

    act(() => result.current.mutate({ title: 'X', content: '' }));

    await waitFor(() => expect(result.current.error?.message).toBe('offline'));
    expect(queryClient.getQueryData(noteKeys.notes.list())).toEqual([note('n1', 'Docker')]);
  });
});

describe('useUpdateNote', () => {
  it('replaces the note in the detail cache and in the list, keeping the order', async () => {
    const updated = note('n1', 'Docker (edited)');
    vi.spyOn(NotesApi, 'updateNote').mockResolvedValue(updated);
    const { result, queryClient } = renderHookWithProviders(() => useUpdateNote());
    queryClient.setQueryData(noteKeys.notes.list(), [note('n1', 'Docker'), note('n2', 'K8s')]);

    await act(() =>
      result.current.mutateAsync({ id: 'n1', title: 'Docker (edited)', content: '' }),
    );

    expect(queryClient.getQueryData(noteKeys.notes.detail('n1'))).toEqual(updated);
    expect(queryClient.getQueryData(noteKeys.notes.list())).toEqual([updated, note('n2', 'K8s')]);
  });
});

describe('useSearchNotes', () => {
  it('does not call the API while disabled', () => {
    const search = vi.spyOn(NotesApi, 'searchNote').mockResolvedValue([]);

    renderHookWithProviders(() => useSearchNotes({ q: '' }, false));

    expect(search).not.toHaveBeenCalled();
  });

  it('returns the hits for the given parameters', async () => {
    const hits = [{ id: 'n1', title: 'Docker', snippet: '…docker…' }];
    const search = vi.spyOn(NotesApi, 'searchNote').mockResolvedValue(hits);

    const { result } = renderHookWithProviders(() => useSearchNotes({ q: 'docker', limit: 5 }));

    await waitFor(() => expect(result.current.data).toEqual(hits));
    expect(search).toHaveBeenCalledWith({ q: 'docker', limit: 5 });
  });
});
