"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateRoom(prevState: FormState, formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const image_2d = formData.get("image_2d") as string;
  const image_3d = formData.get("image_3d") as string;
  const feature_ids = JSON.parse(formData.get("features") as string);
  const badge_ids = JSON.parse(formData.get("badges") as string);

  const roomData = {
    name,
    description,
    image_2d,
    image_3d,
    price,
    feature_ids,
    badge_ids,
  };
  const id = prevState.id;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/room/${id}`,
      {
        method: "PATCH",
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
        value: "Error updating room",
      };
    } else {
      mes = {
        id,
        type: "success",
        value: "Update room successfully",
      };
    }
    revalidatePath(`/edit-room/${id}`);
    revalidatePath(`/dashboard/homepage`);

    return mes;
  } catch (error) {
    console.log(error);
    return {
      id,
      type: "fail",
      value: "Error updating room",
    };
  }
}

export async function deleteRoom(prevState: FormState) {
  console.log("here");
  const id = prevState.id;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/room/${id}`,
      {
        method: "DELETE",
      }
    );

    let mes: FormState;
    if (!res.ok) {
      console.log(res);
      mes = {
        id,
        type: "fail",
        value: "Error deleting room",
      };
    } else {
      mes = {
        id,
        type: "success",
        value: "Deleted room successfully",
      };
    }

    console.log(mes);
    return mes;
  } catch (error) {
    console.log(error);
    return {
      id,
      type: "fail",
      value: "Error deleting room",
    };
  }
}
