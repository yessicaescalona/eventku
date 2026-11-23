
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { pastikanAdmin } from "@/lib/sesi";

export type HasilEvent = {
  pesan: string;
  galat: Partial<
    Record<
      "judul" | "kategori" | "tanggal" | "lokasi" | "harga" | "kuota",
      string
    >
  >;
  isian: Record<string, string>;
};

function segarkan(id?: number) {
  revalidatePath("/");
  revalidatePath("/event");
  revalidatePath("/admin");

  if (id) {
    revalidatePath(`/event/${id}`);
  }
}

function tanggalValid(tanggal: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    return false;
  }

  const [tahun, bulan, hari] = tanggal.split("-").map(Number);

  const tanggalDibuat = new Date(
    Date.UTC(tahun, bulan - 1, hari)
  );

  return (
    tanggalDibuat.getUTCFullYear() === tahun &&
    tanggalDibuat.getUTCMonth() === bulan - 1 &&
    tanggalDibuat.getUTCDate() === hari
  );
}

function tanggalDepan(tanggal: string) {
  const sekarang = new Date();

  const hariIni = [
    sekarang.getFullYear(),
    String(sekarang.getMonth() + 1).padStart(2, "0"),
    String(sekarang.getDate()).padStart(2, "0"),
  ].join("-");

  return tanggal >= hariIni;
}

export async function simpanEvent(
  _sebelum: HasilEvent,
  formData: FormData
): Promise<HasilEvent> {
  await pastikanAdmin();

  const idTeks = String(formData.get("id") ?? "");
  const id = idTeks ? Number(idTeks) : null;

  const isian = {
    id: idTeks,
    judul: String(formData.get("judul") ?? "").trim(),
    kategori: String(formData.get("kategori") ?? "").trim(),
    tanggal: String(formData.get("tanggal") ?? "").trim(),
    lokasi: String(formData.get("lokasi") ?? "").trim(),
    harga: String(formData.get("harga") ?? "").trim(),
    kuota: String(formData.get("kuota") ?? "").trim(),
    gambar: String(formData.get("gambar") ?? "").trim(),
  };

  const harga = Number(isian.harga);
  const kuota = Number(isian.kuota);

  const galat: HasilEvent["galat"] = {};

  // Validasi judul
  if (
    isian.judul.length < 3 ||
    isian.judul.length > 80
  ) {
    galat.judul = "Judul 3 sampai 80 huruf.";
  }

  // Validasi kategori
  if (
    isian.kategori.length < 3 ||
    isian.kategori.length > 20
  ) {
    galat.kategori = "Kategori 3 sampai 20 huruf.";
  }

  // Validasi tanggal
  if (!tanggalValid(isian.tanggal)) {
    galat.tanggal = "Tanggal tidak valid.";
  } else if (!tanggalDepan(isian.tanggal)) {
    galat.tanggal = "Tanggal harus hari ini atau tanggal depan.";
  }

  // Validasi lokasi
  if (
    isian.lokasi.length < 2 ||
    isian.lokasi.length > 100
  ) {
    galat.lokasi = "Lokasi 2 sampai 100 huruf.";
  }

  // Validasi harga
  if (
    isian.harga === "" ||
    !Number.isInteger(harga) ||
    harga < 1 ||
    harga > 1000000
  ) {
    galat.harga = "Harga 1 sampai 1.000.000.";
  }

  // Validasi kuota
  if (
    isian.kuota === "" ||
    !Number.isInteger(kuota) ||
    kuota < 1 ||
    kuota > 1000
  ) {
    galat.kuota = "Kuota 1 sampai 1000.";
  }

  // Validasi ID
  if (
    idTeks &&
    (!Number.isInteger(id) || id === null || id <= 0)
  ) {
    return {
      pesan: "ID event tidak valid.",
      galat: {},
      isian,
    };
  }

  // Kuota tidak boleh di bawah tiket yang sudah terisi
  if (id !== null && Number.isInteger(id) && !galat.kuota) {
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("terisi")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return {
        pesan: "Event tidak ditemukan.",
        galat: {},
        isian,
      };
    }

    if (kuota < data.terisi) {
      galat.kuota = `Kuota tidak boleh di bawah tiket terisi (${data.terisi}).`;
    }
  }

  // Mengembalikan pesan jika ada validasi gagal
  if (Object.keys(galat).length > 0) {
    return {
      pesan: "Periksa lagi isian yang merah.",
      galat,
      isian,
    };
  }

  const baris = {
    judul: isian.judul,
    kategori: isian.kategori,
    tanggal: isian.tanggal,
    lokasi: isian.lokasi,
    harga,
    kuota,
    gambar: isian.gambar || null,
  };

  // Menambah atau memperbarui event
  const { error } =
    id === null
      ? await supabaseAdmin
          .from("events")
          .insert(baris)
      : await supabaseAdmin
          .from("events")
          .update(baris)
          .eq("id", id);

  if (error) {
    return {
      pesan: "Gagal menyimpan: " + error.message,
      galat: {},
      isian,
    };
  }

  segarkan(id ?? undefined);

  redirect(
    "/admin?info=" +
      encodeURIComponent(
        id === null
          ? "Event ditambahkan."
          : "Perubahan disimpan."
      )
  );
}

export async function hapusEvent(formData: FormData) {
  await pastikanAdmin();

  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    redirect("/admin");
  }

  const { error } = await supabaseAdmin
    .from("events")
    .delete()
    .eq("id", id);

  if (error) {
    const pesan =
      error.code === "23503"
        ? "Event ini sudah punya pesanan, jadi tidak bisa dihapus."
        : "Gagal menghapus: " + error.message;

    redirect(
      "/admin?galat=" + encodeURIComponent(pesan)
    );
  }

  segarkan(id);

  redirect(
    "/admin?info=" + encodeURIComponent("Event dihapus.")
  );
}
