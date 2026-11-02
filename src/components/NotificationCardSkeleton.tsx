const NotificationCardSkeleton = () => {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-white p-3">
      <div className="h-10 w-10 shrink-0 rounded-xl bg-input" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex justify-between">
          <div className="h-2 w-14 rounded-full bg-input" />
          <div className="h-2 w-8 rounded-full bg-input" />
        </div>
        <div className="h-3.5 w-3/4 rounded-full bg-input" />
        <div className="h-7 w-full rounded-lg bg-input" />
        <div className="flex justify-between">
          <div className="h-2 w-8 rounded-full bg-input" />
          <div className="h-2 w-20 rounded-full bg-input" />
        </div>
      </div>
    </div>
  );
};

export default NotificationCardSkeleton;
