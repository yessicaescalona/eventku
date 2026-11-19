import { cache } from "react";
import type { Event } from "@/data/events";
import type { Pesanan } from "@/data/pesanan";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Mengambil semua data event
export async function ambilEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("tanggal");

  if (error) {
    throw new Error("Gagal memuat event: " + error.message);
  }

  return (data ?? []) as Event[];
}

// Mengambil satu event berdasarkan ID
export const ambilEvent = cache(async (id: number): Promise<Event | null> => {
  if (!Number.isInteger(id)) return null;

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Gagal memuat event: " + error.message);
  }

  return data as Event | null;
});

// Mengambil event dengan kategori yang sama
export async function ambilTerkait(event: Event): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("kategori", event.kategori)
    .neq("id", event.id)
    .order("tanggal");

  if (error) {
    throw new Error("Gagal memuat event terkait: " + error.message);
  }

  return (data ?? []) as Event[];
}

// Menghitung jumlah pesanan dan total tiket
export async function hitungPesanan(eventId: number): Promise<{
  jumlahPesanan: number;
  totalTiket: number;
}> {
  const { data, error } = await supabaseAdmin
    .from("pesanan")
    .select("jumlah")
    .eq("event_id", eventId);

  if (error) {
    throw new Error("Gagal menghitung pesanan: " + error.message);
  }

  const daftarPesanan = data ?? [];

  const jumlahPesanan = daftarPesanan.length;

  const totalTiket = daftarPesanan.reduce(
    (total, pesanan) => total + pesanan.jumlah,
    0,
  );

  return {
    jumlahPesanan,
    totalTiket,
  };
}

// Mengambil semua data pesanan
export async function ambilPesanan(): Promise<Pesanan[]> {
  const { data, error } = await supabaseAdmin
    .from("pesanan")
    .select("*, events(judul)")
    .order("nomor", { ascending: false });

  if (error) {
    throw new Error("Gagal memuat pesanan: " + error.message);
  }

  return (data ?? []) as Pesanan[];
}
