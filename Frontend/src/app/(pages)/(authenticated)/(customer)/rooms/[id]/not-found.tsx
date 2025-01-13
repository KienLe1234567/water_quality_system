import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex-center mt-10 flex flex-col items-center gap-10">
      <h2 className="text-5xl font-bold text-red-500">Not Found</h2>
      <p>Could not find requested resource</p>
      <Link href="/home">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}
