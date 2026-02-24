import { Button, Icon, Menu, Portal } from "@chakra-ui/react";
import { RiArrowDropDownLine } from "react-icons/ri";
import styles from "./Menu.module.css";

export interface Dropdown {
  title: string;
  menu: DropdownMenuItem[];
}

export interface DropdownMenuItem {
  value: string;
  label: string;
}

const dropdownInput = {
  title: "v",
  menu: [
    { value: "bold", label: "Bold" },
    { value: "italic", label: "Italic" },
    { value: "strike", label: "Strikethrough" },
    { value: "code", label: "Inline code" },

    { value: "clearMarks", label: "Clear marks" },
    { value: "clearNodes", label: "Clear nodes" },

    { value: "paragraph", label: "Paragraph" },
    { value: "h1", label: "Heading 1" },
    { value: "h2", label: "Heading 2" },
    { value: "h3", label: "Heading 3" },
    { value: "h4", label: "Heading 4" },
    { value: "h5", label: "Heading 5" },
    { value: "h6", label: "Heading 6" },

    { value: "bulletList", label: "Bullet list" },
    { value: "orderedList", label: "Ordered list" },
    { value: "codeBlock", label: "Code block" },
    { value: "blockquote", label: "Blockquote" },

    { value: "horizontalRule", label: "Horizontal rule" },
    { value: "hardBreak", label: "Hard break" },

    { value: "undo", label: "Undo" },
    { value: "redo", label: "Redo" },
  ],
};

export interface DropdownProps {
  onSelect: (value: string) => void;
}

export const Dropdown = (props: DropdownProps) => {
  const menu = dropdownInput;

  const handleItemSelection = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const selectedItem = e.currentTarget.dataset.value;
    if (selectedItem) {
      props.onSelect(selectedItem);
    } else {
      throw Error("Item menu cannot be selected");
    }
  };
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button
          className={styles.openDropdown}
          variant="ghost"
          size="sm"
          colorPalette="white"
        >
          <Icon size="lg" color="tomato">
            <RiArrowDropDownLine color="black" />
          </Icon>
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {menu.menu.map((menuItem) => (
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
