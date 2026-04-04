import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Button, Icon } from '@chakra-ui/react';
import { FiFileText } from 'react-icons/fi';

export const PageReferenceNodeView = (props: NodeViewProps) => {
  const { node, extension } = props;
  const { noteId, title } = node.attrs;

  const handleClick = () => {
    if (extension.options.onPageNavigateRequest && noteId) {
      extension.options.onPageNavigateRequest(noteId);
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
        _hover={{ bg: "gray.100", cursor: "pointer" }}
        contentEditable={false} // Bardzo ważne dla Tiptap węzłów!
      >
        <Icon as={FiFileText} mr={2} />
        {title || "Untitled Page"}
      </Button>
    </NodeViewWrapper>
  );
};
