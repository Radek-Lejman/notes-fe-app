import { useState, useEffect } from "react";
import { RichEditor } from "@shared/ui/RichEditor";
import { type JSONContent } from "@tiptap/react";
import { Button, Flex } from "@chakra-ui/react";
import type { NoteEditorFormProps } from "@features/manage-notes/model/types";

export const NoteEditorForm = ({ 
  initialTitle, 
  initialContent, 
  onSave, 
  isSaving 
}: NoteEditorFormProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState<JSONContent | null>(initialContent);

  // Sync props to state if they change externally
  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
  }, [initialTitle, initialContent]);

  const handleContentChange = (newContent: JSONContent) => {
    setContent(newContent);
  };

  const handleSave = () => {
    if (!title || !content) return;
    onSave({ title, content });
  };

  return (
    <Flex
      w="full"
      justify="center"
      css={{
        "& [contentEditable=\"true\"]:empty:not(:focus):before": {
          content: 'attr(data-text)',
          color: 'gray.400',
        }
      }}
    >
      <Flex direction="column" gap={1} w="full" maxW="800px" mx="auto" my={4}>
        <RichEditor.Title
          value={title}
          onChange={setTitle}
          placeholder="Note Title"
        />

        <RichEditor.Root
          value={content || {}}
          onChange={handleContentChange}
          autoFocus={true} 
          placeholder="Type '/' for commands"
        >
          <RichEditor.BubbleMenu />
          <RichEditor.Content />
        </RichEditor.Root>
        
        <Button 
          size="sm" 
          variant="outline" 
          colorScheme="blue" 
          onClick={handleSave}
          loading={isSaving}
          mt={4}
          alignSelf="flex-start"
        >
          Save
        </Button>
      </Flex>
    </Flex>
  );
};
