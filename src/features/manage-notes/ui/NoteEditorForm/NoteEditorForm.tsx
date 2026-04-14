import { RichEditor } from '@shared/ui/RichEditor';
import { Flex, Text, Spinner } from '@chakra-ui/react';
import type { NoteEditorFormProps } from '../../model/types';
import { NoteEditorContext } from '../../model/NoteEditorContext';
import { useNoteForm } from '../../model/hooks/useNoteForm';

export const NoteEditorForm = ({
  initialTitle,
  initialContent,
  onSave,
  isSaving,
  saveError,
  editorExtensions = [],
  slashMenuItems = [],
  editorOverlays,
}: NoteEditorFormProps) => {
  const { title, content, syncStatus, handleContentChange, handleTitleChange, commitEditorState } =
    useNoteForm({
      initialTitle,
      initialContent,
      onSave,
      debounceMs: 1500,
    });

  return (
    <NoteEditorContext.Provider value={{ commitEditorState }}>
      <Flex
        w="full"
        justify="center"
        css={{
          '& [contentEditable="true"]:empty:not(:focus):before': {
            content: 'attr(data-text)',
            color: 'gray.400',
          },
        }}
      >
        <Flex direction="column" gap={1} w="full" maxW="800px" mx="auto" my={4}>
          <Flex justify="flex-end" align="center" px={4} py={2} minH="40px">
            <Flex gap={2} align="center">
              {isSaving && <Spinner size="xs" color="gray.400" />}
              <Text fontSize="xs" color={saveError ? 'red.500' : 'gray.400'} userSelect="none">
                {isSaving
                  ? 'Saving...'
                  : saveError
                    ? `Error: ${saveError}`
                    : syncStatus === 'unsaved'
                      ? 'Unsaved changes'
                      : syncStatus === 'saved'
                        ? 'Saved'
                        : ''}
              </Text>
            </Flex>
          </Flex>

          <RichEditor.Title
            value={title || ''}
            onChange={handleTitleChange}
            placeholder="Note Title"
          />

          <RichEditor.Root
            value={content || {}}
            onChange={handleContentChange}
            autoFocus={true}
            placeholder="Type '/' for commands"
            customSlashItems={slashMenuItems}
            extensions={editorExtensions}
          >
            <RichEditor.BubbleMenu />
            <RichEditor.Content />

            {editorOverlays}
          </RichEditor.Root>
        </Flex>
      </Flex>
    </NoteEditorContext.Provider>
  );
};
