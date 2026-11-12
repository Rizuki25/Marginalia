# Marginalia

Pelacak bacaan pribadi: catat progres halaman setiap hari, simpan kutipan, dan jaga kebiasaan membaca. Antarmuka bahasa Indonesia, mengikuti PRD di `PRD.md`.

## Fitur

- **Dashboard**: buku yang sedang dibaca, statistik rentetan/harian/mingguan, grafik 14 hari, kutipan pilihan.
- **Koleksi buku**: empat rak (sedang dibaca, ingin dibaca, selesai, berhenti), rating, ulasan, sampul, hapus buku.
- **Pencarian buku**: dialog tambah buku mencari metadata dari Google Books, dialihkan otomatis ke Open Library saat kuota Google habis. Penulis, total halaman, genre, dan URL sampul terisi otomatis.
- **Riwayat harian** (`/logs`): kalender bulanan dengan tinggi batang per hari, ringkasan bulan, dan daftar catatan per hari yang bisa diubah atau dihapus.
- **Kutipan** (`/quotes`): galeri dengan pencarian, filter buku/tag, favorit, dan unduh kartu kutipan sebagai PNG.
- **Target membaca**: target buku tahunan dan halaman per hari, terhubung ke statistik dashboard.
- **Tema terang/gelap**: ikut sistem secara bawaan, bisa dipilih manual, diterapkan sebelum paint.

## Menjalankan

```bash
npm install
cp .env.example .env.local   # isi kredensial Supabase
npm run dev
```

Buka `http://localhost:3000`.

Tanpa kredensial Supabase, aplikasi berjalan dalam mode demo memakai berkas JSON di `.data/` (folder ini diabaikan git). Mode demo tidak untuk produksi.

## Environment

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | untuk mode Supabase | URL proyek Supabase. Kosong berarti mode demo. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | untuk mode Supabase | Anon key publik. |
| `GOOGLE_BOOKS_API_KEY` | tidak | Kuota pencarian Google Books lebih longgar. Tanpa ini tetap jalan. |

## Database

Migrasi ada di `supabase/migrations/` dan menjalankan:

```bash
supabase db push
```

Skema mengikuti bagian 5 `PRD.md`: `users`, `books`, `reading_logs`, `quotes`, `tags`, `quote_tags`, `reading_goals`, dengan Row Level Security aktif di semua tabel. Sampul buku disimpan di bucket Storage `book-covers`.

## Tumpukan

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Base UI + shadcn, Supabase (Postgres, Auth, Storage).

## Struktur

```
src/app/            rute App Router, termasuk (app) untuk shell ber-sidebar
src/components/     ui, shell, dashboard, books, quotes, logs, wild
src/lib/            data access, server actions, supabase, helper
supabase/migrations skema Postgres dan bucket Storage
```

## Skrip

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm start` | Jalankan hasil build |
| `npm run lint` | ESLint |

Belum ada test otomatis; verifikasi dilakukan manual lewat browser.
