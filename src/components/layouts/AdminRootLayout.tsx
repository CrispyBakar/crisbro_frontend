import { Outlet } from "react-router";
import React, { useEffect, useState } from "react";

import AdminNavbar from "../AdminNavbar";
import AdminSidebar from "../AdminSidebar";
import Breadcrumb from "../Breadcrumb";

type AdminRootLayoutProps = {
  children?: React.ReactNode;
};

const AdminRootLayout = ({ children }: AdminRootLayoutProps) => {
  // Di bawah breakpoint lg sidebar tampil sebagai drawer yang dibuka dari navbar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isSidebarOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSidebarOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-cream p-3 sm:p-4 lg:p-6">
      {/* Navbar */}
      <AdminNavbar onMenuClick={() => setIsSidebarOpen(true)} />

      <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)] gap-5 sm:mt-4 lg:grid-cols-[17rem_1fr]">
        {/* Backdrop drawer (mobile/tablet) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar — statis di layar lebar, drawer geser di layar kecil */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] p-3 transition-transform duration-300 lg:static lg:z-auto lg:w-auto lg:max-w-none lg:translate-x-0 lg:p-0 lg:transition-none ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
        </div>

        {/* Main — hanya area ini yang scroll */}
        <div className="min-w-0 overflow-y-auto">
          <div className="flex flex-col gap-4 sm:gap-6">
            <Breadcrumb />
            {children ?? <Outlet />}
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminRootLayout;
