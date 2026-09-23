import React from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import HeaderMain from "@/components/HeaderMain";
import { MoveUp, UsersRound } from "lucide-react";
import DashboardCard, {
  type DashboardCardProps,
} from "@/components/DashboardCard";

const dataCard: DashboardCardProps[] = [
  {
    title: "Total Customer",
    value: "14,873",
    icon: UsersRound,
    pct: "4.5",
    moveIcon: MoveUp,
  },
];

const AdminDashboard = () => {
  usePageTitle("Dashboard");

  return (
    <main className="w-full space-y-6">
      <HeaderMain
        title={"Loyalty Overview"}
        subtitle={"Analisis customer dan transaksi"}
      />

      <div className="grid grid-cols-12 gap-4">
        {dataCard.map((data) => (
          <DashboardCard key={data.title} {...data} />
        ))}
      </div>
    </main>
  );
};

export default AdminDashboard;
