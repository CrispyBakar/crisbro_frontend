import React from "react";
import AcquisitionPrompt from "@/components/AcquisitionPrompt";
import CustomerBottomNav from "@/components/CustomerBottomNav";

const CustomerRootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-dvh w-full bg-gray-100 flex justify-center">
      <main className="relative w-full max-w-mobile min-h-dvh bg-cream shadow-md flex flex-col overflow-x-hidden pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {children}
        <CustomerBottomNav />
      </main>
      <AcquisitionPrompt />
    </div>
  );
};

export default CustomerRootLayout;
