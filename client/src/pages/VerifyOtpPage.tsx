import React from "react";
import { VerifyOtp } from "@/components/auth/VerifyOtp";
import { useSearchParams } from "react-router-dom";

export const VerifyOtpPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email")!;

  return <VerifyOtp email={email} />;
};
