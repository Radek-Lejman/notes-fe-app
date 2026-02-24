import { useRegister } from "../model/hooks/useRegister";
import { AuthForm } from "./AuthForm/AuthForm";
import { NavLink } from "react-router-dom";

export const RegisterPageContainer = () => {
  const { username, setUsername, password, setPassword, submitRegistration } =
    useRegister();

  return (
    <>
      <AuthForm
        mode="Register"
        username={username}
        password={password}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onLoginSubmit={submitRegistration}
        footerLink={
          <>
            Already have an account?{" "}
            <NavLink to="/login" style={{ color: "#319795" }}>
              Sign In
            </NavLink>
          </>
        }
      />
    </>
  );
};
