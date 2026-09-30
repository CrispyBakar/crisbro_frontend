import GeneralTable, { type SortOrder } from "@/components/GeneralTable";
import HeaderMain from "@/components/HeaderMain";
import { useProducts, useSyncProducts } from "@/hooks/use-products";
import type { GetProductsProps } from "@/services/products";
import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import imageFallback from "../../assets/ProductImageFallback.png";

const AdminProducts = () => {
  usePageTitle("Produk");

  const itemsPerPage = 25;
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");
  const [orderBy, setOrderBy] = useState<SortOrder | "">("");
  const [status, setStatus] = useState<string>("");

  const {
    mutate: generateProducts,
    isSuccess: successGenerate,
    isPending: pendingGenerate,
    error: errorGenerate,
  } = useSyncProducts();

  const {
    data: products,
    isPending: pendingProducts,
    error: errorProducts,
  } = useProducts({
    take: itemsPerPage,
    skip: (currentPage - 1) * itemsPerPage,
    search: search,
    sort_by: (sortBy || undefined) as GetProductsProps["sort_by"],
    order_by: orderBy || undefined,
    status: (status || undefined) as GetProductsProps["status"],
  });

  const totalPages = products?.total_page;
  const total = products?.total;

  return (
    <main className="w-full space-y-6">
      <HeaderMain
        handleAction={generateProducts}
        isLoading={pendingGenerate}
        btnTitle={"Sync Runchise Products"}
        title={"Products"}
        subtitle={"Data produk yang telah sinkron dengan runchise."}
      />

      {successGenerate ? (
        <p className="text-success">Berhasil sinkronisasi data produk.</p>
      ) : errorGenerate ? (
        <p className="text-red-500">
          Gagala sinkronisasi data produk: {errorGenerate.message}
        </p>
      ) : (
        <></>
      )}

      {/* Table */}
      {pendingProducts ? (
        <p className="text-gray-500">Memuat produk...</p>
      ) : errorProducts ? (
        <p className="text-red-500">
          Gagal memuat produk: {errorProducts.message}
        </p>
      ) : (
        <GeneralTable
          canSelectDate={false}
          deleteBulk={false}
          tableTitle="Products"
          dataHeads={[
            { key: "runchise_id", label: "Runchise Id" },
            {
              key: "name",
              label: "Name and SKU",
              render: ({ name, sku, image_url }) => (
                <div className="flex flex-1 items-center gap-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img
                      src={image_url ? String(image_url) : imageFallback}
                      alt="img_product"
                      className=" w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span>{String(name)}</span>
                    <span className="text-black font-semibold text-xs">{`#${String(sku)}`}</span>
                  </div>
                </div>
              ),
            },
            {
              key: "product_category",
              label: "Category",
              render: ({ product_category }) => (
                <span>{product_category ? String(product_category) : "-"}</span>
              ),
            },
            {
              key: "internal_price",
              label: "Internal Price",
              render: ({ internal_price }) => (
                <span>{internal_price ? String(internal_price) : "-"}</span>
              ),
            },
            { key: "sell_price", label: "Sell Price" },
            {
              key: "status",
              label: "Status",
              render: ({ status }) => (
                <span
                  className={`inline-block py-1 px-3 rounded-full bg-orange/10 ${String(status) === "activated" ? "text-success" : "text-red-500"} font-semibold`}
                >
                  {String(status)}
                </span>
              ),
            },
          ]}
          data={
            products?.products.map((product) => ({
              ...product,
              id: String(product.product_id),
            })) ?? []
          }
          searchPlaceholder="Search product name..."
          search={search}
          onSearchChange={setSearch}
          itemsPerPage={itemsPerPage}
          totalPages={totalPages ?? 0}
          total={total ?? 0}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          sortBy={sortBy}
          orderBy={orderBy}
          setSortBy={setSortBy}
          setOrderBy={setOrderBy}
          filterLabel="Status"
          filterOptions={[
            { label: "Activated", value: "activated" },
            { label: "Deactivated", value: "deactivated" },
          ]}
          filterValue={status}
          onFilterChange={setStatus}
          detailHiddenKeys={["sub_brands", "id"]}
          handleDelete={() => {}}
          canDelete={false}
          canUpdate={false}
          canShow={true}
          canDetail={false}
        />
      )}
    </main>
  );
};

export default AdminProducts;
