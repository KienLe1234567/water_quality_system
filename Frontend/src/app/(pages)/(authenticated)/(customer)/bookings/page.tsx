import axios from "axios";

import BookingList from "@/components/booking-list";
import { getUserId } from "@/lib/auth";
import { Booking, BookingListDto } from "@/types/room";

// Mock data for bookings
const allBookings = [
  {
    id: 1,
    roomName: "Deluxe Ocean View",
    image: "https://i.ibb.co/qrC25Pr/pic9.jpg",
    startDate: "2023-07-15",
    endDate: "2023-07-20",
    price: 1200,
    status: "upcoming",
    location: "Maldives Resort",
  },
  {
    id: 2,
    roomName: "Mountain Cabin",
    image: "https://i.ibb.co/qrC25Pr/pic9.jpg",
    startDate: "2023-08-01",
    endDate: "2023-08-05",
    price: 800,
    status: "upcoming",
    location: "Swiss Alps",
  },
  {
    id: 3,
    roomName: "City Apartment",
    image: "https://i.ibb.co/qrC25Pr/pic9.jpg",
    startDate: "2023-06-10",
    endDate: "2023-06-15",
    price: 600,
    status: "completed",
    location: "New York City",
  },
  {
    id: 4,
    roomName: "Beachfront Villa",
    image: "https://i.ibb.co/qrC25Pr/pic9.jpg",
    startDate: "2023-09-20",
    endDate: "2023-09-27",
    price: 2000,
    status: "upcoming",
    location: "Bali, Indonesia",
  },
  {
    id: 5,
    roomName: "Ski Chalet",
    image: "https://i.ibb.co/qrC25Pr/pic9.jpg",
    startDate: "2023-01-05",
    endDate: "2023-01-10",
    price: 1500,
    status: "completed",
    location: "Aspen, Colorado",
  },
];

async function fetchBookings(): Promise<BookingListDto> {
  const userId = getUserId();
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/user/${userId}/bookings`,
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

export default async function CustomerBookingPage() {
  const bookingDto = await fetchBookings();
  return (
    <div className="container mx-auto p-4">
      <header className="mb-8">
        <h1 className="mt-5 text-start text-3xl font-bold">
          Your Booking Rooms
        </h1>
      </header>
      <BookingList allBookings={bookingDto.data} />
    </div>
  );
}
