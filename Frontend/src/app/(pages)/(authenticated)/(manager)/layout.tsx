import type { Metadata } from "next";

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
  if (role !== "manager") {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center">
          <h1 className="text-5xl font-bold text-red-500">Unauthorized</h1>
        </div>
      </>
    );
  }
  return (
    <>
      <Navbar />
      {children}
      <AppFooter />
    </>
  );
}
