import { useSession } from "@entities/session";
import { Box, Text } from "@chakra-ui/react";

export const SidePanelUserHeader = () => {
    const session = useSession();

    const email = session.data?.email;
    const username = email ? email.split("@")[0] : "User";

    if (email) {
        return (
          <Box w="full" overflow="hidden">
            <Text fontSize="sm" color="gray.500" truncate w="full">
              {email}
            </Text>
            <Text fontSize="md" fontWeight="bold" color="gray.800" _dark={{color: "gray.100"}} truncate w="full">
              {username}
            </Text>
          </Box>
        );
    }

    return (
        <Text fontSize="md" fontWeight="bold" color="gray.800" _dark={{color: "gray.100"}}>
            Notes APP
        </Text>
    );
};
