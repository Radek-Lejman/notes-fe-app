import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Button, Icon } from '@chakra-ui/react';
import { FiFileText } from 'react-icons/fi';

interface PageReferenceExtensionOptions {
  onPageNavigateRequest?: (noteId: string) => void;
}

export const PageReferenceNodeView = (props: NodeViewProps) => {
  const { node } = props;
  const { noteId, title } = node.attrs as Record<string, unknown>;
  const options = props.extension.options as PageReferenceExtensionOptions;

  const handleClick = () => {
    if (options.onPageNavigateRequest && typeof noteId === 'string') {
      options.onPageNavigateRequest(noteId);
    }
  };

  return (
    <NodeViewWrapper css={{ display: 'block', margin: '8px 0' }}>
      <Button
        size="sm"
        onClick={handleClick}
        variant="outline"
        colorScheme="gray"
        borderWidth="1px"
        borderRadius="md"
        bg="gray.50"
        justifyContent="flex-start"
        width="fit-content"
        _hover={{ bg: 'gray.100', cursor: 'pointer' }}
        contentEditable={false} // Bardzo ważne dla Tiptap węzłów!
      >
        <Icon as={FiFileText} mr={2} />
        {typeof title === 'string' ? title : 'Untitled Page'}
      </Button>
    </NodeViewWrapper>
  );
};
