import { type Editor, type JSONContent } from "@tiptap/react";
import React from "react";

export interface RichEditorContextValue {
  editor: Editor | null;
}

export interface RootProps {
  value: JSONContent;
  onChange: (val: JSONContent) => void;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
  children: React.ReactNode;
}

export interface RichEditorTitleProps {
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  placeholder?: string;
}
