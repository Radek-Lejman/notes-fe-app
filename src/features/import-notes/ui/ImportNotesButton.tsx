import { useState } from 'react';
import { Button } from '@chakra-ui/react';
import { ImportNotesDialog } from './ImportNotesDialog';

export const ImportNotesButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setIsOpen(true)}>
        Import notes
      </Button>
      <ImportNotesDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
