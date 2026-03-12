import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { Box, Button, Text } from "@chakra-ui/react";
import {
  type CommandSuggestionListProps,
  type CommandSuggestionListRef,
} from "./types";

export const CommandSuggestionList = forwardRef<CommandSuggestionListRef, CommandSuggestionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex(
      (selectedIndex + props.items.length - 1) % props.items.length
    );
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
    }
  }, [selectedIndex]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }
      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }
      if (event.key === "Enter") {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
    <Box
      bg="white"
      borderRadius="md"
      boxShadow="lg"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      p={1}
      minW="12rem"
      maxW="20rem"
      maxH="20rem"
      overflowY="auto"
    >
      {props.items.length > 0 ? (
        props.items.map((item, index) => (
          <Button
            key={index}
            ref={(el) => { itemRefs.current[index] = el; }}
            variant="ghost"
            justifyContent="flex-start"
            size="sm"
            fontWeight={index === selectedIndex ? "medium" : "normal"}
            bg={index === selectedIndex ? "gray.100" : "transparent"}
            color={index === selectedIndex ? "gray.900" : "gray.700"}
            _hover={{
              bg: "gray.100",
              color: "gray.900",
            }}
            onClick={() => selectItem(index)}
          >
            {item.label}
          </Button>
        ))
      ) : (
        <Text fontSize="sm" color="gray.500" p={2} textAlign="center">
          No results
        </Text>
      )}
    </Box>
  );
});

CommandSuggestionList.displayName = "CommandSuggestionList";
