import { Flex, Stack, Box, Input, Button, Heading, Text, Spinner } from "@chakra-ui/react";
import { useState, type ReactNode } from "react";
import { FiMail, FiLock, FiEye, FiEyeOff, FiEdit3 } from "react-icons/fi";
import { AuthApi } from "@entities/session";


// TODO - move to separate folder
type LoginCredentials = Parameters<typeof AuthApi.login>[0];

interface AuthFormProps {
  mode: "Login" | "Register";
  isLoading?: boolean;
  error?: string | null;
  onSubmit: (credentials: LoginCredentials) => void;
  headerSlot?: ReactNode;
  footerSlot?: ReactNode;
}

export const AuthForm = ({
  mode,
  isLoading,
  error,
  onSubmit,
  headerSlot,
  footerSlot,
}: AuthFormProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    onSubmit({ email, password });
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg="gray.50"
      _dark={{ bg: "gray.900" }}
      px={4}
    >
      <Stack gap={8} mx="auto" maxW="lg" w="full" py={12}>
        <Stack align="center" textAlign="center" gap={4}>
          <Box p={4} bg="teal.500" rounded="2xl" color="white" shadow="lg">
             <FiEdit3 size={32} />
          </Box>
          {headerSlot || (
            <>
              <Heading fontSize="3xl" fontWeight="bold">
                {mode === "Login" ? "Welcome back" : "Create an account"}
              </Heading>
              <Text fontSize="lg" color="gray.600" _dark={{ color: "gray.400" }}>
                to continue to your notes
              </Text>
            </>
          )}
        </Stack>

        <Box
          rounded="2xl"
          bg="white"
          _dark={{ bg: "gray.800" }}
          boxShadow="2xl"
          p={{ base: 6, sm: 8 }}
          borderWidth="1px"
        >
          <form onSubmit={handleSubmit}>
            <Stack gap={5}>
              <Box>
                <Text mb={2} fontWeight="medium">Email address</Text>
                <Box position="relative">
                  <Box position="absolute" left={3} top={3} color="gray.400" zIndex={2}>
                    <FiMail />
                  </Box>
                  <Input
                    name="email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    pl={10}
                    size="lg"
                    _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px #319795" }}
                    rounded="lg"
                  />
                </Box>
              </Box>

              <Box>
                <Text mb={2} fontWeight="medium">Password</Text>
                <Box position="relative">
                  <Box position="absolute" left={3} top={3} color="gray.400" zIndex={2}>
                    <FiLock />
                  </Box>
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    pl={10}
                    pr={12}
                    size="lg"
                    _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px #319795" }}
                    rounded="lg"
                  />
                  <Box position="absolute" right={2} top={2} zIndex={2}>
                    <Button
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                      color="gray.400"
                      _hover={{ bg: "transparent", color: "teal.500" }}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </Button>
                  </Box>
                </Box>
              </Box>

              {error && (
                <Text color="red.500" fontSize="sm" textAlign="center">
                  {error}
                </Text>
              )}

              <Button
                type="submit"
                size="lg"
                fontSize="md"
                bg="teal.500"
                color="white"
                disabled={isLoading}
                w="full"
                rounded="lg"
                shadow="md"
                _hover={{
                  bg: "teal.600",
                  transform: "translateY(-1px)",
                  shadow: "lg",
                }}
                transition="all 0.2s"
              >
                {isLoading ? <Spinner size="sm" color="white" /> : mode}
              </Button>
            </Stack>
          </form>

          {footerSlot && (
            <Box mt={6} textAlign="center">
              {footerSlot}
            </Box>
          )}
        </Box>
      </Stack>
    </Flex>
  );
};
