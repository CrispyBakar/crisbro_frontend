import HeaderMain from "@/components/HeaderMain";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  useLoyaltyProducts,
  useSyncLoyaltyProducts,
} from "@/hooks/use-loyalty-products";
import { Search } from "lucide-react";
import { useState } from "react";
import imageFallback from "../../assets/ProductImageFallback.png";

const AdminProductsLoyalty = () => {
  usePageTitle("Produk Loyalty");

  const itemsPerPage = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState<string>("");

  const {
    mutate: syncLoyalty,
    isSuccess: successSync,
    isPending: pendingSync,
    error: errorSync,
  } = useSyncLoyaltyProducts();

  const {
    data: loyaltyProducts,
    isPending: pendingProducts,
    error: errorProducts,
  } = useLoyaltyProducts({
    take: itemsPerPage,
    skip: (currentPage - 1) * itemsPerPage,
    query: search,
  });

  const totalPages = loyaltyProducts?.total_page;
  const total = loyaltyProducts?.total;
  const products = loyaltyProducts?.loyalty_products ?? [];
  const page = Math.max(1, Math.min(currentPage, totalPages ?? 1));

  return (
    <main className="w-full space-y-6">
      <HeaderMain
        handleAction={syncLoyalty}
        isLoading={pendingSync}
        btnTitle={"Sync Loyalty Products"}
        title={"Loyalty Products"}
        subtitle={"Data produk yang ditambahkan ke program loyalty"}
      />

      {successSync ? (
        <p className="text-success">Berhasil sinkronisasi produk loyalty.</p>
      ) : errorSync ? (
        <p className="text-red-500">
          Gagal sinkronisasi produk loyalty: {errorSync.message}
        </p>
      ) : (
        <></>
      )}

      <div className="w-full flex justify-start items-center gap-3">
        <div className="flex gap-2 justify-start items-center relative rounded-xl border border-gray-200 p-2">
          <Search size={14} />
          <input
            type="text"
            className="w-full outline-none h-full text-sm"
            placeholder={"Search product name..."}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="relative">
          <select className="w-full p-2 border border-gray-100 shadow-sm text-xs rounded-xl max-w-xs">
            <option value="all">All Locations</option>
          </select>
        </div>
      </div>

      {/* Cards */}
      {pendingProducts ? (
        <p className="text-gray-500">Memuat produk loyalty...</p>
      ) : errorProducts ? (
        <p className="text-red-500">
          Gagal memuat produk loyalty: {errorProducts.message}
        </p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">Belum ada produk loyalty.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product.loyalty_product_id}
                className="rounded-xl border border-border bg-white overflow-hidden shadow-sm"
              >
                <div className="w-full aspect-square overflow-hidden bg-cream">
                  <img
                    src={
                      product.product_image_url
                        ? product.product_image_url
                        : imageFallback
                    }
                    alt={product.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 space-y-2">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-chocolate text-sm leading-snug line-clamp-2">
                      {product.product_name}
                    </h3>
                    <span className="text-xs text-muted">{`#${product.product_sku}`}</span>
                  </div>
                  <span className="inline-block py-1 px-3 rounded-full bg-orange/10 text-orange font-semibold text-xs">
                    {`${product.point_needed.toLocaleString("id-ID")} poin`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="w-full flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {`Showing ${(page - 1) * itemsPerPage + 1} to ${Math.min(
                page * itemsPerPage,
                total ?? 0,
              )} of ${total ?? 0} products`}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(page - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs rounded-lg border border-gray-200 disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: totalPages ?? 0 }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`px-3 py-1 text-xs rounded-lg border ${
                      pageNumber === page
                        ? "bg-orange text-white border-orange"
                        : "border-gray-200"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ),
              )}
              <button
                onClick={() => setCurrentPage(Math.min(page + 1, totalPages ?? 1))}
                disabled={page >= (totalPages ?? 1)}
                className="px-3 py-1 text-xs rounded-lg border border-gray-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default AdminProductsLoyalty;
