# M-11 (MEDIUM) — Modal tanpa focus trap / focus-on-open / Escape

Status: **Fixed**
File terdampak: `src/features/admin/AdminPage.tsx` (`MobileCrudDialog`, `ConfirmDeleteDialog`), `src/components/ui/dialog.tsx` (baru)

## 1. Sebelum perbaikan

Kedua dialog ditulis manual dengan `role="dialog"`/`role="alertdialog"`
dan `aria-modal="true"` yang secara ATRIBUT sudah benar, tapi **tanpa
satu pun perilaku** di baliknya:

```tsx
// MobileCrudDialog (ringkas)
<div className="fixed inset-0 ..." onClick={closeDialog} role="presentation">
  <section role="dialog" aria-modal="true" aria-labelledby="mobile-crud-title"
            onClick={(e) => e.stopPropagation()}>
    <button onClick={closeDialog} aria-label="Tutup form">
      <X />
    </button>
    {children}
  </section>
</div>
```

**Masalah:**

1. **Tidak ada focus trap.** Menekan Tab berulang kali membawa fokus
   keluar dari dialog ke konten di belakang overlay (nav bar, tombol
   lain di halaman).
2. **Tidak ada pemindahan fokus saat dibuka.** Fokus tetap di mana pun
   ia berada sebelumnya (biasanya tombol yang baru diklik untuk membuka
   dialog), bukan berpindah ke dalam dialog.
3. **Tidak ada pengembalian fokus saat ditutup.** Setelah dialog
   ditutup, fokus tidak dikembalikan ke elemen pemicu.
4. **Tidak ada handler `Escape`.** Satu-satunya cara menutup lewat
   keyboard adalah men-Tab ke tombol X lalu menekan Enter/Space.

Kedua dialog dipakai luas di halaman admin (form tambah/edit di mobile,
konfirmasi hapus di semua tab CRUD).

## 2. Perbaikan

Dibungkus `@radix-ui/react-dialog` (sudah jadi dependency,
`^1.1.15`) lewat wrapper baru `src/components/ui/dialog.tsx` bergaya
shadcn/ui — bukan menulis ulang focus trap/Escape secara manual, sesuai
rekomendasi laporan ("atau pakai Radix Dialog").

### 2.1 `src/components/ui/dialog.tsx` (baru)

Primitive dasar (`Dialog`, `DialogPortal`, `DialogOverlay`,
`DialogContent`, `DialogTitle`, `DialogDescription`, `DialogClose`),
styling minimal (posisi, z-index, animasi-ready) — detail visual
spesifik tiap dialog (rounded-2xl vs rounded-xl, ukuran, dst) tetap
ditentukan oleh masing-masing pemanggil lewat `className`, sama seperti
pola `select.tsx` di perbaikan M-10.

### 2.2 `MobileCrudDialog` dan `ConfirmDeleteDialog`

Kontrak prop dipertahankan identik dengan versi lama. Radix Dialog
menyediakan bawaan lewat `FocusScope` + `DismissableLayer` internal:
focus trap, pemindahan fokus ke dalam dialog saat dibuka
(`onOpenAutoFocus`), dan Escape untuk menutup (`onEscapeKeyDown`). Guard
`saving` (dialog tidak boleh ditutup selagi proses simpan/hapus
berjalan) dipindah ke `onOpenChange` + `onEscapeKeyDown`/`onInteractOutside`.

`ConfirmDeleteDialog` mempertahankan `role="alertdialog"` yang sudah
benar sejak versi lama lewat override prop eksplisit pada
`DialogContent` (Radix meneruskan prop yang di-spread ke elemen DOM,
sehingga override role ini sah dan terverifikasi lewat accessibility
tree saat pengujian).

### 2.3 Temuan penting saat pengujian: restorasi fokus default Radix tidak cukup

Dokumentasi Radix menyebut fokus dikembalikan otomatis ke elemen pemicu
saat dialog ditutup — tapi mekanisme itu paling andal saat dipakai
bersama `Dialog.Trigger`. Kedua dialog di file ini dibuka dari **banyak
tombol yang tersebar** (tiap baris tabel punya tombol Edit/Hapus
sendiri) lewat state eksternal (`activeMobileForm`/`confirmDialog`),
bukan dibungkus satu `Dialog.Trigger`.

**Diuji langsung di browser sungguhan** (bukan asumsi dari dokumentasi):
menutup dialog lewat Escape maupun klik tombol X membuat fokus jatuh ke
`<body>`, bukan kembali ke tombol yang tadi diklik untuk membuka dialog.
Ditelusuri lewat `onCloseAutoFocus`/`onOpenAutoFocus` diagnostik: `onCloseAutoFocus`
bahkan tidak selalu terpanggil (lewat jalur Escape), dan saat terpanggil
(lewat klik tombol X), `document.activeElement` sudah keburu `<body>`
sebelum restorasi Radix sempat jalan.

