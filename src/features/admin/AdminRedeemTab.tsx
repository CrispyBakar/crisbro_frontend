import { memo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CatalogMenuCategory, CatalogMenuItem, RedeemItem } from "@/lib/admin";
import {
  currencyFormat,
  dateFormat,
  numberFormat,
  toNumber,
  type SortState,
} from "./adminFormatters";
import { Panel, SortableHeader, TableScrollArea } from "./adminUiPrimitives";
import { RedeemFormFields } from "./AdminFormFields";
import type { RedeemFormState } from "./adminFormDefaults";

export type RedeemSortKey = "menu" | "price" | "points" | "status" | "sort_order" | "created_at";

type RedeemListProps = {
  redeemItems: RedeemItem[];
  redeemSort: SortState<RedeemSortKey>;
  sortRedeemItems: (sortBy: RedeemSortKey) => void;
  redeemTotal: number;
  redeemPage: number;
  redeemTotalPages: number;
  loadRedeem: (page: number) => void;
  editRedeemItem: (item: RedeemItem) => void;
  requestDeleteRedeemItem: (item: RedeemItem) => void;
  openCreateRedeemForm: () => void;
  saving: boolean;
};

// L-7: sama seperti tab user -- tabel di-memo agar tidak ikut dirender ulang
// setiap ketikan di form redeem maupun setiap pencarian katalog.
const RedeemListPanel = memo(function RedeemListPanel({
  redeemItems,
  redeemSort,
  sortRedeemItems,
  redeemTotal,
  redeemPage,
  redeemTotalPages,
  loadRedeem,
  editRedeemItem,
  requestDeleteRedeemItem,
  openCreateRedeemForm,
  saving,
}: RedeemListProps) {
  return (
    <Panel title="Menu Redeem Aktif dan Draft">
      <Button
        type="button"
        onClick={openCreateRedeemForm}
        className="mb-4 w-full rounded-full font-bold md:hidden"
      >
        Tambah Menu Redeem
      </Button>
      <TableScrollArea>
        <table className="min-w-[1040px] w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <SortableHeader
                label="Menu"
                sortKey="menu"
                sort={redeemSort}
                onSort={sortRedeemItems}
              />
              <SortableHeader
                label="Nilai Jual & PB1"
                sortKey="price"
                sort={redeemSort}
                onSort={sortRedeemItems}
              />
              <SortableHeader
                label="Poin"
                sortKey="points"
                sort={redeemSort}
                onSort={sortRedeemItems}
              />
              <SortableHeader
                label="Status"
                sortKey="status"
                sort={redeemSort}
                onSort={sortRedeemItems}
              />
              <SortableHeader
                label="Urutan"
                sortKey="sort_order"
                sort={redeemSort}
                onSort={sortRedeemItems}
              />
              <SortableHeader
                label="Dibuat"
                sortKey="created_at"
                sort={redeemSort}
                onSort={sortRedeemItems}
              />
              <th className="p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {redeemItems.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="border-t border-border p-6 text-center font-semibold text-muted-foreground"
                >
                  Belum ada data menu redeem.
                </td>
              </tr>
            ) : (
              redeemItems.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="p-2 font-bold">
                    {item.menu_item.name}
                    {!item.menu_item.is_active && (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-black uppercase text-muted-foreground">
                        Menu Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="space-y-0.5">
                      <p className="font-semibold">
                        {currencyFormat(toNumber(item.menu_item.price))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PB1 {numberFormat(item.pb1_rate * 100)}%: {currencyFormat(item.pb1_amount)}
                      </p>
                      <p className="text-xs font-bold text-primary">
                        Total {currencyFormat(item.price_with_pb1)}
                      </p>
                    </div>
                  </td>
                  <td className="p-2">{numberFormat(item.points_required)}</td>
                  <td className="p-2">{item.is_active ? "Aktif" : "Nonaktif"}</td>
                  <td className="p-2">{numberFormat(item.sort_order)}</td>
                  <td className="p-2">{item.created_at ? dateFormat(item.created_at) : "-"}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="inline-flex items-center gap-1 font-bold text-primary"
                        onClick={() => editRedeemItem(item)}
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </button>
                      <button
                        className="inline-flex items-center gap-1 font-bold text-destructive"
                        disabled={saving}
                        onClick={() => requestDeleteRedeemItem(item)}
                      >
                        <Trash2 className="h-4 w-4" /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableScrollArea>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          {numberFormat(redeemTotal)} menu · Halaman {redeemPage} dari {redeemTotalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={redeemPage <= 1}
            onClick={() => void loadRedeem(redeemPage - 1)}
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            disabled={redeemPage >= redeemTotalPages}
            onClick={() => void loadRedeem(redeemPage + 1)}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </Panel>
  );
});

export default function AdminRedeemTab({
  redeemForm,
  setRedeemForm,
  saveRedeemItem,
  catalogSearch,
  setCatalogSearch,
  searchCatalog,
  resetCatalogSearch,
  appliedCatalogSearch,
  catalogCategories,
  catalogItems,
  selectedCatalogItem,
  ...listProps
}: RedeemListProps & {
  redeemForm: RedeemFormState;
  setRedeemForm: (form: RedeemFormState) => void;
  saveRedeemItem: () => void;
  catalogSearch: string;
  setCatalogSearch: (value: string) => void;
  searchCatalog: () => void;
  resetCatalogSearch: () => void;
  appliedCatalogSearch: string;
  catalogCategories: CatalogMenuCategory[];
  catalogItems: CatalogMenuItem[];
  selectedCatalogItem: CatalogMenuItem | null;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="hidden md:block">
        <Panel title={redeemForm.id ? "Edit Item Redeem" : "Tambah Item Redeem"}>
          <RedeemFormFields
            redeemForm={redeemForm}
            setRedeemForm={setRedeemForm}
            catalogSearch={catalogSearch}
            setCatalogSearch={setCatalogSearch}
            searchCatalog={searchCatalog}
            resetCatalogSearch={resetCatalogSearch}
            appliedCatalogSearch={appliedCatalogSearch}
            catalogCategories={catalogCategories}
            catalogItems={catalogItems}
            selectedCatalogItem={selectedCatalogItem}
          />
          <Button
            onClick={saveRedeemItem}
            disabled={listProps.saving}
            className="mt-3 w-full rounded-full font-bold"
          >
            Simpan Item
          </Button>
        </Panel>
      </div>
      <RedeemListPanel {...listProps} />
    </section>
  );
}
