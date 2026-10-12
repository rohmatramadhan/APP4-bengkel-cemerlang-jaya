import { redirect } from "next/navigation";

// Halaman depan publik (PRD 6.2) adalah tugas di rumah / The public landing page (PRD 6.2) is homework
export default function Beranda() {
  redirect("/login");
}
