import { type Editor, type Extensions, type JSONContent } from "@tiptap/react";
import type React from "react";

export interface RichEditorContextValue {
  editor: Editor | null;
}

export interface CustomSlashMenuItem {
  label: string;
  value: string;
  action?: (editor: Editor) => void;
}

export interface RootProps {
  value: JSONContent;
  onChange: (val: JSONContent) => void;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
  children: React.ReactNode;
  customSlashItems?: CustomSlashMenuItem[];
  extensions?: Extensions;
}

export interface RichEditorTitleProps {
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  placeholder?: string;
}
