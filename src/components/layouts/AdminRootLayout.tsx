import { Outlet } from "react-router";
import React from "react";

import AdminNavbar from "../AdminNavbar";
import AdminSidebar from "../AdminSidebar";
import Breadcrumb from "../Breadcrumb";

type AdminRootLayoutProps = {
  children?: React.ReactNode;
};

const AdminRootLayout = ({ children }: AdminRootLayoutProps) => {
  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-cream p-6">
      {/* Navbar */}
      <AdminNavbar />

      <div className="mt-4 grid min-h-0 flex-1 grid-cols-[17rem_1fr] gap-5">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main — hanya area ini yang scroll */}
        <div className="min-w-0 overflow-y-auto">
          <div className="flex flex-col gap-6">
            <Breadcrumb />
            {children ?? <Outlet />}
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminRootLayout;
