import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import { lazy, Suspense } from "react";
import AdminAuthLayout from "../components/layouts/AdminAuthLayout";
import ErrorPage from "@/pages/error/ErrorPage";
import AdminLoginPage from "@/pages/auth/AdminLoginPage";
import AdminDashboard from "@/pages/admin_dashboard/AdminDashboard";
import AdminRootLayout from "@/components/layouts/AdminRootLayout";
import AdminLocations from "@/pages/admin_locations/AdminLocations";
import GuestRoute from "@/components/guards/GuestRoute";
import ProtectedRoute from "@/components/guards/ProtectedRoute";
import AdminCustomers from "@/pages/admin_customers/AdminCustomers";
import CustomerDetails from "@/pages/admin_customers/CustomerDetails";

const router = createBrowserRouter([
  {
    path: "/admin",
    element: <AdminAuthLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <GuestRoute />,
        children: [
          {
            path: "login",
            Component: AdminLoginPage,
          },
        ],
      },
      {
        element: <ProtectedRoute roles={["admin", "marketing"]} />,
        children: [
          {
            path: "dashboard",
            element: <AdminRootLayout />,
            children: [{ index: true, Component: AdminDashboard }],
          },
          {
            path: "locations",
            element: <AdminRootLayout />,
            children: [{ index: true, Component: AdminLocations }],
          },
          {
            path: "customers",
            element: <AdminRootLayout />,
            children: [
              { index: true, Component: AdminCustomers },
              { path: ":customer_id", Component: CustomerDetails },
            ],
          },
        ],
      },
    ],
  },
  { path: "/403", element: <h1>403 — Akses ditolak</h1> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
