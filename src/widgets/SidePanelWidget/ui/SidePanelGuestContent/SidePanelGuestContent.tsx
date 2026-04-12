import { Button, VStack, Text } from '@chakra-ui/react';
import type { ButtonProps } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import type { NavLinkProps } from 'react-router-dom';

const NavLinkButton = Button as React.FC<ButtonProps & NavLinkProps>;

export const SidePanelGuestContent = () => (
  <VStack align="start" mt={4}>
    <Text>Zaloguj się, aby mieć dostęp do swoich notatek.</Text>
    <NavLinkButton as={NavLink} to="/login" replace colorScheme="blue" size="sm" width="full">
      Zaloguj się
    </NavLinkButton>
    <NavLinkButton as={NavLink} to="/register" replace variant="outline" size="sm" width="full">
      Załóż konto
    </NavLinkButton>
  </VStack>
);
