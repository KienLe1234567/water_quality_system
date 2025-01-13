"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useFormState, useFormStatus } from "react-dom";

import { bookRoom } from "@/app/(pages)/(authenticated)/(manager)/dashboard/viewdetail/[id]/actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserInfo } from "@/types/user";

import { ToastAction } from "./ui/toast";

interface BookingModalProps {
  roomId: number;
  price: number;
  checkInDate?: Date;
  checkOutDate?: Date;
  setCheckInDate: any;
  setCheckOutDate: any;
  userInfo?: UserInfo;
  bookedRoomDateRange: { start: Date; end: Date }[];
}

export default function BookingModal({
  roomId,
  price,
  checkInDate,
  checkOutDate,
  setCheckInDate,
  setCheckOutDate,
  userInfo,
  bookedRoomDateRange,
}: BookingModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [bookState, bookAction] = useFormState(bookRoom, {
    id: roomId,
    type: "",
    value: "",
  });
  useEffect(() => {
    console.log(bookState);
    if (bookState.type === "success") {
      toast({
        variant: "success",
        title: bookState.type.toUpperCase(),
        description: bookState.value,
      });
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
    if (bookState.type !== "success" && bookState.value !== "") {
      toast({
        variant: "destructive",
        title: bookState.type.toUpperCase(),
        description: bookState.value,
      });
    }
  }, [bookState]);

  const handleBooking = async (formData: FormData) => {
    formData.append("check_in", checkInDate?.toISOString() as string);
    formData.append("check_out", checkOutDate?.toISOString() as string);
    formData.append("price", price.toString());

    bookAction(formData);
    setIsOpen(false);
  };

  const isDateDisabled = (date: Date | undefined) => {
    if (!date) return false;
    return bookedRoomDateRange.some(
      (range) => date >= range.start && date <= range.end
    );
  };

  const isRangeColliding = (start: Date, end: Date) => {
    // Check if any day in the range is disabled
    for (
      let day = new Date(start);
      day <= end;
      day.setDate(day.getDate() + 1)
    ) {
      if (isDateDisabled(day)) {
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    if (checkInDate && checkOutDate && checkInDate > checkOutDate) {
      setCheckOutDate(checkInDate);
    }
  }, [checkInDate, checkOutDate]);

  const handleCheckInDateChange = (date: Date | undefined) => {
    if (isRangeColliding(date!, checkOutDate!)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selected date range is not available.",
      });
      return;
    }
    setCheckInDate(date);
  };

  const handleCheckOutDateChange = (date: Date | undefined) => {
    if (isRangeColliding(checkInDate!, date!)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selected date range is not available.",
      });
      return;
    }
    setCheckOutDate(date);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full"
          size="lg"
          variant="outline"
          disabled={!checkInDate || !checkOutDate}
        >
          Book a Room
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book a Room</DialogTitle>
          <DialogDescription>
            Confirm your information to book a room. Click submit when
            you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form action={handleBooking}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                className="col-span-3"
                required
                defaultValue={userInfo?.name}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                className="col-span-3"
                required
                defaultValue={userInfo?.email}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                name="phone"
                className="col-span-3"
                required
                defaultValue={userInfo?.phone_number}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="guests" className="text-right">
                Guests
              </Label>
              <Select name="guests" required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select number of guests" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Guest</SelectItem>
                  <SelectItem value="2">2 Guests</SelectItem>
                  <SelectItem value="3">3 Guests</SelectItem>
                  <SelectItem value="4">4 Guests</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="checkin" className="text-right">
                Check-in
              </Label>
              <Input
                className="hidden"
                type="date"
                name="checkin"
                hidden
                value={checkInDate?.toUTCString()}
              />
              <Popover modal>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`col-span-3 justify-start text-left font-normal ${!checkInDate && "text-muted-foreground"}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkInDate ? (
                      format(checkInDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    fromDate={
                      new Date(new Date().setDate(new Date().getDate() + 1))
                    }
                    mode="single"
                    selected={checkInDate}
                    onSelect={handleCheckInDateChange}
                    initialFocus
                    disabled={isDateDisabled}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="checkout" className="text-right">
                Check-out
              </Label>
              <Popover modal>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`col-span-3 justify-start text-left font-normal ${!checkOutDate && "text-muted-foreground"}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkOutDate ? (
                      format(checkOutDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    fromDate={checkInDate}
                    mode="single"
                    selected={checkOutDate}
                    onSelect={handleCheckOutDateChange}
                    initialFocus
                    disabled={isDateDisabled}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <BookButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const BookButton = () => {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Confirming..." : "Confirm Booking"}
    </Button>
  );
};
