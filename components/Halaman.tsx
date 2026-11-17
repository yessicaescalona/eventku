
import Link from "next/link";
import {
  alamatHalaman,
  type Saringan,
} from "@/data/saring";

type Props = {
  s: Saringan;
  hal: number;
  jumlah: number;
};

export default function Halaman({
  s,
  hal,
  jumlah,
}: Props) {
  // Jika hanya ada satu halaman, pagination tidak ditampilkan
  if (jumlah <= 1) return null;

  // Membuat daftar nomor halaman
  const nomor = Array.from(
    { length: jumlah },
    (_, i) => i + 1
  );

  return (
    <nav
      aria-label="Navigasi halaman katalog"
      className="mt-6 flex flex-wrap items-center gap-3"
    >
      {/* Tombol sebelumnya */}
      {hal > 1 && (
        <Link
          href={alamatHalaman(s, hal - 1)}
          className="text-gray-600 hover:text-blue-600"
        >
          « Sebelumnya
        </Link>
      )}

      {/* Nomor halaman */}
      {nomor.map((n) => (
        <Link
          key={n}
          href={alamatHalaman(s, n)}
          aria-current={n === hal ? "page" : undefined}
          className={
            n === hal
              ? "font-bold text-blue-600"
              : "text-gray-600 hover:text-blue-600"
          }
        >
          {n}
        </Link>
      ))}

      {/* Tombol berikutnya */}
      {hal < jumlah && (
        <Link
          href={alamatHalaman(s, hal + 1)}
          className="text-gray-600 hover:text-blue-600"
        >
          Berikutnya »
        </Link>
      )}
    </nav>
  );
}
