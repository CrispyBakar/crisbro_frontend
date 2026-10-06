import { Link } from "react-router";

type SectionHeaderProps = {
  title: string;
  subtitle: string;
  endpoint: string;
};

const SectionHeader = ({ title, subtitle, endpoint }: SectionHeaderProps) => {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-extrabold leading-tight text-chocolate">
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
      </div>
      <Link
        to={endpoint}
        className="shrink-0 text-xs font-semibold text-berry-red"
      >
        Lihat semua
      </Link>
    </div>
  );
};

export default SectionHeader;
