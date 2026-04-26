import { Resend } from "resend";
import { render } from "react-email";
import React from "react";
import { VerificationEmail } from "../emails/VerificationEmail.js";
import WelcomeEmail from "../emails/WelcomeEmail.js";

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

/**
 * Send welcome email after successful verification
 * @param to - Recipient's email address
 * @param name - Recipient's first name
 * @param dashboardUrl - Link to the platform dashboard
 */
export const sendWellcomeEmail = async (
  to: string,
  name: string,
  role: "BUYER" | "SUPPLIER",
  dashboardUrl: string,
) => {
  try {
    const emailHtml = await render(
      // Pass the props to your React Email component
      React.createElement(WelcomeEmail, {
        name: name,
        role,
        dashboardUrl: dashboardUrl,
      }),
    );

    const result = await resend.emails.send({
      from: "Bid-Sync <notifications@bidsync.ezedin.me>",
      to,
      subject: `Welcome to Bid-Sync, ${name}!`,
      html: emailHtml,
    });

    if (result.error) {
      console.error("Resend welcome email error:", result.error);
      throw new Error(`Failed to send welcome email: ${result.error.message}`);
    }

    return result;
  } catch (error) {
    console.error("Email service error:", error);
    throw new Error("Failed to send welcome email. Please try again later.");
  }
};

export async function sendVerificationEmailWithRetry(
  email: string,
  otp: string,
  maxRetries: number = 3,
  delayMs: number = 1000,
): Promise<void> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      await sendVerificationEmail(email, otp);
      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `Email attempt ${i + 1}/${maxRetries} failed for ${email}:`,
        lastError.message,
      );

      if (i < maxRetries - 1) {
        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs * Math.pow(2, i)),
        );
      }
    }
  }

  throw new Error(
    `Failed to send email after ${maxRetries} attempts: ${lastError?.message}`,
  );
}

export async function sendWellcomeEmailRetry(
  maxRetries: number = 3,
  delayMs: number = 1000,
  to: string,
  name: string,
  role: "BUYER" | "SUPPLIER",
  dashboardUrl: string,
) {
  let lastError: Error | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await sendWellcomeEmail(to, name, role, dashboardUrl);
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `Email attempt ${i + 1}/${maxRetries} failed for ${to}:`,
        lastError.message,
      );
    }
    if (i < maxRetries - 1) {
      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, delayMs * Math.pow(2, i)),
      );
    }
  }
  throw new Error(
    `Failed to send email after ${maxRetries} attempts: ${lastError?.message}`,
  );
}
