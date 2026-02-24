import { useLogin } from "../model/hooks/useLogin";
import { AuthForm } from "./AuthForm/AuthForm";
import { NavLink } from "react-router-dom";

export const LoginPageContainer = () => {
  const { username, setUsername, password, setPassword, submitLogin } =
    useLogin();

  return (
    <>
      <AuthForm
        mode="Login"
        username={username}
        password={password}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onLoginSubmit={submitLogin}
        footerLink={
          <>
            New to us?{" "}
            <NavLink to="/register" style={{ color: "#319795" }}>
              Sign Up
            </NavLink>
          </>
        }
      />
    </>
  );
};
