import { AxiosError } from "axios";
import { z } from "zod";

interface PrismaErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: unknown;
}

interface ValidationErrorResponse {
  success: false;
  message: string;
  details: Array<{
    path: string;
    message: string;
  }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const errorHandler = (route: string, error: any) => {
  // Zod Validation Errors (client-side)
  if (error instanceof z.ZodError) {
    const errorMap = error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`
    );
    console.error("Zod Validation Error:", errorMap);
    throw new Error(`Validation failed: ${errorMap.join(", ")}`);
  }

  // Axios Errors (backend responses)
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as
      | PrismaErrorResponse
      | ValidationErrorResponse
      | { message: string };

    // Backend Validation Errors
    if (
      error.response?.status === 400 &&
      responseData &&
      "details" in responseData
    ) {
      const validationError = responseData as ValidationErrorResponse;
      const errorDetails = validationError.details.map(
        (detail) => `${detail.path}: ${detail.message}`
      );
      console.error("Backend Validation Error:", errorDetails);
      throw new Error(`Validation failed: ${errorDetails.join(", ")}`);
    }

    // Prisma Unique Constraint Error (P2002)
    if (
      error.response?.status === 409 &&
      responseData &&
      "code" in responseData
    ) {
      const prismaError = responseData as PrismaErrorResponse;
      console.error("Duplicate Entry Error:", prismaError.message);
      throw new Error(prismaError.message);
    }

    // Prisma Record Not Found (P2025, P2001)
    if (
      error.response?.status === 404 &&
      responseData &&
      "code" in responseData
    ) {
      const prismaError = responseData as PrismaErrorResponse;
      console.error("Record Not Found:", prismaError.message);
      throw new Error(prismaError.message);
    }

    // Prisma Foreign Key Error (P2003)
    if (
      error.response?.status === 400 &&
      responseData &&
      "code" in responseData
    ) {
      const prismaError = responseData as PrismaErrorResponse;
      if (prismaError.code === "P2003") {
        console.error("Invalid Reference:", prismaError.message);
        throw new Error("Invalid reference: The selected item does not exist");
      }
    }

    // Other Prisma Errors
    if (responseData && "code" in responseData) {
      const prismaError = responseData as PrismaErrorResponse;
      console.error(`Prisma Error ${prismaError.code}:`, prismaError.message);
      throw new Error(prismaError.message || "Database operation failed");
    }

    // Generic Backend Errors with messages
    if (responseData && "message" in responseData) {
      console.error("Backend Error:", responseData.message);
      throw new Error(responseData.message);
    }

    // Network/Connection Errors
    if (!error.response) {
      console.error("Network Error:", error.message);
      throw new Error("Network error: Unable to connect to server");
    }

    // Fallback for unhandled Axios errors
    console.error(
      "Axios Error:",
      "\nRoute:",
      route,
      "\nStatus:",
      error.response?.status,
      "\nCode:",
      error.code,
      "\nMessage:",
      error.message,
      "\nResponse:",
      error.response?.data
    );

    throw new Error(
      `Request failed: ${error.response?.status} ${error.message}`
    );
  }

  // Generic JavaScript Errors
  if (error instanceof Error) {
    console.error("JavaScript Error:", error.message);
    throw error; // Re-throw with original message
  }

  // Fallback for unknown errors
  console.error("Unknown Error in", route, ":", error);
  throw new Error(`Something went wrong in ${route}`);
};

// Optional: Utility function for specific error types
export const isDuplicateError = (error: Error): boolean => {
  return error.message.toLowerCase().includes("already exists");
};

export const isNotFoundError = (error: Error): boolean => {
  return (
    error.message.toLowerCase().includes("not found") ||
    error.message.toLowerCase().includes("does not exist")
  );
};

export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
};
