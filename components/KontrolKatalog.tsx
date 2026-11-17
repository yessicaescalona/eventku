import type { Saringan } from "@/data/saring";

type Props = {
  s?: Saringan;
  daftarKategori: string[];
};

export default function KontrolKatalog({
  s,
  daftarKategori,
}: Props) {
  const filter = s ?? {
    cari: "",
    kategori: "Semua",
    urut: "tanggal",
    sisa: false,
    max: null,
  };

  return (
    <form
      action="/event"
      method="GET"
      className="mb-4 flex flex-wrap items-center gap-3"
    >
      <input
        type="text"
        name="cari"
        defaultValue={filter.cari}
        placeholder="Cari event ..."
        className="rounded border bg-white px-3 py-2"
      />

      <select
        name="kategori"
        defaultValue={filter.kategori}
        className="rounded border bg-white px-3 py-2"
      >
        {daftarKategori.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>

      <select
        name="urut"
        defaultValue={filter.urut}
        className="rounded border bg-white px-3 py-2"
      >
        <option value="tanggal">Tanggal terdekat</option>
        <option value="murah">Harga termurah</option>
        <option value="mahal">Harga termahal</option>
        <option value="nama">Nama A-Z</option>
      </select>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="sisa"
          value="1"
          defaultChecked={filter.sisa}
        />
        Hanya yang masih ada tiket
      </label>

      <input
        type="number"
        name="max"
        min="0"
        defaultValue={filter.max ?? ""}
        placeholder="Harga maksimal"
        className="w-40 rounded border bg-white px-3 py-2"
      />

      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-white"
      >
        Terapkan
      </button>
    </form>
  );
}