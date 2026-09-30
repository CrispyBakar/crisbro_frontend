import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import HeaderMain from "@/components/HeaderMain";
import {
  Coins,
  Gift,
  PackageCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import DashboardCard from "@/components/DashboardCard";
import { ProductChart } from "@/components/ProductChart";
import { OutletCustomersChart } from "@/components/OutletCustomersChart";
import {
  ALL_TIME_PERIOD,
  DASHBOARD_PERIODS,
  OUTLET_PERIODS,
  formatApiRange,
  getPeriodRange,
  toOutletPeriodKey,
  toPeriodKey,
} from "@/lib/period";
import {
  useCustomersPerOutlet,
  useDashboardTotalCounts,
  useRecentTransactions,
  useTopRedeemedProducts,
} from "@/hooks/use-dashboard";
import type { DashboardTotalCounts } from "@/services/dashboard";
import GeneralTable from "@/components/GeneralTable";

const formatRupiah = (value: number) =>
  `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;

// Bulan singkat Indonesia + zona WIB, mis. "10 Sep 2026, 10:45 WIB"
const formatDateWIB = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso)) + " WIB";

const dashboardCards: {
  key: keyof DashboardTotalCounts;
  title: string;
  icon: LucideIcon;
}[] = [
  { key: "customers", title: "Total Customer", icon: UsersRound },
  { key: "redeemed_points", title: "Redeemed Points", icon: Gift },
  { key: "member_points", title: "Member Points", icon: Coins },
  { key: "loyalty_products", title: "Loyalty Products", icon: PackageCheck },
];

const TOP_PRODUCT_LIMIT = 7;

const AdminDashboard = () => {
  usePageTitle("Dashboard");

  const [search, setSearch] = useState<string>("");
  const [productPeriod, setProductPeriod] = useState<string>("Bulan ini");
  const [outletPeriod, setOutletPeriod] = useState<string>("Bulan ini");

  const itemsPerPage = 25;
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: outletData,
    isPending: outletPending,
    isPlaceholderData: outletIsPlaceholder,
    error: outletError,
  } = useCustomersPerOutlet(toOutletPeriodKey(outletPeriod));

  // Selama data periode baru dimuat, keepPreviousData masih memberi data lama;
  // label rentang diambil dari helper lokal agar sesuai dropdown.
  const outletRange =
    outletData && !outletIsPlaceholder ? outletData : undefined;

  const {
    data: productData,
    isPending: productPending,
    error: productError,
  } = useTopRedeemedProducts({
    period: toPeriodKey(productPeriod),
    limit: TOP_PRODUCT_LIMIT,
  });

  const outlets = outletData?.outlets.map((outlet) => ({
    id: outlet.location_id,
    outlet: outlet.location_name,
    customers: outlet.customers,
    // null (period=all) → undefined agar badge % perubahan disembunyikan
    previous: outlet.previous_customers ?? undefined,
  }));

  const products = productData?.products.map((product) => ({
    id: product.loyalty_product_id,
    name: product.product_name,
    redeemCount: product.redeem_count,
    pointNeeded: product.point_needed,
  }));

  const {
    data: totalCounts,
    isPending: totalCountsPending,
    isError: totalCountsIsError,
    error: totalCountsError,
  } = useDashboardTotalCounts();

  const {
    data: recentTransactions,
    isPending: recentTransactionsPending,
    error: recentTransactionsError,
  } = useRecentTransactions({
    take: itemsPerPage,
    skip: (currentPage - 1) * itemsPerPage,
    search: search,
  });

  return (
    <main className="w-full space-y-6 lg:pr-3">
      <HeaderMain
        title={"Loyalty Overview"}
        subtitle={"Analisis customer dan transaksi"}
      />

      {totalCountsPending ? (
        <p className="text-gray-500">Memuat ringkasan dashboard...</p>
      ) : totalCountsIsError ? (
        <p className="text-red-500">
          Gagal memuat ringkasan dashboard: {totalCountsError.message}
        </p>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {dashboardCards.map(({ key, title, icon }) => (
            <DashboardCard
              key={key}
              title={title}
              icon={icon}
              value={totalCounts[key].current_value}
              lastValue={totalCounts[key].last_week_value}
            />
          ))}
        </div>
      )}

      {/* Di layar lebar kedua chart dikunci setinggi baris (460px); daftar
          outlet scroll di dalam kartu, plot produk mengisi sisa tinggi */}
      <div className="grid grid-cols-1 gap-4 py-2 xl:grid-cols-2 xl:grid-rows-[460px]">
        <OutletCustomersChart
          data={outlets ?? []}
          total={outletData?.total_customers}
          previousTotal={outletData?.previous_total_customers ?? undefined}
          period={outletPeriod}
          periodOptions={OUTLET_PERIODS}
          onPeriodChange={setOutletPeriod}
          rangeLabel={
            outletRange
              ? formatApiRange(outletRange.period)
              : outletPeriod === ALL_TIME_PERIOD
                ? "Seluruh customer terdaftar"
                : getPeriodRange(outletPeriod).label
          }
          comparisonLabel={
            outletRange?.previous_period
              ? `vs ${formatApiRange(outletRange.previous_period)}`
              : "vs periode sebelumnya"
          }
          isLoading={outletPending}
          errorMessage={
            outletError
              ? `Gagal memuat customer per outlet: ${outletError.message}`
              : undefined
          }
        />
        <ProductChart
          data={products ?? []}
          totalRedeem={productData?.total_redeem}
          limit={TOP_PRODUCT_LIMIT}
          // Tinggi minimal plot; di layar lebar plot tumbuh mengisi kartu 460px
          height={220}
          period={productPeriod}
          periodOptions={DASHBOARD_PERIODS}
          onPeriodChange={setProductPeriod}
          isLoading={productPending}
          errorMessage={
            productError
              ? `Gagal memuat produk yang di-redeem: ${productError.message}`
              : undefined
          }
        />
      </div>

      <div className="w-full mb-1">
        {recentTransactionsPending ? (
          <p className="text-gray-500">Memuat transaksi terbaru...</p>
        ) : recentTransactionsError ? (
          <p className="text-red-500">
            Gagal memuat transaksi terbaru: {recentTransactionsError.message}
          </p>
        ) : (
          <GeneralTable
            canSelectDate={false}
            deleteBulk={false}
            tableTitle="Recent Transactions"
            dataHeads={[
              {
                key: "sales_no",
                label: "Sales No",
                render: ({ sales_no }) => (
                  <span>{sales_no ? String(sales_no) : "-"}</span>
                ),
              },
              // GeneralTable membaca row[key] langsung, jadi nama customer
              // diratakan ke `customer_name` agar bisa dirender dan disortir
              { key: "customer_name", label: "Customer" },
              {
                key: "sales_time",
                label: "Sales Time",
                render: ({ sales_time }) => (
                  <span>
                    {sales_time ? formatDateWIB(String(sales_time)) : "-"}
                  </span>
                ),
              },
              {
                key: "gross_sales",
                label: "Gross Sales",
                render: ({ gross_sales }) => (
                  <span>
                    {gross_sales != null
                      ? formatRupiah(Number(gross_sales))
                      : "-"}
                  </span>
                ),
              },
              {
                key: "location_name",
                label: "Outlet",
                render: ({ location_name }) => (
                  <span>{location_name ? String(location_name) : "-"}</span>
                ),
              },
              {
                key: "order_type",
                label: "Order Type",
                render: ({ order_type }) => (
                  <span>{order_type ? String(order_type) : "-"}</span>
                ),
              },
              {
                key: "net_sales_after_tax",
                label: "Net Sales",
                render: ({ net_sales_after_tax }) => (
                  <span>
                    {net_sales_after_tax != null
                      ? formatRupiah(Number(net_sales_after_tax))
                      : "-"}
                  </span>
                ),
              },
            ]}
            data={
              recentTransactions?.transactions.map((transaction) => ({
                ...transaction,
                id: transaction.transaction_id,
                customer_name: transaction.customer.name,
              })) ?? []
            }
            searchPlaceholder="Search customer or sales no..."
            search={search}
            onSearchChange={setSearch}
            itemsPerPage={itemsPerPage}
            totalPages={recentTransactions?.total_page ?? 0}
            total={recentTransactions?.total ?? 0}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            canDelete={false}
            canUpdate={false}
            canShow={false}
            canDetail={false}
          />
        )}
      </div>
    </main>
  );
};

export default AdminDashboard;
