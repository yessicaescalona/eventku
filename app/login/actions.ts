"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";

import {
  NAMA_COOKIE,
  UMUR_SESI,
  buatToken,
} from "@/lib/sesi";

export type HasilMasuk = {
  pesan: string;
};

const NAMA_COOKIE_GAGAL = "login_gagal";
const BATAS_PERCOBAAN = 5;
const DURASI_KUNCI = 60;

function bandingkanSandi(input: string, sandiBenar: string) {
  const inputBuffer = Buffer.from(input, "utf8");
  const sandiBuffer = Buffer.from(sandiBenar, "utf8");

  if (inputBuffer.length !== sandiBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, sandiBuffer);
}

export async function masuk(
  _sebelum: HasilMasuk,
  formData: FormData
): Promise<HasilMasuk> {
  const sandi = String(formData.get("sandi") ?? "");
  const dari = String(formData.get("dari") ?? "");

  const penyimpananCookie = await cookies();

  // Membaca jumlah percobaan login yang gagal.
  const dataGagal = penyimpananCookie.get(NAMA_COOKIE_GAGAL)?.value;

  const [jumlahText, waktuKunciText] = (dataGagal ?? "0.0").split(".");

  let jumlahGagal = Number(jumlahText);
  const waktuKunci = Number(waktuKunciText);

  if (!Number.isSafeInteger(jumlahGagal) || jumlahGagal < 0) {
    jumlahGagal = 0;
  }

  // Memeriksa apakah waktu penguncian masih berlaku.
  if (Number.isFinite(waktuKunci) && waktuKunci > Date.now()) {
    const sisaWaktu = Math.ceil(
      (waktuKunci - Date.now()) / 1000
    );

    return {
      pesan: `Terlalu banyak percobaan. Coba lagi dalam ${sisaWaktu} detik.`,
    };
  }

  // Jika waktu penguncian sudah selesai, hitungan direset.
  if (Number.isFinite(waktuKunci) && waktuKunci > 0) {
    jumlahGagal = 0;
  }

  const sandiBenar = process.env.ADMIN_PASSWORD;

  if (!sandiBenar || !bandingkanSandi(sandi, sandiBenar)) {
    jumlahGagal++;

    // Mengunci login setelah 5 kali percobaan salah.
    if (jumlahGagal >= BATAS_PERCOBAAN) {
      const waktuBaru = Date.now() + DURASI_KUNCI * 1000;

      penyimpananCookie.set(
        NAMA_COOKIE_GAGAL,
        `${jumlahGagal}.${waktuBaru}`,
        {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: DURASI_KUNCI,
        }
      );

      return {
        pesan: "Terlalu banyak percobaan. Login dikunci selama 1 menit.",
      };
    }

    // Menyimpan jumlah percobaan yang gagal.
    penyimpananCookie.set(
      NAMA_COOKIE_GAGAL,
      `${jumlahGagal}.0`,
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 300,
      }
    );

    return {
      pesan: `Kata sandi salah. Percobaan ${jumlahGagal} dari ${BATAS_PERCOBAAN}.`,
    };
  }

  // Login berhasil: hapus hitungan percobaan gagal.
  penyimpananCookie.delete(NAMA_COOKIE_GAGAL);

  // Membuat sesi admin.
  penyimpananCookie.set(NAMA_COOKIE, await buatToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UMUR_SESI,
  });

  redirect(dari.startsWith("/admin") ? dari : "/admin");
}

export async function keluar() {
  const penyimpananCookie = await cookies();

  penyimpananCookie.delete(NAMA_COOKIE);
  penyimpananCookie.delete(NAMA_COOKIE_GAGAL);

  redirect("/login");
}