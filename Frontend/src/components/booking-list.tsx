"use client";

import Image from "next/image";
import { useState } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  DollarSign,
  Eye,
  Users,
  XCircle,
  Mail,
  Phone,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Booking } from "@/types/room";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

export default function BookingList({
  allBookings,
}: {
  allBookings: Booking[];
}) {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const { toast } = useToast();
  
  const upcomingBookings = allBookings.filter(
    (booking) => booking.status === "booked"
  );
  const historyBookings = allBookings.filter(
    (booking) => booking.status === "completed" || booking.status === "cancelled"
  );

  const handleCancel = async () => {
    if (!selectedBooking) return;

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/booking/${selectedBooking.id}/cancel`
      );
      console.log(selectedBooking.id)
      toast({
        variant: "success",
        title: "Success",
        description: "Booking successfully canceled!",
      });
      setIsModalOpen(false);  // Close the modal after successful cancellation
      window.location.reload();
    } catch (error) {
      console.error("Error canceling booking:", error);
      
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Failed to cancel booking. Please try again.",
      });
    }
  };

  const renderBookings = (bookings: Booking[]) => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {bookings.map((booking: Booking) => (
        <Card key={booking.id} className="flex flex-col">
          <CardContent className="flex-grow p-4">
            <div className="mb-2 flex items-center gap-2">
              <User className="mr-1 h-4 w-4" />
              <span className="text-sm font-semibold">
                {booking.guest_name}
              </span>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <Mail className="mr-1 h-4 w-4" />
              <span className="text-sm font-semibold">
                {booking.guest_email}
              </span>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <Phone className="mr-1 h-4 w-4" />
              <span className="text-sm font-semibold">
                {booking.guest_contact_number}
              </span>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <Users className="mr-1 h-4 w-4" />
              <span className="text-sm font-semibold">
                {booking.number_of_guests} Guest(s)
              </span>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <CalendarDays className="mr-1 h-4 w-4" />
              <span className="text-sm font-semibold">
                {format(new Date(booking.check_in), "PPP")} -{" "}
                {format(new Date(booking.check_out), "PPP")}
              </span>
            </div>
            <div className="mb-2 flex items-center">
              <DollarSign className="mr-1 h-4 w-4" />
              <span className="text-sm font-semibold">
                <span className="mr-1 font-semibold">&nbsp;&nbsp;Total price:</span>
                {booking.total_price}
              </span>
            </div>
            <Badge
              variant={booking.status === "pending" ? "default" : "secondary"}
              className="capitalize"
            >
              {booking.status}
            </Badge>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <div className="flex w-full justify-between">
              <Button variant="outline" size="sm" className="flex items-center">
                <Eye className="mr-1 h-4 w-4" />
                View Details
              </Button>
              {(booking.status === "pending" || booking.status === "booked") && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center"
                  onClick={() => {
                    setSelectedBooking(booking);
                    setIsModalOpen(true);
                  }}
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <>
      <Tabs defaultValue="upcoming" className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming" onClick={() => setActiveTab("upcoming")}>
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="history" onClick={() => setActiveTab("history")}>
            History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          {renderBookings(upcomingBookings)}
        </TabsContent>
        <TabsContent value="history">
          {renderBookings(historyBookings)}
        </TabsContent>
      </Tabs>

      {/* Confirmation Modal */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              Confirm Cancellation
            </h2>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4" />
                <span className="text-sm">{selectedBooking.guest_name}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{selectedBooking.guest_email}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4" />
                <span className="text-sm">
                  {selectedBooking.guest_contact_number}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">
                  {selectedBooking.number_of_guests} Guest(s)
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="h-4 w-4" />
                <span className="text-sm">
                  {format(new Date(selectedBooking.check_in), "PPP")} -{" "}
                  {format(new Date(selectedBooking.check_out), "PPP")}
                </span>
              </div>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  {selectedBooking.total_price}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to cancel this booking?
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                No
              </Button>
              <Button variant="destructive" onClick={handleCancel}>
                Yes, Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
