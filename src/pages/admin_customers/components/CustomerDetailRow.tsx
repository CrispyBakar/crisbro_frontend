const CustomerDetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="grid grid-cols-[7.5rem_1fr] items-center gap-4 border-b border-gray-200 py-3">
    <span className="font-semibold text-chocolate">{label}</span>
    <span className="min-w-0 wrap-break-word font-bold text-black">
      {value ?? "-"}
    </span>
  </div>
);

export default CustomerDetailRow;
