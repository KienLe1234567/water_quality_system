"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
  Bath,
  Bed,
  Cigarette,
  Coffee,
  DoorOpen,
  Eye,
  Palmtree,
  ShieldCheck,
  ShowerHead,
  Tv,
  Users,
  Utensils,
  Wifi,
  Wind,
  Wine,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Room } from "@/types/room";

import FullscreenModal from "./fullscreen";
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
  "Up to 4 guests": Users,
  '55" 4K Smart TV': Tv,
};
interface RoomCardProps extends Room {
  color: string;
  bgColor: string;
}
const RoomCard = ({ room, role }: { room: RoomCardProps; role: string }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  console.log(room);
  const handleView360Click = () => {
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };
  const handleViewDetailClick = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("roomcolor", room.color);
      localStorage.setItem("roombgcolor", room.bgColor);
    }
  };

  const roomDetailsLink =
    role === "manager"
      ? `/dashboard/viewdetail/${room.id}`
      : `/rooms/${room.id}`;
  return (
    <div key={room.id} className="perspective group relative">
      {room.image_3d.length > 0 && (
        <Badge className="absolute -right-3 -top-3 z-10">360&#xb0;</Badge>
      )}
      <Card
        className={`flex flex-col overflow-hidden bg-gradient-to-br shadow-lg ${room.bgColor} group-hover:rotate-y-6 h-full transform transition-all duration-300 group-hover:scale-105`}
      >
        <div className="pointer-events-none absolute inset-0 bg-white/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <CardHeader>
          <CardTitle>{room.name}</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="relative mb-4 aspect-video overflow-hidden rounded-lg">
            <Image
              src={room.image_2d}
              alt={room.name}
              layout="fill"
              objectFit="cover"
              className="cursor-pointer transition-all group-hover:scale-110"
              onClick={handleView360Click} // Open modal on click
            />
          </div>
          <div className="grid gap-2">
            <h3 className="font-semibold">Room Features</h3>
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
          <div className="mt-4 flex flex-wrap gap-2">
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
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-2xl font-bold">
            ${room.price}
            <span className="text-sm font-normal">/night</span>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Link href={roomDetailsLink}>
              <Button
                className={`flex-1 bg-gradient-to-r sm:flex-initial ${room.color} transition-all group-hover:brightness-110`}
                onClick={handleViewDetailClick}
              >
                {role === "manager" ? "View Details" : "Book Now"}
              </Button>
            </Link>
          </div>
        </CardFooter>
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

export default RoomCard;
