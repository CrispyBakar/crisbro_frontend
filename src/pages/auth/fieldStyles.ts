// Gaya kotak input yang dipakai bersama form auth customer dan OutletSelect
export const fieldBoxClass = (invalid = false) =>
  `flex h-12 items-center overflow-hidden rounded-xl border bg-white transition-colors focus-within:ring-3 has-[input:disabled]:bg-chocolate/5 ${
    invalid
      ? "border-berry-red focus-within:ring-berry-red/15"
      : "border-chocolate/15 focus-within:border-border/90 focus-within:ring-border/20"
  }`;

// text-base (16px) supaya Safari iOS tidak zoom saat input fokus
export const fieldInputClass =
  "h-full min-w-0 flex-1 bg-transparent px-3.5 text-base font-medium text-chocolate outline-none placeholder:font-normal placeholder:text-muted/45 disabled:cursor-not-allowed disabled:text-muted";
