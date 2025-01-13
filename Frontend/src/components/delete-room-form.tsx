"use client";

import { revalidatePath } from "next/cache";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useFormState, useFormStatus } from "react-dom";

import { deleteRoom } from "@/app/(pages)/(authenticated)/(manager)/edit-room/[id]/actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const DeleteRoomForm = ({ roomId }: { roomId: number }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteState, deleteAction] = useFormState(deleteRoom, {
    id: roomId,
    type: "",
    value: "",
  });

  useEffect(() => {
    console.log(deleteState);
    if (deleteState.type === "success") {
      toast({
        variant: "success",
        title: deleteState.type.toUpperCase(),
        description: deleteState.value,
      });
      console.log("here");
      router.push("/dashboard/homepage");
      router.refresh();
    }
    if (deleteState.type !== "success" && deleteState.value !== "") {
      toast({
        variant: "destructive",
        title: deleteState.type.toUpperCase(),
        description: deleteState.value,
      });
    }
  }, [deleteState]);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          className="mt-4 w-full py-6 text-xl text-white"
          variant="destructive"
        >
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent forceMount>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            room.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={deleteAction}>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <DeleteButton />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const DeleteButton = () => {
  const { pending } = useFormStatus();
  return (
    <Button
      disabled={pending}
      type="submit"
      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
    >
      {pending ? "Deleting..." : "Continue"}
    </Button>
  );
};

export default DeleteRoomForm;
