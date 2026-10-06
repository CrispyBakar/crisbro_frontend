import { Navigate, Outlet } from "react-router";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import LoadingCircle from "@/components/LoadingCircle";

// Halaman customer yang wajib login; tamu diarahkan ke halaman login
const CustomerRoute = () => {
  const { data: user, isPending } = useCustomerProfile();

  if (isPending) {
    return <LoadingCircle className="flex-1" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default CustomerRoute;
