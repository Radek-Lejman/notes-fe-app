import React, { useState } from "react";
import styles from "./Note.module.css";
import RichEditor from "@shared/ui/RichEditor/RichEditor";

const Note = () => {
  const [markdown, setMarkdown] = useState({
    title: ``,
    description: "",
  });

  const [description, setDescription] = useState("");

  function handleDescriptionChange(e: React.ChangeEvent<HTMLInputElement>) {
    //   console.log("content", e.target.value);

    setDescription(e.target.innerText); // <--- odpowiednik value
  }

  // const handleDescriptionChange = (
  //   e: React.ChangeEvent<HTMLTextAreaElement>
  // ) => {
  //   console.log("content", e.target.value);
  //   setMarkdown((prev) => ({ ...prev, description: e.target.value }));
  // };
  const handleTitleChange = (e: string) => {
    console.log("title ", e);
    setMarkdown((prev) => ({ ...prev, title: e }));
  };

  const handleContentChange = (e: string) => {
    console.log("title ", e);
    setMarkdown((prev) => ({ ...prev, description: e }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.editorSection}>
        {/* <div contentEditable={true}>
          <h1
            className={styles.titleInput}
            contentEditable={true}
            data-text="# Hello Markdown 👋"
          ></h1>
        </div>

        <div
          contentEditable={true}
          className="content"
          data-text="Write your markdown here..."
          onInput={handleDescriptionChange}
        ></div> */}
        {/* 
        <Editable
          value={markdown.title}
          onChange={handleTitleChange}
          placeholder="# Hello Markdown 👋"
          className="title"
        />

        <Editable
          value={markdown.description}
          onChange={handleContentChange}
          placeholder="Write your markdown here..."
          className={styles.title}
        /> */}

        <RichEditor
          tag="h2"
          value="# Hello Markdown 👋"
          onChange={handleContentChange}
          placeholder="Write your markdown here..."
          // className={styles.title}
        />
        <RichEditor
          tag="p"
          value="Write your markdown here..."
          onChange={handleContentChange}
          placeholder="Write your markdown here..."
        />

        {/* <input
          className={styles.titleInput}
          value={markdown.title}
          onChange={handleTitleChange}
        />
        <br />
        <textarea
          className={styles.editor}
          value={markdown.description}
          // onChange={handleDescriptionChange}
          placeholder=""
        /> */}
      </div>
      <div className={styles.actionButtons}>
        <button>Check grammar</button>
      </div>
    </div>
  );
};

export default Note;
