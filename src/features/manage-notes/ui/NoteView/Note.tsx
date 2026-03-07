import { useState } from "react";
import styles from "./Note.module.css";
import { RichEditor } from "@shared/ui/RichEditor";
import MainLayout from "@shared/ui/layouts/MainLayout/MainLayout";
import { DeleteNoteAction } from "../DeleteNoteAction/DeleteNoteAction";

interface EditorBlock {
  id: string;
  content: string;
}

const Note = () => {
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<EditorBlock[]>([
    { id: crypto.randomUUID(), content: "" },
  ]);

  const handleContentChange = (id: string, newContent: string) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === id ? { ...block, content: newContent } : block
      )
    );
  };

  const handleAddBlock = (index: number) => {
    setBlocks((prev) => {
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, { id: crypto.randomUUID(), content: "" });
      return newBlocks;
    });
  };

  return (
    <MainLayout
      title="Edit Note"
      headerActions={<DeleteNoteAction noteId="temp-123" />}
    >
      <div className={styles.container}>
        <div className={styles.editorSection}>

          <RichEditor.Title
            value={title}
            onChange={setTitle}
            onEnter={() => handleAddBlock(-1)}
            placeholder="Note Title"
          />

          {blocks.map((block, index) => (
            <RichEditor.Root
              key={block.id}
              value={block.content}
              onChange={(val) => handleContentChange(block.id, val)}
              onEnter={() => handleAddBlock(index)}
              autoFocus={true} 
              placeholder="Type '/' for commands"
            >
              <RichEditor.Dropdown />
              <RichEditor.Content />
            </RichEditor.Root>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Note;
