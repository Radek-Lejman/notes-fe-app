import { useRef, type ChangeEvent } from 'react';
import { Button, Flex } from '@chakra-ui/react';
import { PICKABLE_FILE_TYPES } from '../lib/importPaths';

/** "Choose a folder" (a whole vault) and "Choose files or a .zip", each with its hidden input. */
export const ImportFilePicker = ({ onPick }: { onPick: (files: File[]) => void }) => {
  const folderInput = useRef<HTMLInputElement>(null);
  const filesInput = useRef<HTMLInputElement>(null);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Picking the same folder again must fire `change` again.
    event.target.value = '';
    onPick(files);
  };

  return (
    <Flex gap={3} wrap="wrap">
      <input
        ref={(element) => {
          folderInput.current = element;
          // Not in React's attribute types; lets the user pick a whole folder.
          element?.setAttribute('webkitdirectory', '');
        }}
        type="file"
        hidden
        data-testid="import-folder-input"
        onChange={onChange}
      />
      <input
        ref={filesInput}
        type="file"
        multiple
        accept={PICKABLE_FILE_TYPES}
        hidden
        data-testid="import-files-input"
        onChange={onChange}
      />
      <Button variant="outline" onClick={() => folderInput.current?.click()}>
        Choose a folder
      </Button>
      <Button variant="outline" onClick={() => filesInput.current?.click()}>
        Choose files or a .zip
      </Button>
    </Flex>
  );
};
