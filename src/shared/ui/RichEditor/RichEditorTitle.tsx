import { Textarea } from "@chakra-ui/react";
import styles from "./RichEditor.module.css";
import React from "react";

interface RichEditorTitleProps {
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  placeholder?: string;
}

export const RichEditorTitle = ({ value, onChange, onEnter, placeholder = "Title" }: RichEditorTitleProps) => {
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    
    // Auto-resize logic
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (onEnter) onEnter();
    }
  };

  return (
    <Textarea
      value={value}
      onChange={handleInput}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={styles.title}
      variant="flushed"
      border="none"
      _focus={{ border: "none", boxShadow: "none" }}
      px={2}
      py={2}
      minH="unset"
      overflow="hidden"
      resize="none"
      rows={1}
      fontSize="4xl"
      fontWeight="bold"
      lineHeight="1.2"
      color="gray.800"
      _placeholder={{ color: "gray.400" }}
    />
  );
};
