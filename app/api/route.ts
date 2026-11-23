
import { ambilEvent } from "@/data/ambil";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || isNaN(Number(id))) {
    return Response.json(
      { pesan: "ID event tidak valid" },
      { status: 400 }
    );
  }

  const event = await ambilEvent(Number(id));

  if (!event) {
    return Response.json(
      { pesan: "Event tidak ditemukan" },
      { status: 404 }
    );
  }

  return Response.json(event);
}
