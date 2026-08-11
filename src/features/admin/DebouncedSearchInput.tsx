import { memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

// H-5: Memindahkan state pencarian ke komponen lokal agar pengetikan tidak memicu re-render AdminPage dan tabel secara keseluruhan.

export type DebouncedSearchInputHandle = {
  /** Mengosongkan input dari luar tanpa mengangkat nilainya jadi state induk. */
  clear: () => void;
  /** Menjalankan pencarian dengan nilai saat ini (dipakai tombol "Cari"). */
  submit: () => void;
};

type Props = {
  /** Nilai awal saat pertama dipasang. Perubahan setelahnya diabaikan --
   *  input ini yang memegang kebenaran nilai ketikan, bukan induknya. */
  defaultValue?: string;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  /** 0 = tidak ada auto-search; pencarian hanya jalan saat Enter/submit. */
  debounceMs?: number;
  /** Dipanggil dengan nilai yang sudah di-trim. */
  onSearch: (value: string) => void;
  handleRef?: React.Ref<DebouncedSearchInputHandle>;
};

function DebouncedSearchInputView({
  defaultValue = "",
  placeholder,
  ariaLabel,
  className,
  debounceMs = 0,
  onSearch,
  handleRef,
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const timerRef = useRef<number | undefined>(undefined);

  // onSearch disimpan di ref supaya efek debounce di bawah tidak perlu
  // memasukkannya ke dependency. Tanpa ini, induk yang membuat ulang
  // callback-nya setiap render akan me-restart timer terus-menerus dan
  // pencarian tidak pernah jalan.
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  const cancelPending = useCallback(() => {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  useEffect(() => cancelPending, [cancelPending]);

  const runSearch = useCallback(
    (nextValue: string) => {
      cancelPending();
      onSearchRef.current(nextValue.trim());
    },
    [cancelPending],
  );

  // valueRef dipakai submit() agar handle-nya tidak perlu dibuat ulang setiap
  // huruf diketik -- membuat ulang handle akan menulis ke ref induk dan justru
  // memicu render yang ingin dihindari.
  const valueRef = useRef(value);
  valueRef.current = value;

  useImperativeHandle(
    handleRef,
    () => ({
      clear() {
        cancelPending();
        setValue("");
      },
      submit() {
        runSearch(valueRef.current);
      },
    }),
    [cancelPending, runSearch],
  );

  const handleChange = useCallback(
    (nextValue: string) => {
      setValue(nextValue);
      if (debounceMs <= 0) return;

      cancelPending();
      timerRef.current = window.setTimeout(() => {
        timerRef.current = undefined;
        onSearchRef.current(nextValue.trim());
      }, debounceMs);
    },
    [cancelPending, debounceMs],
  );

  return (
    <input
      value={value}
      aria-label={ariaLabel}
      placeholder={placeholder}
      className={className}
      onChange={(event) => handleChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        runSearch(value);
      }}
    />
  );
}

export const DebouncedSearchInput = memo(DebouncedSearchInputView);
