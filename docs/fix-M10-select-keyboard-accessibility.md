# M-10 (MEDIUM) — Komponen Select kustom tidak bisa dipakai keyboard

Status: **Fixed**
File terdampak: `src/features/admin/AdminPage.tsx` (komponen `Select`), `src/components/ui/select.tsx` (baru)

## 1. Sebelum perbaikan

`Select` di `AdminPage.tsx` adalah dropdown buatan sendiri (bukan
primitive Radix, walau `@radix-ui/react-select` sudah lama jadi
dependency di `package.json`):

```tsx
// versi lama (ringkas)
<button
  onClick={() => setOpen((current) => !current)}
  aria-haspopup="listbox"
  aria-expanded={open}
>
  {selectedOption?.label ?? "Pilih opsi"}
  <ChevronDown ... />
</button>

{open && createPortal(
  <div role="listbox">
    {options.map((option) => (
      <button
        role="option"
        aria-selected={option.value === value}
        onMouseDown={(event) => {           // <- HANYA onMouseDown
          event.preventDefault();
          onChange(option.value);
          setOpen(false);
        }}
      >
        {option.label}
      </button>
    ))}
  </div>,
  document.body,
)}
```

**Masalah:**

1. **Opsi cuma menembak `onMouseDown`, tanpa `onClick`.** Native
   `<button>` yang difokus lalu ditekan Enter/Space memicu event `click`,
   bukan `mousedown` — jadi menekan Enter/Space pada opsi yang sedang
   fokus **tidak melakukan apa-apa**.
2. **Tidak ada navigasi panah.** Setelah dropdown terbuka, tidak ada
   `onKeyDown` yang menangani `ArrowDown`/`ArrowUp` untuk memindahkan
   fokus antar opsi.
3. **Tidak ada `Escape`** untuk membatalkan/menutup dropdown lewat
   keyboard.
4. **Tidak ada `aria-activedescendant`** atau roving focus — screen
   reader tidak tahu opsi mana yang sedang "disorot" saat navigasi.
5. **Tidak ada typeahead** (ketik huruf untuk lompat ke opsi yang cocok).

Hasilnya: pengguna keyboard/screen-reader bisa **membuka** dropdown
(tombol trigger-nya native button, bisa difokus lewat Tab dan dibuka lewat
Enter/Space karena `onClick` di trigger memang ada), tapi begitu terbuka,
**tidak bisa memilih opsi apa pun** — satu-satunya jalan keluar adalah klik
mouse atau menutup paksa lewat klik di luar area. Kontrol ini dipakai di
**12 tempat** di file yang sama (filter role, status, gender, outlet,
brand, email status, dst).

## 2. Perbaikan

Diganti jadi pembungkus tipis di atas primitive `@radix-ui/react-select`
(sudah jadi dependency, tinggal dipakai) — bukan menulis ulang penanganan
keyboard secara manual, sesuai rekomendasi laporan.

### 2.1 `src/components/ui/select.tsx` (baru)

Wrapper standar bergaya shadcn/ui di atas `SelectPrimitive` dari Radix
(`Root`, `Trigger`, `Content`, `Item`, dst), diberi styling Tailwind yang
menyamai tampilan lama (rounded-xl, h-11, warna border/primary yang
sama) — Radix menangani **seluruh** interaksi keyboard/ARIA bawaan:
navigasi panah, Home/End, Enter/Space untuk memilih, Escape untuk
membatalkan, typeahead, focus management, dan role `combobox`/`option`
yang benar sesuai WAI-ARIA APG.

### 2.2 `AdminPage.tsx` — kontrak prop dipertahankan persis

```tsx
const SELECT_EMPTY_VALUE = "__crisbar_select_empty__";

function Select({ label, value, onChange, options, required = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}) {
  return (
    <label className="mb-3 block text-sm font-bold text-foreground">
      <span className="mb-1.5 block text-xs font-black uppercase text-muted-foreground">
        <RequiredLabel label={label} required={required} />
      </span>
      <SelectRoot
        value={value === "" ? SELECT_EMPTY_VALUE : value}
        onValueChange={(next) => onChange(next === SELECT_EMPTY_VALUE ? "" : next)}
      >
        <SelectTrigger aria-required={required}>
          <SelectValue placeholder="Pilih opsi" />
        </SelectTrigger>
        <SelectContent>
          {(options ?? []).map((option) => (
            <SelectItem
              key={option.value === "" ? SELECT_EMPTY_VALUE : option.value}
              value={option.value === "" ? SELECT_EMPTY_VALUE : option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </label>
  );
}
```

Prop `label`/`value`/`onChange`/`options`/`required` **sengaja dibuat
identik** dengan versi lama, sehingga ke-12 pemanggil di file ini tidak
perlu diubah sama sekali — diverifikasi lewat `grep` semua penggunaan
`<Select` sebelum menulis kode, memastikan tidak ada prop lain (mis.
`placeholder`, `disabled`) yang terlewat.

