import { useState } from "react";
import GeneralTable from "@/components/GeneralTable";
import type { SortOrder, TableHead } from "@/components/GeneralTable";
import HeaderMain from "@/components/HeaderMain";
import { usePageTitle } from "@/hooks/use-page-title";
import { useRedeemedVouchers } from "@/hooks/use-redeem-transactions";
import { formatShortDateTime } from "@/lib/date";
import RedeemedVoucherDetailModal from "./RedeemedVoucherDetailModal";
import {
  formatRedeemerPhone,
  renderVoucherStatus,
} from "./redeemed-voucher-utils";

// Backend hanya mengurutkan berdasarkan waktu penukaran (sort_order), jadi
// kolom lain tidak ditawarkan di menu sort
const redeemedVoucherHeads: TableHead[] = [
  { key: "code", label: "Voucher Code", sortable: false },
  { key: "customer_name", label: "Customer", sortable: false },
  { key: "customer_phone", label: "Phone", sortable: false },
  { key: "menu", label: "Menu", sortable: false },
  { key: "promo_name", label: "Promo", sortable: false },
  {
    key: "points_spent",
    label: "Points Spent",
    sortable: false,
    render: (row) => (
      <span className="inline-block py-1 px-3 rounded-full bg-amber-100 text-orange font-semibold">
        {Number(row.points_spent ?? 0).toLocaleString("id-ID")}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    sortable: false,
    render: (row) => renderVoucherStatus(row.status),
  },
  {
    key: "redeemed_at",
    label: "Redeemed At",
    render: (row) => formatShortDateTime(String(row.redeemed_at)),
  },
];

const AdminRedeemTransactions = () => {
  usePageTitle("Redeemed Vouchers");

  const itemsPerPage = 25;
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [orderBy, setOrderBy] = useState<SortOrder | "">("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const {
    data: vouchers,
    isPending,
    isFetching,
    error,
  } = useRedeemedVouchers({
    page: currentPage,
    limit: itemsPerPage,
    search,
    sort_order: orderBy || undefined,
  });

  // Field bersarang (promo_code, customer, products) diratakan agar bisa
  // dipakai GeneralTable
  const rows =
    vouchers?.data.map((voucher) => ({
      id: voucher.redeem_transaction_id,
      code: voucher.promo_code.code ?? "-",
      customer_name: voucher.customer.name,
      customer_phone: formatRedeemerPhone(voucher.customer),
      menu: voucher.products.map((product) => product.name).join(", ") || "-",
      promo_name: voucher.promo.name ?? "-",
      points_spent: voucher.points_spent,
      status: voucher.promo_code.status,
      redeemed_at: voucher.redeemed_at,
    })) ?? [];

  return (
    <main className="w-full space-y-6">
      <HeaderMain
        title="Redeemed Vouchers"
        subtitle="Voucher yang ditukar customer crisbro dengan poin"
      />

      {isPending ? (
        <p className="text-gray-500">Memuat voucher...</p>
      ) : error ? (
        <p className="text-red-500">Gagal memuat voucher: {error.message}</p>
      ) : (
        <GeneralTable
          dataPending={isFetching}
          tableTitle="Redeemed Vouchers"
          dataHeads={redeemedVoucherHeads}
          data={rows}
          deleteBulk={false}
          searchPlaceholder="Search customer, code, or promo..."
          search={search}
          onSearchChange={setSearch}
          itemsPerPage={itemsPerPage}
          totalPages={vouchers?.meta.total_pages ?? 0}
          total={vouchers?.meta.total ?? 0}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          sortBy={sortBy}
          orderBy={orderBy}
          setSortBy={setSortBy}
          setOrderBy={setOrderBy}
          canDelete={false}
          canUpdate={false}
          canShow={false}
          canDetail={true}
          handleDetail={setDetailId}
          canSelectDate={false}
        />
      )}

      {detailId && (
        <RedeemedVoucherDetailModal
          redeemTransactionId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}
    </main>
  );
};

export default AdminRedeemTransactions;
