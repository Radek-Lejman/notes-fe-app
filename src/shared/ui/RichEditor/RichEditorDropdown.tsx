import { Menu, Portal } from "@chakra-ui/react";
import { RiArrowDropDownLine } from "react-icons/ri";
import { useRichEditorContext } from "./RichEditorRoot";
import { richEditorMenu } from "./RichEditorMenu";
import { handleEditorAction } from "../../lib/editorActions";
import styles from "./RichEditor.module.css";



export const RichEditorDropdown = () => {
  const { editor } = useRichEditorContext();

  if (!editor) return null;

  const handleItemSelection = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const selectedItem = e.currentTarget.dataset.value;
    handleEditorAction(editor, selectedItem);
  };

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <button className={styles.openDropdown} aria-label="Open block menu">
          <RiArrowDropDownLine size={24} />
        </button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {richEditorMenu.menu.map((menuItem) => (
              <Menu.Item
                onClick={handleItemSelection}
                value={menuItem.value}
                key={menuItem.value}
              >
                {menuItem.label}
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
