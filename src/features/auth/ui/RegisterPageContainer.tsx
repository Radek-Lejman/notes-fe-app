import { useRegister } from "../model/hooks/useRegister";
import { AuthForm } from "./AuthForm/AuthForm";
import { NavLink } from "react-router-dom";
import { Text } from "@chakra-ui/react";

export const RegisterPageContainer = () => {
  const { submitRegistration, isLoading, error } = useRegister();

  return (
    <AuthForm
      mode="Register"
      isLoading={isLoading}
      error={error}
      onSubmit={submitRegistration}
      footerSlot={
        <Text color="gray.600" _dark={{ color: "gray.400" }}>
          Already have an account?{" "}
          <NavLink to="/login" style={{ color: "#319795", fontWeight: "medium" }}>
            Sign In
          </NavLink>
        </Text>
      }
    />
  );
};
