"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getUserId } from "@/lib/auth";

export async function bookRoom(prevState: FormState, formData: FormData) {
  const id = prevState.id;
  const user_id = getUserId();
  const guest_name = formData.get("name") as string;
  const guest_contact_number = formData.get("phone") as string;
  const guest_email = formData.get("email") as string;
  console.log(formData.get("checkin"));
  const check_in = formData.get("check_in") as string;
  const check_out = formData.get("check_out") as string;
  const number_of_guests = Number(formData.get("guests"));
  const total_price = Number(formData.get("price"));

  const roomData = {
    user_id,
    room_id: prevState.id,
    check_in,
    check_out,
    total_price,
    status: "booked",
    guest_name,
    guest_contact_number,
    guest_email,
    number_of_guests,
  };
  console.log(roomData);
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/booking`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roomData),
      }
    );
    let mes: FormState;
    if (!res.ok) {
      console.log(res);
      mes = {
        id,
        type: "fail",
        value: "Error booking room",
      };
    } else {
      mes = {
        id,
        type: "success",
        value: "Book room successfully",
      };
    }
    revalidatePath(`/dashboard/mybooking`);
    revalidatePath(`/bookings`);

    return mes;
  } catch (error) {
    console.log(error);
    return {
      id,
      type: "fail",
      value: "Error booking room",
    };
  }
}
