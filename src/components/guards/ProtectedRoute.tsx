import { Navigate, Outlet, useLocation } from "react-router";
import { useCurrentUser } from "@/hooks/use-current-user";
import LoadingCircle from "@/components/LoadingCircle";

type ProtectedRouteProps = {
  roles?: string[];
};

const ProtectedRoute = ({ roles }: ProtectedRouteProps) => {
  const { data: user, isPending } = useCurrentUser();
  const location = useLocation();

  if (isPending) {
    return <LoadingCircle />;
  }

  //   Unauthenticated
  if (!user) {
    return <Navigate to={"/admin/login"} state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
