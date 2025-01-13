import { redirect } from "next/navigation";

import { getRole } from "@/lib/auth";

export default function RootPage() {
  const role = getRole();

  if (role === "manager") {
    return redirect("/dashboard/homepage");
  } else if (role === "customer") {
    return redirect("/home");
  }

  return redirect("auth/login");
}
