import React from "react";

const NotificationCardSkeleton = () => {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-input" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-3 w-1/4 rounded-full bg-input" />
          <div className="h-4 w-1/2 rounded-full bg-input" />
          <div className="h-10 w-full rounded-full bg-input" />
        </div>
      </div>
    </div>
  );
};

export default NotificationCardSkeleton;
