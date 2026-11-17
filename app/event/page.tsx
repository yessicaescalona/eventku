
import type { Metadata } from "next";
import { ambilEvents } from "@/data/ambil";
import { rupiah } from "@/data/events";
import {
  PER_HALAMAN,
  bacaSaringan,
  saringEvents,
} from "@/data/saring";
import KontrolKatalog from "@/components/KontrolKatalog";
import KartuEvent from "@/components/KartuEvent";
import Halaman from "@/components/Halaman";

export const metadata: Metadata = {
  title: "Katalog Event",
};

export default async function Katalog({
  searchParams,
}: PageProps<"/event">) {
  // Membaca parameter URL
  const params = await searchParams;
  const s = bacaSaringan(params);

  // Mengambil dan menyaring data event
  const events = await ambilEvents();
  const tersusun = saringEvents(events, s);

  // Menghitung jumlah halaman
  const jumlahHalaman = Math.max(
    1,
    Math.ceil(tersusun.length / PER_HALAMAN)
  );

  // Memastikan halaman tidak melebihi jumlah halaman
  const hal = Math.max(
    1,
    Math.min(s.hal, jumlahHalaman)
  );

  // Mengambil event sesuai halaman
  const terlihat = tersusun.slice(
    (hal - 1) * PER_HALAMAN,
    hal * PER_HALAMAN
  );

  // Menyiapkan daftar kategori
  const daftarKategori = [
    "Semua",
    ...new Set(events.map((e) => e.kategori)),
  ];

  // Menghitung total sisa tiket
  const totalSisa = tersusun.reduce(
    (total, event) =>
      total + (event.kuota - event.terisi),
    0
  );

  // Menghitung rata-rata harga event
  const rataHarga =
    tersusun.length === 0
      ? 0
      : Math.round(
          tersusun.reduce(
            (total, event) => total + event.harga,
            0
          ) / tersusun.length
        );

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">
        Katalog Event
      </h1>

      {/* Formulir filter katalog */}
      <KontrolKatalog
        key={JSON.stringify(s)}
        s={s}
        daftarKategori={daftarKategori}
      />

      <p className="mb-1 text-sm text-slate-500">
        {tersusun.length} event ditemukan
      </p>

      <p className="mb-3 text-sm text-slate-500">
        Rata-rata harga {rupiah(rataHarga)}.
        Total sisa tiket {totalSisa}
      </p>

      {terlihat.length === 0 ? (
        <p className="text-slate-500">
          Tidak ada event yang cocok.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {terlihat.map((event) => (
            <KartuEvent
              key={event.id}
              event={event}
            />
          ))}
        </div>
      )}

      <Halaman
        s={s}
        hal={hal}
        jumlah={jumlahHalaman}
      />
    </div>
  );
}
