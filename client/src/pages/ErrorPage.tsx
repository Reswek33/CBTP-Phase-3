import React from "react";
import { useRouteError, isRouteErrorResponse } from "react-router-dom";
import { NotFoundPage } from "./NotFoundPage";
import { UnauthorizedPage } from "./UnauthorizedPage";
import { GenericErrorPage } from "./GenericErrorPage";

export const ErrorPage: React.FC = () => {
  const error = useRouteError();

  // Log error for debugging (only in development)
  if (import.meta.env.DEV) {
    console.error("Route error:", error);
  }

  if (isRouteErrorResponse(error)) {
    // 404 Not Found
    if (error.status === 404) {
      return <NotFoundPage />;
    }

    // 401 Unauthorized
    if (error.status === 401) {
      return <UnauthorizedPage />;
    }

    // 403 Forbidden
    if (error.status === 403) {
      return <UnauthorizedPage />;
    }

    // 500 Internal Server Error
    if (error.status === 500) {
      return <GenericErrorPage />;
    }
  }

  // Default to generic error page
  return <GenericErrorPage />;
};
