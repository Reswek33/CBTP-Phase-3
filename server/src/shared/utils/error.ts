import { ZodError } from "zod";
import type { Response } from "express";
import { Prisma, LogLevel } from "../../../generated/prisma/index.js";
import { logActivity } from "./logger.js";

// Define error response interface for better type safety
interface ErrorResponse {
  success: false;
  route: string;
  message: string;
  code?: string | undefined;
  details?: unknown;
  issues?:
    | Array<{
        path: string;
        message: string;
      }>
    | undefined;
}

// Error code to HTTP status mapping
const errorStatusMap: Record<string, number> = {
  P2002: 409, // Unique constraint violation
  P2025: 404, // Record not found
  P2001: 404, // Record does not exist
  P2003: 400, // Foreign key constraint
  P2014: 400, // Relation violation
  P2000: 400, // Value too long
  P2016: 400, // Query error
  P2021: 500, // Table doesn't exist
  P2022: 500, // Column doesn't exist
};

// User-friendly error messages
const getUserFriendlyMessage = (errorCode: string, meta?: any): string => {
  const targetField =
    Array.isArray(meta?.target) && meta.target.length > 0
      ? String(meta.target[0])
      : null;

  const formattedField = targetField
    ? targetField.charAt(0).toUpperCase() + targetField.slice(1)
    : "Field";

  const messages: Record<string, string> = {
    P2002: `${formattedField} already exists`,
    P2025: meta?.cause || "Record not found",
    P2003: "Cannot delete because other records depend on it",
    P2014: "The operation would violate a required relationship",
    P2000: "Input value is too long for the field",
    P2001: "The requested record does not exist",
    P2016: "Query interpretation error - please check your request",
    P2021: "Database table configuration error",
    P2022: "Database column configuration error",
  };

  return messages[errorCode] || "Database operation failed";
};

// Get HTTP status code for error
const getStatusCode = (errorCode?: string, errorMessage?: string): number => {
  if (errorCode && errorStatusMap[errorCode]) return errorStatusMap[errorCode];

  // Custom application errors
  if (errorMessage) {
    const statusMap: Record<string, number> = {
      USER_NOT_FOUND: 404,
      INVALID_CREDENTIALS: 401,
      ACCESS_DENIED: 403,
      INVALID_TOKEN: 401,
      RATE_LIMIT_EXCEEDED: 429,
      RESOURCE_NOT_FOUND: 404,
      DUPLICATE_ENTRY: 409,
      VALIDATION_ERROR: 400,
    };
    return statusMap[errorMessage] || 400;
  }

  return 400;
};

// Get log level based on error type
const getLogLevel = (errorCode?: string, statusCode?: number): LogLevel => {
  if (!statusCode) return "ERROR";

  if (statusCode >= 500) return "CRITICAL";
  if (statusCode === 401 || statusCode === 403) return "WARN";
  if (statusCode === 400 || statusCode === 404 || statusCode === 409)
    return "INFO";

  return "ERROR";
};

// Extract user ID from request if available
const extractUserId = (req?: any): string | undefined => {
  try {
    return req?.user?.id || req?.userId;
  } catch {
    return undefined;
  }
};

// Safe array access helper
const getFirstTarget = (target: unknown): string | undefined => {
  if (Array.isArray(target) && target.length > 0) {
    return String(target[0]);
  }
  return undefined;
};

