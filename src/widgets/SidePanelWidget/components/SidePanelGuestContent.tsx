import { Button, Link, VStack, Text } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";

export const SidePanelGuestContent = () => (
  <VStack align="start"  mt={4}>
    <Text>Zaloguj się, aby mieć dostęp do swoich notatek.</Text>
    <Button as={Link} colorScheme="blue" size="sm" width="full">
      <NavLink to="/login" replace >Zaloguj się</NavLink>
    </Button>
    <Button as={Link}  variant="outline" size="sm" width="full">
      <NavLink to="/register" replace >Załóż konto</NavLink>
    </Button>
  </VStack>
);