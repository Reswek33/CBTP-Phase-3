import { Resend } from "resend";
import { render } from "react-email";
import React from "react";
import { VerificationEmail } from "../emails/VerificationEmail.js";

const apiKey = process.env.RESEND_API_KEY as string;

if (!apiKey)
  throw new Error("RESEND_API_KEY is not provided in environment variables");

const resend = new Resend(apiKey);

/**
 * Send verification email with OTP code
 * @param to - Recipient's email address
 * @param otp - One-time password/code
 * @returns Promise with email send result
 */

export const sendVerificationEmail = async (to: string, otp: string) => {
  try {
    const emailHtml = await render(
      React.createElement(VerificationEmail, { otp }),
    );

    const result = await resend.emails.send({
      from: "Bid-Sync <notifications@bidsync.ezedin.me>",
      to,
      subject: "Verify your BidSync email address",
      html: emailHtml,
    });

    if (result.error) {
      console.error("Resend email error:", result.error);
      throw new Error(
        `Failed to send verification email: ${result.error.message}`,
      );
    }

    return result;
  } catch (error) {
    console.error("Email service error:", error);
    throw new Error(
      "Failed to send verification email. Please try again later.",
    );
  }
};
