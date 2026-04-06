import { Stack, Box, Input, Button, Spinner, Field } from "@chakra-ui/react";
import { useState } from "react";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import type { RegisterFormProps } from "./types";

export const RegisterForm = ({
  onSubmit,
  isLoading,
  buttonText = "Register",
  error,
}: RegisterFormProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={5}>
        <Field.Root invalid={!!error} required>
          <Field.Label fontWeight="medium">Email address</Field.Label>
          <Box position="relative">
            <Box
              position="absolute"
              left={3}
              top={3}
              color="gray.400"
              zIndex={2}
            >
              <FiMail />
            </Box>
            <Input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              pl={10}
              size="lg"
              _focus={{
                borderColor: "teal.500",
                boxShadow: "0 0 0 1px #319795",
              }}
              rounded="lg"
            />
          </Box>
        </Field.Root>

        <Field.Root invalid={!!error} required>
          <Field.Label fontWeight="medium">Password</Field.Label>
          <Box position="relative">
            <Box
              position="absolute"
              left={3}
              top={3}
              color="gray.400"
              zIndex={2}
            >
              <FiLock />
            </Box>
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a password"
              pl={10}
              pr={12}
              size="lg"
              _focus={{
                borderColor: "teal.500",
                boxShadow: "0 0 0 1px #319795",
              }}
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
        </Field.Root>

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
          _disabled={{
            opacity: 0.6,
            cursor: "not-allowed",
            _hover: { bg: "teal.500", transform: "none" },
          }}
          transition="all 0.2s"
        >
          {isLoading ? <Spinner size="sm" color="white" /> : buttonText}
        </Button>
      </Stack>
    </form>
  );
};
