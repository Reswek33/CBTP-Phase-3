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
    <div className="min-h-screen relative bg-background overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]"></div>
      </div>

      {/* Navigation Bar - Glassmorphism */}
      <nav className="relative z-10 bg-background/80 backdrop-blur-md border-b border-border py-4 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform">
              <LogIn className="text-primary-foreground w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tighter text-foreground">
              Bid<span className="text-primary">Sync</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-sm font-bold text-primary hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors"
            >
              Sign Up
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
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
            <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-6">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Secure Access
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight mb-3">
              Welcome Back
            </h1>
            <p className="text-muted-foreground font-medium">
              Sign in to access your dashboard and manage your auctions
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email/Username Field */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
                    Email Address or Username
                  </label>
                  <input
                    type="text"
                    {...register("identifier")}
                    className={`w-full px-4 py-3 border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-muted-foreground/50 bg-background text-foreground ${
                      errors.identifier
                        ? "border-destructive bg-destructive/5"
                        : "border-border"
                    }`}
                    placeholder="Enter your email or username"
                  />
                  {errors.identifier && (
                    <p className="mt-2 text-xs text-destructive font-medium">
                      {errors.identifier.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      className={`w-full px-4 py-3 border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-muted-foreground/50 bg-background text-foreground pr-12 ${
                        errors.password
                          ? "border-destructive bg-destructive/5"
                          : "border-border"
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-xs text-destructive font-medium">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Status Messages */}
                {error && (
                  <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20 font-medium">
                    ⚠️ {error}
                  </div>
                )}
                {message && (
                  <div className="p-4 text-sm text-green-600 bg-green-50 rounded-xl border border-green-100 font-medium dark:bg-green-950/20 dark:text-green-400 dark:border-green-900">
                    ✓ {message}
                  </div>
                )}

                {/* Forgot Password */}
                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm font-semibold text-primary hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base group active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
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
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link
                      to="/register"
                      className="text-primary font-bold hover:underline"
                    >
                      Create an account
                    </Link>
                  </p>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-card text-xs text-muted-foreground">
                      Secure Login
                    </span>
                  </div>
                </div>

                {/* Security Note */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span>Your data is encrypted and secure</span>
                </div>
              </form>
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs text-muted-foreground text-center mt-8 leading-relaxed">
            By signing in, you agree to our{" "}
            <Link
              to="/terms"
              className="text-primary hover:underline font-medium"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="text-primary hover:underline font-medium"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-center">
            <p className="text-xs font-bold text-muted-foreground">
              © 2025 BidSync Protocol. Built for Velocity.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
