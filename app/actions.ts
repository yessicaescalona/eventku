"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { ambilEvent } from "@/data/ambil";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type HasilPesan = {
  berhasil: boolean;
  pesan: string;
  galat: {
    nama?: string;
    email?: string;
    jumlah?: string;
  };
  isian: {
    nama: string;
    email: string;
  };
};

// Menyimpan pesanan tiket
export async function pesanTiket(
  _sebelum: HasilPesan,
  formData: FormData
): Promise<HasilPesan> {
  const eventId = Number(formData.get("eventId"));
  const nama = String(formData.get("nama") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const jumlah = Number(formData.get("jumlah"));

  const isian = { nama, email };

  const event = await ambilEvent(eventId);

  if (!event) {
    return {
      berhasil: false,
      pesan: "Event tidak ditemukan.",
      galat: {},
      isian,
    };
  }

  const sisa = event.kuota - event.terisi;
  const galat: HasilPesan["galat"] = {};

  // Validasi nama
  if (nama.length < 3) {
    galat.nama = "Nama minimal 3 huruf.";
  } else if (nama.length > 40) {
    galat.nama = "Nama maksimal 40 huruf.";
  }

  // Validasi email
  if (!email.includes("@")) {
    galat.email = "Email harus memuat tanda @.";
  }

  // Validasi jumlah tiket
  if (!Number.isInteger(jumlah) || jumlah < 1) {
    galat.jumlah = "Jumlah tiket minimal 1.";
  } else if (jumlah > 5) {
    galat.jumlah = "Maksimal 5 tiket per pesanan.";
  } else if (jumlah > sisa) {
    galat.jumlah = `Sisa tiket hanya ${sisa}.`;
  }

  if (Object.keys(galat).length > 0) {
    return {
      berhasil: false,
      pesan: "Periksa lagi isian yang merah.",
      galat,
      isian,
    };
  }

  // Memperbarui kuota dengan pemeriksaan nilai terisi
  const { data: kuotaBerubah, error: galatKuota } =
    await supabaseAdmin
      .from("events")
      .update({
        terisi: event.terisi + jumlah,
      })
      .eq("id", eventId)
      .eq("terisi", event.terisi)
      .select();

  if (galatKuota) {
    return {
      berhasil: false,
      pesan: "Gagal memperbarui kuota. Coba lagi.",
      galat: {},
      isian,
    };
  }

  // Jika tidak ada baris yang berubah, kuota sudah berubah
  if (!kuotaBerubah || kuotaBerubah.length === 0) {
    return {
      berhasil: false,
      pesan: "Tiket baru saja berubah, coba lagi.",
      galat: {},
      isian,
    };
  }

  // Menyimpan pesanan setelah kuota berhasil diperbarui
  const { data: baru, error } = await supabaseAdmin
    .from("pesanan")
    .insert({
      event_id: eventId,
      nama,
      email,
      jumlah,
      total: event.harga * jumlah,
    })
    .select("nomor")
    .single();

  if (error) {
    // Mengembalikan kuota jika penyimpanan pesanan gagal
    await supabaseAdmin
      .from("events")
      .update({
        terisi: event.terisi,
      })
      .eq("id", eventId)
      .eq("terisi", event.terisi + jumlah);

    return {
      berhasil: false,
      pesan: "Pesanan gagal disimpan. Coba lagi.",
      galat: {},
      isian,
    };
  }

  // Menyimpan nama pemesan dalam cookie
  const toples = await cookies();

  toples.set("nama", nama, {
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath("/event");
  revalidatePath(`/event/${eventId}`);
  revalidatePath("/pesanan");

  return {
    berhasil: true,
    pesan: `Pesanan #${baru.nomor} tersimpan: ${jumlah} tiket untuk ${nama}.`,
    galat: {},
    isian: { nama, email },
  };
}

// Membatalkan pesanan tiket
export async function batalkanPesanan(formData: FormData) {
  const nomor = Number(formData.get("nomor"));
  const namaSaya = (await cookies()).get("nama")?.value;

  if (!Number.isInteger(nomor) || !namaSaya) {
    return;
  }

  const { data: batal, error } = await supabaseAdmin
    .from("pesanan")
    .delete()
    .eq("nomor", nomor)
    .eq("nama", namaSaya)
    .select()
    .maybeSingle();

  if (error || !batal) {
    return;
  }

  const event = await ambilEvent(batal.event_id);

  if (event) {
    await supabaseAdmin
      .from("events")
      .update({
        terisi: Math.max(0, event.terisi - batal.jumlah),
      })
      .eq("id", batal.event_id);
  }

  revalidatePath("/event");
  revalidatePath(`/event/${batal.event_id}`);
  revalidatePath("/pesanan");
}