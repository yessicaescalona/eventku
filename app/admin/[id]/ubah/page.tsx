import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ambilEvent } from "@/data/ambil";
import FormEvent from "@/components/FormEvent";

export const metadata: Metadata = {
  title: "Ubah Event",
};

export default async function Ubah({
  params,
}: PageProps<"/admin/[id]/ubah">) {
  const { id } = await params;
  const eventId = Number(id);

  if (!Number.isInteger(eventId) || eventId < 1) {
    notFound();
  }

  const event = await ambilEvent(eventId);

  if (!event) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">
        Ubah Event
      </h1>

      <FormEvent event={event} />
    </div>
  );
}