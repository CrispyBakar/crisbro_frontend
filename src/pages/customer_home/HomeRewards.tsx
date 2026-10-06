import { Link } from "react-router";
import crisbarCoin from "@/assets/crisbar_coin.png";
import productImageFallback from "@/assets/ProductImageFallback.png";
import { useFeaturedRewardMenus } from "@/hooks/use-loyalty-products";
import SectionHeader from "./SectionHeader";

const cardClass =
  "w-40 shrink-0 snap-start overflow-hidden rounded-2xl shadow-sm bg-white mb-2";

const messageClass = "mt-4 text-sm text-muted";

// Menu reward pilihan di beranda; daftar lengkapnya ada di halaman Menu Redeem
const HomeRewards = () => {
  const { data: menus, isPending, isError } = useFeaturedRewardMenus();

  const renderContent = () => {
    if (isPending) {
      return (
        <div
          role="status"
          aria-label="Memuat menu reward"
          className="mt-4 flex animate-pulse gap-3 overflow-hidden"
        >
          {[0, 1, 2].map((item) => (
            <div key={item} className={cardClass}>
              <div className="aspect-square w-full bg-input" />
              <div className="flex flex-col gap-2 p-3">
                <div className="h-4 w-full rounded-full bg-input" />
                <div className="h-4 w-1/2 rounded-full bg-input" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (isError) {
      return <p className={messageClass}>Menu reward belum bisa dimuat.</p>;
    }

    if (menus.length === 0) {
      return <p className={messageClass}>Belum ada menu reward.</p>;
    }

    return (
      // -mx-4 + px-4: daftar bisa digeser sampai ke tepi layar
      <div className="-mx-4 mt-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
        {menus.map((menu) => (
          <Link
            to="/redeem"
            key={menu.loyalty_product_id}
            className={cardClass}
          >
            <img
              src={menu.product_image_url ?? productImageFallback}
              alt=""
              loading="lazy"
              decoding="async"
              onError={(event) => {
                // Lepas handler dulu supaya tidak berulang kalau fallback ikut gagal
                event.currentTarget.onerror = null;
                event.currentTarget.src = productImageFallback;
              }}
              className="aspect-square w-full object-cover"
            />
            <div className="p-3">
              <h3 className="line-clamp-2 text-sm font-bold leading-snug text-chocolate">
                {menu.product_name}
              </h3>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                <img src={crisbarCoin} alt="" className="h-4 w-4" />
                <span className="text-sm font-extrabold text-chocolate">
                  {menu.point_needed.toLocaleString("id-ID")}
                </span>
                Poin
              </p>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <section>
      <SectionHeader
        title="Menu spesial reward buat Crisbro"
        subtitle="Tukarkan poin kamu sekarang"
        endpoint="/redeem"
      />
      {renderContent()}
    </section>
  );
};

export default HomeRewards;
