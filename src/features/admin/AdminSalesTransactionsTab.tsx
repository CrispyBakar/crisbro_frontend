import { Button } from "@/components/ui/button";
import type { CustomerSalesTransactionReport } from "@/lib/admin";
import {
  currencyFormat,
  dateFormat,
  dateTimeFormat,
  numberFormat,
  paginationItems,
  toNumber,
} from "./adminFormatters";
import { FormInput, Panel, Select, TableScrollArea } from "./adminUiPrimitives";

// H-5: tab Crisbro Transaction Report dipecah dari AdminPage.tsx jadi modul
// lazy tersendiri, mengikuti pola yang sudah divalidasi di AdminActivityTab.
// Dipilih sebagai tab kedua karena juga read-only (tabel + filter + paginasi,
// tanpa form CRUD), jadi risikonya setara dengan tab pertama.
//
// Sama seperti AdminActivityTab: state (daftar transaksi, filter, halaman)
// dan loadSalesTransactions() TETAP dikelola AdminPage.tsx -- komponen ini
// murni presentational dan menerima semuanya lewat props.

export default function AdminSalesTransactionsTab({
  transactions,
  search,
  onSearchChange,
  outlet,
  onOutletChange,
  outletOptions,
  from,
  onFromChange,
  to,
  onToChange,
  page,
  totalPages,
  total,
  limit,
  onLimitChange,
  pageInput,
  onPageInputChange,
  onJumpToPage,
  loading,
  onLoadPage,
}: {
  transactions: CustomerSalesTransactionReport[];
  search: string;
  onSearchChange: (value: string) => void;
  outlet: string;
  onOutletChange: (value: string) => void;
  outletOptions: string[];
  from: string;
  onFromChange: (value: string) => void;
  to: string;
  onToChange: (value: string) => void;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onLimitChange: (limit: number) => void;
  pageInput: string;
  onPageInputChange: (value: string) => void;
  onJumpToPage: () => void;
  loading: boolean;
  onLoadPage: (page: number) => void;
}) {
  return (
    <section>
      <Panel title="Crisbro Transaction Report">
        <div className="mb-4 grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-end">
          <FormInput
            label="Cari"
            value={search}
            onChange={onSearchChange}
            placeholder="Nama, telepon, outlet, atau tipe order"
          />
          <Select
            label="Outlet"
            value={outlet}
            onChange={onOutletChange}
            options={[
              { value: "", label: "Semua outlet" },
              ...outletOptions.map((name) => ({ value: name, label: name })),
            ]}
          />
          <FormInput label="Dari tanggal" type="date" value={from} onChange={onFromChange} />
          <FormInput label="Hingga tanggal" type="date" value={to} onChange={onToChange} />
          <Button
            onClick={() => onLoadPage(1)}
            disabled={loading}
            className="mb-3 rounded-full font-bold"
          >
            Terapkan
          </Button>
        </div>
        <TableScrollArea>
          <table className="min-w-[1650px] w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="p-2">ID Transaksi</th>
                <th className="p-2">Nama Pelanggan</th>
                <th className="p-2">No Telepon</th>
                <th className="p-2">Lokasi Dibuat</th>
                <th className="p-2">Pelanggan Sejak</th>
                <th className="p-2">Poin Pelanggan</th>
                <th className="p-2">Tanggal Transaksi</th>
                <th className="p-2">Nama Outlet</th>
                <th className="p-2">Tipe Order</th>
                <th className="p-2 text-right">Pembelian per Order</th>
                <th className="p-2 text-right">Penambahan Poin</th>
                <th className="p-2 text-right">Penggunaan Poin</th>
                <th className="p-2">Reward/Menu Ditukar</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr className="border-t border-border">
                  <td colSpan={13} className="p-8 text-center font-bold">
                    Belum ada data transaksi customer yang sesuai.
                  </td>
                </tr>
              )}
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-t border-border align-top">
                  <td className="p-2 font-mono text-xs">
                    {transaction.runchise_sales_transaction_id}
                  </td>
                  <td className="p-2 font-bold">{transaction.nama_pelanggan ?? "-"}</td>
                  <td className="p-2">{transaction.no_telepon ?? "-"}</td>
                  <td className="p-2">{transaction.lokasi_dibuat ?? "-"}</td>
                  <td className="p-2">
                    {transaction.pelanggan_sejak ? dateFormat(transaction.pelanggan_sejak) : "-"}
                  </td>
                  <td className="p-2">{numberFormat(transaction.poin_pelanggan)}</td>
                  <td className="p-2">
                    {transaction.tanggal_transaksi
                      ? dateTimeFormat(transaction.tanggal_transaksi)
                      : "-"}
                  </td>
                  <td className="p-2">{transaction.nama_outlet ?? "-"}</td>
                  <td className="p-2">{transaction.tipe_order ?? "-"}</td>
                  <td className="p-2 text-right">
                    {currencyFormat(toNumber(transaction.pembelian_per_order))}
                  </td>
                  <td className="p-2 text-right">{numberFormat(transaction.penambahan_poin)}</td>
                  <td className="p-2 text-right">
                    {numberFormat(toNumber(transaction.penggunaan_poin))}
                  </td>
                  <td className="min-w-[280px] p-2">
                    {(transaction.redeemed_rewards ?? []).length === 0 ? (
                      <span className="text-muted-foreground">-</span>
                    ) : (
                      <div className="space-y-1.5">
                        {(transaction.redeemed_rewards ?? []).map((reward) => (
                          <div key={reward.id}>
                            <div className="font-bold">
                              {numberFormat(reward.quantity)}× {reward.product_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {numberFormat(reward.points_spent)} poin
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScrollArea>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-3 font-semibold text-muted-foreground">
            <span>
              Menampilkan {total === 0 ? 0 : (page - 1) * limit + 1}–{Math.min(page * limit, total)}{" "}
              dari {numberFormat(total)} transaksi
            </span>
            <label className="flex items-center gap-2">
              Per halaman
              <select
                value={limit}
                onChange={(event) => onLimitChange(Number(event.target.value))}
                className="rounded-lg border border-border bg-card px-2 py-1"
              >
                {[25, 50, 100].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1}
              onClick={() => onLoadPage(page - 1)}
              className="rounded-full font-bold"
            >
              Sebelumnya
            </Button>
            {paginationItems(page, totalPages).map((item, index) =>
              item === "ellipsis" ? (
                <span key={`sales-ellipsis-${index}`} className="px-1 text-muted-foreground">
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  type="button"
                  variant={item === page ? "default" : "outline"}
                  disabled={loading}
                  onClick={() => onLoadPage(item)}
                  className="h-9 min-w-9 rounded-full px-3 font-bold"
                  aria-label={`Halaman transaksi ${item}`}
                  aria-current={item === page ? "page" : undefined}
                >
                  {item}
                </Button>
              ),
            )}
            <Button
              type="button"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => onLoadPage(page + 1)}
              className="rounded-full font-bold"
            >
              Berikutnya
            </Button>
            {/* Form lompat-ke-halaman ini sebelumnya keliru berada di dalam blok
                paginasi tab Customers (lihat commit 7bc6edd) sehingga tab
                Customers menampilkan dua tombol "Pergi" -- satu di antaranya
                justru memindahkan halaman tab transaksi ini -- sementara tab
                transaksi sendiri tidak punya kontrolnya sama sekali. Sekarang
                dikembalikan ke tab yang memang memakainya. */}
            <form
              className="ml-1 flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                onJumpToPage();
              }}
            >
              <input
                type="number"
                min={1}
                max={totalPages}
                value={pageInput}
                onChange={(event) => onPageInputChange(event.target.value)}
                className="w-20 rounded-lg border border-border bg-card px-2 py-2"
                aria-label="Nomor halaman transaksi tujuan"
              />
              <Button type="submit" variant="outline" className="rounded-full font-bold">
                Pergi
              </Button>
            </form>
          </div>
        </div>
      </Panel>
    </section>
  );
}
