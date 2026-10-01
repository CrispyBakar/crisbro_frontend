import { createBrowserRouter, RouterProvider, redirect } from "react-router";
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
import AdminProducts from "@/pages/admin_products/AdminProducts";
import AdminProductsLoyalty from "@/pages/admin_products_loyalty/AdminProductsLoyalty";
import AdminSettings from "@/pages/admin_settings/AdminSettings";
import AdminProfile from "@/pages/admin_settings/profile/AdminProfile";
import AdminPromo from "@/pages/admin_promo/AdminPromo";

const router = createBrowserRouter([
  {
    path: "/",
    loader: () => redirect("/admin/login"),
  },
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
          {
            path: "products",
            element: <AdminRootLayout />,
            children: [{ index: true, Component: AdminProducts }],
          },
          {
            path: "products-loyalty",
            element: <AdminRootLayout />,
            children: [{ index: true, Component: AdminProductsLoyalty }],
          },
          {
            path: "settings",
            element: <AdminRootLayout />,
            children: [
              { index: true, Component: AdminSettings },
              { path: "profile", Component: AdminProfile },
            ],
          },
          {
            path: "promos",
            element: <AdminRootLayout />,
            children: [{ index: true, Component: AdminPromo }],
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
