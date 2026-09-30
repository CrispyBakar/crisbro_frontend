import GeneralTable from "@/components/GeneralTable";
import HeaderMain from "@/components/HeaderMain";
import {
  useDeleteLocation,
  useGenerateLocations,
  useLocations,
} from "@/hooks/use-locations";
import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";

const AdminLocations = () => {
  usePageTitle("Lokasi");

  const itemsPerPage = 25;
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isPending, isFetching, isError, error } = useLocations({
    take: itemsPerPage,
    skip: (currentPage - 1) * itemsPerPage,
    query: search,
  });

  const { mutate: deleteLocation } = useDeleteLocation();

  const {
    mutate: generateLocation,
    isPending: generatePending,
    error: generateError,
    isSuccess: generateSuccess,
  } = useGenerateLocations();

  const handleDelete = (locationId: string) => {
    if (!confirm("Yakin ingin menghapus lokasi ini?")) return;

    deleteLocation({ location_id: locationId });
  };

  const locations = data?.locations.map(({ location_id, ...location }) => ({
    ...location,
    id: location_id,
  }));
  const total = data?.total ?? 0;
  const totalPages = data?.total_page ?? 0;

  return (
    <main className="w-full space-y-6">
      <HeaderMain
        handleAction={generateLocation}
        isLoading={generatePending}
        btnTitle={"Sync Runchise Locations"}
        title={"Locations"}
        subtitle={"Data lokasi yang telah sinkron dengan runchise."}
      />

      {generateSuccess ? (
        <p className="text-success">Berhasil sinkronisasi data lokasi.</p>
      ) : generateError ? (
        <p className="text-red-500">
          Gagala sinkronisasi data lokasi: {generateError.message}
        </p>
      ) : (
        <></>
      )}

      {/* Table */}
      {isPending ? (
        <p className="text-gray-500">Memuat lokasi...</p>
      ) : isError ? (
        <p className="text-red-500">Gagal memuat lokasi: {error.message}</p>
      ) : (
        <GeneralTable
          dataPending={isFetching}
          canSelectDate={false}
          deleteBulk={false}
          tableTitle="Locations"
          dataHeads={[
            { key: "runchise_id", label: "Runchise Id" },
            { key: "name", label: "Name" },
            { key: "city", label: "City" },
            { key: "province", label: "Province" },
            { key: "country", label: "Country" },
            { key: "branch_type", label: "Branch Type" },
            {
              key: "status",
              label: "Status",
              render: ({ status }) => (
                <span className="inline-block py-1 px-3 rounded-full bg-orange/10 text-success font-semibold">
                  {String(status)}
                </span>
              ),
            },
          ]}
          data={locations ?? []}
          searchPlaceholder="Search location name..."
          search={search}
          onSearchChange={setSearch}
          itemsPerPage={itemsPerPage}
          totalPages={totalPages}
          total={total}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          detailHiddenKeys={["sub_brands", "id"]}
          handleDelete={handleDelete}
          canDelete={false}
          canUpdate={false}
          canShow={true}
          canDetail={false}
        />
      )}
    </main>
  );
};

export default AdminLocations;
