import { redirect } from "next/navigation";
import React from "react";

import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5">
      <h1 className="text-5xl font-bold">404 - Not Found</h1>
      <form
        action={async () => {
          "use server";
          redirect("/");
        }}
      >
        <Button type="submit">Back to home</Button>
      </form>
    </div>
  );
};

export default NotFound;
