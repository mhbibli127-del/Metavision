import type { Metadata } from "next";
import MenuView from "@/components/dashboard/MenuView";

export const metadata: Metadata = {
  title: "Menu — Metavision",
  description: "Manage your restaurant menu items and categories.",
};

export default function MenuPage() {
  return <MenuView />;
}
