import { Flex, Stack, Box, Input, Button, Heading } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface AuthFormProps {
  mode: "Login" | "Register";
  username: string;
  password: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onLoginSubmit: (username: string, password: string) => void;
  footerLink?: ReactNode;
}

export const AuthForm = ({
  username,
  mode,
  password,
  onUsernameChange,
  onPasswordChange,
  onLoginSubmit,
  footerLink,
}: AuthFormProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSubmit(username, password);
  };

  return (
    <Flex
      flexDirection="column"
      width="100wh"
      height="100vh"
      backgroundColor="gray.200"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        flexDir="column"
        mb="2"
        justifyContent="center"
        alignItems="center"
      >
        <Heading color="teal.400">Welcome</Heading>

        <Box minW={{ base: "90%", md: "468px" }}>
          <form onSubmit={handleSubmit}>
            <Stack p="1rem" backgroundColor="whiteAlpha.900" boxShadow="md">
              <Input
                type="email"
                placeholder="email address"
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
              />

              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
              />

              <Button
                borderRadius={0}
                type="submit"
                variant="solid"
                colorScheme="teal"
                width="full"
              >
                {mode}
              </Button>
            </Stack>
          </form>
        </Box>
      </Stack>

      {footerLink && <Box>{footerLink}</Box>}
    </Flex>
  );
};
