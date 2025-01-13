"use server";

import { revalidatePath } from "next/cache";

export const addRoom = async (prevState: FormState, formData: FormData) => {
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
  try {
    console.log(roomData);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/room`,
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
      mes = {
        type: "fail",
        value: "Error adding room",
      };
    } else {
      mes = {
        type: "success",
        value: "Added room successfully",
      };
    }
    revalidatePath("/dashboard/homepage");

    return mes;
  } catch (error) {
    return {
      type: "fail",
      value: "Error adding room",
    };
  }
};
