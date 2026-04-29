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
import { VerifyOtpPage } from "@/pages/VerifyOtpPage";
import LissajousLoader from "@/components/ui/LissajousDrift";
import { BidRoomCreatePage } from "@/pages/BidRoomCreatePage";
import { BidRoomDetailPage } from "@/pages/BidRoomDetailPage";
import { BidRoomPage } from "@/pages/BidRoomPage";

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
const SubscriptionPage = lazy(() => import("../pages/SubscriptionPage"));
const PaymentStatusPage = lazy(() => import("../pages/PaymentStatusPage"));

// Helper for loading states - Using LissajousLoader for better UX
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <LissajousLoader size={300} showFormula={false} loadingText="Loading..." />
  </div>
);

// Component wrapper for dashboard rout
export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/verify-otp",
    element: <VerifyOtpPage />,
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
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardHome />
          </Suspense>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: "bidroom",
        element: (
          <Suspense fallback={<PageLoader />}>
            <BidRoomPage />
          </Suspense>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: "bidroom/create",
        element: (
          <Suspense fallback={<PageLoader />}>
            <BidRoomCreatePage />
          </Suspense>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: "bidroom/:id",
        element: (
          <Suspense fallback={<PageLoader />}>
            <BidRoomDetailPage />
          </Suspense>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: "onboarding",
        element: (
          <Suspense fallback={<PageLoader />}>
            <SupplierOnboardingPage />
          </Suspense>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: "rfps",
        element: (
          <Suspense fallback={<PageLoader />}>
            <RfpsPage />
          </Suspense>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: "rfps/create",
        element: (
          <Suspense fallback={<PageLoader />}>
            <CreateRfpPage />
          </Suspense>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: "rfps/:id",
        element: (
          <Suspense fallback={<PageLoader />}>
            <RfpDetailPage />
          </Suspense>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: "admin/users",
        element: (
          <Suspense fallback={<PageLoader />}>
            <UserManagement />
          </Suspense>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: "admin/users/:id",
        element: (
          <Suspense fallback={<PageLoader />}>
            <UserDetailView />
          </Suspense>
        ),
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
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
          </Suspense>
        ),
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
      {
        path: "subscription",
        element: (
          <Suspense fallback={<PageLoader />}>
            <SubscriptionPage />
          </Suspense>
        ),
        errorElement: <ErrorPage />,
      },
    ],
  },
  {
    path: "/payment-status",
    element: (
      <Suspense fallback={<PageLoader />}>
        <PaymentStatusPage />
      </Suspense>
    ),
    errorElement: <ErrorPage />,
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
