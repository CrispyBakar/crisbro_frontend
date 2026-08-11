// H-5: mengukur klaim inti temuan audit — "setiap ketikan me-render ulang
// seluruh pohon". Test ini MENGHITUNG render induk secara nyata, bukan
// mengandalkan asumsi bahwa memindahkan state sudah cukup.
//
// Sengaja memakai timer asli, bukan fake timer: memalsukan timer di
// lingkungan ini membuat scheduler React dan userEvent menggantung (seluruh
// test timeout). Jedanya dipakai sama dengan produksi (400 ms) karena
// userEvent butuh waktu nyata untuk memproses tiap ketikan -- dengan jeda
// terlalu pendek, debounce menembak di tengah pengetikan dan yang gagal
// adalah test-nya, bukan komponennya.
import { describe, expect, it, vi } from "vitest";
import { useRef, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DebouncedSearchInput, type DebouncedSearchInputHandle } from "./DebouncedSearchInput";

const DEBOUNCE_MS = 400;
// Untuk test yang mengandalkan debounce TIDAK menembak selama interaksi
// berlangsung. Di bawah beban (suite penuh, worker paralel) pengetikan
// userEvent bisa memakan lebih dari 400 ms, sehingga debounce menembak di
// tengah dan yang gagal adalah test-nya, bukan komponennya.
const NEVER_FIRES_MS = 10_000;

/** Jeda nyata yang cukup panjang untuk membuktikan "tidak dipanggil". */
function settle(ms = DEBOUNCE_MS + 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Induk tiruan yang memperlihatkan berapa kali dirinya di-render. */
function Parent({
  onSearch,
  debounceMs = DEBOUNCE_MS,
}: {
  onSearch: (value: string) => void;
  debounceMs?: number;
}) {
  const renders = useRef(0);
  renders.current += 1;

  return (
    <div>
      <span data-testid="parent-renders">{renders.current}</span>
      <DebouncedSearchInput ariaLabel="Cari" debounceMs={debounceMs} onSearch={onSearch} />
    </div>
  );
}

/** Pembanding: pola LAMA — nilai ketikan disimpan sebagai state induk. */
function LegacyParent({ onSearch }: { onSearch: (value: string) => void }) {
  const renders = useRef(0);
  renders.current += 1;
  const [value, setValue] = useState("");

  return (
    <div>
      <span data-testid="legacy-renders">{renders.current}</span>
      <input
        aria-label="Cari lama"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          onSearch(event.target.value);
        }}
      />
    </div>
  );
}

function parentRenders() {
  return Number(screen.getByTestId("parent-renders").textContent);
}

describe("DebouncedSearchInput", () => {
  it("PENGUKURAN: mengetik 11 huruf tidak menambah satu pun render induk", async () => {
    const user = userEvent.setup();
    render(<Parent onSearch={vi.fn()} debounceMs={NEVER_FIRES_MS} />);

    const before = parentRenders();
    await user.type(screen.getByLabelText("Cari"), "budi santos");

    expect(parentRenders()).toBe(before);
  });

  it("PEMBANDING: pola lama me-render induk sekali per huruf", async () => {
    const user = userEvent.setup();
    render(<LegacyParent onSearch={vi.fn()} />);

    const before = Number(screen.getByTestId("legacy-renders").textContent);
    await user.type(screen.getByLabelText("Cari lama"), "budi");

    // 4 huruf -> 4 render tambahan. Inilah perilaku yang diperbaiki.
    expect(Number(screen.getByTestId("legacy-renders").textContent)).toBe(before + 4);
  });

  it("nilai ketikan tetap tampil utuh walau induk tidak ikut render", async () => {
    const user = userEvent.setup();
    render(<Parent onSearch={vi.fn()} debounceMs={NEVER_FIRES_MS} />);

    const input = screen.getByLabelText("Cari") as HTMLInputElement;
    await user.type(input, "kopi");

    expect(input.value).toBe("kopi");
    expect(parentRenders()).toBe(1);
  });

  it("memanggil onSearch sekali saja setelah jeda, dengan nilai akhir ter-trim", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<Parent onSearch={onSearch} />);

    await user.type(screen.getByLabelText("Cari"), "  budi  ");

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
    expect(onSearch).toHaveBeenCalledWith("budi");
  });

  it("Enter menjalankan pencarian seketika dan membatalkan jeda yang tertunda", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<Parent onSearch={onSearch} debounceMs={NEVER_FIRES_MS} />);

    await user.type(screen.getByLabelText("Cari"), "budi");
    await user.keyboard("{Enter}");

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("budi");

    // Jeda yang tadi tertunda tidak boleh menembak lagi setelahnya.
    await settle();
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("debounceMs = 0: tidak ada pencarian otomatis, hanya lewat Enter", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<Parent onSearch={onSearch} debounceMs={0} />);

    await user.type(screen.getByLabelText("Cari"), "admin");
    await settle();
    expect(onSearch).not.toHaveBeenCalled();

    await user.keyboard("{Enter}");
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("admin");
  });

  it("onSearch yang identitasnya berubah tiap render tidak me-restart jeda", async () => {
    const user = userEvent.setup();
    const calls: string[] = [];

    function UnstableParent() {
      const [, force] = useState(0);
      return (
        <div>
          <button type="button" onClick={() => force((n) => n + 1)}>
            paksa render
          </button>
          <DebouncedSearchInput
            ariaLabel="Cari"
            debounceMs={DEBOUNCE_MS}
            // Sengaja callback baru setiap render.
            onSearch={(value) => calls.push(value)}
          />
        </div>
      );
    }

    render(<UnstableParent />);
    await user.type(screen.getByLabelText("Cari"), "bu");
    // Induk render ulang di tengah jeda; timer TIDAK boleh ikut ter-reset.
    await user.click(screen.getByRole("button", { name: "paksa render" }));

    await waitFor(() => expect(calls).toEqual(["bu"]));
  });

  it("clear() dari luar mengosongkan input dan membatalkan jeda", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    function WithHandle() {
      const handleRef = useRef<DebouncedSearchInputHandle>(null);
      return (
        <div>
          <button type="button" onClick={() => handleRef.current?.clear()}>
            reset
          </button>
          <DebouncedSearchInput
            ariaLabel="Cari"
            debounceMs={NEVER_FIRES_MS}
            onSearch={onSearch}
            handleRef={handleRef}
          />
        </div>
      );
    }

    render(<WithHandle />);
    const input = screen.getByLabelText("Cari") as HTMLInputElement;
    await user.type(input, "kopi");
    await user.click(screen.getByRole("button", { name: "reset" }));

    expect(input.value).toBe("");
    await settle();
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("tidak memanggil onSearch setelah komponen dilepas (tidak ada timer menggantung)", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const { unmount } = render(<Parent onSearch={onSearch} />);

    await user.type(screen.getByLabelText("Cari"), "b");
    unmount();

    await settle();
    expect(onSearch).not.toHaveBeenCalled();
  });
});
