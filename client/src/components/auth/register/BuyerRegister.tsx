/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Check,
  User,
  TrendingDown,
  ArrowLeft,
} from "lucide-react";
import { postRegister } from "@/services/api/auth-api";

const buyerRegisterSchema = z
  .object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
    role: z.enum(["BUYER", "SUPPLIER"]),
    companyName: z.string().min(2, "Company name is required"),
    phone: z.string().optional(),
    companyType: z.string().optional(),
    industrySector: z.string().optional(),
    position: z.string().optional(),
    companyAddress: z.string().optional(),
    accountPurpose: z.string().optional(),
    acceptLegalTerms: z
      .boolean()
      .refine((val) => val === true, "You must accept the terms"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type BuyerFormData = z.infer<typeof buyerRegisterSchema>;

const BuyerRegister: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BuyerFormData>({
    resolver: zodResolver(buyerRegisterSchema),
    defaultValues: {
      role: "BUYER",
      acceptLegalTerms: false,
    },
  });

  const selectedRole = watch("role");
  console.log(selectedRole);

  const onSubmit = async (data: BuyerFormData) => {
    setLoading(true);
    setServerError(null);
    try {
      console.log(data);
      const { confirmPassword, ...apiData } = data;
      console.log(confirmPassword);
      await postRegister(apiData);
      setSubmitted(true);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err: any) {
      setServerError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen relative font-sans text-slate-900 overflow-x-hidden bg-white flex items-center justify-center">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60"></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-50 rounded-full blur-[100px] opacity-60"></div>
        </div>

        <div className="relative z-10 bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-slate-100 max-w-md w-full text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Registration Successful!
          </h2>
          <p className="text-slate-500 mb-8">
            Welcome to BidSync! Your buyer account has been created.
            <br />
            Redirecting you to your dashboard...
          </p>
          <div className="w-16 h-1 bg-blue-600 rounded-full mx-auto animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative font-sans text-slate-900 overflow-x-hidden bg-white">
      {/* Background Wave Animation - Matching Landing Page Style */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-112.5 opacity-30">
          <svg
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            className="w-full"
          >
            <path
              fill="#2563eb"
              fillOpacity="0.05"
              d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,197.3C1248,213,1344,203,1392,197.3L1440,192L1440,0L0,0Z"
            />
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-87.5 opacity-20">
          <svg
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            className="w-full"
          >
            <path
              fill="#3b82f6"
              fillOpacity="0.05"
              d="M0,256L48,240C96,224,192,192,288,192C384,192,480,224,576,229.3C672,235,768,213,864,208C960,203,1056,213,1152,224C1248,235,1344,245,1392,250.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-4 md:px-6 top-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:rotate-6 transition-transform">
              <TrendingDown className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-extrabold tracking-tighter text-slate-900">
              Bid<span className="text-blue-600">Sync</span>
            </span>
          </Link>
          <Link
            to="/login"
            className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
          >
            Log In
          </Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-175 mx-auto py-12 px-4 sm:px-6">
        {/* Back Button */}
        <Link
          to="/"
          className="group inline-flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* Main Form Container */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden">
          {/* Heading Section */}
          <div className="pt-12 pb-8 px-6 sm:px-10 text-center border-b border-slate-100">
            <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full mb-6">
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">
                Buyer Registration
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black mb-2 text-slate-900 tracking-tight">
              Join as a <span className="text-blue-600">Buyer</span>
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Start sourcing smarter with competitive auctions
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 sm:p-10 space-y-10"
          >
            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                [!] ERROR: {serverError}
              </div>
            )}

            {/* Section 1: Account Information */}
            <section>
              <h2 className="text-lg font-bold mb-6 text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center text-sm font-black">
                  1
                </span>
                Account Information
              </h2>
              <div className="grid grid-cols-1 gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wider font-bold text-slate-500">
                      First Name
                    </label>
                    <input
                      {...register("firstName")}
                      type="text"
                      placeholder="Enter your first name"
                      className={`px-4 py-3 border rounded-lg focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 ${
                        errors.firstName
                          ? "border-red-500 bg-red-50"
                          : "border-slate-200"
                      }`}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-600 font-medium">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wider font-bold text-slate-500">
                      Last Name
                    </label>
                    <input
                      {...register("lastName")}
                      type="text"
                      placeholder="Enter your last name"
                      className={`px-4 py-3 border rounded-lg focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 ${
                        errors.lastName
                          ? "border-red-500 bg-red-50"
                          : "border-slate-200"
                      }`}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-red-600 font-medium">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wider font-bold text-slate-500">
                      Email Address
                    </label>
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="email@example.com"
                      className={`px-4 py-3 border rounded-lg focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 ${
                        errors.email
                          ? "border-red-500 bg-red-50"
                          : "border-slate-200"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-600 font-medium">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wider font-bold text-slate-500">
                      Phone Number (Optional)
                    </label>
                    <input
                      {...register("phone")}
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className="px-4 py-3 border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2 relative">
                    <label className="text-xs uppercase tracking-wider font-bold text-slate-500">
                      Password
                    </label>
                    <input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      className={`px-4 py-3 border rounded-lg focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 ${
                        errors.password
                          ? "border-red-500 bg-red-50"
                          : "border-slate-200"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-9.5 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    {errors.password && (
                      <p className="text-xs text-red-600 font-medium">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 relative">
                    <label className="text-xs uppercase tracking-wider font-bold text-slate-500">
                      Confirm Password
                    </label>
                    <input
                      {...register("confirmPassword")}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className={`px-4 py-3 border rounded-lg focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 ${
                        errors.confirmPassword
                          ? "border-red-500 bg-red-50"
                          : "border-slate-200"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-9.5 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-600 font-medium">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Company Information */}
            <section>
              <h2 className="text-lg font-bold mb-6 text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center text-sm font-black">
                  2
                </span>
                Company Information
              </h2>
              <div className="grid grid-cols-1 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-wider font-bold text-slate-500">
                    Company Name *
                  </label>
                  <input
                    {...register("companyName")}
                    type="text"
                    placeholder="Legal company name"
                    className={`px-4 py-3 border rounded-lg focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 ${
                      errors.companyName
                        ? "border-red-500 bg-red-50"
                        : "border-slate-200"
                    }`}
                  />
                  {errors.companyName && (
                    <p className="text-xs text-red-600 font-medium">
                      {errors.companyName.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wider font-bold text-slate-500">
                      Company Type (Optional)
                    </label>
                    <select
                      {...register("companyType")}
                      className="px-4 py-3 border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none bg-white transition-all"
                    >
                      <option value="">Select type</option>
                      <option>Construction Company</option>
                      <option>Developer</option>
                      <option>Contractor</option>
                      <option>Government</option>
                      <option>Individual</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wider font-bold text-slate-500">
                      Industry Sector (Optional)
                    </label>
                    <select
                      {...register("industrySector")}
                      className="px-4 py-3 border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none bg-white transition-all"
                    >
                      <option value="">Select sector</option>
                      <option>Real Estate</option>
                      <option>Infrastructure</option>
                      <option>Commercial</option>
                      <option>Residential</option>
                      <option>Technology</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wider font-bold text-slate-500">
                      Your Position (Optional)
                    </label>
                    <input
                      {...register("position")}
                      type="text"
                      placeholder="e.g., Procurement Manager"
                      className="px-4 py-3 border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wider font-bold text-slate-500">
                      Account Purpose (Optional)
                    </label>
                    <select
                      {...register("accountPurpose")}
                      className="px-4 py-3 border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none bg-white transition-all"
                    >
                      <option value="">Select purpose</option>
                      <option>Personal Project</option>
                      <option>Small Business</option>
                      <option>Large Corporation</option>
                      <option>Government Agency</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-wider font-bold text-slate-500">
                    Company Address (Optional)
                  </label>
                  <textarea
                    {...register("companyAddress")}
                    rows={2}
                    placeholder="Full street address, city, state"
                    className="px-4 py-3 border border-slate-200 rounded-lg focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all resize-none placeholder:text-slate-300"
                  />
                </div>
              </div>
            </section>

            {/* Terms & Submit */}
            <section className="space-y-6">
              <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="relative flex items-center pt-1">
                  <input
                    type="checkbox"
                    {...register("acceptLegalTerms")}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 checked:bg-blue-600 checked:border-blue-600 transition-all"
                  />
                  <Check className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none left-1 top-1.25" />
                </div>
                <label className="text-sm text-slate-600 font-medium leading-relaxed cursor-pointer">
                  I understand and agree to the
                  <span className="text-blue-600 cursor-pointer hover:underline mx-1 font-bold">
                    BidSync Terms of Service
                  </span>
                  and
                  <span className="text-blue-600 cursor-pointer hover:underline ml-1 font-bold">
                    Privacy Policy
                  </span>
                  .
                </label>
              </div>
              {errors.acceptLegalTerms && (
                <p className="text-xs text-red-600 font-medium -mt-4">
                  {errors.acceptLegalTerms.message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 disabled:bg-slate-300 disabled:shadow-none text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating Account...
                  </div>
                ) : (
                  "Create Buyer Account"
                )}
              </button>

              <div className="text-center">
                <span className="text-sm text-slate-500">
                  Already have an account?{" "}
                </span>
                <Link
                  to="/login"
                  className="text-sm text-blue-600 font-bold hover:underline"
                >
                  Log In
                </Link>
              </div>
            </section>
          </form>
        </div>

        {/* Footer */}
        <footer className="relative z-10 border-t border-slate-100 mt-12 pt-8 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-lg font-bold text-slate-500 tracking-tight">
                BidSync
              </span>
              <span className="text-xs">© 2025 Global Inc.</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
              <Link
                to="/terms"
                className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/privacy"
                className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/accessibility"
                className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
              >
                Accessibility
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default BuyerRegister;
