import heroBanner from "@/assets/banners/hero_banner.png";
import crisbarLogo from "@/assets/logo-crisbar-spotlight.png";
import crisbarCoin from "@/assets/crisbar_coin.png";
import productImageFallback from "@/assets/ProductImageFallback.png";
import {
  ChevronRight,
  Coins,
  ExternalLink,
  Gift,
  MapPin,
  TicketPercent,
} from "lucide-react";
import { Link } from "react-router";
import { useCustomerProfile } from "@/hooks/use-customer-profile";

const quickActions = [
  { icon: Gift, label: "Tukar Poin", endpoint: "/redeem" },
  { icon: MapPin, label: "Cabang Outlet", endpoint: "/locations" },
  { icon: TicketPercent, label: "Voucher Saya", endpoint: "/vouchers" },
];

// Data sementara sampai tersambung ke API
const rewardMenus = [
  {
    id: 1,
    name: "Ayam Nashville + Butter Rice",
    description: "Ayam Nashville, butter rice, cheese sauce & spicy kale.",
    points: 10,
    image: productImageFallback,
  },
  {
    id: 2,
    name: "Ayam Nashville + Butter Rice",
    description: "Ayam Nashville, butter rice, cheese sauce & spicy kale.",
    points: 10,
    image: productImageFallback,
  },
];

const outlets = [
  {
    id: 1,
    city: "Bandung",
    name: "Antapani",
    address:
      "Jl. Subang No.59, Antapani Tengah, Kec. Antapani, Kota Bandung, Jawa Barat 40291",
  },
];

type SectionHeaderProps = {
  title: string;
  subtitle: string;
  endpoint: string;
};

const SectionHeader = ({ title, subtitle, endpoint }: SectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-chocolate">{title}</h2>
        <p className="text-xs text-chocolate">{subtitle}</p>
      </div>
      <Link
        to={endpoint}
        className="shrink-0 text-xs font-semibold text-berry-red"
      >
        Lihat lainnya
      </Link>
    </div>
  );
};

