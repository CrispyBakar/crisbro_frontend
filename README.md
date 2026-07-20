  # Crisbar Frontend

  Frontend aplikasi loyalty & katalog Crisbar. Aplikasi ini digunakan untuk menampilkan halaman publik, katalog produk, lokasi outlet, login customer,
  dashboard poin customer, redeem menu, serta console admin/marketing.

  ## Tech Stack

  - React 19
  - TypeScript
  - Vite
  - TanStack Router
  - Tailwind CSS
  - Radix UI
  - Lucide React
  - Recharts
  - Vercel/Nitro preset

  ## Fitur Utama

  ### Public Pages

  - Home page dengan hero section dan carousel menu
  - Katalog produk Crisbar
  - Promo
  - Lokasi outlet dengan filter wilayah:
    - Semua
    - Bandung & Cimahi
    - Jabodeta
  - Halaman login customer
  - Halaman register/customer activation

  ### Customer

  - Dashboard customer
  - Membership card digital
  - Informasi poin tersedia
  - Progress reward
  - Riwayat poin
  - Menu redeem/tukar poin
  - Estimasi penukaran reward

  ### Admin & Marketing

  - Dashboard report
  - Manajemen customer
  - Manajemen redeem menu
  - Manajemen user admin
  - Activity log admin
  - Laporan redemption/outlet

  ## Struktur Folder

  ```txt
  src/
    assets/          # Gambar dan asset aplikasi
    components/      # Komponen reusable seperti Navbar, Footer, UI
    hooks/           # Custom hooks
    lib/             # Helper API, auth, utils
    routes/          # Halaman aplikasi berbasis TanStack Router
    styles.css       # Global style dan design system

  ## Environment Variable

  Frontend memakai base URL API dari environment variable berikut:

  VITE_API_BASE_URL=http://localhost:5000/api

  Jika tidak diisi, aplikasi akan memakai default:

  /api

  Saat development, request /api diproxy ke backend lokal:

  http://localhost:5000

  Konfigurasi proxy ada di vite.config.ts.

  ## Instalasi

  npm install

  ## Menjalankan Development Server

  npm run dev

  Default Vite biasanya berjalan di:

  http://localhost:5173

  Pastikan backend juga berjalan agar fitur API seperti login, katalog, lokasi, dashboard, dan admin dapat digunakan.

  ## Build Production

  npm run build

  ## Preview Build

  npm run preview

  ## Lint

  npm run lint

  ## Format Code

  npm run format

  ## Script yang Tersedia

  {
    "dev": "vite dev",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier --write ."
  }

  ## Routing Utama

   Route         Deskripsi
  ━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━━━━━
   /             Home page
  ────────────  ───────────────────────────
   /katalog      Katalog produk
  ────────────  ───────────────────────────
   /promo        Promo
  ────────────  ───────────────────────────
   /lokasi       Daftar lokasi outlet
  ────────────  ───────────────────────────
   /login        Login customer
  ────────────  ───────────────────────────
   /register     Register customer
  ────────────  ───────────────────────────
   /dashboard    Dashboard customer
  ────────────  ───────────────────────────
   /menu         Menu redeem poin
  ────────────  ───────────────────────────
   /estimasi     Estimasi penukaran reward
  ────────────  ───────────────────────────
   /admin        Console admin
  ────────────  ───────────────────────────
   /marketing    Console marketing

  ## API

  Helper API berada di:

  src/lib/api.ts

  Base URL API ditentukan dari:

  VITE_API_BASE_URL || "/api"

  Contoh penggunaan:

  apiUrl("/locations")
  akan menghasilkan:

  /api/locations

  ## Auth

  Helper auth berada di:

  src/lib/auth.ts

  Aplikasi menyimpan dan membaca data login customer/admin untuk kebutuhan dashboard, menu redeem, admin console, dan marketing console.

  ## Deployment

  Project dikonfigurasi untuk output Vercel melalui Nitro preset di vite.config.ts.

  Build production:

  npm run build

  Output build akan diarahkan ke folder Vercel output sesuai konfigurasi:

  .vercel/output

  ## Catatan Development

  - Gunakan Node.js versi modern yang kompatibel dengan Vite 7.
  - Pastikan backend berjalan di http://localhost:5000 saat development lokal.
  - Jangan mengubah plugin Vite bawaan dari @lovable.dev/vite-tanstack-config kecuali benar-benar diperlukan, karena konfigurasi tersebut sudah mencakup
    React, TanStack, Tailwind, alias path, env injection, dan preset deployment.
