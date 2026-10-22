import CustomerDetailEmptyState from "./CustomerDetailEmptyState";

const CustomerDetailTabState = ({
  isPending,
  error,
  emptyTitle,
  emptyDescription,
}: {
  isPending: boolean;
  error: Error | null;
  emptyTitle: string;
  emptyDescription?: string;
}) => {
  if (isPending) {
    return <p className="mt-6 text-sm text-gray-500">Memuat data...</p>;
  }

  if (error) {
    return (
      <p className="mt-6 text-sm text-red-500">
        Gagal memuat data: {error.message}
      </p>
    );
  }

  return (
    <CustomerDetailEmptyState
      title={emptyTitle}
      description={emptyDescription}
    />
  );
};

export default CustomerDetailTabState;
