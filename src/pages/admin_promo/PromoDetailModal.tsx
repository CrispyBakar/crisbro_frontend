import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Power, PowerOff, Ticket, X } from "lucide-react";
import {
  useActivatePromo,
  useDeactivatePromo,
  usePromo,
} from "@/hooks/use-promos";
import { useLocations } from "@/hooks/use-locations";
import LoadingCircle from "@/components/LoadingCircle";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  PROMO_GOAL_LABELS,
  formatPromoPeriodDate,
  parseMaxQtyProducts,
  parseOrderTypes,
} from "./promo-detail-utils";

const SECTIONS = [
  { id: "details", label: "Promo Details" },
  { id: "terms", label: "Term and Conditions" },
  { id: "location", label: "Location" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const DetailItem = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-medium uppercase text-gray-500">{label}</span>
    <div className="text-sm text-gray-900">{children}</div>
  </div>
);

const yesNo = (value: boolean | null | undefined) => (value ? "Yes" : "No");

type PromoDetailModalProps = {
  promoId: string;
  onClose: () => void;
  onEdit: () => void;
  onShowPromoCodes: (name: string) => void;
};

// Modal detail promo dari GET /promos/:promo_id
const PromoDetailModal = ({
  promoId,
  onClose,
  onEdit,
  onShowPromoCodes,
}: PromoDetailModalProps) => {
  const { data, isPending, error } = usePromo(promoId);
  // location_ids & owner_location_id berisi location_id lokal → nama lokasi
  const { data: locationsData } = useLocations({ take: 100 });
  const locationNames = new Map(
    (locationsData?.locations ?? []).map((location) => [
      location.location_id,
      location.name,
    ]),
  );

  const [activeSection, setActiveSection] = useState<SectionId>("details");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Partial<Record<SectionId, HTMLElement | null>>>(
    {},
  );
  const menuRef = useRef<HTMLDivElement>(null);

  // Tutup menu "..." saat klik di luar
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const scrollToSection = (id: SectionId) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Tandai section yang sedang terlihat saat konten di-scroll
  const handleScroll = () => {
    const container = contentRef.current;
    if (!container) return;
    const top = container.getBoundingClientRect().top;
    const current = [...SECTIONS]
      .reverse()
      .find(
        ({ id }) =>
          (sectionRefs.current[id]?.getBoundingClientRect().top ?? Infinity) -
            top <=
          24,
      );
    if (current) setActiveSection(current.id);
  };

  const promo = data?.promo;
  const rule = data?.promo_rule;
  const reward = data?.promo_reward;
  const promoName = promo?.name ?? "-";
  const channel = promo?.channel?.toUpperCase() ?? "-";
  const isActive = promo?.status === "active";

  // Activate / deactivate lewat PATCH /promos/:promo_id/(activate|deactivate)
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const activate = useActivatePromo();
  const deactivate = useDeactivatePromo();
  const statusMutation = isActive ? deactivate : activate;

  const closeStatusConfirm = () => {
    setIsStatusConfirmOpen(false);
    statusMutation.reset();
  };

  const handleChangeStatus = () =>
    statusMutation.mutate(
      { promo_id: promoId },
      { onSuccess: () => setIsStatusConfirmOpen(false) },
    );

  const orderTypes = parseOrderTypes(rule?.order_types);
  const maxQtyByName = new Map(
    parseMaxQtyProducts(rule?.maximum_qty_applied_to_products).map(
      (product) => [product.name, product.maximum_purchase],
    ),
  );
  const locationLabels = (promo?.location_ids ?? []).map(
    (id) => locationNames.get(id) ?? id,
  );

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <div
          className="flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-md"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-4 sm:p-6">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-chocolate">
                {promoName}
              </h3>
              <span className="text-sm text-gray-500">{channel}</span>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-cream hover:text-chocolate"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>

          {isPending ? (
            <LoadingCircle className="py-16" />
          ) : error ? (
            <p className="p-6 text-sm text-red-500">
              Gagal memuat detail promo: {error.message}
            </p>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
              {/* Navigasi section */}
              <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-gray-100 p-3 sm:w-64 sm:flex-col sm:border-r sm:border-b-0 sm:p-6">
                {SECTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => scrollToSection(id)}
                    className={`shrink-0 cursor-pointer rounded-xl px-4 py-2.5 text-left text-sm transition-colors ${
                      activeSection === id
                        ? "bg-orange/10 font-medium text-orange"
                        : "text-gray-700 hover:bg-cream"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </nav>

              {/* Konten */}
              <div
                ref={contentRef}
                onScroll={handleScroll}
                className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"
              >
                <section
                  ref={(element) => {
                    sectionRefs.current.details = element;
                  }}
                  className="flex scroll-mt-4 flex-col gap-5"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-bold">{promoName}</h4>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 capitalize">
                        <span
                          className={`h-2 w-2 rounded-full ${isActive ? "bg-cyan-500" : "bg-gray-400"}`}
                        />
                        {promo?.status}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{channel}</span>
                  </div>

                  <DetailItem label="Period">
                    {formatPromoPeriodDate(promo?.start_date ?? null) ?? "-"} -{" "}
                    {formatPromoPeriodDate(promo?.end_date ?? null) ??
                      "Onwards"}
                  </DetailItem>
                  <DetailItem label="Promotion Goal">
                    {PROMO_GOAL_LABELS[promo?.goal ?? ""] ?? promo?.goal ?? "-"}
                  </DetailItem>

                  <hr className="border-gray-100" />

                  <h4 className="text-base font-bold">Promotion Details</h4>
                  <DetailItem
                    label={
                      reward?.discount_is_percentage
                        ? "Discount (%)"
                        : "Discount"
                    }
                  >
                    {reward?.discount_amount
                      ? `${reward.discount_amount}${reward.discount_is_percentage ? "%" : ""}`
                      : "-"}
                  </DetailItem>
                  <DetailItem label="Promotion Apply To">
                    Specific Products
                  </DetailItem>
                  <DetailItem label="Products">
                    {reward?.get_products.length ? (
                      <ul className="flex flex-col gap-1">
                        {reward.get_products.map((name) => (
                          <li
                            key={name}
                            className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2"
                          >
                            <span>{name}</span>
                            {maxQtyByName.get(name) && (
                              <span className="text-xs text-gray-500">
                                Max {maxQtyByName.get(name)} / order
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "-"
                    )}
                  </DetailItem>
                  <DetailItem label="Apply to Option Set and Modifier">
                    {yesNo(reward?.apply_to_option_set)}
                  </DetailItem>
                </section>

                <hr className="my-6 border-gray-100" />

                <section
                  ref={(element) => {
                    sectionRefs.current.terms = element;
                  }}
                  className="flex scroll-mt-4 flex-col gap-5"
                >
                  <h4 className="text-base font-bold">Term and Conditions</h4>
                  <DetailItem label="Applicable for Order Type">
                    {orderTypes.length
                      ? orderTypes.map((orderType) => orderType.name).join(", ")
                      : "All order types"}
                  </DetailItem>
                  <DetailItem label="Member Only">
                    {yesNo(rule?.member_only)}
                  </DetailItem>
                  <DetailItem label="Use Promo Code">
                    {yesNo(rule?.use_promotion_code)}
                  </DetailItem>
                  {rule?.use_promotion_code && (
                    <>
                      <DetailItem label="Redemption Rules">
                        <span className="capitalize">
                          {rule.promotion_code_usage_type ?? "-"} use
                        </span>
                      </DetailItem>
                      <DetailItem label="Source">
                        <span className="capitalize">
                          {rule.promotion_code_source ?? "-"}
                        </span>
                      </DetailItem>
                      <DetailItem label="Number of Codes">
                        {data?.promo_codes.length ??
                          rule.promotion_code_number_of_generated_code ??
                          "-"}
                      </DetailItem>
                    </>
                  )}
                </section>

                <hr className="my-6 border-gray-100" />

                <section
                  ref={(element) => {
                    sectionRefs.current.location = element;
                  }}
                  className="flex scroll-mt-4 flex-col gap-5 pb-4"
                >
                  <h4 className="text-base font-bold">Location</h4>
                  <DetailItem label="Promotion Belongs to Location">
                    {promo
                      ? (locationNames.get(promo.owner_location_id) ??
                        promo.owner_location_id)
                      : "-"}
                  </DetailItem>
                  <DetailItem label="Valid at Location">
                    {locationLabels.length ? (
                      <div className="flex flex-wrap gap-2">
                        {locationLabels.map((name) => (
                          <span
                            key={name}
                            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </DetailItem>
                </section>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-4 border-t border-gray-100 p-4 sm:p-6">
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen((open) => !open)}
                disabled={!data}
                className="cursor-pointer rounded-xl border border-gray-200 p-3 text-gray-700 transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Aksi lainnya"
              >
                <MoreHorizontal size={18} />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-48 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onShowPromoCodes(promoName);
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-gray-700 hover:bg-cream"
                  >
                    <Ticket size={16} />
                    Promo Codes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsStatusConfirmOpen(true);
                    }}
                    className={`flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-cream ${
                      isActive ? "text-red-500" : "text-success"
                    }`}
                  >
                    {isActive ? <PowerOff size={16} /> : <Power size={16} />}
                    {isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              )}
            </div>
            <div className="h-12 w-px bg-gray-100" />
            <button
              type="button"
              onClick={onEdit}
              disabled={!data}
              className="cursor-pointer rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-orange transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Di luar overlay detail agar klik backdrop tidak ikut menutup detail */}
      {isStatusConfirmOpen && (
        <ConfirmDialog
          title={isActive ? "Nonaktifkan promo?" : "Aktifkan promo?"}
          message={
            isActive ? (
              <>
                Promo <b>{promoName}</b> tidak akan bisa dipakai lagi di
                Runchise sampai diaktifkan kembali.
              </>
            ) : (
              <>
                Promo <b>{promoName}</b> akan aktif dan bisa dipakai di Runchise
                sesuai periode dan aturannya.
              </>
            )
          }
          icon={isActive ? PowerOff : Power}
          confirmLabel={isActive ? "Ya, nonaktifkan" : "Ya, aktifkan"}
          variant={isActive ? "danger" : "default"}
          isPending={statusMutation.isPending}
          error={statusMutation.error?.message}
          onConfirm={handleChangeStatus}
          onCancel={closeStatusConfirm}
        />
      )}
    </>
  );
};

export default PromoDetailModal;
