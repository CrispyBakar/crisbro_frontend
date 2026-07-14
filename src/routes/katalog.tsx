import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiUrl } from "@/lib/api";
import { ArrowUp, Search, X } from "lucide-react";

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

const SKELETON_COUNT = 9;

const CATEGORY_DISPLAY_ORDER = [
  "Best Seller Bundling",
  "Crisbarbar Whole Chicken",
  "Skin Lovers Squad",
  "Bundling Tea Series",
  "My Kisah Katsu <3",
  "#TeamHot",
  "Little Hero Crisbar",
  "Cocolove Stories 🫶🏻",
  "Paket Ayam Crisbar",
  "Cita Rasa Nusantara",
  "Paket Ayam Crisbee",
  "Smart Deal",
  "Keju Mozzarella Naikin Mood",
  "Balinese Series",
  "Paket Ayam Spicy",
  "Crisbar Korean Chicken",
  "Keju Salju Sensasi Baru",
  "It's DJ Time!!",
  "#TeamCool",
  "Teman Gawe",
  "Survival Kit",
  "Nasi Kulit",
  "Crisbar Coffe",
  "Mood Booster Drinks",
  "Snack & Sides",
  "Topping",
  "CMP",
];

const CATEGORY_DISPLAY_ORDER_MAP = new Map(
  CATEGORY_DISPLAY_ORDER.map((name, index) => [normalizeCategoryName(name), index]),
);

function normalizeCategoryName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function getCategoryDisplayOrder(name: string) {
  return CATEGORY_DISPLAY_ORDER_MAP.get(normalizeCategoryName(name)) ?? Number.MAX_SAFE_INTEGER;
}

type ProductGroup = {
  id: number | null;
  name: string;
  items: Product[];
};

async function fetchJsonArray<T>(
  url: string,
  label: string,
  isValidItem: (item: unknown) => item is T,
): Promise<T[]> {
  const response = await fetch(url);
  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new Error(`${label} mengembalikan data yang tidak valid`);
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : data && typeof data === "object" && "message" in data && typeof data.message === "string"
          ? data.message
          : `Gagal memuat ${label.toLowerCase()} (HTTP ${response.status})`;
    throw new Error(message);
  }

  if (!Array.isArray(data)) {
    throw new Error(`${label} mengembalikan format data yang tidak sesuai`);
  }

  if (!data.every(isValidItem)) {
    throw new Error(`${label} berisi data yang tidak sesuai`);
  }

  return data;
}

function isProduct(item: unknown): item is Product {
  if (!item || typeof item !== "object") return false;

  const product = item as Partial<Product>;
  return (
    Number.isFinite(product.id) &&
    typeof product.name === "string" &&
    (product.description === null || typeof product.description === "string") &&
    Number.isFinite(product.sell_price) &&
    (product.image_url === null || typeof product.image_url === "string") &&
    typeof product.category === "string" &&
    (product.category_id === null || Number.isFinite(product.category_id))
  );
}

function isCategory(item: unknown): item is Category {
  if (!item || typeof item !== "object") return false;

  const category = item as Partial<Category>;
  return (
    Number.isFinite(category.id) &&
    typeof category.name === "string" &&
    Number.isFinite(category.total_products)
  );
}

function KatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const categoryNavRef = useRef<HTMLDivElement | null>(null);
  const categorySectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    // Fetch categories dan products secara paralel
    Promise.all([
      fetchJsonArray(apiUrl("/catalog/products/categories"), "Kategori katalog", isCategory),
      fetchJsonArray(apiUrl("/catalog/products"), "Produk katalog", isProduct),
    ])
      .then(([cats, prods]) => {
        setCategories(cats);
        setProducts(prods);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [products, search]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const orderA = getCategoryDisplayOrder(a.name);
      const orderB = getCategoryDisplayOrder(b.name);

      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  }, [categories]);

  const groupedProducts = useMemo<ProductGroup[]>(() => {
    const categoryOrder = new Map(sortedCategories.map((category, index) => [category.id, index]));
    const groups = new Map<string, ProductGroup>();

    for (const product of filtered) {
      const key = String(product.category_id ?? "uncategorized");

      if (!groups.has(key)) {
        groups.set(key, {
          id: product.category_id,
          name: product.category || "Tanpa kategori",
          items: [],
        });
      }

      groups.get(key)?.items.push(product);
    }

    return Array.from(groups.values()).sort((a, b) => {
      const orderA = a.id === null ? Number.MAX_SAFE_INTEGER : categoryOrder.get(a.id);
      const orderB = b.id === null ? Number.MAX_SAFE_INTEGER : categoryOrder.get(b.id);

      if (orderA !== undefined && orderB !== undefined && orderA !== orderB) {
        return orderA - orderB;
      }

      if (orderA !== undefined && orderB === undefined) return -1;
      if (orderA === undefined && orderB !== undefined) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filtered, sortedCategories]);

  const categoryKey = (categoryId: number | null) => String(categoryId ?? "uncategorized");

  const scrollToCategory = (categoryId: number | null) => {
    setActiveCategoryId(categoryId);
    categorySectionRefs.current[categoryKey(categoryId)]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const scrollToCatalogStart = () => {
    setActiveCategoryId(null);
    document.getElementById("katalog-content")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const scrollToPageTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (loading || error || groupedProducts.length === 0) return;

    const updateActiveCategory = () => {
      const markerY = 180;
      let visibleCategoryId: number | null = null;

      for (const group of groupedProducts) {
        const section = categorySectionRefs.current[categoryKey(group.id)];
        if (!section) continue;

        const rect = section.getBoundingClientRect();
        if (rect.top <= markerY && rect.bottom > markerY) {
          visibleCategoryId = group.id;
          break;
        }
      }

      setActiveCategoryId(visibleCategoryId);
    };

    updateActiveCategory();
    window.addEventListener("scroll", updateActiveCategory, { passive: true });
    window.addEventListener("resize", updateActiveCategory);

    return () => {
      window.removeEventListener("scroll", updateActiveCategory);
      window.removeEventListener("resize", updateActiveCategory);
    };
  }, [error, groupedProducts, loading]);

  useEffect(() => {
    const categoryNav = categoryNavRef.current;
    const activeButton = categoryNav?.querySelector<HTMLButtonElement>(
      `[data-category-id="${categoryKey(activeCategoryId)}"]`,
    );

    if (categoryNav && activeButton) {
      const targetLeft =
        activeButton.offsetLeft - categoryNav.clientWidth / 2 + activeButton.clientWidth / 2;

      categoryNav.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: "smooth",
      });
    }
  }, [activeCategoryId]);

  useEffect(() => {
    const updateBackToTopVisibility = () => {
      setShowBackToTop(window.scrollY > 600);
    };

    updateBackToTopVisibility();
    window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateBackToTopVisibility);
    };
  }, []);

  return (
    <main className="px-4 mt-10">
      <section className="mx-auto max-w-6xl text-center mb-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-secondary-foreground shadow-(--shadow-pop)">
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
        <section className="sticky top-4 z-20 mx-auto max-w-6xl mb-8 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari produk atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-full border border-border bg-card text-sm font-medium shadow-(--shadow-soft) focus:outline-none focus:ring-2 focus:ring-ring"
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
          <div className="rounded-xl bg-card/95 border border-border p-4 shadow-(--shadow-soft) backdrop-blur">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-muted-foreground">
                Kategori <span className="text-foreground">({categories.length})</span>
              </p>
              {activeCategoryId !== null && (
                <button
                  onClick={scrollToCatalogStart}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Ke awal
                </button>
              )}
            </div>

            <div ref={categoryNavRef} className="-mx-1 overflow-x-auto px-1 pb-1">
              <div className="flex w-max min-w-full items-center gap-2">
                {/* Tombol Semua */}
                <button
                  data-category-id={categoryKey(null)}
                  onClick={scrollToCatalogStart}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${
                    activeCategoryId === null
                      ? "bg-primary text-primary-foreground border-primary shadow-(--shadow-pop)"
                      : "bg-background border-border hover:bg-secondary"
                  }`}
                >
                  Semua
                </button>

                {sortedCategories.map((cat) => (
                  <button
                    key={cat.id}
                    data-category-id={categoryKey(cat.id)}
                    onClick={() => scrollToCategory(cat.id)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${
                      activeCategoryId === cat.id
                        ? "bg-primary text-primary-foreground border-primary shadow-(--shadow-pop)"
                        : "bg-secondary border-secondary-foreground/20 hover:bg-secondary/70 text-secondary-foreground"
                    }`}
                  >
                    {cat.name}
                    <span className={`ml-1.5 text-xs font-normal opacity-70`}>
                      {cat.total_products}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {loading && <KatalogSkeleton />}
      {error && <p className="text-center text-destructive mt-10">{error}</p>}

      <div id="katalog-content" className="mx-auto max-w-6xl space-y-12">
        {groupedProducts.map((group) => (
          <section
            key={categoryKey(group.id)}
            ref={(element) => {
              categorySectionRefs.current[categoryKey(group.id)] = element;
            }}
            className="scroll-mt-32"
          >
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-primary">Kategori</p>
                <h2 className="text-2xl font-black tracking-tight">{group.name}</h2>
              </div>
              <p className="shrink-0 text-sm font-bold text-muted-foreground">
                {group.items.length} produk
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
              {group.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ))}
      </div>

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

      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToPageTop}
          aria-label="Kembali ke atas"
          className="fixed bottom-5 right-5 z-30 grid h-11 w-11 place-items-center rounded-full border border-primary bg-primary text-primary-foreground shadow-(--shadow-pop) transition-all hover:-translate-y-0.5 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:bottom-6 sm:right-6 sm:h-12 sm:w-12"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </main>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-(--shadow-soft) transition-transform hover:-translate-y-1">
      <div className="relative aspect-4/3 overflow-hidden bg-secondary">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-5xl">🍽️</div>
        )}
        <Badge className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full border border-primary/20 bg-card/95 px-2 py-0.5 text-[10px] font-bold text-primary shadow-(--shadow-pop) backdrop-blur-sm hover:bg-card hover:text-primary sm:left-3 sm:top-3 sm:px-2.5 sm:text-xs">
          {product.category}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-6">
        <h3 className="mb-1 line-clamp-2 text-sm font-extrabold leading-tight sm:mb-1.5 sm:text-xl">
          {product.name}
        </h3>
        {product.description && (
          <p className="mb-3 line-clamp-2 flex-1 text-xs text-muted-foreground sm:mb-4 sm:text-sm">
            {product.description}
          </p>
        )}
        <p className="mt-auto text-base font-black text-primary sm:text-2xl">
          Rp {product.sell_price.toLocaleString("id-ID")}
        </p>
      </div>
    </article>
  );
}

function KatalogSkeleton() {
  return (
    <>
      <section className="mx-auto max-w-6xl mb-8 space-y-4">
        <Skeleton className="h-12 w-full rounded-full" />
        <div className="rounded-xl border border-border bg-card p-4 shadow-(--shadow-soft)">
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-(--shadow-soft)"
          >
            <Skeleton className="aspect-4/3 w-full rounded-none" />
            <div className="p-3 sm:p-6">
              <Skeleton className="mb-3 h-4 w-3/4 sm:h-6" />
              <Skeleton className="mb-2 h-3 w-full sm:h-4" />
              <Skeleton className="mb-4 h-3 w-2/3 sm:mb-5 sm:h-4" />
              <Skeleton className="h-6 w-24 sm:h-8 sm:w-32" />
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
