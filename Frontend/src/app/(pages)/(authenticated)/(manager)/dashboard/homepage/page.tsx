import { Suspense } from "react";

import FilterSheet from "@/components/filter-sheet";
import RoomList from "@/components/roomList";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default async function Home({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { [key: string]: string | undefined };
}) {
  const currentPage = searchParams["page"] ? searchParams["page"] : "1";
  const min = Number(searchParams?.minPrice) || 0;
  const max = Number(searchParams?.maxPrice) || 200000;
  const badgesQuery = searchParams?.badges || "";
  const featuresQuery = searchParams?.features || "";
  const badges =
    badgesQuery.length === 0
      ? []
      : badgesQuery.split(",").map((b) => Number(b));
  const features =
    featuresQuery.length === 0
      ? []
      : featuresQuery.split(",").map((b) => Number(b));

  return (
    <main
      key={Math.random()}
      className="flex min-h-screen flex-col items-center p-24"
    >
      <div className="container flex justify-end">
        <FilterSheet />
      </div>
      <div className="w-full">
        <Suspense fallback={<RoomListSkeleton />}>
          <RoomList
            currentPage={currentPage}
            min={min}
            max={max}
            badges={badges}
            features={features}
          />
        </Suspense>
      </div>
    </main>
  );
}

const RoomCardSkeleton = () => {
  return (
    <Card className="flex animate-pulse flex-col overflow-hidden bg-gradient-to-br shadow-lg">
      <CardHeader>
        <Skeleton className="h-6 w-3/4 bg-gray-200" />
        <Skeleton className="mt-2 h-4 w-full bg-gray-200" />
      </CardHeader>
      <CardContent className="flex-grow">
        <Skeleton className="aspect-video w-full rounded-lg bg-gray-200" />
        <div className="mt-4 grid gap-2">
          <Skeleton className="h-5 w-1/3 bg-gray-200" />
          <ul className="grid gap-1">
            {[...Array(6)].map((_, index) => (
              <li key={index} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full bg-gray-200" />
                <Skeleton className="h-4 w-3/4 bg-gray-200" />
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[...Array(3)].map((_, index) => (
            <Skeleton
              key={index}
              className="h-6 w-20 rounded-full bg-gray-200"
            />
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Skeleton className="h-8 w-24 bg-gray-200" />
        <Skeleton className="h-10 w-full bg-gray-200 sm:w-32" />
      </CardFooter>
    </Card>
  );
};

const RoomListSkeleton = () => {
  return (
    <div className="container mt-24 grid w-full gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, index) => (
        <RoomCardSkeleton key={index} />
      ))}
    </div>
  );
};
