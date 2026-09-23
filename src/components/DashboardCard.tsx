import type { LucideIcon } from "lucide-react";

export interface DashboardCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  pct: string;
  moveIcon: LucideIcon;
}

const DashboardCard = ({
  title,
  value,
  icon: Icon,
  pct,
  moveIcon: Move,
}: DashboardCardProps) => {
  return (
    <div className="col-span-3 w-full p-4 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex gap-1 flex-row items-start justify-between">
        <div className="flex flex-col gap-2 space-y-4">
          <span className="text-gray-700 font-medium ">{title}</span>
          <div className="flex gap-2 w-full">
            <span className="text-4xl font-bold">{value} </span>
            <div className="flex h-fit items-center py-1 font-semibold text-success text-xs bg-green-100 rounded-2xl px-1.5">
              <Move size={9} /> {pct}%
            </div>
          </div>
          <p className="text-xs font-medium text-gray-800">
            Last Month: <span className="font-bold text-black">13,213</span>
          </p>
        </div>
        <div className="p-3 rounded-full bg-gray-50">
          <Icon className="text-chocolate" />
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
