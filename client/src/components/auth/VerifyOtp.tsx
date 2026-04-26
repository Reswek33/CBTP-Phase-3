/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/auth/VerifyOtp.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { postOtp, resendOtp } from "@/services/api/auth-api";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface VerifyOtpProps {
  email?: string;
  onSuccess?: () => void;
}

export const VerifyOtp: React.FC<VerifyOtpProps> = ({
  email: propEmail,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);

  // Get email from location state or prop
  const email = propEmail || (location.state as any)?.email;

  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await postOtp({ email, otp });

      if (response.success) {
        setSuccess("Email verified successfully! Redirecting...");

        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            navigate("/dashboard");
          }
        }, 2000);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Invalid verification code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await resendOtp({ email });
      setSuccess("New verification code sent to your email!");
      setTimeLeft(300);
      setCanResend(false);
      setOtp("");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to resend code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen relative bg-background overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-6">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Email Verification
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-2">
              Verify Your Email
            </h1>
            <p className="text-muted-foreground text-sm">
              We've sent a verification code to
              <br />
              <span className="font-semibold text-foreground">{email}</span>
            </p>
          </div>

          {/* OTP Card */}
          <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
            {/* OTP Input */}
            <div className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-4 text-center">
                  Enter Verification Code
                </label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={loading}
                    className="gap-2"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Code expires in:{" "}
                  <span className="font-mono font-bold text-primary">
                    {formatTime(timeLeft)}
                  </span>
                </span>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {success}
                  </p>
                </div>
              )}

              {/* Verify Button */}
              <button
                onClick={handleVerify}
                disabled={loading || otp.length !== 6}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  "Verify Email"
                )}
              </button>

              {/* Resend Section */}
              <div className="text-center space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-card text-xs text-muted-foreground">
                      Didn't receive the code?
                    </span>
                  </div>
                </div>

                {canResend ? (
                  <button
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-sm text-primary hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Resend verification code
                  </button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    You can request a new code in {formatTime(timeLeft)}
                  </p>
                )}
              </div>

              {/* Help Text */}
              <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p>
                    Check your spam folder if you don't see the email within a
                    few minutes.
                  </p>
                  <p className="mt-1">
                    Need help?{" "}
                    <a
                      href="mailto:support@bidsync.com"
                      className="text-primary hover:underline"
                    >
                      Contact support
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
