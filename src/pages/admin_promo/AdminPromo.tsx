import { useState } from "react";
import HeaderMain from "@/components/HeaderMain";
import GeneralTable, { type SortOrder } from "@/components/GeneralTable";
import { usePageTitle } from "@/hooks/use-page-title";
import { useCreatePromo, usePromos } from "@/hooks/use-promos";
import { useLocations } from "@/hooks/use-locations";
import { isPromoSyncFailed } from "@/services/promo";
import type { GetPromosProps } from "@/services/promo";
import PromoSyncFailedModal from "./PromoSyncFailedModal";
import PendingPromoSyncBanner from "./PendingPromoSyncBanner";
import { addPendingPromoSync } from "./pending-promo-syncs";
import PromoFormModal from "./PromoFormModal";
import { buildPromoPayload, emptyPromoFormValues } from "./promo-form-utils";
import PromoDetailModal from "./PromoDetailModal";
import EditPromoModal from "./EditPromoModal";
import PromoCodesModal from "./PromoCodesModal";

// Modal create promo — di-mount kondisional agar form selalu reset saat dibuka
const CreatePromoModal = ({ onClose }: { onClose: () => void }) => {
  const { mutate: createPromo, isPending, error } = useCreatePromo();
  // Promo sudah dibuat di Runchise tapi gagal tersimpan lokal
  const [syncFailure, setSyncFailure] = useState<{
    runchiseId: number;
    name: string;
  } | null>(null);

  if (syncFailure) {
    return (
      <PromoSyncFailedModal
        runchiseId={syncFailure.runchiseId}
        promoName={syncFailure.name}
        onClose={onClose}
      />
    );
  }

  return (
    <PromoFormModal
      title="Tambah Promo"
      subtitle="Buat promo baru untuk customer crisbro."
      submitLabel="Simpan promo"
      initialValues={emptyPromoFormValues()}
      isPending={isPending}
      error={error?.message}
      onSubmit={(values) => {
        const request = buildPromoPayload(values);
        createPromo(request, {
          onSuccess: onClose,
          onError: (createError) => {
            if (!isPromoSyncFailed(createError)) return;
            // Simpan dulu agar runchise_id tidak hilang walau modal ditutup
            addPendingPromoSync({
              runchise_id: createError.runchiseId,
              name: request.name,
            });
            setSyncFailure({
              runchiseId: createError.runchiseId,
              name: request.name,
            });
          },
        });
      }}
      onClose={onClose}
    />
  );
};

const formatPromoDate = (value: unknown) =>
  value
    ? new Date(String(value)).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

