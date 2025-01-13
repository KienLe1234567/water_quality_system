"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import axios from "axios";
import { Edit, Save } from "lucide-react";
import {
  Bath,
  Bed,
  Cigarette,
  Coffee,
  DoorOpen,
  Eye,
  Palmtree,
  PlusCircle,
  ShieldCheck,
  Tv,
  Upload,
  Users,
  Utensils,
  Wifi,
  Wind,
  Wine,
  X,
} from "lucide-react";
import { useFormState, useFormStatus } from "react-dom";

import { updateRoom } from "@/app/(pages)/(authenticated)/(manager)/edit-room/[id]/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge, Feature, Room } from "@/types/room";

import DeleteRoomForm from "./delete-room-form";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

const featureTypes = {
  Bed: {
    icon: Bed,
    options: ["King-size bed", "Queen-size bed", "Twin beds"],
  },
  View: {
    icon: Eye,
    options: ["Ocean view", "City view", "Mountain view"],
  },
  WiFi: {
    icon: Wifi,
    options: ["Free WiFi"],
  },
  TV: {
    icon: Tv,
    options: ["Flat-screen TV", '55" 4K Smart TV'],
  },
  Climate: {
    icon: Wind,
    options: ["Air conditioning"],
  },
  Minibar: {
    icon: Wine,
    options: ["Mini-bar"],
  },
  Coffee: {
    icon: Coffee,
    options: ["Coffee machine"],
  },
  Safe: {
    icon: ShieldCheck,
    options: ["In-room safe"],
  },
  Bathroom: {
    icon: Bath,
    options: ["Bathtub", "Shower"],
  },
  Outdoor: {
    icon: Palmtree,
    options: ["Balcony", "Terrace"],
  },
  Service: {
    icon: Utensils,
    options: ["Room service"],
  },
  Room: {
    icon: DoorOpen,
    options: ["Soundproof", "Interconnected rooms available"],
  },
  Smoking: {
    icon: Cigarette,
    options: ["Non-smoking"],
  },
  Capacity: {
    icon: Users,
    options: ["Up to 3 guests", "Up to 4 guests"],
  },
};

async function fetchFeatures(): Promise<Feature[]> {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/room_features`,
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
    return res.data.data;
  } catch (error) {
    throw new Error("Failed to fetch features");
  }
}

async function fetchBadges(): Promise<Badge[]> {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/room_badges`,
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
    return res.data.data;
  } catch (error) {
    throw new Error("Failed to fetch badges");
  }
}

async function postImg(image: File): Promise<string> {
  try {
    var formData = new FormData();
    formData.append("image", image);
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/images/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res.data.url;
  } catch (error) {
    throw new Error("Failed to upload");
  }
}

