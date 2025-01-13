import axios from "axios";

import BookingList from "@/components/booking-list";
import { getUserId } from "@/lib/auth";
import { Booking } from "@/types/room";

interface BookingListDto {
  data: Booking[];
  total_count: number;
  has_more: boolean;
  page: number;
  items_per_page: number;
}

async function fetchBookings(): Promise<BookingListDto> {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/bookings`,
      {
        params: {
          page: 1,
          items_per_page: 100,
        },
      }
    );

    return res.data;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch bookings");
  }
}

export default async function AdminBookingPage() {
  const bookingDto = await fetchBookings();
  return (
    <div className="container mx-auto p-4">
      <header className="mb-8">
        <h1 className="mt-5 text-start text-3xl font-bold">
          All Booking Rooms
        </h1>
      </header>
      <BookingList allBookings={bookingDto.data} />
    </div>
  );
}
