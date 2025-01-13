import { notFound } from "next/navigation";

import EditRoomForm from "@/components/edit-room-form";
import { Room } from "@/types/room";

const EditRoomPage = async ({ params }: { params: { id: string } }) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/room/${params.id}`,
    {
      cache: "no-store",
    }
  );
  if (res.status === 404) {
    return notFound();
  }
  //console.log(res); 
  const data = (await res.json()) as Room;

  return (
    <main className="p-24">
      <div>
        <EditRoomForm room={data} />
      </div>
    </main>
  );
};

export default EditRoomPage;
