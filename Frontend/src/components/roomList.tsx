import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";

import axios from "axios";
import qs from "qs";

import { Button } from "@/components/ui/button";
import { getRole } from "@/lib/auth";
import { Room, RoomDto } from "@/types/room";

import RoomCard from "./room-card";
import RoomPagination from "./room-pagination";

const colors = [
  {
    color: "from-blue-500 to-cyan-300",
    bgColor: "from-blue-50 to-cyan-50",
  },
  {
    color: "from-green-500 to-emerald-300",
    bgColor: "from-green-50 to-emerald-50",
  },
  {
    color: "from-purple-500 to-pink-300",
    bgColor: "from-purple-50 to-pink-50",
  },
  {
    color: "from-purple-500 to-pink-300",
    bgColor: "from-purple-50 to-pink-50",
  },
  {
    color: "from-blue-500 to-cyan-300",
    bgColor: "from-blue-50 to-cyan-50",
  },
  {
    color: "from-green-500 to-emerald-300",
    bgColor: "from-green-50 to-emerald-50",
  },
];

async function fetchRooms(
  currentPage: string,
  min: number,
  max: number,
  features: number[],
  badges: number[]
): Promise<RoomDto> {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/rooms/filter`,
      {
        params: {
          page: currentPage,
          items_per_page: 6,
          min_price: min,
          max_price: max,
          feature_ids: features,
          badge_ids: badges,
        },
        paramsSerializer: (params) => {
          return qs.stringify(params, { arrayFormat: "repeat" });
        },
      }
    );

    return res.data;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch rooms");
  }
}

export default function RoomList({
  currentPage,
  min,
  max,
  features,
  badges,
}: {
  currentPage: string;
  min: number;
  max: number;
  features: number[];
  badges: number[];
}) {
  const role = getRole() as string;
  const data = use(fetchRooms(currentPage, min, max, features, badges));

  const roomProps = data.data.map((room, idx) => ({
    ...room,
    color: colors[idx % colors.length].color,
    bgColor: colors[idx % colors.length].bgColor,
  }));
  const totalPages = Math.floor(
    (data.total_count + data.items_per_page - 1) / data.items_per_page
  );

  if (Number(currentPage) > totalPages && totalPages !== 0) {
    return notFound();
  }
  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Available Rooms</h1>
        {role === "manager" && (
          <Link className="nav-link" href="/dashboard/addroom">
            <Button>Add</Button>
          </Link>
        )}
      </div>
      {roomProps.length === 0 ? (
        <p className="text-center text-4xl font-bold">No rooms found</p>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {roomProps.map((room) => (
              <RoomCard key={room.id} room={room} role={role} />
            ))}
          </div>
          <RoomPagination
            hasMore={data.has_more}
            totalPages={totalPages}
            role={role}
          />
        </>
      )}
    </div>
  );
}
