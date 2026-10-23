import GeneralTable from "@/components/GeneralTable";
import HeaderMain from "@/components/HeaderMain";
import UploadBannerModal from "@/components/UploadBannerModal";
import { useBanners, useDeleteBanner } from "@/hooks/use-banner";
import { getImageBanner } from "@/services/banner";
import { useEffect, useState } from "react";

// Render Image Component
function BannerImage({ bannerId }: { bannerId: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const res = await getImageBanner(bannerId);
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [bannerId]);

  if (error) return <span>No image</span>;
  if (!src) return <span>Loading...</span>;

  return (
    <img
      src={src}
      alt="Banner"
      style={{ width: 120, height: 60, objectFit: "cover" }}
      className="rounded-2xl"
    />
  );
}

const BannerSettings = () => {
  const { data, isPending, isError, error } = useBanners();
  const {
    mutate: deleteBanner,
    isPending: isDeleting,
    error: deleteError,
  } = useDeleteBanner();
  const [search, setSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const itemsPerPage = 25;
  const totalPages = Math.ceil((data?.length as number) / itemsPerPage);

  const banners = data?.map(({ banner_id, ...banners }) => ({
    ...banners,
    id: banner_id,
  }));

  const handleDelete = (bannerId: string) => {
    if (isDeleting || !confirm("Yakin ingin menghapus banner ini?")) return;
    deleteBanner(bannerId);
  };

  return (
    <main className="w-full space-y-6">
      <HeaderMain
        title="Manage Banner"
        subtitle="Atur banner promosi yang tampil pada halaman customer"
        handleAction={() => setModalOpen(true)}
        btnTitle="Upload"
      />

      {/* Table */}
      {isPending ? (
        <p className="text-gray-500">Memuat banner...</p>
      ) : isError ? (
        <p className="text-red-500">Gagal memuat banner: {error.message}</p>
      ) : (
        <>
          {deleteError && (
            <p className="text-sm text-red-500" role="alert">
              Gagal menghapus banner: {deleteError.message}
            </p>
          )}
          {isDeleting && (
            <p className="text-sm text-gray-500" role="status">
              Menghapus banner...
            </p>
          )}
          <GeneralTable
            dataPending={isPending}
            canSelectDate={false}
            deleteBulk={false}
            tableTitle="Banners"
            dataHeads={[
              {
                key: "image_url",
                label: "Image",
                render: (row) => <BannerImage bannerId={row.id} />,
              },
              { key: "title", label: "Title" },
              {
                key: "status",
                label: "Status",
                render: (row) => {
                  const status = String(row.status);
                  return (
                    <span
                      className={`${status === "active" ? "text-success" : "text-berry-red"}`}
                    >
                      {status}
                    </span>
                  );
                },
              },
              { key: "type", label: "Type" },
              {
                key: "start_date",
                label: "Start Date",
                render: (row) => {
                  let dateStr = "Not set";
                  if (
                    typeof row.start_date === "string" ||
                    typeof row.start_date === "number"
                  ) {
                    dateStr = new Date(row.start_date).toLocaleString();
                  }
                  return (
                    <span
                      className={`${!row.start_date ? "text-berry-red" : ""}`}
                    >
                      {dateStr}
                    </span>
                  );
                },
              },
              {
                key: "end_date",
                label: "End Date",
                render: (row) => {
                  let dateStr = "Not set";
                  if (
                    typeof row.end_date === "string" ||
                    typeof row.end_date === "number"
                  ) {
                    dateStr = new Date(row.end_date).toLocaleString();
                  }
                  return (
                    <span
                      className={`${!row.end_date ? "text-berry-red" : ""}`}
                    >
                      {dateStr}
                    </span>
                  );
                },
              },
              {
                key: "start_time",
                label: "Start Time",
                render: (row) => {
                  const startTime = String(row.start_time ?? "Not Set");
                  const time =
                    startTime.split("T")[1]?.slice(0, 5) ?? startTime;
                  return (
                    <span
                      className={`${!row.start_time ? "text-berry-red" : ""}`}
                    >
                      {time.replace(":", ".")}
                    </span>
                  );
                },
              },
              {
                key: "end_time",
                label: "End Time",
                render: (row) => {
                  const endTime = String(row.end_time ?? "Not Set");
                  const time = endTime.split("T")[1]?.slice(0, 5) ?? endTime;
                  return (
                    <span
                      className={`${!row.end_time ? "text-berry-red" : ""}`}
                    >
                      {time.replace(":", ".")}
                    </span>
                  );
                },
              },
            ]}
            data={banners ?? []}
            searchPlaceholder="Search location name..."
            search={search}
            onSearchChange={setSearch}
            itemsPerPage={itemsPerPage}
            totalPages={totalPages}
            total={banners?.length as number}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            detailHiddenKeys={["image_url", "id"]}
            handleDelete={handleDelete}
            canDelete={true}
            canUpdate={false}
            canShow={false}
            canDetail={false}
          />
        </>
      )}

      {/* Upload Modal */}
      {modalOpen && <UploadBannerModal onClose={setModalOpen} />}
    </main>
  );
};

export default BannerSettings;