const handleError = async (
  route: string,
  error: unknown,
  res: Response,
  req?: any, // Optional request object for context
) => {
  let statusCode = 500;
  let response: ErrorResponse = {
    success: false,
    route,
    message: "Internal server error",
  };

  const userId = extractUserId(req);
  let logLevel: LogLevel = "ERROR";
  let errorCode: string | undefined;

  // Zod Validation Errors (400)
  if (error instanceof ZodError) {
    statusCode = 400;
    logLevel = "INFO";
    response = {
      success: false,
      route,
      message: "Validation failed",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    };

    // Log validation errors
    await logActivity(
      `Validation error in ${route}: ${error.issues[0]?.message || "Invalid input"}`,
      "INFO",
      userId,
      route,
      {
        issues: error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      false,
    );
  }

  // Prisma Known Request Errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    errorCode = error.code;
    statusCode = getStatusCode(error.code);
    logLevel = getLogLevel(error.code, statusCode);

    const message = getUserFriendlyMessage(error.code, error.meta);

    response = {
      success: false,
      route,
      message,
      code: error.code,
      ...(process.env.NODE_ENV === "development" && { details: error.meta }),
    };

    // Safely extract meta information
    const metaInfo: Record<string, unknown> = {};
    if (error.meta) {
      const meta = error.meta as Record<string, unknown>;
      if (meta.query) metaInfo.query = meta.query;
      if (meta.target) metaInfo.target = meta.target;
      if (meta.cause) metaInfo.cause = meta.cause;
    }

    // Log Prisma errors with context
    await logActivity(
      `Database error in ${route}: ${message} (${error.code})`,
      logLevel,
      userId,
      route,
      {
        errorCode: error.code,
        ...metaInfo,
      },
      false,
    );
  }

  // Prisma Unknown Request Errors
  else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = 500;
    logLevel = "CRITICAL";
    response = {
      success: false,
      route,
      message: "Database operation failed",
    };

    await logActivity(
      `Unknown database error in ${route}`,
      "CRITICAL",
      userId,
      route,
      { error: error.message },
      false,
    );
  }

  // Prisma Initialization Errors
  else if (error instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    logLevel = "CRITICAL";
    response = {
      success: false,
      route,
      message: "Database connection error",
      code: error.errorCode,
    };

    await logActivity(
      `Database connection failed in ${route}: ${error.message}`,
      "CRITICAL",
      userId,
      route,
      { errorCode: error.errorCode, message: error.message },
      false,
    );
  }

  // Prisma Validation Errors
  else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    logLevel = "WARN";
    response = {
      success: false,
      route,
      message: "Invalid query parameters",
    };

    await logActivity(
      `Query validation error in ${route}`,
      "WARN",
      userId,
      route,
      { error: error.message },
      false,
    );
  }

  // Prisma RUST Panics
  else if (error instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = 500;
    logLevel = "CRITICAL";
    response = {
      success: false,
      route,
      message: "Database system error - contact support",
    };

    await logActivity(
      `Database rust panic in ${route}: ${error.message}`,
      "CRITICAL",
      userId,
      route,
      { error: error.message },
      false,
    );
  }

  // Custom application errors
  else if (error instanceof Error) {
    errorCode = error.message;
    statusCode = getStatusCode(undefined, error.message);
    logLevel = getLogLevel(undefined, statusCode);

    // Define user-friendly messages for known error types
    const customMessages: Record<string, string> = {
      USER_NOT_FOUND: "User not found",
      INVALID_CREDENTIALS: "Invalid email/username or password",
      ACCESS_DENIED: "You don't have permission to access this resource",
      INVALID_TOKEN: "Your session has expired. Please login again",
      RATE_LIMIT_EXCEEDED: "Too many requests. Please try again later",
      RESOURCE_NOT_FOUND: "The requested resource was not found",
      DUPLICATE_ENTRY: "An entry with this information already exists",
      VALIDATION_ERROR: "Please check your input and try again",
      UNAUTHORIZED: "Please login to access this resource",
      FORBIDDEN: "You don't have permission to perform this action",
      CONFLICT: "This operation conflicts with existing data",
    };

    const message = customMessages[error.message] || error.message;

    response = {
      success: false,
      route,
      message,
    };

    // Add code for specific errors
    if (error.message === "RATE_LIMIT_EXCEEDED") {
      response.code = "RATE_LIMIT_EXCEEDED";
    }

    // Log application errors (don't log client errors as CRITICAL)
    const isClientError = statusCode >= 400 && statusCode < 500;
    if (!isClientError || statusCode === 401 || statusCode === 403) {
      await logActivity(
        `Application error in ${route}: ${message}`,
        logLevel,
        userId,
        route,
        {
          errorMessage: error.message,
          stack:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
        false,
      );
    }
  }

  // Unknown/unhandled errors
  else {
    statusCode = 500;
    logLevel = "CRITICAL";
    response = {
      success: false,
      route,
      message: "An unexpected error occurred",
    };

    await logActivity(
      `Unhandled error in ${route}`,
      "CRITICAL",
      userId,
      route,
      { error: String(error) },
      false,
    );

    // Log to console for immediate visibility
    console.error(`[${route}] Unhandled Error:`, error);
  }

  // Add environment-specific details in development
  if (process.env.NODE_ENV === "development") {
    if (error instanceof Error) {
      response.details = {
        message: error.message,
        ...(error.stack && { stack: error.stack }),
      };
    } else {
      response.details = String(error);
    }

    if (error instanceof Error && error.stack) {
      console.error(`[${route}] Stack Trace:`, error.stack);
    }
  }

  // Log response summary for errors (for monitoring)
  if (statusCode >= 500) {
    console.error(`[${route}] ${statusCode} - ${response.message}`);
  } else if (statusCode >= 400 && statusCode < 500) {
    console.warn(`[${route}] ${statusCode} - ${response.message}`);
  }

  return res.status(statusCode).json(response);
};

// Wrapper function for async route handlers with automatic error catching
export const asyncHandler = (fn: Function) => {
  return async (req: any, res: Response, next: any) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      const routePath = req.route?.path || req.path || "UNKNOWN_ROUTE";
      await handleError(routePath, error, res, req);
    }
  };
};

// Export a configured error handler that can be used directly
export const createErrorHandler = (route: string) => {
  return async (error: unknown, res: Response, req?: any) => {
    return handleError(route, error, res, req);
  };
};

export default handleError;
