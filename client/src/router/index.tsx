/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import AdminLogDashboard from "../components/admin/Logs";
import BidHistory from "../components/supplier/BidHistory";
import { ChatPage } from "../pages/ChatPage";
import AuditPage from "../components/admin/AuditPage";
import { LandingPage } from "../pages/LandingPage";
import BuyerRegister from "@/components/auth/register/BuyerRegister";
import SupplierRegister from "@/components/auth/register/SupplierRegister";
import { ErrorPage } from "@/pages/ErrorPage";
import { UnauthorizedPage } from "@/pages/UnauthorizedPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

// 1. Lazy load ALL page components
const Login = lazy(() => import("../pages/LoginPage"));
const DashboardLayout = lazy(() =>
  import("../layout/DashboardLayout").then((m) => ({
    default: m.DashboardLayout,
  })),
);
const DashboardHome = lazy(() =>
  import("../components/DashboardHome").then((m) => ({
    default: m.DashboardHome,
  })),
);
const RfpsPage = lazy(() => import("../pages/RfpsPage"));
const CreateRfpPage = lazy(() => import("../pages/CreateRfpPage"));
const RfpDetailPage = lazy(() => import("../pages/RfpDetailPage"));
const SupplierOnboardingPage = lazy(
  () => import("../pages/SupplierOnboardingPage"),
);
const ProfilePage = lazy(() =>
  import("../pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const UserManagement = lazy(() =>
  import("../pages/UserManagement").then((m) => ({
    default: m.UserManagement,
  })),
);
const UserDetailView = lazy(() =>
  import("../pages/UserDetailView").then((m) => ({
    default: m.UserDetailView,
  })),
);

// Helper for loading states
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-500 font-medium">Loading...</p>
    </div>
  </div>
);

// Helper for unauthorized page

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/buyerform",
    element: <BuyerRegister />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/supplierform",
    element: <SupplierRegister />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/dashboard",
    element: (
      <Suspense fallback={<PageLoader />}>
        <DashboardLayout />
      </Suspense>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <DashboardHome />,
        errorElement: <ErrorPage />,
      },
      {
        path: "onboarding",
        element: <SupplierOnboardingPage />,
        errorElement: <ErrorPage />,
      },
      {
        path: "rfps",
        element: <RfpsPage />,
        errorElement: <ErrorPage />,
      },
      {
        path: "rfps/create",
        element: <CreateRfpPage />,
        errorElement: <ErrorPage />,
      },
      {
        path: "rfps/:id",
        element: <RfpDetailPage />,
        errorElement: <ErrorPage />,
      },
      {
        path: "admin/users",
        element: <UserManagement />,
        errorElement: <ErrorPage />,
      },
      {
        path: "admin/users/:id",
        element: <UserDetailView />,
        errorElement: <ErrorPage />,
      },
      {
        path: "admin/logs",
        element: <AdminLogDashboard />,
        errorElement: <ErrorPage />,
      },
      {
        path: "admin/audit",
        element: <AuditPage />,
        errorElement: <ErrorPage />,
      },
      {
        path: "profile",
        element: <ProfilePage />,
        errorElement: <ErrorPage />,
      },
      {
        path: "my-bids",
        element: <BidHistory />,
        errorElement: <ErrorPage />,
      },
      {
        path: "chat",
        element: <ChatPage />,
        errorElement: <ErrorPage />,
      },
    ],
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
    errorElement: <ErrorPage />,
  },
]);
