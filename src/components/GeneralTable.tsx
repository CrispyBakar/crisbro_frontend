import React from "react";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  ListFilter,
  ListSortDescending,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import DetailDataModal from "./DetailDataModal";
import { DateRange, type Range } from "react-date-range";

const formatDate = (date?: Date) =>
  date
    ? date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

// Tanggal disimpan sebagai string lokal "YYYY-MM-DD" agar bisa di-parse balik
// tanpa bergeser zona waktu.
const toDateString = (date?: Date) =>
  date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : "";

const parseDate = (value?: string) => {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? undefined : date;
};

export type TableRow = { id: string } & Record<string, unknown>;

export type TableHead = {
  key: string;
  label: string;
  render?: (row: TableRow) => React.ReactNode;
  // Set `false` untuk menyembunyikan kolom dari menu sort, mis. kolom yang
  // tidak didukung `sort_by` di backend.
  sortable?: boolean;
};

export type SortOrder = "asc" | "desc";

export type FilterOption = { label: string; value: string };

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
  canSelectDate: boolean;
  setStartDate?: (startDate: string) => void;
  setEndDate?: (endDate: string) => void;
  startDate?: string;
  endDate?: string;
  // Saat `setSortBy` diberikan, sort ditangani server (param `sort_by` dan
  // `sort_order`); selain itu data disortir lokal pada halaman aktif saja.
  sortBy?: string;
  orderBy?: SortOrder | "";
  setSortBy?: (sortBy: string) => void;
  setOrderBy?: (orderBy: SortOrder | "") => void;
  // Dropdown filter tambahan (mis. status); tampil saat `filterOptions` diisi.
  // Nilai "" berarti tanpa filter.
  filterLabel?: string;
  filterOptions?: FilterOption[];
  filterValue?: string;
  onFilterChange?: (value: string) => void;
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
  canSelectDate,
  setStartDate,
  setEndDate,
  startDate,
  endDate,
  sortBy,
  orderBy,
  setSortBy,
  setOrderBy,
  filterLabel = "Filter",
  filterOptions,
  filterValue = "",
  onFilterChange,
}: GeneralTableProps<T>) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [internalSearch, setInternalSearch] = useState("");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [internalSortKey, setInternalSortKey] = useState("");
  const [internalSortDirection, setInternalSortDirection] = useState<
    SortOrder | ""
  >("");
  const [detailRow, setDetailRow] = useState<TableRow | null>(null);

  const isServerSort = Boolean(setSortBy);
  const sortKey = (isServerSort ? sortBy : internalSortKey) || null;
  const sortDirection: SortOrder =
    (isServerSort ? orderBy : internalSortDirection) || "asc";

  const applySort = (key: string, direction: SortOrder | "") => {
    if (isServerSort) {
      setSortBy?.(key);
      setOrderBy?.(direction);
    } else {
      setInternalSortKey(key);
      setInternalSortDirection(direction);
    }
  };

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

  const sortedData =
    sortKey && !isServerSort
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
      applySort(key, sortDirection === "asc" ? "desc" : "asc");
    } else {
      applySort(key, "asc");
    }
    setCurrentPage(1);
  };

  const resetSort = () => {
    applySort("", "");
    setIsSortOpen(false);
    setCurrentPage(1);
  };

  const handleChangeDateRange = (startDate: string, endDate: string) => {
    setStartDate?.(startDate);
    setEndDate?.(endDate);
    setCurrentPage(1);
  };

  const resetDateRange = () => {
    handleChangeDateRange("", "");
    setIsDateOpen(false);
  };

  const hasDateFilter = Boolean(startDate || endDate);

  const handleFilterChange = (value: string) => {
    onFilterChange?.(value);
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const activeFilter = filterOptions?.find(
    (option) => option.value === filterValue,
  );

  // `ranges` wajib diisi: tanpa range, DateRange (v2.0.1) crash saat hover
  // ("Cannot access 'color' before initialization").
  const dateRange: Range[] = [
    {
      startDate: parseDate(startDate) ?? new Date(),
      endDate: parseDate(endDate) ?? parseDate(startDate) ?? new Date(),
      key: "selection",
    },
  ];

  return (
    <div className="w-full p-4 sm:p-5 rounded-3xl shadow-sm shadow-gray-100 bg-white">
      <div className="flex flex-col gap-3 w-full sm:flex-row sm:justify-between sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
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
          <div className="flex min-w-0 flex-1 gap-2 justify-start items-center relative rounded-full border border-gray-200 p-2 sm:w-64 sm:flex-none">
            <Search size={14} className="shrink-0" />
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

          {filterOptions && filterOptions.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className={`flex gap-2 justify-start items-center whitespace-nowrap font-semibold text-sm rounded-full border p-2 cursor-pointer ${
                  activeFilter ? "border-orange text-orange" : "border-gray-200"
                }`}
              >
                <ListFilter size={14} />
                <span className="hidden sm:inline">
                  {activeFilter?.label ?? filterLabel}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    isFilterOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Popover filter */}
              {isFilterOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsFilterOpen(false)}
                  />
                  <div className="absolute top-full right-0 z-20 mt-2 min-w-48 bg-white border border-gray-100 rounded-3xl p-2 shadow-lg shadow-gray-100">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterChange(option.value)}
                        className={`flex justify-between items-center gap-2 w-full px-4 py-2 rounded-2xl text-sm font-semibold cursor-pointer transition-colors ${
                          option.value === filterValue
                            ? "bg-orange text-white"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                    {activeFilter && (
                      <button
                        onClick={() => handleFilterChange("")}
                        className="w-full px-4 py-2 rounded-2xl text-sm font-semibold text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {canSelectDate && (
            <div className="relative">
              <button
                onClick={() => setIsDateOpen((prev) => !prev)}
                className="flex gap-2 justify-start items-center whitespace-nowrap font-medium text-sm rounded-full border border-gray-200 p-2 cursor-pointer"
              >
                <Calendar size={14} />
                <span className="hidden sm:inline">
                  {hasDateFilter
                    ? `${formatDate(dateRange[0].startDate)} - ${formatDate(
                        dateRange[0].endDate,
                      )}`
                    : "All dates"}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    isDateOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Popover pilih rentang tanggal */}
              {isDateOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsDateOpen(false)}
                  />
                  <div className="absolute top-full right-0 z-20 mt-2 overflow-hidden bg-white border border-gray-100 rounded-3xl shadow-lg shadow-gray-100">
                    <DateRange
                      editableDateInputs={true}
                      onChange={(item) =>
                        handleChangeDateRange(
                          toDateString(item.selection.startDate),
                          toDateString(item.selection.endDate),
                        )
                      }
                      moveRangeOnFirstSelection={false}
                      ranges={dateRange}
                    />
                    {hasDateFilter && (
                      <div className="px-2 pb-2">
                        <button
                          onClick={resetDateRange}
                          className="w-full px-4 py-2 rounded-2xl text-sm font-semibold text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setIsSortOpen((prev) => !prev)}
              className="flex gap-2 justify-start items-center whitespace-nowrap font-semibold text-sm rounded-full border border-gray-200 p-2 cursor-pointer"
            >
              <ListSortDescending size={14} />
              <span className="hidden sm:inline">Sort by</span>
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
                  {dataHeads
                    .filter((head) => head.sortable !== false)
                    .map((head) => {
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

      {/* Tabel di-scroll horizontal saat layar lebih sempit dari isinya */}
      <div className="mt-4 w-full overflow-x-auto">
        <table className="w-full whitespace-nowrap border-separate border-spacing-0">
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
      </div>

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
