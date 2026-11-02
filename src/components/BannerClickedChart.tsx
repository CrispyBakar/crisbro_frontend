import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBannerClicked } from "@/hooks/use-banner-clicked";
import { useBanners } from "@/hooks/use-banner";
import { useCustomers } from "@/hooks/use-customers";
import type { BannerClickedAnalyticsPoint } from "@/services/banner-click";

const numberFormat = new Intl.NumberFormat("id-ID");

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getInitialDateRange = () => {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  return {
    start: toDateInputValue(start),
    end: toDateInputValue(end),
  };
};

function BannerClickedPlot({
  points,
}: {
  points: BannerClickedAnalyticsPoint[];
}) {
  const width = 720;
  const height = 220;
  const left = 48;
  const right = 12;
  const top = 14;
  const bottom = 40;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxValue = Math.max(1, ...points.map((point) => point.clicks));
  const tickStep = Math.max(1, Math.ceil(maxValue / 4));
  const yMax = tickStep * 4;
  const x = (index: number) =>
    left +
    (points.length <= 1
      ? plotWidth / 2
      : (index / (points.length - 1)) * plotWidth);
  const y = (value: number) => top + plotHeight - (value / yMax) * plotHeight;
  const labelIndexes = new Set(
    Array.from({ length: Math.min(6, points.length) }, (_, index) =>
      Math.round(
        (index * (points.length - 1)) / (Math.min(6, points.length) - 1 || 1),
      ),
    ),
  );
  const polyline = points
    .map((point, index) => `${x(index)},${y(point.clicks)}`)
    .join(" ");

  return (
    <div className="mt-5 min-w-0 overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Grafik jumlah klik banner per hari"
        className="h-auto min-w-[560px] w-full overflow-visible"
      >
        {Array.from({ length: 5 }, (_, index) => {
          const value = yMax - index * tickStep;
          const yPosition = y(value);
          return (
            <g key={value}>
              <line
                x1={left}
                x2={width - right}
                y1={yPosition}
                y2={yPosition}
                stroke="#e5e7eb"
                strokeDasharray="4 5"
              />
              <text
                x={left - 10}
                y={yPosition + 4}
                textAnchor="end"
                fill="#737373"
                fontSize="11"
              >
                {numberFormat.format(value)}
              </text>
            </g>
          );
        })}
        {points.length > 1 && (
          <polyline
            points={polyline}
            fill="none"
            stroke="#e60c19"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {points.map((point, index) => (
          <g key={point.date}>
            <circle
              cx={x(index)}
              cy={y(point.clicks)}
              r={points.length > 45 ? 2 : 3.5}
              fill="#e60c19"
            >
              <title>
                {point.date}: {numberFormat.format(point.clicks)} klik
              </title>
            </circle>
            {labelIndexes.has(index) && (
              <text
                x={x(index)}
                y={height - 12}
                textAnchor="middle"
                fill="#737373"
                fontSize="10"
              >
                {new Intl.DateTimeFormat("id-ID", {
                  day: "numeric",
                  month: "short",
                  timeZone: "UTC",
                }).format(new Date(`${point.date}T00:00:00Z`))}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

const selectClassName =
  "h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-200";
const dateInputClassName =
  "h-10 min-w-0 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-200 w-full";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CustomerOption = {
  userId: string;
  phoneNumber: string;
  name: string;
};

const getUuidValue = (value: unknown): string | null => {
  if (typeof value === "string") {
    return UUID_PATTERN.test(value) ? value : null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  return getUuidValue(record.user_id ?? record.id);
};

export function BannerClickedChart() {
  const [bannerId, setBannerId] = useState("");
  const [userId, setUserId] = useState("");
  const [selectedCustomerOption, setSelectedCustomerOption] =
    useState<CustomerOption | null>(null);
  const [customerPhoneSearch, setCustomerPhoneSearch] = useState("");
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false);
  const [startDate, setStartDate] = useState(() => getInitialDateRange().start);
  const [endDate, setEndDate] = useState(() => getInitialDateRange().end);
  const customerSelectRef = useRef<HTMLDivElement>(null);
  const customerSearchRef = useRef<HTMLInputElement>(null);

  const {
    data: analytics,
    isPending: analyticsPending,
    isError: analyticsIsError,
    error: analyticsError,
  } = useBannerClicked({
    startDate,
    endDate,
    bannerId: bannerId || undefined,
    userId: userId || undefined,
  });
  const {
    data: banners,
    isPending: bannersPending,
    isError: bannersIsError,
    error: bannersError,
  } = useBanners();
  const {
    data: customers,
    isPending: customersPending,
    isFetching: customersFetching,
    isError: customersIsError,
    error: customersError,
  } = useCustomers({
    page: 1,
    limit: 100,
    search: customerPhoneSearch.trim() || undefined,
  });

  const customerOptions = useMemo(() => {
    const customerByUserId = new Map<string, CustomerOption>();
    customers?.data.forEach((customer) => {
      const customerUserId = getUuidValue(customer.user_id);
      if (customerUserId && !customerByUserId.has(customerUserId)) {
        customerByUserId.set(customerUserId, {
          userId: customerUserId,
          phoneNumber: customer.phone_number,
          name: customer.name,
        });
      }
    });
    return [...customerByUserId.values()].sort((a, b) =>
      a.phoneNumber.localeCompare(b.phoneNumber),
    );
  }, [customers]);
  const filteredCustomerOptions = useMemo(() => {
    const query = customerPhoneSearch.trim().toLocaleLowerCase("id-ID");
    const digits = query.replace(/\D/g, "");
    return customerOptions.filter((customer) => {
      if (customer.userId === userId) return true;
      if (!query) return true;
      if (digits) {
        return customer.phoneNumber.replace(/\D/g, "").includes(digits);
      }
      return (
        customer.phoneNumber.toLocaleLowerCase("id-ID").includes(query) ||
        customer.name.toLocaleLowerCase("id-ID").includes(query)
      );
    });
  }, [customerOptions, customerPhoneSearch, userId]);
  const selectedCustomer =
    selectedCustomerOption?.userId === userId
      ? selectedCustomerOption
      : customerOptions.find((customer) => customer.userId === userId);

  useEffect(() => {
    if (!isCustomerSelectOpen) return;

    customerSearchRef.current?.focus();
    const handleClickOutside = (event: MouseEvent) => {
      if (!customerSelectRef.current?.contains(event.target as Node)) {
        setIsCustomerSelectOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsCustomerSelectOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isCustomerSelectOpen]);

  const dateRangeIsValid = Boolean(
    startDate && endDate && startDate <= endDate,
  );
  const series = analytics?.series ?? [];
  const filterError =
    bannersIsError || customersIsError
      ? `Gagal memuat pilihan filter: ${
          bannersError?.message ?? customersError?.message
        }`
      : null;

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
            Klik Banner
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Tren klik banner berdasarkan rentang tanggal
          </p>
        </div>
        {!analyticsPending &&
          !analyticsIsError &&
          dateRangeIsValid &&
          analytics && (
            <div className="rounded-2xl bg-neutral-50 px-4 py-2">
              <p className="text-2xl font-semibold tabular-nums tracking-tight text-neutral-900">
                {numberFormat.format(analytics.total_clicks)}
              </p>
              <p className="text-xs text-neutral-500">total klik</p>
            </div>
          )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="min-w-0 space-y-1.5">
          <span className="text-xs font-medium text-neutral-600">
            Nama banner
          </span>
          <select
            value={bannerId}
            onChange={(event) => setBannerId(event.target.value)}
            disabled={bannersPending || bannersIsError}
            className={selectClassName}
          >
            <option value="">Semua banner</option>
            {banners?.map((banner) => (
              <option key={banner.banner_id} value={banner.banner_id}>
                {banner.title}
              </option>
            ))}
          </select>
        </label>

        <div ref={customerSelectRef} className="min-w-0 space-y-1.5">
          <label className="block text-xs font-medium text-neutral-600">
            Nomor telepon customer
          </label>
          <div className="relative">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isCustomerSelectOpen}
              aria-label="Filter nomor telepon customer"
              disabled={customersPending || customersIsError}
              onClick={() => setIsCustomerSelectOpen((open) => !open)}
              className={`${selectClassName} flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span className="truncate">
                {selectedCustomer
                  ? `${selectedCustomer.phoneNumber} · ${selectedCustomer.name}`
                  : "Semua customer"}
              </span>
              <ChevronDown
                size={16}
                className={`shrink-0 transition-transform ${isCustomerSelectOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isCustomerSelectOpen && (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
                <div className="border-b border-neutral-100 p-2">
                  <input
                    ref={customerSearchRef}
                    type="search"
                    value={customerPhoneSearch}
                    onChange={(event) =>
                      setCustomerPhoneSearch(event.target.value)
                    }
                    placeholder="Cari nomor telepon"
                    aria-label="Cari nomor telepon customer"
                    className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                  />
                </div>
                <ul
                  role="listbox"
                  aria-label="Daftar customer"
                  className="max-h-60 overflow-y-auto p-1"
                >
                  <li>
                    <button
                      type="button"
                      role="option"
                      aria-selected={!userId}
                      onClick={() => {
                        setUserId("");
                        setSelectedCustomerOption(null);
                        setCustomerPhoneSearch("");
                        setIsCustomerSelectOpen(false);
                      }}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                        !userId
                          ? "bg-neutral-100 font-semibold text-neutral-900"
                          : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      Semua customer
                    </button>
                  </li>
                  {customersFetching && (
                    <li className="px-3 py-3 text-sm text-neutral-500">
                      Mencari customer...
                    </li>
                  )}
                  {!customersFetching &&
                    filteredCustomerOptions.map((customer) => (
                      <li key={customer.userId}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={customer.userId === userId}
                          onClick={() => {
                            setUserId(customer.userId);
                            setSelectedCustomerOption(customer);
                            setCustomerPhoneSearch("");
                            setIsCustomerSelectOpen(false);
                          }}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                            customer.userId === userId
                              ? "bg-neutral-100 font-semibold text-neutral-900"
                              : "text-neutral-700 hover:bg-neutral-50"
                          }`}
                        >
                          <span className="block truncate">
                            {customer.phoneNumber}
                          </span>
                          <span className="block truncate text-xs text-neutral-500">
                            {customer.name}
                          </span>
                        </button>
                      </li>
                    ))}
                  {!customersFetching &&
                    filteredCustomerOptions.length === 0 && (
                      <li className="px-3 py-3 text-sm text-neutral-500">
                        Customer tidak ditemukan
                      </li>
                    )}
                </ul>
              </div>
            )}
          </div>
        </div>

        <label className="min-w-0 space-y-1.5">
          <span className="text-xs font-medium text-neutral-600">
            Dari tanggal
          </span>
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => setStartDate(event.target.value)}
            className={dateInputClassName}
          />
        </label>

        <label className="min-w-0 space-y-1.5">
          <span className="text-xs font-medium text-neutral-600">
            Sampai tanggal
          </span>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
            className={dateInputClassName}
          />
        </label>
      </div>

      {filterError && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {filterError}
        </p>
      )}
      {!dateRangeIsValid ? (
        <p className="mt-6 rounded-2xl bg-amber-50 px-4 py-8 text-center text-sm text-amber-800">
          Pilih rentang tanggal yang valid.
        </p>
      ) : analyticsPending ? (
        <p className="mt-6 rounded-2xl bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
          Memuat data klik banner...
        </p>
      ) : analyticsIsError ? (
        <p className="mt-6 rounded-2xl bg-rose-50 px-4 py-8 text-center text-sm text-rose-700">
          Gagal memuat data klik banner: {analyticsError.message}
        </p>
      ) : series.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
          Tidak ada data grafik klik banner untuk rentang tanggal ini.
        </p>
      ) : (
        <BannerClickedPlot points={series} />
      )}
    </section>
  );
}
