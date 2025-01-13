import { Calendar } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            <div className="p-8 lg:w-1/2">
              <Skeleton className="h-64 w-full rounded-lg lg:h-full" />
            </div>
            <div className="flex flex-col justify-between p-8 lg:w-1/2">
              <div>
                <nav aria-label="Breadcrumb">
                  <ol className="mb-4 flex text-sm">
                    <Skeleton className="h-4 w-16" />
                    <span className="mx-2">/</span>
                    <Skeleton className="h-4 w-16" />
                    <span className="mx-2">/</span>
                    <Skeleton className="h-4 w-24" />
                  </ol>
                </nav>
                <Skeleton className="mb-4 h-8 w-3/4" />
                <div className="mb-4 flex items-center">
                  <Skeleton className="mr-2 h-8 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="mb-6 h-20 w-full" />
                <div className="mb-6 grid grid-cols-2 gap-4">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="flex items-center">
                      <Skeleton className="mr-2 h-5 w-5" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
                <div className="mb-4 mt-4 flex flex-wrap gap-2">
                  {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} className="h-4 w-20" />
                  ))}
                </div>
              </div>
              <div>
                <Button
                  variant="outline"
                  className="mb-4 w-full justify-start text-left font-normal"
                >
                  <Skeleton className="h-4 w-48" />
                </Button>
                <div className="flex space-x-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-40" />
                </div>
              </div>
              <Separator className="my-6" />
              <div className="flex items-center justify-between text-sm">
                <Skeleton className="h-4 w-64" />
                <Badge variant="outline">
                  <Skeleton className="h-4 w-32" />
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
