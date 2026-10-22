import { Search } from "lucide-react";

const CustomerDetailEmptyState = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => (
  <div className="mt-6 flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-10 text-center">
    <Search size={20} className="text-gray-400" />
    <span className="text-sm font-semibold text-chocolate">{title}</span>
    {description && (
      <span className="text-xs text-gray-500">{description}</span>
    )}
  </div>
);

export default CustomerDetailEmptyState;
