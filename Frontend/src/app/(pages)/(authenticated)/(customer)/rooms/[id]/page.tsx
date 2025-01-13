import { notFound } from "next/navigation";

import RoomDetailOverview from "@/components/roomviewdetail";
import { getRole, getSession } from "@/lib/auth";
import { BookingListDto, Room } from "@/types/room";
import { UserInfo } from "@/types/user";

const getUserInfo = async () => {
  const accessToken = getSession();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/user/me/`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return (await res.json()) as UserInfo;
};

const getBookedRooms = async (roomId: number) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/room/${roomId}/bookings?status=booked&items_per_page=100&page=1&start_date=2021-01-01&end_date=2025-12-31`,
    {
      cache: "no-store",
    }
  );
  const list = (await res.json()) as BookingListDto;
  return list.data;
};

const ViewRoomPage = async ({ params }: { params: { id: string } }) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/room/${params.id}`,
    {
      cache: "no-store",
    }
  );
  if (res.status === 404) {
    return notFound();
  }
  const data = (await res.json()) as Room;
  var roomcolor, roombgcolor: any;
  if (typeof window !== "undefined") {
    roomcolor = localStorage.getItem("roomcolor");
    roombgcolor = localStorage.getItem("roombgcolor");
    localStorage.removeItem("roomcolor");
    localStorage.removeItem("roombgcolor");
  }
  const role = getRole() as string;
  let userInfo: UserInfo | undefined;
  if (role === "customer") {
    userInfo = await getUserInfo();
  }

  const room = {
    ...data,
    color: !roomcolor ? "from-blue-500 to-cyan-300" : roomcolor,
    bgColor: !roombgcolor ? "from-blue-50 to-cyan-50" : roombgcolor,
  };

  const bookedRooms = await getBookedRooms(data.id);
  const bookedRoomDateRange = bookedRooms.map((room) => {
    return {
      start: new Date(room.check_in),
      end: new Date(room.check_out),
    };
  });
  return (
    <main>
      <div>
        <RoomDetailOverview
          key={data.id}
          room={room}
          userInfo={userInfo}
          role={role}
          bookedRoomDateRange={bookedRoomDateRange}
        />
      </div>
    </main>
  );
};

export default ViewRoomPage;
