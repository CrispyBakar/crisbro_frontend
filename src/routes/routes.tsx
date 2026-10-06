import { createBrowserRouter, Outlet, RouterProvider } from "react-router";
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
import AdminReferral from "@/pages/admin_referral/AdminReferral";
import CustomerAuthLayout from "@/components/layouts/CustomerAuthLayout";
import CustomerLoginPage from "@/pages/auth/CustomerLoginPage";
import CustomerRegisterPage from "@/pages/auth/CustomerRegisterPage";
import CustomerRootLayout from "@/components/layouts/CustomerRootLayout";
import CustomerHomePage from "@/pages/customer_home/CustomerHomePage";
import CustomerRedeemPage from "@/pages/customer_redeem/CustomerRedeemPage";
import CustomerLocationsPage from "@/pages/customer_locations/CustomerLocationsPage";
import CustomerRoute from "@/components/guards/CustomerRoute";
import CustomerVouchersPage from "@/pages/customer_vouchers/CustomerVouchersPage";
import CustomerVoucherDetailPage from "@/pages/customer_vouchers/CustomerVoucherDetailPage";
import CustomerSettingsPage from "@/pages/customer_settings/CustomerSettingsPage";
import CustomerProfilePage from "@/pages/customer_settings/CustomerProfilePage";
import CustomerChangePasswordPage from "@/pages/customer_settings/CustomerChangePasswordPage";
import CustomerReferralPage from "@/pages/customer_settings/CustomerReferralPage";
import CustomerPointHistoryPage from "@/pages/customer_settings/CustomerPointHistoryPage";

const router = createBrowserRouter([
  // {
  //   path: "/",
  //   loader: () => redirect("/admin/login"),
  // },
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
          {
            path: "referrals",
            element: <AdminRootLayout />,
            children: [{ index: true, Component: AdminReferral }],
          },
        ],
      },
    ],
  },
  {
    path: "/",
    element: (
      <CustomerRootLayout>
        <Outlet />
      </CustomerRootLayout>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        Component: CustomerHomePage,
      },
      {
        path: "redeem",
        Component: CustomerRedeemPage,
      },
      {
        path: "locations",
        Component: CustomerLocationsPage,
      },
      {
        element: <CustomerRoute />,
        children: [
          {
            path: "vouchers",
            children: [
              { index: true, Component: CustomerVouchersPage },
              { path: ":voucher_id", Component: CustomerVoucherDetailPage },
            ],
          },
          {
            path: "settings",
            children: [
              { index: true, Component: CustomerSettingsPage },
              { path: "profile", Component: CustomerProfilePage },
              { path: "password", Component: CustomerChangePasswordPage },
              { path: "referral", Component: CustomerReferralPage },
              {
                path: "point-history",
                Component: CustomerPointHistoryPage,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "/login",
    element: (
      <CustomerAuthLayout>
        <Outlet />
      </CustomerAuthLayout>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        Component: CustomerLoginPage,
      },
    ],
  },
  {
    path: "/register",
    element: (
      <CustomerAuthLayout>
        <Outlet />
      </CustomerAuthLayout>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        Component: CustomerRegisterPage,
      },
    ],
  },
  { path: "/403", element: <ErrorPage status={403} /> },
  // Alamat yang tidak cocok dengan rute mana pun, termasuk di bawah /admin
  { path: "*", element: <ErrorPage status={404} /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