const AdminPromo = () => {
  usePageTitle("Promo");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailPromoId, setDetailPromoId] = useState<string | null>(null);
  const [editPromoId, setEditPromoId] = useState<string | null>(null);
  const [promoCodesTarget, setPromoCodesTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const itemsPerPage = 25;
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [orderBy, setOrderBy] = useState<SortOrder | "">("");

  const {
    data: promos,
    isPending: pendingPromos,
    isFetching: fetchingPromos,
    error: errorPromos,
  } = usePromos({
    page: currentPage,
    limit: itemsPerPage,
    search,
    sort_by: (sortBy || undefined) as GetPromosProps["sort_by"],
    sort_order: orderBy || undefined,
  });

  // location_ids promo berisi location_id lokal → tampilkan nama lokasinya
  const { data: locationsData } = useLocations({ take: 100 });
  const locationNames = new Map(
    (locationsData?.locations ?? []).map((location) => [
      location.location_id,
      location.name,
    ]),
  );

  return (
    <main className="w-full space-y-6">
      <HeaderMain
        handleAction={() => setIsCreateOpen(true)}
        isLoading={false}
        btnTitle={"Tambah Promo"}
        title={"Promo"}
        subtitle={"Data promo khusus customer crisbro"}
      />

      {/* Promo yang gagal tersimpan lokal setelah dibuat di Runchise */}
      <PendingPromoSyncBanner />

      {/* Table */}
      {pendingPromos ? (
        <p className="text-gray-500">Memuat promo...</p>
      ) : errorPromos ? (
        <p className="text-red-500">
          Gagal memuat promo: {errorPromos.message}
        </p>
      ) : (
        <GeneralTable
          dataPending={fetchingPromos}
          canSelectDate={false}
          deleteBulk={false}
          tableTitle="Promo"
          dataHeads={[
            {
              key: "name",
              label: "Name",
              render: ({ name }) => <span>{name ? String(name) : "-"}</span>,
            },
            {
              key: "channel",
              label: "Channel",
              sortable: false,
              render: ({ channel }) => (
                <span className="uppercase">
                  {channel ? String(channel) : "-"}
                </span>
              ),
            },
            {
              key: "start_date",
              label: "Start Date",
              render: ({ start_date }) => (
                <span>{formatPromoDate(start_date)}</span>
              ),
            },
            {
              key: "end_date",
              label: "End Date",
              render: ({ end_date }) => (
                <span>{formatPromoDate(end_date)}</span>
              ),
            },
            {
              key: "location_ids",
              label: "Locations",
              sortable: false,
              render: ({ location_ids }) => {
                const names = (location_ids as string[]).map(
                  (id) => locationNames.get(id) ?? id,
                );
                if (names.length === 0) return <span>-</span>;
                return (
                  <span title={names.join(", ")}>
                    {names.slice(0, 2).join(", ")}
                    {names.length > 2 && (
                      <span className="text-gray-500">
                        {` +${names.length - 2}`}
                      </span>
                    )}
                  </span>
                );
              },
            },
            {
              key: "status",
              label: "Status",
              render: ({ status }) => (
                <span
                  className={`inline-block py-1 px-3 rounded-full bg-orange/10 ${String(status) === "active" ? "text-success" : "text-red-500"} font-semibold`}
                >
                  {String(status)}
                </span>
              ),
            },
          ]}
          data={
            promos?.data.map(({ promo }) => ({
              ...promo,
              id: promo.promo_id,
            })) ?? []
          }
          searchPlaceholder="Search promo name..."
          search={search}
          onSearchChange={setSearch}
          itemsPerPage={itemsPerPage}
          totalPages={promos?.meta.total_pages ?? 0}
          total={promos?.meta.total ?? 0}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          sortBy={sortBy}
          orderBy={orderBy}
          setSortBy={setSortBy}
          setOrderBy={setOrderBy}
          detailHiddenKeys={["id", "location_ids"]}
          handleDelete={() => {}}
          canDelete={false}
          canUpdate={false}
          canShow={false}
          canDetail={true}
          handleDetail={setDetailPromoId}
        />
      )}

      {/* Detail Modal */}
      {detailPromoId && (
        <PromoDetailModal
          promoId={detailPromoId}
          onClose={() => setDetailPromoId(null)}
          onEdit={() => {
            setEditPromoId(detailPromoId);
            setDetailPromoId(null);
          }}
          onShowPromoCodes={(name) =>
            setPromoCodesTarget({ id: detailPromoId, name })
          }
        />
      )}

      {/* Edit Modal — kembali ke detail setelah tersimpan */}
      {editPromoId && (
        <EditPromoModal
          promoId={editPromoId}
          onClose={() => setEditPromoId(null)}
          onSuccess={() => {
            setDetailPromoId(editPromoId);
            setEditPromoId(null);
          }}
        />
      )}

      {/* Promo Codes Modal (di atas modal detail) */}
      {promoCodesTarget && (
        <PromoCodesModal
          promoId={promoCodesTarget.id}
          promoName={promoCodesTarget.name}
          onClose={() => setPromoCodesTarget(null)}
        />
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <CreatePromoModal onClose={() => setIsCreateOpen(false)} />
      )}
    </main>
  );
};

export default AdminPromo;
