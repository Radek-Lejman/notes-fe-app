import { useState } from "react";
import { PageReferenceNode } from "../../lib/tiptap/PageReferenceNode";
import type { CustomSlashMenuItem } from "@shared/ui/RichEditor/types";
import type { NestedNotePluginProps } from "../types";

export const useNestedNotePlugin = ({ 
  onNestedNoteNavigateRequest,
  isNestedNoteCreationEnabled = true
}: NestedNotePluginProps = {}) => {
  const [isOpen, setIsOpen] = useState(false);

  const extensions = [PageReferenceNode.configure({ onPageNavigateRequest: onNestedNoteNavigateRequest })];
  
  const slashMenuItems: CustomSlashMenuItem[] = isNestedNoteCreationEnabled ? [
    {
      label: "Sub-note",
      value: "nested_note",
      action: () => setIsOpen(true),
    }
  ] : [];

  return { 
    extensions, 
    slashMenuItems, 
    isOverlayOpen: isOpen,
    closeOverlay: () => setIsOpen(false)
  };
};
