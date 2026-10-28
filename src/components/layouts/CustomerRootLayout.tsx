import React from "react";
import AcquisitionPrompt from "@/components/AcquisitionPrompt";
import CustomerBottomNav from "@/components/CustomerBottomNav";
import PushPermissionPrompt from "@/components/PushPermissionPrompt";
import { useCustomerProfile } from "@/hooks/use-customer-profile";
import { usePushSync } from "@/hooks/use-push-notification";
import MustCompleteProfile from "../MustCompleteProfile";
import { useLocation } from "react-router";

const CustomerRootLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: user } = useCustomerProfile();
  usePushSync(user?.role === "customer");

  const location = useLocation();
  const pathname = location.pathname;

  return (
    <div className="min-h-dvh w-full bg-gray-100 flex justify-center">
      <main className="relative w-full max-w-mobile min-h-dvh bg-cream shadow-md flex flex-col overflow-x-hidden pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {children}
        <CustomerBottomNav />
      </main>
      {pathname !== "/settings/profile" && <MustCompleteProfile />}
      <PushPermissionPrompt />
      <AcquisitionPrompt />
    </div>
  );
};

export default CustomerRootLayout;
