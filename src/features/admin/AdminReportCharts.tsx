import { memo, useEffect, useState } from "react";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { LoyaltySummary } from "@/lib/admin";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

const numberFormat = (value: number) => value.toLocaleString("id-ID");
const dateFormat = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export function buildRewardHistoryYAxis(data: NonNullable<LoyaltySummary["redemption_trend"]>) {
  const exactValues = data.flatMap((item) => [item.redemption_count, item.points_spent]);
  const maximum = Math.max(0, ...exactValues);
  if (maximum === 0) return { domainMax: 1, ticks: [0, 1] };

  const roughStep = maximum / 5;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep || 1));
  const normalizedStep = roughStep / magnitude;
  const stepMultiplier =
    normalizedStep <= 1 ? 1 : normalizedStep <= 2 ? 2 : normalizedStep <= 5 ? 5 : 10;
  const step = stepMultiplier * magnitude;
  const domainMax = Math.ceil(maximum / step) * step;
  const regularTicks = Array.from(
    { length: Math.floor(domainMax / step) + 1 },
    (_, index) => index * step,
  );

  // Nilai aktual ikut menjadi tick agar setiap titik memiliki garis grid
  // horizontal tepat menuju angka pada satu sumbu Y di sebelah kiri.
  const ticks = [...new Set([...regularTicks, ...exactValues, domainMax])].sort((a, b) => a - b);
  return { domainMax, ticks };
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const update = () => setMatches(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [query]);
  return matches;
}

function TopRewardsChartView({ rewards }: { rewards: LoyaltySummary["top_rewards"] }) {
  const compact = useMediaQuery("(max-width: 640px)");
  const colors = ["#E11D48", "#F97316", "#EAB308", "#22C55E", "#0EA5E9"];
  const limit = compact ? 14 : 24;
  const data = rewards.map((reward, index) => ({
    name: reward.reward_name,
    label:
      reward.reward_name.length > limit
        ? `${reward.reward_name.slice(0, limit)}...`
        : reward.reward_name,
    redemptions: reward.redemption_count,
    points: reward.points_spent,
    fill: colors[index % colors.length],
  }));

  if (!data.length) return <EmptyChart message="Belum ada data redemption." />;
  return (
    <ChartContainer
      config={{ redemptions: { label: "Jumlah Redeem", color: colors[0] } }}
      className="h-65 min-h-57.5 w-full"
    >
      <BarChart data={data} layout="vertical" margin={{ right: compact ? 18 : 42 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis
          type="number"
          allowDecimals={false}
          tickFormatter={(value) => numberFormat(+value)}
        />
        <YAxis dataKey="label" type="category" width={compact ? 88 : 138} />
        <ChartTooltip
          cursor={{ fill: "hsl(var(--muted))" }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""}
              formatter={(value, name, item) => (
                <TooltipRows value={value} name={name} points={item.payload?.points} />
              )}
            />
          }
        />
        <Bar dataKey="redemptions" radius={[0, 7, 7, 0]} barSize={22}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
          <LabelList dataKey="redemptions" position="right" formatter={numberFormat} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

function TopRedeemOutletsChartView({
  outlets,
}: {
  outlets: NonNullable<LoyaltySummary["top_redeem_outlets"]>;
}) {
  const compact = useMediaQuery("(max-width: 640px)");
  const colors = ["#0EA5E9", "#22C55E", "#F97316", "#E11D48", "#8B5CF6"];
  const limit = compact ? 14 : 22;
  const data = outlets.map((outlet, index) => ({
    name: outlet.outlet_name,
    label:
      outlet.outlet_name.length > limit
        ? `${outlet.outlet_name.slice(0, limit)}...`
        : outlet.outlet_name,
    redemptions: outlet.redemption_count,
    points: outlet.points_spent,
    fill: colors[index % colors.length],
  }));

  if (!data.length) return <EmptyChart message="Belum ada data redeem outlet." />;
  return (
    <ChartContainer
      config={{ redemptions: { label: "Jumlah Redeem", color: colors[0] } }}
      className="h-65 min-h-57.5 w-full"
    >
      <BarChart data={data} layout="vertical" margin={{ right: compact ? 18 : 42 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis
          type="number"
          allowDecimals={false}
          tickFormatter={(value) => numberFormat(+value)}
        />
        <YAxis dataKey="label" type="category" width={compact ? 88 : 138} />
        <ChartTooltip
          cursor={{ fill: "hsl(var(--muted))" }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""}
              formatter={(value, name, item) => (
                <TooltipRows value={value} name={name} points={item.payload?.points} />
              )}
            />
          }
        />
        <Bar dataKey="redemptions" radius={[0, 7, 7, 0]} barSize={22}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
          <LabelList dataKey="redemptions" position="right" formatter={numberFormat} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

function RedemptionHistoryChartView({
  data,
}: {
  data: NonNullable<LoyaltySummary["redemption_trend"]>;
}) {
  const chartData = data.map((item) => ({ ...item, label: dateFormat(item.date) }));
  if (!chartData.length) {
    return <EmptyChart message="Belum ada data reward pada rentang tanggal ini." />;
  }
  const { domainMax, ticks } = buildRewardHistoryYAxis(data);
  return (
    <ChartContainer
      config={{
        redemption_count: { label: "Jumlah Redeem", color: "#E11D48" },
        points_spent: { label: "Poin Ditukar", color: "#0EA5E9" },
      }}
      className="min-h-65 w-full"
    >
      <LineChart data={chartData} margin={{ top: 8, right: 18, bottom: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={18} />
        <YAxis
          allowDecimals={false}
          domain={[0, domainMax]}
          ticks={ticks}
          tickFormatter={(value) => numberFormat(+value)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line type="monotone" dataKey="redemption_count" stroke="#E11D48" strokeWidth={3} />
        <Line type="monotone" dataKey="points_spent" stroke="#0EA5E9" strokeWidth={3} />
        <ChartLegend content={<ChartLegendContent />} />
      </LineChart>
    </ChartContainer>
  );
}

function TooltipRows({ value, name, points }: { value: unknown; name: unknown; points?: unknown }) {
  return (
    <div className="grid min-w-45 gap-1">
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">
          {name === "redemptions" ? "Jumlah Redeem" : String(name)}
        </span>
        <strong>{numberFormat(Number(value))}</strong>
      </div>
      {points !== undefined && (
        <div className="flex justify-between gap-4 text-xs">
          <span className="text-muted-foreground">Poin Terpakai</span>
          <strong>{numberFormat(Number(points))}</strong>
        </div>
      )}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return <p className="text-sm font-semibold text-muted-foreground">{message}</p>;
}

export const TopRewardsChart = memo(TopRewardsChartView);
export const TopRedeemOutletsChart = memo(TopRedeemOutletsChartView);
export const RedemptionHistoryChart = memo(RedemptionHistoryChartView);