**Perbaikan:** hook kecil `useDialogCloseFocusRestore(open)` yang
mengingat elemen yang fokus **tepat sebelum** dialog dibuka (lewat
`useEffect` yang mengamati `open`), lalu mengembalikannya secara
eksplisit lewat `onCloseAutoFocus` (dengan `event.preventDefault()` untuk
mencegah default Radix yang tidak konsisten):

```tsx
function useDialogCloseFocusRestore(open: boolean) {
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) lastFocusedRef.current = document.activeElement as HTMLElement | null;
  }, [open]);

  return useCallback((event: Event) => {
    event.preventDefault();
    lastFocusedRef.current?.focus();
  }, []);
}
```

Dipakai di kedua dialog lewat `onCloseAutoFocus={restoreFocusOnClose}`.
Tanpa langkah pengujian empiris ini, perbaikan akan terlihat "selesai"
di atas kertas (Radix terpasang, ARIA benar) padahal salah satu dari
empat perilaku yang diminta laporan (pengembalian fokus) sebenarnya
masih belum benar.

## 3. Verifikasi

Diuji lewat route sementara tanpa-auth (`/temp-m11-dialog-check`, salinan
identik kedua komponen + hook, termasuk `Select` dari M-10 di dalam
`MobileCrudDialog` untuk membuktikan primitive Radix yang bersarang tetap
kompatibel) di browser sungguhan, dihapus total setelah pengujian selesai.

### Focus-on-open

```
Klik "Buka form (MobileCrudDialog)"
-> document.activeElement: <button aria-label="Tutup form"> (elemen fokus pertama di dalam dialog)
```

### Focus trap (Tab tidak bisa "bocor" ke konten di belakang overlay)

```
Urutan Tab di dalam MobileCrudDialog: Tutup form -> input Nama -> Select Role (combobox) -> Simpan -> (wrap) Tutup form
Tab ke-5 (lebih dari jumlah elemen fokusable di dialog): kembali ke "Tutup form", insideDialog: true
-- TIDAK PERNAH lompat ke link navigasi atau tombol "Buka konfirmasi hapus" di belakang overlay
```

### Escape menutup + mengembalikan fokus (setelah perbaikan useDialogCloseFocusRestore)

```
SEBELUM perbaikan hook: Escape -> document.activeElement: <body>              (SALAH)
SESUDAH perbaikan hook: Escape -> document.activeElement: "Buka form (MobileCrudDialog)"  (BENAR)
```

Diuji juga untuk jalur tutup via klik tombol X — hasil sama, fokus
kembali ke tombol pemicu yang benar.

### `ConfirmDeleteDialog` — role alertdialog, focus trap, aksi konfirmasi

```
accessibility tree: alertdialog [ref_34]  <- role="alertdialog" berhasil di-override dari default Radix "dialog"
Focus-on-open: <button aria-label="Tutup dialog konfirmasi">
Tab x3 (Tutup -> Batal -> Ya hapus -> wrap): kembali ke "Tutup dialog konfirmasi", insideAlertDialog: true
Escape -> fokus kembali ke "Buka konfirmasi hapus" (tombol pemicu)
Klik "Ya, hapus" -> confirmed=true (alur onConfirm sungguhan tetap berjalan benar)
```

Route uji dan seluruh perubahan `routeTree.gen.ts` yang sempat
ter-generate untuknya dihapus total setelah pengujian; `git diff` pada
`routeTree.gen.ts` kosong (kembali ke state semula).

### TypeScript & ESLint

```
$ npx tsc --noEmit -p tsconfig.json | wc -l
22   # sama persis dengan baseline pra-existing

$ npx eslint src/features/admin/AdminPage.tsx src/components/ui/dialog.tsx
4 warning pra-existing (tidak terkait perubahan ini), 0 error
```

### Diff summary

```
 src/features/admin/AdminPage.tsx | 245 +++++++++++++++++++++++++--------------
 1 file changed, 158 insertions(+), 87 deletions(-)

 src/components/ui/dialog.tsx (baru, 66 baris)
```

## 4. Yang TIDAK berubah

- Kontrak prop kedua dialog (`open`/`title`/`saving`/`children`/`onClose`
  untuk `MobileCrudDialog`; `dialog`/`saving`/`onCancel`/`onConfirm`
  untuk `ConfirmDeleteDialog`) — identik dengan versi lama.
- Perilaku `saving` mencegah dialog ditutup selama proses simpan/hapus
  berjalan — dipertahankan lewat guard yang sama, hanya dipindah ke
  `onOpenChange`/`onEscapeKeyDown`/`onInteractOutside`.
- Styling visual — dibuat menyamai tampilan lama (warna, radius, shadow)
  memakai token Tailwind yang sama.
- `role="alertdialog"` pada `ConfirmDeleteDialog` — sudah benar sejak
  versi lama, dipertahankan lewat override eksplisit.
- Tidak ada perubahan backend/API — murni perbaikan komponen UI.
