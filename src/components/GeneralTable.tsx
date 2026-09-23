import React from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  ListSortDescending,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import DetailDataModal from "./DetailDataModal";

export type TableRow = { id: string } & Record<string, unknown>;

export type TableHead = {
  key: string;
  label: string;
  render?: (row: TableRow) => React.ReactNode;
};

type GeneralTableProps<T extends TableRow> = {
  tableTitle: string;
  dataHeads: TableHead[];
  data: T[];
  deleteBulk: boolean;
  searchPlaceholder?: string;
  itemsPerPage: number;
  totalPages: number;
  total: number;
  currentPage: number;
  setCurrentPage: (value: number) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  // Kolom untuk modal detail; jika tidak diberikan, modal menampilkan
  // seluruh field pada baris data (label dibakukan dari nama field).
  detailHeads?: TableHead[];
  // Field yang disembunyikan dari modal detail (berlaku saat `detailHeads`
  // tidak diberikan), mis. `id` internal atau field bersarang.
  detailHiddenKeys?: string[];
  handleDelete?: (id: string) => void;
  detailButton?: string;
  canDelete: boolean;
  canUpdate: boolean;
  canShow: boolean;
  canDetail: boolean;
  handleDetail?: (id: string) => void;
};

const GeneralTable = <T extends TableRow>({
  tableTitle,
  dataHeads,
  data,
  deleteBulk = false,
  searchPlaceholder = "Search...",
  itemsPerPage,
  totalPages,
  total,
  currentPage,
  setCurrentPage,
  search,
  onSearchChange,
  detailHeads,
  detailHiddenKeys,
  handleDelete,
  canDelete,
  canDetail,
  canShow,
  handleDetail,
}: GeneralTableProps<T>) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [internalSearch, setInternalSearch] = useState("");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [detailRow, setDetailRow] = useState<TableRow | null>(null);

  // Saat `onSearchChange` diberikan, pencarian ditangani server (param `query`);
  // selain itu difilter lokal pada halaman aktif saja.
  const searchValue = search ?? internalSearch;

  const filteredData = onSearchChange
    ? data
    : data.filter((row) =>
        dataHeads.some((head) =>
          String(row[head.key] ?? "")
            .toLowerCase()
            .includes(searchValue.toLowerCase()),
        ),
      );

  const sortedData = sortKey
    ? [...filteredData].sort((a, b) => {
        const compare = String(a[sortKey] ?? "").localeCompare(
          String(b[sortKey] ?? ""),
          undefined,
          { numeric: true, sensitivity: "base" },
        );
        return sortDirection === "asc" ? compare : -compare;
      })
    : filteredData;

  const page = Math.max(1, Math.min(currentPage, totalPages));

  // Daftar nomor halaman yang ditampilkan: selalu halaman pertama, terakhir,
  // dan halaman di sekitar halaman aktif; sisanya diringkas jadi elipsis agar
  // tidak merender ribuan tombol saat data sangat banyak.
  const getPageNumbers = (): (number | "dots")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages: (number | "dots")[] = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    if (start > 2) pages.push("dots");
    for (let pageNumber = start; pageNumber <= end; pageNumber++) {
      pages.push(pageNumber);
    }
    if (end < totalPages - 1) pages.push("dots");

    pages.push(totalPages);
    return pages;
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const resetSort = () => {
    setSortKey(null);
    setSortDirection("asc");
    setIsSortOpen(false);
    setCurrentPage(1);
  };

  return (
    <div className="w-full p-5 rounded-3xl shadow-sm shadow-gray-100 bg-white">
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-black text-xl">{tableTitle}</h3>
          {deleteBulk ?? (
            <button
              disabled={selectedIds.length < 1}
              className="flex items-center gap-2 py-1.5 px-4 rounded-full text-sm font-semibold bg-red-500 text-white cursor-pointer transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <Trash2 size={14} />
              <span>
                Delete Selected
                {selectedIds.length > 0 && ` (${selectedIds.length})`}
              </span>
            </button>
          )}
        </div>
        <div className="flex justify-end items-center gap-2">
          <div className="flex gap-2 justify-start items-center relative rounded-full border border-gray-200 p-2">
            <Search size={14} />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => {
                if (onSearchChange) {
                  onSearchChange(e.target.value);
                } else {
                  setInternalSearch(e.target.value);
                }
                setCurrentPage(1);
              }}
              className="w-full outline-none h-full text-sm"
              placeholder={searchPlaceholder}
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsSortOpen((prev) => !prev)}
              className="flex gap-2 justify-start items-center font-semibold text-sm rounded-full border border-gray-200 p-2 cursor-pointer"
            >
              <ListSortDescending size={14} />
              <span>Sort by</span>
              <ChevronDown
                size={14}
                className={`transition-transform ${
                  isSortOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Modal sort by */}
            {isSortOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsSortOpen(false)}
                />
                <div className="absolute top-full right-0 z-20 mt-2 min-w-48 bg-white border border-gray-100 rounded-3xl p-2 shadow-lg shadow-gray-100">
                  {dataHeads.map((head) => {
                    const isActive = sortKey === head.key;
                    return (
                      <button
                        key={head.key}
                        onClick={() => handleSort(head.key)}
                        className={`flex justify-between items-center gap-2 w-full px-4 py-2 rounded-2xl text-sm font-semibold cursor-pointer transition-colors ${
                          isActive
                            ? "bg-orange text-white"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span>{head.label}</span>
                        {isActive &&
                          (sortDirection === "asc" ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          ))}
                      </button>
                    );
                  })}
                  {sortKey && (
                    <button
                      onClick={resetSort}
                      className="w-full px-4 py-2 rounded-2xl text-sm font-semibold text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <table className="w-full border-separate border-spacing-0 mt-4">
        <thead className="bg-gray-50 text-left text-base">
          <tr>
            {dataHeads.map((head, index) => (
              <th
                key={head.key}
                className={`px-4 py-2 text-gray-500 font-normal ${index === 0 ? "rounded-l-md" : ""}`}
              >
                <div className="flex justify-start items-center gap-2">
                  {index === 0 && deleteBulk && <input type="checkbox" />}
                  <span>{head.label}</span>
                </div>
              </th>
            ))}
            <th className="px-4 py-2 text-gray-500 font-normal rounded-r-md">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="text-left text-sm">
          {sortedData.map((row) => (
            <tr key={row.id}>
              {dataHeads.map((head, index) => (
                <td
                  key={head.key}
                  className="px-4 py-3 border-b border-gray-100 text-gray-500"
                >
                  {index === 0 ? (
                    <div className="flex justify-start items-center gap-2">
                      {deleteBulk && (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={() => toggleSelect(row.id)}
                        />
                      )}

                      <span className="font-semibold text-black">
                        {String(row[head.key] ?? "")}
                      </span>
                    </div>
                  ) : head.render ? (
                    head.render(row)
                  ) : (
                    String(row[head.key] ?? "")
                  )}
                </td>
              ))}
              <td className="px-4 py-3 border-b border-gray-100">
                {canDelete && (
                  <button
                    onClick={() => handleDelete?.(row.id)}
                    className="p-2 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 cursor-pointer transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                {canShow && (
                  <button
                    onClick={() => setDetailRow(row)}
                    className="p-2 rounded-full text-gray-400 hover:bg-red-50 hover:text-orange-500 cursor-pointer transition-colors"
                  >
                    <Eye size={16} />
                  </button>
                )}
                {canDetail && (
                  <button
                    onClick={() => handleDetail?.(row.id)}
                    className="py-1 px-2.5 rounded-3xl bg-gray-100 border border-gray-100 text-sm text-gray-500 font-semibold hover:bg-orange-300 hover:text-white cursor-pointer active:bg-orange-400"
                  >
                    Detail
                  </button>
                )}
              </td>
            </tr>
          ))}
          {sortedData.length === 0 && (
            <tr>
              <td
                colSpan={dataHeads.length + 1}
                className="px-4 py-8 text-center text-gray-400"
              >
                No data found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-4">
        <span className="text-sm text-gray-500">
          {sortedData.length === 0
            ? "No entries to show"
            : `Showing ${(page - 1) * itemsPerPage + 1} to ${Math.min(
                page * itemsPerPage,
                total,
              )} of ${total} entries`}
        </span>
        <div className="flex flex-wrap justify-center sm:justify-end items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(Math.max(page - 1, 1))}
            disabled={page === 1}
            className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} />
          </button>
          {getPageNumbers().map((pageNumber, index) =>
            pageNumber === "dots" ? (
              <span
                key={`dots-${index}`}
                className="flex items-center justify-center min-w-8 py-1 text-gray-400"
              >
                <MoreHorizontal size={14} />
              </span>
            ) : (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                className={`min-w-8 px-2 py-1 rounded-full text-sm font-semibold cursor-pointer ${
                  pageNumber === page
                    ? "bg-orange text-white"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {pageNumber}
              </button>
            ),
          )}
          <button
            onClick={() => setCurrentPage(Math.min(page + 1, totalPages))}
            disabled={page >= totalPages}
            className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Modal detail data */}
      {detailRow && (
        <DetailDataModal
          title={`Detail ${tableTitle}`}
          imageUrl={detailRow?.image_url as string}
          dataHeads={detailHeads}
          hiddenKeys={detailHiddenKeys}
          row={detailRow}
          onClose={() => setDetailRow(null)}
        />
      )}
    </div>
  );
};

export default GeneralTable;