**Kasus khusus yang ditemukan sebelum menulis kode:** filter "Outlet" di
tab transaksi penjualan memakai `{ value: "", label: "Semua outlet" }`
untuk berarti "tanpa filter". Radix `Select.Item` **tidak mengizinkan**
`value=""` (dipakai Radix sendiri sebagai penanda internal "belum ada
yang dipilih"). Dipetakan bolak-balik lewat `SELECT_EMPTY_VALUE` di dalam
wrapper — pemanggil di luar tetap bekerja dengan string kosong seperti
sebelumnya, tidak perlu tahu soal sentinel ini sama sekali.

Import `createPortal` dan `ChevronDown` (dari `lucide-react`) dihapus
karena sudah tidak dipakai di mana pun lagi setelah implementasi lama
diganti — diverifikasi lewat `grep` sebelum dihapus.

## 3. Verifikasi

Karena mengetes halaman admin sungguhan butuh login (kredensial
admin/marketing), dan **membuat akun atau memasukkan password untuk
login adalah tindakan yang tidak boleh saya lakukan sendiri**, pengujian
dilakukan lewat route sementara yang tidak butuh autentikasi
(`/temp-m10-select-check`, dihapus total setelah pengujian selesai) yang
me-render **wrapper `Select` yang identik** dengan yang ada di
`AdminPage.tsx` (primitive Radix yang sama, prop yang sama, termasuk
kasus sentinel value kosong). Ini membuktikan integrasi Radix Select yang
sesungguhnya di build/bundling proyek ini, bukan cuma potongan kode
terisolasi.

Dev server dijalankan sungguhan (`vite dev`), diuji lewat browser
sungguhan dengan interaksi keyboard nyata (bukan simulasi/asumsi dari
membaca kode):

### Navigasi panah + Enter untuk memilih (skenario utama yang dulu rusak)

```
Klik trigger "Role" (fokus + buka dropdown)
-> document.activeElement: <div role="option">Marketing</div> (data-state="checked")

Tekan ArrowDown
-> document.activeElement: <div role="option">Admin</div>

Tekan Enter
-> role=admin        (state ter-update, SEBELUMNYA tidak mungkin lewat keyboard)
-> ROLE_CHANGED admin (console log onChange benar-benar terpanggil)
-> dropdown tertutup
```

### Round-trip sentinel value kosong ("Semua outlet")

```
Trigger "Outlet" awal: outlet=""  (Semua outlet)
2x ArrowDown -> Enter  => outlet="binus"   (Binus, bukan sentinel mentah)
2x ArrowUp   -> Enter  => outlet=""        (kembali ke Semua outlet, benar)
```

### Escape membatalkan tanpa mengubah nilai + focus management

```
Trigger "Role" (nilai saat ini: admin), buka dropdown
ArrowUp (fokus pindah ke opsi "Marketing")
Tekan Escape
-> role=admin TETAP (bukan ter-set ke "marketing" -- Escape membatalkan, bukan memilih)
-> listboxOpen: false
-> document.activeElement kembali ke <button>Admin</button> (trigger)
   -- fokus dikembalikan otomatis ke trigger, sesuatu yang TIDAK ADA
      sama sekali di implementasi lama
```

### Semantik ARIA yang benar

Accessibility tree menunjukkan `combobox` pada trigger (bukan `button`
polos dengan `aria-haspopup` manual) dan `option` pada tiap item —
sesuai pola WAI-ARIA APG untuk select-only combobox, ditangani Radix
secara otomatis.

Route uji sementara dan seluruh perubahan pada `routeTree.gen.ts` yang
sempat ter-generate untuknya dihapus total setelah pengujian; `git diff`
pada `routeTree.gen.ts` kosong (kembali ke state semula).

### TypeScript check

Dibandingkan sebelum/sesudah untuk memastikan tidak ada error tipe baru:

```
$ npx tsc --noEmit -p tsconfig.json | wc -l
22   # (sama persis dengan baseline pra-existing sebelum perbaikan ini)
```

### Diff summary

```
 src/features/admin/AdminPage.tsx | 174 +++++++++++----------------------------
 1 file changed, 48 insertions(+), 126 deletions(-)

 src/components/ui/select.tsx (baru, 85 baris)
```

## 4. Yang TIDAK berubah

- Kontrak prop `Select` (`label`, `value`, `onChange`, `options`,
  `required`) — identik dengan versi lama, ke-12 pemanggil di
  `AdminPage.tsx` tidak disentuh.
- Styling visual — dibuat menyamai tampilan lama (warna, ukuran, radius,
  ikon chevron) memakai token Tailwind yang sama dengan komponen lain di
  proyek ini.
- Tidak ada perubahan di backend maupun endpoint API — murni perbaikan
  komponen UI di frontend.
- `@radix-ui/react-select` — tidak ada perubahan versi, sudah terpasang
  sejak sebelumnya di `package.json` (`^2.2.6`), sekarang baru benar-benar
  dipakai.
