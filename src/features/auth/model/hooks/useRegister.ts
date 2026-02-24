import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthApi } from "@entities/session";

export const useRegister = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submitRegistration = async (email: string, password: string) => {
    try {
      await AuthApi.register({ email, password });
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
    submitRegistration,
  };
};
