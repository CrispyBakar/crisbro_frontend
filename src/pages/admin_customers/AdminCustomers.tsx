import GeneralTable, { type SortOrder } from "@/components/GeneralTable";
import HeaderMain from "@/components/HeaderMain";
import { useCustomers } from "@/hooks/use-customers";
import type { ParamsCustomers } from "@/services/customers";
import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { useNavigate } from "react-router";

const AdminCustomers = () => {
  usePageTitle("Customer");

  const [search, setSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");
  const [orderBy, setOrderBy] = useState<SortOrder | "">("");

  const navigate = useNavigate();

  const itemsPerPage = 25;
  const {
    data: customers,
    isPending,
    isFetching,
    error,
  } = useCustomers({
    limit: itemsPerPage,
    search: search,
    page: currentPage,
    start_date: startDate,
    end_date: endDate,
    sort_by: (sortBy || undefined) as ParamsCustomers["sort_by"],
    sort_order: orderBy || undefined,
  });
  const totalPages = customers?.meta.total_pages;
  const total = customers?.meta.total;

  const handleDetailCustomer = (id: string) => {
    navigate(`/admin/customers/${id}`);
  };

  return (
    <main className="w-full space-y-6">
      <HeaderMain
        title={"Customers"}
        subtitle={"Kelola data customer yang telah registrasi crisbro"}
      />

      {isPending ? (
        <p className="text-gray-500">Memuat customers...</p>
      ) : error ? (
        <p className="text-red-500">Gagal memuat customers: {error.message}</p>
      ) : (
        <GeneralTable
          dataPending={isFetching}
          sortBy={sortBy}
          orderBy={orderBy}
          setSortBy={setSortBy}
          setOrderBy={setOrderBy}
          canSelectDate={true}
          deleteBulk={false}
          tableTitle="Customers"
          dataHeads={[
            { key: "runchise_id", label: "Runchise Id", sortable: false },
            { key: "name", label: "Name" },
            { key: "phone_number", label: "Phone Number" },
            {
              key: "total_point",
              label: "Total Point",
              render: (row: any) => {
                const totalPoint = Number(row.total_point ?? 0);

                return (
                  <span
                    className={`inline-block py-1 px-3 rounded-full ${
                      totalPoint > 0
                        ? "text-orange bg-amber-100"
                        : "text-white bg-red-500"
                    } font-semibold`}
                  >
                    {String(totalPoint)}
                  </span>
                );
              },
            },
            {
              key: "available_point",
              label: "Available Point",
              render: (row: any) => {
                const availablePoint = Number(row.available_point ?? 0);

                return (
                  <span
                    className={`inline-block py-1 px-3 rounded-full ${
                      availablePoint > 0
                        ? "text-orange bg-amber-100"
                        : "text-white bg-red-500"
                    } font-semibold`}
                  >
                    {String(availablePoint)}
                  </span>
                );
              },
            },
            {
              key: "status",
              label: "Status",
              render: (row: any) => {
                const status = String(row.status ?? "");

                return (
                  <span
                    className={`inline-block py-1 px-3 rounded-full bg-orange/10 ${
                      status === "active" ? "text-success" : "text-red-500"
                    } font-semibold`}
                  >
                    {status}
                  </span>
                );
              },
            },
            {
              key: "created_at",
              label: "Created At",
              render: (row: any) => {
                const date = new Date(row.created_at ?? "");

                return (
                  <span>
                    {date.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                );
              },
            },
          ]}
          data={
            customers?.data?.map((customer) => ({
              ...customer,
              id: String(customer.customer_id),
            })) ?? []
          }
          searchPlaceholder="Search name or phone..."
          search={search}
          onSearchChange={setSearch}
          itemsPerPage={itemsPerPage}
          totalPages={totalPages ?? 0}
          total={total ?? 0}
          currentPage={customers?.meta.page ?? currentPage}
          setCurrentPage={setCurrentPage}
          canDelete={false}
          canUpdate={false}
          canShow={false}
          canDetail={true}
          handleDetail={handleDetailCustomer}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </main>
  );
};

export default AdminCustomers;
