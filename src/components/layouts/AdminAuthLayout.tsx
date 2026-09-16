import type { ReactNode } from "react";
import { Outlet } from "react-router";

type AdminAuthLayoutProps = {
  children?: ReactNode;
};

const AdminAuthLayout = ({ children }: AdminAuthLayoutProps) => {
  return (
    <main className="min-h-dvh bg-cream w-full">{children ?? <Outlet />}</main>
  );
};

export default AdminAuthLayout;
