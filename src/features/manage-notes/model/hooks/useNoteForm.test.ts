import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useNoteForm, type UseNoteFormProps } from './useNoteForm';

describe('useNoteForm', () => {
  const onSave = vi.fn<UseNoteFormProps['onSave']>();
  const setup = (props: Partial<UseNoteFormProps> = {}) =>
    renderHook((p: UseNoteFormProps) => useNoteForm(p), {
      initialProps: { initialTitle: 'Docker', initialContent: '# Docker', onSave, ...props },
    });

  beforeEach(() => {
    vi.useFakeTimers();
    onSave.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('starts from the given markdown without saving', () => {
    const { result } = setup();

    expect(result.current.content).toBe('# Docker');
    vi.runAllTimers();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('autosaves the edited markdown after the debounce', () => {
    const { result } = setup();

    act(() => result.current.handleContentChange('# Docker\n\nnew'));
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(onSave).toHaveBeenCalledWith({ title: 'Docker', content: '# Docker\n\nnew' });
  });

  it('saves an emptied note (empty markdown is valid content)', () => {
    const { result } = setup();

    act(() => result.current.handleContentChange(''));
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(onSave).toHaveBeenCalledWith({ title: 'Docker', content: '' });
  });

  it('commits an empty note immediately', () => {
    const { result } = setup();

    act(() => result.current.commitEditorState(''));

    expect(onSave).toHaveBeenCalledWith({ title: 'Docker', content: '' });
  });

  it('autosaves a title change with the current content', () => {
    const { result } = setup();

    act(() => result.current.handleTitleChange('Docker Compose'));
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(onSave).toHaveBeenCalledWith({ title: 'Docker Compose', content: '# Docker' });
  });

  it('does not save a note without a title', () => {
    const { result } = setup({ initialTitle: '' });

    act(() => result.current.handleContentChange('body'));
    act(() => result.current.commitEditorState());
    act(() => {
      vi.runAllTimers();
    });

    expect(onSave).not.toHaveBeenCalled();
    expect(result.current.content).toBe('body');
  });

  it('does not save when the title is cleared', () => {
    const { result } = setup();

    act(() => result.current.handleTitleChange(''));
    act(() => {
      vi.runAllTimers();
    });

    expect(onSave).not.toHaveBeenCalled();
    expect(result.current.title).toBe('');
  });

  it('commits the current content when no content is passed', () => {
    const { result } = setup();

    act(() => result.current.commitEditorState());

    expect(onSave).toHaveBeenCalledWith({ title: 'Docker', content: '# Docker' });
  });

  it('keeps a pending edit when the previous save comes back from the server', () => {
    const { result, rerender } = setup();

    act(() => result.current.handleContentChange('# Docker\n\ntyped while saving'));
    rerender({ initialTitle: 'Docker', initialContent: '# Docker\n\nolder saved', onSave });
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.content).toBe('# Docker\n\ntyped while saving');
    expect(onSave).toHaveBeenCalledWith({
      title: 'Docker',
      content: '# Docker\n\ntyped while saving',
    });
  });
});