export default function EditRoomForm({ room }: { room: Room }) {
  const router = useRouter();
  const { toast } = useToast();
  const [updateState, updateAction] = useFormState(updateRoom, {
    id: room.id,
    type: "",
    value: "",
  });
  console.log(room);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featuresList, setFeaturesList] = useState<Feature[]>([]);
  const [badgesList, setBadgesList] = useState<Badge[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description);
  const [price, setPrice] = useState(room.price.toString());
  const [image2D, setImage2D] = useState<File | null>(null);
  const [image3D, setImage3D] = useState<File | null>(null);
  const [image2DPreview, setImage2DPreview] = useState<string | null>(
    room.image_2d || null
  );
  const [image3DPreview, setImage3DPreview] = useState<string | null>(
    room.image_3d || null
  );
  const [features, setFeatures] = useState<number[]>(
    room.features.map((feature) => feature.id)
  );
  const [selectedBadges, setSelectedBadges] = useState<number[]>(
    room.badges.map((badge) => badge.id)
  );
  const fileInput2DRef = useRef<HTMLInputElement>(null);
  const fileInput3DRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedFeatures = await fetchFeatures();
        const fetchedBadges = await fetchBadges();
        setFeaturesList(fetchedFeatures);
        setBadgesList(fetchedBadges);
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (updateState.type === "success") {
      toast({
        variant: "success",
        title: updateState.type.toUpperCase(),
        description: updateState.value,
      });
      router.refresh();
    }
    if (updateState.type !== "success" && updateState.value !== "") {
      toast({
        variant: "destructive",
        title: updateState.type.toUpperCase(),
        description: updateState.value,
      });
    }
  }, [updateState, router, toast]);

  const handleImage2DChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage2D(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage2DPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImage3DChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage3D(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage3DPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBadgeToggle = (badgeId: number) => {
    setSelectedBadges((prev) =>
      prev.includes(badgeId)
        ? prev.filter((id) => id !== badgeId)
        : [...prev, badgeId]
    );
  };

  const handleSave = async (formData: FormData) => {
    formData.append("features", JSON.stringify(features));
    formData.append("badges", JSON.stringify(selectedBadges));

    let url2D = room.image_2d || "";
    let url3D = room.image_3d || "";

    try {
      const uploadPromises = [];

      if (image2D) uploadPromises.push(postImg(image2D));
      if (image3D) uploadPromises.push(postImg(image3D));

      if (uploadPromises.length > 0) {
        const results = await Promise.all(uploadPromises);

        if (image2D) url2D = results[0];
        if (image3D) url3D = image2D ? results[1] : results[0];
      }
    } catch (err) {
      setError("Failed to upload image");
    } finally {
      setLoading(false);
    }

    formData.append("image_2d", url2D);
    formData.append("image_3d", url3D);
    updateAction(formData);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div
          className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <Card className="relative mx-auto w-full max-w-4xl bg-gradient-to-br from-blue-50 to-purple-50">
      <CardHeader className="flex items-center justify-between rounded-t-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardTitle className="text-3xl font-bold">Room Details</CardTitle>
        <div className="absolute right-2 top-0 flex items-center space-x-2">
          <Label htmlFor="edit-mode" className="text-sm font-medium text-white">
            Edit Mode
          </Label>
          <Switch
            id="edit-mode"
            checked={isEditing}
            onCheckedChange={setIsEditing}
          />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form action={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label className="text-lg font-semibold text-gray-700">
                Room Name
              </Label>
              {isEditing ? (
                <Input
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 text-lg"
                />
              ) : (
                <p className="mt-1 text-lg">{name}</p>
              )}
            </div>
            <div>
              <Label className="text-lg font-semibold text-gray-700">
                Price per Night ($)
              </Label>
              {isEditing ? (
                <Input
                  name="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  className="mt-1 text-lg"
                />
              ) : (
                <p className="mt-1 text-lg">${price}</p>
              )}
            </div>
          </div>
          <div>
            <Label className="text-lg font-semibold text-gray-700">
              Description
            </Label>
            {isEditing ? (
              <Textarea
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 text-lg"
                rows={4}
              />
            ) : (
              <p className="mt-1 text-lg">{description}</p>
            )}
          </div>
          <div>
            <Label className="text-lg font-semibold text-gray-700">
              Room Images
            </Label>
            <div className="flex items-center gap-10">
              <div className="mt-1 flex items-center space-x-4">
                {isEditing && (
                  <Button
                    type="button"
                    onClick={() => fileInput2DRef.current?.click()}
                    className="bg-blue-500 text-white hover:bg-blue-600"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {image2DPreview ? "Change 2D Image" : "Upload 2D Image"}
                  </Button>
                )}
                <Input
                  id="image2D"
                  type="file"
                  onChange={handleImage2DChange}
                  accept="image/*"
                  className="hidden"
                  ref={fileInput2DRef}
                />
                {image2DPreview && (
                  <div className="relative h-32 w-32">
                    <Image
                      width={128}
                      height={128}
                      src={image2DPreview}
                      alt="Room preview"
                      className="h-full w-full rounded-lg object-cover"
                    />
                    {isEditing && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-0 top-0 rounded-full"
                        onClick={() => {
                          setImage2D(null);
                          setImage2DPreview(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-1 flex items-center space-x-4">
                {isEditing && (
                  <Button
                    type="button"
                    onClick={() => fileInput3DRef.current?.click()}
                    className="bg-blue-500 text-white hover:bg-blue-600"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {image3DPreview ? "Change 3D Image" : "Upload 3D Image"}
                  </Button>
                )}
                <Input
                  id="image3D"
                  type="file"
                  onChange={handleImage3DChange}
                  accept="image/*"
                  className="hidden"
                  ref={fileInput3DRef}
                />
                {image3DPreview && (
                  <div className="relative h-32 w-32">
                    <Image
                      src={image3DPreview}
                      alt="Room 3D preview"
                      className="h-full w-full rounded-lg object-cover"
                      width={128}
                      height={128}
                    />
                    {isEditing && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-0 top-0 rounded-full"
                        onClick={() => {
                          setImage3D(null);
                          setImage3DPreview(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-gray-700">
              Features
            </Label>
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              {Object.entries(featureTypes).map(
                ([type, { icon: Icon, options }]) => {
                  const filteredFeatures = featuresList.filter((feature) =>
                    options.includes(feature.name)
                  );

                  const currentSelection = features.find((featureId) =>
                    filteredFeatures.some((feature) => feature.id === featureId)
                  );

                  return (
                    filteredFeatures.length > 0 && (
                      <div key={type} className="mb-4 flex items-center gap-10">
                        <h3 className="text-md mb-2 flex items-center font-semibold">
                          <Icon className="mr-2 h-5 w-5" />
                          {type}
                        </h3>
                        <ToggleGroup
                          variant="outline"
                          type="single"
                          value={currentSelection?.toString() || ""}
                          onValueChange={(value) => {
                            if (isEditing) {
                              const selectedFeatureId = Number(value);
                              setFeatures((prev) => {
                                return prev
                                  .filter(
                                    (f) =>
                                      !filteredFeatures.some(
                                        (ff) => ff.id === f
                                      )
                                  )
                                  .concat(selectedFeatureId)
                                  .filter((f) => f !== 0);
                              });
                            }
                          }}
                        >
                          {filteredFeatures.map((feature) => (
                            <ToggleGroupItem
                              key={feature.id}
                              value={feature.id.toString()}
                              disabled={!isEditing}
                              className={!isEditing ? "cursor-default" : ""}
                            >
                              {feature.name}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </div>
                    )
                  );
                }
              )}
            </ScrollArea>
          </div>
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-gray-700">
              Badges
            </Label>
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              {badgesList.map((badge) => (
                <div
                  key={badge.id}
                  className="mb-2 flex items-center space-x-2"
                >
                  <Checkbox
                    id={`badge-${badge.name}`}
                    checked={selectedBadges.includes(badge.id)}
                    onCheckedChange={() =>
                      isEditing && handleBadgeToggle(badge.id)
                    }
                    disabled={!isEditing}
                  />
                  <label
                    htmlFor={`badge-${badge.name}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {badge.name}
                  </label>
                </div>
              ))}
            </ScrollArea>
          </div>
          {isEditing ? (
            <UpdateButton />
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 py-6 text-xl text-white hover:from-blue-600 hover:to-purple-600"
            >
              <Edit className="mr-2 h-6 w-6" /> Edit Room Details
            </Button>
          )}
        </form>
        {isEditing && <DeleteRoomForm roomId={room.id} />}
      </CardContent>
    </Card>
  );
}

const UpdateButton = () => {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 py-6 text-xl text-white hover:from-blue-600 hover:to-purple-600"
      disabled={pending}
    >
      <Save className="mr-2 h-6 w-6" /> {pending ? "Saving..." : "Save Changes"}
    </Button>
  );
};
