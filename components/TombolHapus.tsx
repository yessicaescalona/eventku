"use client";

export default function TombolHapus() {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm("Yakin ingin menghapus event ini?")) {
          e.preventDefault();
        }
      }}
      className="text-red-600 underline"
    >
      Hapus
    </button>
  );
}