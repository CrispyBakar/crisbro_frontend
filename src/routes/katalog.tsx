// src/routes/katalog.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/katalog")({
  head: () => ({
    meta: [
      { title: "Katalog Produk — Crisbar" },
      { name: "description", content: "Semua produk Crisbar tersedia di sini." },
    ],
  }),
  component: KatalogPage,
});

type Product = {
  id: number;
  name: string;
  description: string | null;
  sell_price: number;
  image_url: string | null;
  category: string;
  category_id: number | null;
};

type Category = {
  id: number;
  name: string;
  total_products: number;
};

const API_BASE = "/api";
const VISIBLE_LIMIT = 8;
// Maksimal jumlah card/menu yang ditampilkan per halaman grid.
const PAGE_SIZE = 9;

function KatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Fetch categories dan products secara paralel
    Promise.all([
      fetch(`${API_BASE}/catalog/products/categories`).then((r) => r.json()),
      fetch(`${API_BASE}/catalog/products`).then((r) => r.json()),
    ])
      .then(([cats, prods]) => {
        setCategories(cats);
        setProducts(prods);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const visibleCategories = showAllCategories ? categories : categories.slice(0, VISIBLE_LIMIT);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCategoryId === null || p.category_id === activeCategoryId;
      const matchSearch =
        search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, activeCategoryId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Setiap kali filter (kategori/pencarian) berubah, kembali ke halaman 1
  // supaya tidak terjebak di halaman yang sudah tidak ada datanya.
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategoryId, search]);

  // Jaga-jaga kalau currentPage melebihi totalPages (misal data berkurang).
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const activeCategory = categories.find((c) => c.id === activeCategoryId);

  const goToPage = (page: number) => {
    const clamped = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(clamped);
    // Scroll halus ke atas grid produk saat pindah halaman
    document.getElementById("katalog-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Bangun daftar nomor halaman dengan ellipsis agar tidak terlalu panjang.
  const pageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];
    const maxButtons = 5;

    if (totalPages <= maxButtons + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) {
      start = 2;
      end = 4;
    } else if (currentPage >= totalPages - 2) {
      start = totalPages - 3;
      end = totalPages - 1;
    }

    if (start > 2) pages.push("ellipsis");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("ellipsis");

    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  return (
    <main className="px-4 mt-10">
      <section className="mx-auto max-w-6xl text-center mb-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-secondary-foreground shadow-[var(--shadow-pop)]">
          🛍️ Katalog Produk
        </span>
        <h1 className="mt-4 text-5xl md:text-6xl font-black tracking-tight">
          Menu <span className="text-primary">Crisbar</span>
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Semua produk segar kami, langsung dari dapur ke mejamu.
        </p>
      </section>

      {!loading && !error && (
        <section className="mx-auto max-w-6xl mb-8 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari produk atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-full border border-border bg-card text-sm font-medium shadow-[var(--shadow-soft)] focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter kategori */}
          <div className="rounded-3xl bg-card border border-border p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-muted-foreground">
                Kategori <span className="text-foreground">({categories.length})</span>
              </p>
              {activeCategoryId !== null && (
                <button
                  onClick={() => setActiveCategoryId(null)}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Reset filter
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Tombol Semua */}
              <button
                onClick={() => setActiveCategoryId(null)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${
                  activeCategoryId === null
                    ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-pop)]"
                    : "bg-background border-border hover:bg-secondary"
                }`}
              >
                Semua
              </button>

              {visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(activeCategoryId === cat.id ? null : cat.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${
                    activeCategoryId === cat.id
                      ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-pop)]"
                      : "bg-secondary border-secondary-foreground/20 hover:bg-secondary/70 text-secondary-foreground"
                  }`}
                >
                  {cat.name}
                  <span className={`ml-1.5 text-xs font-normal opacity-70`}>
                    {cat.total_products}
                  </span>
                </button>
              ))}

              {/* Tombol expand/collapse */}
              {categories.length > VISIBLE_LIMIT && (
                <button
                  onClick={() => setShowAllCategories((v) => !v)}
                  className="px-4 py-1.5 rounded-full text-sm font-bold border border-border bg-background hover:bg-secondary transition-all flex items-center gap-1"
                >
                  {showAllCategories ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" /> Tutup
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" />+{categories.length - VISIBLE_LIMIT}{" "}
                      lainnya
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Info filter aktif */}
      {(activeCategoryId !== null || search) && !loading && !error && (
        <div className="mx-auto max-w-6xl mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span>Menampilkan</span>
          <span className="font-bold text-foreground">{filtered.length} produk</span>
          {activeCategory && (
            <>
              <span>dalam</span>
              <span className="font-bold text-primary">{activeCategory.name}</span>
            </>
          )}
          {search && (
            <>
              <span>untuk pencarian</span>
              <span className="font-bold text-primary">"{search}"</span>
            </>
          )}
        </div>
      )}

      {loading && <p className="text-center text-muted-foreground mt-10">Memuat produk...</p>}
      {error && <p className="text-center text-destructive mt-10">{error}</p>}

      <section
        id="katalog-grid"
        className="mx-auto max-w-6xl grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {paginated.map((p) => (
          <article
            key={p.id}
            className="group rounded-3xl bg-card border border-border overflow-hidden shadow-[var(--shadow-soft)] hover:-translate-y-1 transition-transform flex flex-col"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-5xl">🍽️</div>
              )}
              <Badge className="absolute top-3 left-3 rounded-full bg-card text-primary font-bold shadow-[var(--shadow-pop)] border border-border">
                {p.category}
              </Badge>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-xl font-extrabold mb-1.5">{p.name}</h3>
              {p.description && (
                <p className="text-muted-foreground text-sm mb-4 flex-1 line-clamp-2">
                  {p.description}
                </p>
              )}
              <p className="text-2xl font-black text-primary mt-auto">
                Rp {p.sell_price.toLocaleString("id-ID")}
              </p>
            </div>
          </article>
        ))}
      </section>

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center mt-12 space-y-2">
          <p className="text-4xl">🔍</p>
          <p className="text-muted-foreground font-semibold">Tidak ada produk yang cocok.</p>
          <button
            onClick={() => {
              setActiveCategoryId(null);
              setSearch("");
            }}
            className="text-sm text-primary font-bold hover:underline"
          >
            Reset semua filter
          </button>
        </div>
      )}

      {/* Pagination — hanya tampil kalau total produk hasil filter > PAGE_SIZE */}
      {!loading && !error && filtered.length > PAGE_SIZE && (
        <nav
          aria-label="Navigasi halaman katalog"
          className="mx-auto max-w-6xl mt-10 flex items-center justify-center gap-2"
        >
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Halaman sebelumnya"
            className="h-10 w-10 grid place-items-center rounded-full border border-border bg-card hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-card"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pageNumbers.map((p, idx) =>
            p === "ellipsis" ? (
              <span
                key={`ellipsis-${idx}`}
                className="h-10 w-10 grid place-items-center text-sm text-muted-foreground"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => goToPage(p)}
                aria-current={p === currentPage ? "page" : undefined}
                className={`h-10 w-10 grid place-items-center rounded-full text-sm font-bold transition-all border ${
                  p === currentPage
                    ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-pop)]"
                    : "bg-card border-border hover:bg-secondary"
                }`}
              >
                {p}
              </button>
            ),
          )}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Halaman berikutnya"
            className="h-10 w-10 grid place-items-center rounded-full border border-border bg-card hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-card"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}

      {!loading && !error && filtered.length > PAGE_SIZE && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          Halaman {currentPage} dari {totalPages} · {filtered.length} produk total
        </p>
      )}
    </main>
  );
}
