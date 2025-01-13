import type { Metadata } from "next";
import { redirect } from "next/navigation";

import AppFooter from "@/components/footer";
import Navbar from "@/components/navbar";
import { getRole } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Hotel booking system",
  description: "Hotel booking system for many gorgeous rooms inside",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const role = getRole();
  if (role === "manager") {
    redirect("/dashboard/homepage");
  }
  return (
    <>
      <Navbar />
      {children}
      <AppFooter />
    </>
  );
}
