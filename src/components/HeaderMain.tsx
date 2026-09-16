import { EllipsisIcon } from "lucide-react";

type HeaderMainProps = {
  title: string;
  subtitle: string;
  isLoading?: boolean;
  btnTitle?: string;
  handleAction?: () => void;
};

const HeaderMain = ({
  title,
  subtitle,
  isLoading,
  btnTitle,
  handleAction,
}: HeaderMainProps) => {
  return (
    <div className="flex w-full justify-between items-center">
      <div>
        <h2 className="text-3xl font-semibold text-chocolate">{title}</h2>
        <span className="text-light text-xs text-gray-500">{subtitle}</span>
      </div>

      <div className={`${btnTitle ? "block" : "hidden"}`}>
        <button
          onClick={() => handleAction?.()}
          className="py-2 px-8 rounded-3xl bg-orange text-white font-semibold shadow-sm shadow-amber-600 active:bg-orange-500 cursor-pointer"
        >
          {!isLoading ? (
            btnTitle
          ) : (
            <EllipsisIcon
              size={20}
              color="white"
              className="[&>circle]:animate-bounce [&>circle:nth-child(2)]:[animation-delay:150ms] [&>circle:nth-child(3)]:[animation-delay:300ms]"
            />
          )}
        </button>
      </div>
    </div>
  );
};

export default HeaderMain;
