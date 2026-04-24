/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, ArrowLeft, ChevronRight } from "lucide-react";

// Zod validation schema
const loginInputSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginInput = z.infer<typeof loginInputSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
    mode: "onChange",
  });

  // const identifier = watch("identifier");
  // const password = watch("password");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      await login(data);
      const origin = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(origin);
      setMessage("Login successful! Redirecting...");
    } catch (err: any) {
      const errorMessage =
        typeof err === "string"
          ? err
          : err.message || "Invalid email/username or password";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setError("");
        setMessage("");
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex flex-col">
      {/* Header - Exact Upwork style */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Left side with back button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>

              {/* Logo - Exact Upwork style */}
              <Link to="/" className="flex items-center">
                <span className="text-2xl font-bold text-blue-600">Bid</span>
                <span className="text-2xl font-bold text-gray-900">Sync</span>
              </Link>
            </div>

            {/* Right side - Help */}
            <button className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium">
              Help
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-8 sm:py-12 px-4">
        <div className="w-full max-w-120 bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          {/* Welcome Text - Upwork style */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-normal text-gray-900 mb-2">
              Log in to BidSync
            </h1>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email/Username Field - Upwork style */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email Address or Username
              </label>
              <div className="relative">
                <input
                  id="identifier"
                  type="text"
                  {...register("identifier")}
                  className={`w-full px-4 py-3 border ${
                    errors.identifier ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors text-base`}
                  placeholder="Enter your email or username"
                />
              </div>
              {errors.identifier && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.identifier.message}
                </p>
              )}
            </div>

            {/* Password Field - Upwork style */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className={`w-full px-4 py-3 border ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors text-base pr-12`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Status Messages */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                {error}
              </div>
            )}
            {message && (
              <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg border border-green-100">
                {message}
              </div>
            )}

            {/* Forgot Password Link - Upwork style */}
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button - Exact Upwork style with blue theme */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 px-4 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Log In</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Don't have an account link - Moved below login button */}
            <div className="text-center pt-2">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>

          {/* Divider - Upwork style */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-sm text-gray-500">or</span>
            </div>
          </div>

          {/* Social Login Buttons - Upwork style */}

          {/* Terms - Upwork style */}
          <p className="text-xs text-gray-500 text-center mt-8 leading-relaxed">
            By signing in, you agree to our{" "}
            <Link to="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>

      {/* Footer - Clean and minimal */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-6">
          <div className="flex justify-center">
            <div className="text-sm text-gray-400">Powered by BidSync</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
