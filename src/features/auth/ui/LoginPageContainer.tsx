import { useLogin } from "../model/hooks/useLogin";
import { AuthForm } from "./AuthForm/AuthForm";
import { NavLink } from "react-router-dom";
import { Text } from "@chakra-ui/react";

export const LoginPageContainer = () => {
  const { submitLogin, isLoading, error } = useLogin();

  return (
    <AuthForm
      mode="Login"
      isLoading={isLoading}
      error={error}
      onSubmit={submitLogin}
      footerSlot={
        <Text color="gray.600" _dark={{ color: "gray.400" }}>
          New to us?{" "}
          <NavLink to="/register" style={{ color: "#319795", fontWeight: "medium" }}>
            Sign Up
          </NavLink>
        </Text>
      }
    />
  );
};

