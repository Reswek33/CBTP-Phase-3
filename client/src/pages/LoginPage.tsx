import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import LoginForm from "../components/auth/Login/LoginForm";
import { useLocation, useNavigate } from "react-router-dom";
import type { LoginInput } from "../schemas/auth-schema";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { login, isAuthenticated, user } = useAuth();

  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated) {
      const from =
        location.state?.from?.pathname ||
        `/${user?.role?.toLocaleLowerCase()}/dashboard`;
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location, user]);

  const handleLogin = async (loginData: LoginInput) => {
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      await login(loginData);
      setMessage("Login successful! Redirecting...");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // Assuming 'err' is a string or has a message property
      const errorMessage =
        typeof err === "string" ? err : err.message || "Invalid credentials";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      // Clear error after 3 seconds as per your original logic
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full flex flex-col items-center">
        {/* You could add a logo here */}
        <div className="mb-8 flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            A
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            AppLogo
          </span>
        </div>

        <LoginForm
          onSubmit={handleLogin}
          isLoading={isSubmitting}
          error={error}
          message={message}
        />

        <p className="mt-8 text-sm text-gray-500">
          Don't have an account?{" "}
          <span className="text-blue-600 hover:underline cursor-pointer">
            Contact Admin
          </span>
        </p>
      </div>
    </main>
  );
};

export default LoginPage;
