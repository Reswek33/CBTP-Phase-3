/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";

// --- Lazy-Loaded Components ---
const Login = lazy(() => import("../pages/LoginPage"));

// --- Router Definition ---
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
]);
