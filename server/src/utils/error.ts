import { ZodError } from "zod";
import { Response } from "express";
import { Prisma } from "../generated/prisma/client";

// Define error response interface for better type safety
interface ErrorResponse {
  success: false;
  route: string;
  message: string;
  code?: string;
  details?: unknown;
  issues?: Array<{
    path: string;
    message: string;
  }>;
}

const handleError = (route: string, error: unknown, res: Response) => {
  // Zod Validation Errors
  if (error instanceof ZodError) {
    const response: ErrorResponse = {
      success: false,
      route: route,
      message: "Validation failed",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
    return res.status(400).json(response);
  }

  // Prisma Known Request Errors (P-codes)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const getErrorMessage = (): Omit<ErrorResponse, "success" | "route"> => {
      const target = error.meta?.target as string[] | undefined;
      const field = target?.[0] || "field";
      const fieldName = field.charAt(0).toUpperCase() + field.slice(1);

      switch (error.code) {
        case "P2002":
          return {
            message: `${fieldName} already exists`,
            code: error.code,
          };

        case "P2025":
          return {
            message: (error.meta?.cause as string) || "Record not found",
            code: error.code,
          };

        case "P2003":
          return {
            message: "Invalid reference: related record does not exist",
            code: error.code,
          };

        case "P2014":
          return {
            message: "Required relation violation",
            code: error.code,
          };

        case "P2000":
          return {
            message: "Input value too long for field",
            code: error.code,
          };

        case "P2001":
          return {
            message: "The requested record does not exist",
            code: error.code,
          };

        case "P2016":
          return {
            message: "Query interpretation error",
            code: error.code,
          };

        case "P2021":
          return {
            message: "Table does not exist",
            code: error.code,
          };

        case "P2022":
          return {
            message: "Column does not exist",
            code: error.code,
          };

        default:
          return {
            message: "Database operation failed",
            code: error.code,
            details: error.meta,
          };
      }
    };

    const errorInfo = getErrorMessage();
    const statusCode =
      error.code === "P2002"
        ? 409
        : error.code === "P2025" || error.code === "P2001"
          ? 404
          : 400;

    const response: ErrorResponse = {
      success: false,
      route,
      ...errorInfo,
    };

    return res.status(statusCode).json(response);
  }

  // Prisma Unknown Request Errors
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    const response: ErrorResponse = {
      success: false,
      route,
      message: "Unknown database error occurred",
    };
    return res.status(500).json(response);
  }

  // Prisma Initialization Errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    const response: ErrorResponse = {
      success: false,
      route,
      message: "Database connection failed",
      code: error.errorCode,
    };
    return res.status(500).json(response);
  }

  // Prisma Validation Errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    const response: ErrorResponse = {
      success: false,
      route,
      message: "Invalid query parameters",
    };
    return res.status(400).json(response);
  }

  // Prisma RUST Panics
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    const response: ErrorResponse = {
      success: false,
      route,
      message: "Database system error",
    };
    return res.status(500).json(response);
  }

  // Custom application errors
  if (error instanceof Error) {
    const getCustomErrorMessage = (): Omit<
      ErrorResponse,
      "success" | "route"
    > => {
      switch (error.message) {
        case "USER_NOT_FOUND":
          return { message: "User not found" };
        case "INVALID_CREDENTIALS":
          return { message: "Invalid credentials" };
        case "ACCESS_DENIED":
          return { message: "Access denied" };
        case "INVALID_TOKEN":
          return { message: "Invalid or expired token" };
        case "RATE_LIMIT_EXCEEDED":
          return { message: "Rate limit exceeded" };
        default:
          return { message: error.message };
      }
    };

    const errorInfo = getCustomErrorMessage();
    const statusCode =
      error.message === "USER_NOT_FOUND"
        ? 404
        : error.message === "INVALID_CREDENTIALS"
          ? 401
          : error.message === "ACCESS_DENIED"
            ? 403
            : error.message === "INVALID_TOKEN"
              ? 401
              : error.message === "RATE_LIMIT_EXCEEDED"
                ? 429
                : 400;

    const response: ErrorResponse = {
      success: false,
      route,
      ...errorInfo,
    };

    return res.status(statusCode).json(response);
  }

  // Fallback for any unhandled errors
  console.error(`[${route}] Internal Server Error:`, error);

  const response: ErrorResponse = {
    success: false,
    route,
    message: "Internal server error",
  };

  // Only include error details in development
  if (process.env.NODE_ENV === "development") {
    response.details = error instanceof Error ? error.message : "Unknown error";

    // Include stack trace in development for debugging
    if (error instanceof Error && error.stack) {
      console.error(`[${route}] Stack Trace:`, error.stack);
    }
  }

  return res.status(500).json(response);
};

export default handleError;
