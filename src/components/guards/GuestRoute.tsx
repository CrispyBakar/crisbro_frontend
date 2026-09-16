import { Navigate, Outlet } from "react-router";
import { useCurrentUser } from "@/hooks/use-current-user";

const GuestRoute = () => {
  const { data: user, isPending } = useCurrentUser();

  if (isPending) return null;
  if (user) return <Navigate to={"/admin/dashboard"} replace />;

  return <Outlet />;
};

export default GuestRoute;
