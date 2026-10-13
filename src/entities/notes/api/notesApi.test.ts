import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AxiosResponse } from 'axios';
import { apiClient } from '@shared/api/axios/client';
import { NotesApi } from './notesApi';
import { noteQueries } from './notesQuery';
import { noteKeys } from './notesKeys';

const ok = <T>(data: T) => Promise.resolve({ data } as AxiosResponse<T>);
const note = { id: 'n1', title: 'Docker', content: '# Docker', createdAt: '2026-01-01' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('NotesApi', () => {
  it('lists notes', async () => {
    const get = vi.spyOn(apiClient, 'get').mockReturnValue(ok([note]));

    await expect(NotesApi.getNotes()).resolves.toEqual([note]);
    expect(get).toHaveBeenCalledWith('/notes');
  });

  it('gets one note by id', async () => {
    const get = vi.spyOn(apiClient, 'get').mockReturnValue(ok(note));

    await expect(NotesApi.getNote('n1')).resolves.toEqual(note);
    expect(get).toHaveBeenCalledWith('/notes/n1');
  });

  it('creates a note', async () => {
    const post = vi.spyOn(apiClient, 'post').mockReturnValue(ok(note));
    const payload = { title: 'Docker', content: '', parentId: 'p1' };

    await expect(NotesApi.createNote(payload)).resolves.toEqual(note);
    expect(post).toHaveBeenCalledWith('/notes', payload);
  });

  it('patches a note without sending its id in the body', async () => {
    const patch = vi.spyOn(apiClient, 'patch').mockReturnValue(ok(note));

    await NotesApi.updateNote({ id: 'n1', title: 'Docker', content: '# Docker' });

    expect(patch).toHaveBeenCalledWith('/notes/n1', { title: 'Docker', content: '# Docker' });
  });

  it('sends search parameters as the query string', async () => {
    const get = vi.spyOn(apiClient, 'get').mockReturnValue(ok([]));
    const params = { q: 'docker', limit: 10, order: '-createdAt' as const, fields: 'title' };

    await NotesApi.searchNote(params);

    expect(get).toHaveBeenCalledWith('/notes/search', { params });
  });

  it('propagates request errors', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('offline'));

    await expect(NotesApi.getNotes()).rejects.toThrow('offline');
  });
});

describe('noteQueries', () => {
  it('uses the shared query keys', () => {
    expect(noteQueries.list().queryKey).toEqual(noteKeys.notes.list());
    expect(noteQueries.detail('n1').queryKey).toEqual(['notes', 'detail', 'n1']);
    expect(noteQueries.search('dock').queryKey).toEqual(['notes', 'search', 'dock']);
  });

  it('does not fetch a note without an id', () => {
    expect(noteQueries.detail('').enabled).toBe(false);
    expect(noteQueries.detail('n1').enabled).toBe(true);
  });

  it('searches only from three characters', () => {
    expect(noteQueries.search('do').enabled).toBe(false);
    expect(noteQueries.search('doc').enabled).toBe(true);
  });

  it('keeps every note key under the common prefix, so one invalidation covers all', () => {
    const prefix = noteKeys.notes.all();
    for (const key of [
      noteKeys.notes.list(),
      noteKeys.notes.detail('n1'),
      noteKeys.notes.search('x'),
    ]) {
      expect(key.slice(0, prefix.length)).toEqual(prefix);
    }
  });
});
