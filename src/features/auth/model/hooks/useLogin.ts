import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthApi } from "@entities/session";

export const useLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submitLogin = async (email: string, password: string) => {
    try {
      await AuthApi.login({ email, password });
      navigate("/");
    } catch (err) {
      console.error("Failed to get LOGIN :", err);
    }
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    submitLogin,
  };
};
