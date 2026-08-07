# Perbaikan Latensi Logout

## Sebelumnya

`logout()` menunggu `POST /api/logout` selesai sebelum menghapus `localStorage`,
memperbarui state React, dan melakukan navigasi. Endpoint server mencabut sesi
melalui database, sehingga cold start atau latency database membuat tombol
Keluar terlihat macet.

## Sesudah perubahan

Logout normal sekarang optimistic:

1. State lokal dibersihkan dan event `auth-change` dipancarkan segera.
2. UI dapat langsung menutup menu dan menavigasi ke halaman publik.
3. Request pencabutan sesi tetap dikirim di background dengan `credentials:
   include` dan `keepalive: true`.

`logout-all` tetap menunggu server karena operasi tersebut memang meminta
konfirmasi pencabutan semua perangkat.

## Output dan keamanan

Pengguna langsung dianggap logout di browser tanpa menunggu database. Sesi
server aktif dicabut oleh request background; jika jaringan gagal, sesi tetap
dibatasi TTL server dan cookie lokal sudah dihapus. Tidak ada token yang
disimpan di JavaScript.

## Verifikasi

Build frontend dengan:

```powershell
npm run build
```

Ukur dari klik Keluar sampai navigasi; waktu UI tidak lagi bergantung pada
latency `POST /api/logout`. Periksa Network tab untuk memastikan request logout
memiliki `credentials` dan `keepalive` tetap dikirim.
