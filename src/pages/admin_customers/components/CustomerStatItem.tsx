const CustomerStatItem = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs text-gray-500">{label}</span>
    <span
      className={`text-2xl font-bold ${accent ? "text-orange" : "text-chocolate"}`}
    >
      {value}
    </span>
  </div>
);

export default CustomerStatItem;
