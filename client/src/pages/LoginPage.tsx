/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  ChevronRight,
  LogIn,
  Shield,
  Star,
} from "lucide-react";

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
    <div className="min-h-screen relative bg-white overflow-hidden">
      {/* Background Elements - Matching Landing Page */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-50 rounded-full blur-[100px] opacity-60"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
      </div>

      {/* Navigation Bar - Glassmorphism */}
      <nav className="relative z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:rotate-6 transition-transform">
              <LogIn className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tighter text-slate-900">
              Bid<span className="text-blue-600">Sync</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
            >
              Sign Up
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-73px)] py-12 px-4">
        <div className="w-full max-w-120">
          {/* Header Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full mb-6">
              <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">
                Secure Access
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3">
              Welcome Back
            </h1>
            <p className="text-slate-500 font-medium">
              Sign in to access your dashboard and manage your auctions
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email/Username Field */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">
                    Email Address or Username
                  </label>
                  <input
                    type="text"
                    {...register("identifier")}
                    className={`w-full px-4 py-3 border rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 ${
                      errors.identifier
                        ? "border-red-500 bg-red-50"
                        : "border-slate-200"
                    }`}
                    placeholder="Enter your email or username"
                  />
                  {errors.identifier && (
                    <p className="mt-2 text-xs text-red-600 font-medium">
                      {errors.identifier.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      className={`w-full px-4 py-3 border rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 pr-12 ${
                        errors.password
                          ? "border-red-500 bg-red-50"
                          : "border-slate-200"
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-xs text-red-600 font-medium">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Status Messages */}
                {error && (
                  <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 font-medium">
                    ⚠️ {error}
                  </div>
                )}
                {message && (
                  <div className="p-4 text-sm text-green-600 bg-green-50 rounded-xl border border-green-100 font-medium">
                    ✓ {message}
                  </div>
                )}

                {/* Forgot Password */}
                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm font-semibold text-blue-600 hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base group active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                {/* Sign Up Link */}
                <div className="text-center pt-2">
                  <p className="text-sm text-slate-500">
                    Don't have an account?{" "}
                    <Link
                      to="/register"
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Create an account
                    </Link>
                  </p>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-white text-xs text-slate-400">
                      Secure Login
                    </span>
                  </div>
                </div>

                {/* Security Note */}
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Shield className="w-3 h-3" />
                  <span>Your data is encrypted and secure</span>
                </div>
              </form>
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs text-slate-400 text-center mt-8 leading-relaxed">
            By signing in, you agree to our{" "}
            <Link
              to="/terms"
              className="text-blue-600 hover:underline font-medium"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="text-blue-600 hover:underline font-medium"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-center">
            <p className="text-xs font-bold text-slate-400">
              © 2025 BidSync Protocol. Built for Velocity.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
