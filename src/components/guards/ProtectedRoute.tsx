import { Navigate, Outlet, useLocation } from "react-router";
import { useCurrentUser } from "@/hooks/use-current-user";

type ProtectedRouteProps = {
  roles?: string[];
};

const ProtectedRoute = ({ roles }: ProtectedRouteProps) => {
  const { data: user, isPending } = useCurrentUser();
  const location = useLocation();

  if (isPending) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <span className="animate-spin size-8 rounded-full border-2 border-gay-300 border-t-berry-red" />
      </div>
    );
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