const CustomerHomePage = () => {
  const { data: user } = useCustomerProfile();
  const isLoggedIn = Boolean(user);
  const points = user?.customer?.available_point ?? 0;

  return (
    <div className="w-full">
      {/* aspect mengikuti rasio gambar banner (1290x900) supaya tidak terpotong */}
      <div className="relative w-full aspect-43/30">
        <img
          src={heroBanner}
          alt="Customer Home"
          className="w-full h-full object-cover"
        />
        <div className="absolute flex items-center gap-3 top-0 left-0 w-full px-4 pt-5">
          {/* Crisbar Logo */}
          <div className="bg-white rounded-full w-11 h-11 shrink-0 flex justify-center items-center">
            <img src={crisbarLogo} alt="Crisbar Logo" className="w-8 h-8" />
          </div>

          {/* Location */}
          <div className="min-w-0 bg-black/45 rounded-full px-3 py-2 text-sm font-semibold text-white flex items-center gap-1">
            <MapPin size={16} className="shrink-0 text-sunshine-yellow" />
            <span className="truncate">Crisbar Office</span>
          </div>

          {/* Notification Bell */}
          {/* <div className="bg-white rounded-full w-11 h-11 flex justify-center items-center">
            <Bell className="text-berry-red" />
          </div> */}
        </div>

        <div className="absolute bottom-0 inset-x-4 translate-y-1/2 px-4 max-[411px]:px-3 py-3 bg-white h-fixed rounded-3xl shadow-md flex flex-row items-center justify-start gap-2">
          <div className="shrink-0 max-[299px]:hidden">
            <img src={crisbarCoin} alt="Crisbar Coin" className="w-10 h-10" />
          </div>
          {isLoggedIn ? (
            <>
              <div className="min-w-0">
                {/* flex-wrap: badge turun ke bawah angka poin di layar sempit */}
                <div className="flex flex-wrap justify-start items-center gap-x-2 max-[389px]:pb-1">
                  <h4 className="font-extrabold text-2xl text-chocolate whitespace-nowrap">
                    {points.toLocaleString("id-ID")}{" "}
                    <span className="text-base font-bold">Poin</span>
                  </h4>
                  <div className="text-[10px] leading-none font-bold text-sunshine-yellow bg-chocolate rounded-full px-1.5 py-1 align-text-bottom whitespace-nowrap">
                    CRISBRO MEMBER
                  </div>
                </div>

                {/* Divider */}
                <div className="max-w-36 border-b-4 border-chocolate rounded-full" />

                {/* Text */}
                <p className="text-[12px] text-chocolate font-bold max-w-64">
                  Hadiah menarik menanti kamu!
                </p>
              </div>
              <div className="ml-auto shrink-0">
                <button className="bg-sunshine-yellow text-chocolate font-bold text-sm px-4 max-[411px]:px-3 py-2 rounded-full flex items-center gap-0.5">
                  Tukar
                  <ChevronRight
                    className="text-chocolate font-bold"
                    size={16}
                  />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Guest: poin disembunyikan sampai login */}
              <div className="min-w-0">
                <h4 className="font-extrabold text-base leading-tight text-chocolate">
                  Login dulu, yuk!
                </h4>
                <p className="text-[12px] text-chocolate font-bold">
                  Masuk untuk melihat poin kamu
                </p>
              </div>
              <div className="ml-auto shrink-0">
                <Link
                  to="/login"
                  className="bg-sunshine-yellow text-chocolate font-bold text-sm px-4 max-[411px]:px-3 py-2 rounded-full flex items-center gap-0.5"
                >
                  Login
                  <ChevronRight className="text-chocolate font-bold" size={16} />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="px-4 mt-20 flex flex-col gap-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2 min-[390px]:gap-3">
          {quickActions.map(({ icon: Icon, label, endpoint }) => (
            <Link
              to={endpoint}
              key={label}
              className="bg-white border border-border rounded-3xl px-1 py-5 flex flex-col items-center gap-3"
            >
              <span className="bg-input rounded-xl w-11 h-11 flex justify-center items-center">
                <Icon size={22} className="text-berry-red" />
              </span>
              <span className="text-xs font-semibold leading-tight text-center text-muted">
                {label}
              </span>
            </Link>
          ))}
        </div>

        {/* Reward Menu */}
        <section>
          <SectionHeader
            title="Menu spesial reward buat crisbro"
            subtitle="Tukarkan poin kamu sekarang"
            endpoint="/redeem"
          />
          <div className="mt-4 flex flex-col gap-3">
            {rewardMenus.map((menu) => (
              <div
                key={menu.id}
                className="bg-white rounded-2xl shadow-md p-2 flex gap-3"
              >
                <img
                  src={menu.image}
                  alt={menu.name}
                  className="w-[27%] max-w-26 aspect-square shrink-0 self-start rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1 flex flex-col py-1 pr-1">
                  <h3 className="text-base font-extrabold leading-tight text-muted">
                    {menu.name}
                  </h3>
                  <p className="mt-0.5 text-[10px] text-muted/70 line-clamp-2">
                    {menu.description}
                  </p>
                  <div className="mt-auto pt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <div className="flex items-center gap-1.5">
                      <Coins size={18} className="text-orange" />
                      <span className="text-lg font-extrabold text-orange">
                        {menu.points}
                      </span>
                      <span className="text-xs font-bold text-muted/70">
                        Poin
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled
                      className="w-24 shrink-0 rounded-full bg-gray-300 px-3 py-1.5 text-[10px] font-bold leading-tight tracking-wide text-white"
                    >
                      Login untuk tukar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Outlets */}
        <section>
          <SectionHeader
            title="Makan dine in lebih nikmat"
            subtitle="Kunjungi outlet terdekat"
            endpoint="/locations"
          />
          <div className="mt-4 flex flex-col gap-3">
            {outlets.map((outlet) => (
              <div
                key={outlet.id}
                className="bg-white border border-border rounded-3xl p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="bg-sunshine-yellow rounded-xl w-9 h-9 shrink-0 flex justify-center items-center">
                    <MapPin size={18} className="text-berry-red" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-berry-red">
                      {outlet.city}
                    </p>
                    <h3 className="text-base font-extrabold leading-tight text-chocolate">
                      {outlet.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-muted">
                      {outlet.address}
                    </p>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(outlet.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-full border border-berry-red/20 bg-berry-red/10 py-2 text-xs font-bold text-berry-red"
                >
                  <MapPin size={14} />
                  Lihat di Maps
                  <ExternalLink size={12} />
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CustomerHomePage;
