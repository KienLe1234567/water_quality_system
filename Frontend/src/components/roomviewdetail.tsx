"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { format, set } from "date-fns";
import {
  Bath,
  Bed,
  Calendar,
  Car,
  Cigarette,
  Coffee,
  DoorOpen,
  Dumbbell,
  Eye,
  Home,
  Mountain,
  Palmtree,
  ShieldCheck,
  ShowerHead,
  Star,
  Tv,
  Users,
  Utensils,
  Volume2,
  Waves,
  Wifi,
  Wind,
  Wine,
} from "lucide-react";
import { DateRange } from "react-day-picker";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Room } from "@/types/room";
import { UserInfo } from "@/types/user";

import FullscreenModal from "./fullscreen";
import BookingModal from "./modalbooking";
import Room360Viewer from "./roomview360";

const iconMapping: Record<string, React.ComponentType<any>> = {
  "King-size bed": Bed,
  "Queen-size bed": Bed,
  "Twin beds": Bed,
  "Ocean view": Eye,
  "City view": Eye,
  "Mountain view": Eye,
  "Free WiFi": Wifi,
  "Flat-screen TV": Tv,
  "Air conditioning": Wind,
  "Mini-bar": Wine,
  "Coffee machine": Coffee,
  "In-room safe": ShieldCheck,
  Bathtub: Bath,
  Shower: ShowerHead,
  Balcony: Palmtree,
  Terrace: Palmtree,
  "Room service": Utensils,
  Soundproof: DoorOpen,
  "Non-smoking": Cigarette,
  "Interconnected rooms available": DoorOpen,
  "Up to 3 guests": Users,
  '55" 4K Smart TV': Tv,
};
interface RoomCardProps extends Room {
  color: string | null;
  bgColor: string | null;
}
const RoomDetailOverview = ({
  room,
  userInfo,
  role,
  bookedRoomDateRange,
}: {
  room: RoomCardProps;
  userInfo?: UserInfo;
  role: string;
  bookedRoomDateRange: { start: Date; end: Date }[];
}) => {
  const { toast } = useToast();
  const [selectedDates, setSelectedDates] = useState<DateRange | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();

  const isDateDisabled = (date: Date) => {
    return bookedRoomDateRange.some(
      (range) => date >= range.start && date <= range.end
    );
  };

  // Custom onSelect handler
  const handleSelect = (range: DateRange | undefined) => {
    if (!range || !range.from || !range.to) {
      setSelectedDates(range);
      return;
    }

    // Check if any date in the range is disabled
    const start = new Date(range.from);
    const end = new Date(range.to);
    for (let day = start; day <= end; day.setDate(day.getDate() + 1)) {
      if (isDateDisabled(day)) {
        // If a disabled date is found, don't update the selection
        setSelectedDates(undefined);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Selected date range is not available.",
        });
        return;
      }
    }

    // If no disabled dates are in the range, update the selection
    setSelectedDates(range);
  };

  const handleView360Click = () => {
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  useEffect(() => {
    setCheckIn(selectedDates?.from);
    setCheckOut(selectedDates?.to);
  }, [selectedDates]);

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card
        className={`w-full overflow-hidden bg-gradient-to-br ${room.bgColor}`}
      >
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            <div className="p-8 lg:w-1/2">
              <div className="relative h-full w-full overflow-hidden rounded-lg">
                <Image
                  src={room.image_2d}
                  alt={room.name}
                  layout="fill"
                  objectFit="fill"
                  className="transform cursor-pointer transition-transform duration-300 hover:scale-105"
                  onClick={handleView360Click}
                />
              </div>
            </div>
            <div className="flex flex-col justify-between p-8 lg:w-1/2">
              <div>
                <nav aria-label="Breadcrumb">
                  <ol className="mb-4 flex text-sm text-muted-foreground">
                    <li>
                      <Link
                        href="/dashboard/homepage"
                        className="hover:text-foreground"
                      >
                        Home
                      </Link>
                    </li>
                    <li>
                      <span className="mx-2">/</span>
                    </li>
                    <li>
                      <Link
                        href="/dashboard/homepage"
                        className="hover:text-foreground"
                      >
                        Rooms
                      </Link>
                    </li>
                    <li>
                      <span className="mx-2">/</span>
                    </li>
                    <li aria-current="page">{room.name}</li>
                  </ol>
                </nav>
                <h1 className="mb-4 text-3xl font-bold text-foreground">
                  {room.name}
                </h1>
                <div className="mb-4 flex items-center">
                  <span className="mr-2 text-2xl font-bold text-foreground">
                    ${room.price}
                  </span>
                  <span className="text-muted-foreground">/per night</span>
                </div>
                {/* <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, index) => (
                    <Star key={index} className="text-yellow-400 w-4 h-4 mr-1" fill="currentColor" />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">(4.8 out of 5 stars, 120 reviews)</span>
                </div> */}
                <p className="mb-6 text-muted-foreground">
                  <b>Description:</b> {room.description}
                </p>
                <div className="mb-6 grid grid-cols-2 gap-4">
                  {room.features.map((feature, index) => {
                    const IconComponent = iconMapping[feature.name];

                    return (
                      <div key={index} className="flex items-center">
                        {IconComponent && (
                          <IconComponent className="mr-2 h-5 w-5 text-blue-500" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {feature.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mb-4 mt-4 flex flex-wrap gap-2">
                  {room.badges.map((badge, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className={`bg-gradient-to-r ${room.color} text-white`}
                    >
                      {badge.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Popover>
                  {room.status !== "booked" ? (
                    <>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="mb-4 w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {selectedDates?.from && selectedDates?.to ? (
                            <>
                              {format(selectedDates.from, "LLL dd, y")} -{" "}
                              {format(selectedDates.to, "LLL dd, y")}
                            </>
                          ) : (
                            <span>Select your stay dates</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          fromDate={
                            new Date(
                              new Date().setDate(new Date().getDate() + 1)
                            )
                          }
                          mode="range"
                          selected={selectedDates}
                          onSelect={handleSelect}
                          initialFocus
                          disabled={isDateDisabled}
                        />
                      </PopoverContent>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      className="mb-4 w-full cursor-not-allowed justify-start text-left font-normal text-gray-400"
                      disabled
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Unavailable for booking</span>
                    </Button>
                  )}
                </Popover>
                <div className="flex space-x-4">
                  {room.status !== "booked" ? (
                    <>
                      <BookingModal
                        roomId={room.id}
                        price={room.price}
                        checkInDate={checkIn}
                        checkOutDate={checkOut}
                        setCheckInDate={setCheckIn}
                        setCheckOutDate={setCheckOut}
                        userInfo={userInfo}
                        bookedRoomDateRange={bookedRoomDateRange}
                      />
                      {role === "manager" && (
                        <Link href={`/edit-room/${room.id.toString()}`}>
                          <Button className="w-full" size="lg">
                            Edit room
                          </Button>
                        </Link>
                      )}
                    </>
                  ) : (
                    <Button
                      className="hover:bg-red-10 w-full cursor-not-allowed border border-red-600 bg-red-500 font-semibold text-black"
                      size="lg"
                      disabled
                    >
                      This room has been booked
                    </Button>
                  )}
                </div>
              </div>
              <Separator className="my-6" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Free cancellation up to 24 hours before check-in</span>
                <Badge variant="outline">Best Price Guarantee</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <FullscreenModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        imgSrc={room.image_3d}
        imgSrcBackup={room.image_2d}
      />
    </div>
  );
};

export default RoomDetailOverview;
