import { useState } from "react";
import styles from "./Note.module.css";
import { RichEditor } from "@shared/ui/RichEditor";
import MainLayout from "@shared/ui/layouts/MainLayout/MainLayout";
import { DeleteNoteAction } from "../DeleteNoteAction/DeleteNoteAction";



const Note = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
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
            placeholder="Note Title"
          />

            <RichEditor.Root
              value={content}
              onChange={handleContentChange}
              autoFocus={true} 
              placeholder="Type '/' for commands"
            >
              <RichEditor.BubbleMenu />
              <RichEditor.Content />
            </RichEditor.Root>
        </div>
      </div>
    </MainLayout>
  );
};

export default Note;
