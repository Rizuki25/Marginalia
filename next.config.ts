import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  // The floating dev badge is a build artefact, not part of the product, so it
  // is off: the app should look the same while developing and after release.
  devIndicators: false,
  experimental: {
    staleTimes: {
      // Halaman dashboard, koleksi dan quotes selalu dinamis (data per user).
      // 30 detik berarti pindah menu bolak-balik dilayani dari cache client,
      // tanpa request ke server. Mutasi tetap memanggil revalidatePath, jadi
      // angka ini hanya memengaruhi data yang tidak berubah.
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
