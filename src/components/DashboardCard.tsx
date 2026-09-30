import { Minus, MoveDown, MoveUp, type LucideIcon } from "lucide-react";

export interface DashboardCardProps {
  title: string;
  value: number;
  lastValue: number;
  icon: LucideIcon;
}

const numberFmt = new Intl.NumberFormat("id-ID");
const pctFmt = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

const getTrend = (value: number, lastValue: number) => {
  const diff = value - lastValue;
  // Minggu lalu 0 → persentase tidak terdefinisi, badge disembunyikan
  const pct = lastValue === 0 ? null : (Math.abs(diff) / lastValue) * 100;

  if (diff > 0) {
    return { pct, Icon: MoveUp, className: "text-success bg-green-100" };
  }
  if (diff < 0) {
    return { pct, Icon: MoveDown, className: "text-red-500 bg-red-100" };
  }
  return { pct, Icon: Minus, className: "text-gray-600 bg-gray-100" };
};

const DashboardCard = ({
  title,
  value,
  lastValue,
  icon: Icon,
}: DashboardCardProps) => {
  const { pct, Icon: TrendIcon, className } = getTrend(value, lastValue);

  return (
    <div className="col-span-12 sm:col-span-6 xl:col-span-3 bg-white w-full p-4 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex gap-1 flex-row items-start justify-between">
        <div className="flex min-w-0 flex-col gap-2 space-y-2 sm:space-y-4">
          <span className="text-gray-700 font-medium ">{title}</span>
          <div className="flex flex-wrap gap-2 w-full">
            <span className="text-3xl font-bold sm:text-4xl">{numberFmt.format(value)}</span>
            {pct !== null && (
              <div
                className={`flex h-fit items-center py-1 font-semibold text-xs rounded-2xl px-1.5 ${className}`}
              >
                <TrendIcon size={9} /> {pctFmt.format(pct)}%
              </div>
            )}
          </div>
          <p className="text-xs font-medium text-gray-800">
            Last Week:{" "}
            <span className="font-bold text-black">
              {numberFmt.format(lastValue)}
            </span>
          </p>
        </div>
        <div className="shrink-0 p-3 rounded-full bg-gray-50">
          <Icon className="text-chocolate" />
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
