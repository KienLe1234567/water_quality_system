"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import axios from "axios";
import { ExecOptionsWithStringEncoding } from "child_process";
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

import { addRoom } from "@/app/(pages)/(authenticated)/(manager)/dashboard/addroom/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge, Feature } from "@/types/room";

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
export default function AddRoomForm() {
  const [featuresList, setFeaturesList] = useState<Feature[]>([]);
  const [badgesList, setBadgesList] = useState<Badge[]>([]);
  const [features, setFeatures] = useState<number[]>([]);
  const [badges, setBadges] = useState<number[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction] = useFormState(addRoom, {
    type: "",
    value: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBadges, setSelectedBadges] = useState<number[]>([]);
  const [customFeature, setCustomFeature] = useState("");
  const [customBadge, setCustomBadge] = useState("");
  const [image2DPreview, setImage2DPreview] = useState<string | null>(null);
  const [image3DPreview, setImage3DPreview] = useState<string | null>(null);
  const fileInput2DRef = useRef<HTMLInputElement>(null);
  const fileInput3DRef = useRef<HTMLInputElement>(null);
  const [image2D, setImage2D] = useState<File | null>(null);
  const [image3D, setImage3D] = useState<File | null>(null);
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
    setFeatures(featuresList.map((feature) => feature.id));
    setBadges(badgesList.map((badge) => badge.id));
    if (state.type === "success") {
      toast({
        variant: "success",
        title: state.type.toUpperCase(),
        description: state.value,
      });
      router.push("/dashboard/homepage");
    }

    if (state.type !== "success" && state.value !== "") {
      toast({
        variant: "destructive",
        title: state.type.toUpperCase(),
        description: state.value,
      });
    }
  }, [state]);

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

  // const handleAddCustomFeature = () => {
  //   if (customFeature) {
  //     const newId = Math.random(); // Generate a temporary ID for custom feature
  //     setSelectedFeatures((prev) => [...prev, newId]);
  //     setFeaturesList((prev) => [
  //       ...prev,
  //       { id: newId, name: customFeature, description: "" },
  //     ]);
  //     setCustomFeature("");
  //   }
  // };

  // const handleAddCustomBadge = () => {
  //   if (customBadge) {
  //     const newId = Math.random(); // Generate a temporary ID for custom badge
  //     setSelectedBadges((prev) => [...prev, newId]);
  //     setBadgesList((prev) => [
  //       ...prev,
  //       { id: newId, name: customBadge, description: "" },
  //     ]);
  //     setCustomBadge("");
  //   }
  // };

  const handleSubmit = async (formData: FormData) => {
    formData.append("features", JSON.stringify(features));
    formData.append("badges", JSON.stringify(selectedBadges));

    let url2D = "";
    let url3D = "";

    try {
      const uploadPromises = [];

      if (image2D) uploadPromises.push(postImg(image2D));
      if (image3D) uploadPromises.push(postImg(image3D));

      if (uploadPromises.length > 0) {
        const results = await Promise.all(uploadPromises);

        if (image2D) url2D = results[0];
        if (image3D) url3D = image2D ? results[1] : "";
      }
    } catch (err) {
      setError("Failed to upload image");
    } finally {
      setLoading(false);
    }

    formData.append("image_2d", url2D);
    formData.append("image_3d", url3D);
    formAction(formData);
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
    <Card className="mx-auto w-full max-w-4xl bg-gradient-to-br from-blue-50 to-purple-50">
      <CardHeader className="rounded-t-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardTitle className="text-3xl font-bold">Add New Room</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form action={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label
                htmlFor="name"
                className="text-lg font-semibold text-gray-700"
              >
                Room Name
              </Label>
              <Input id="name" name="name" required className="mt-1 text-lg" />
            </div>
            <div>
              <Label
                htmlFor="price"
                className="text-lg font-semibold text-gray-700"
              >
                Price per Night ($)
              </Label>
              <Input
                id="price"
                type="number"
                name="price"
                required
                min="0"
                step="0.01"
                className="mt-1 text-lg"
              />
            </div>
          </div>
          <div>
            <Label
              htmlFor="description"
              className="text-lg font-semibold text-gray-700"
            >
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              required
              className="mt-1 text-lg"
              rows={4}
            />
          </div>
          <div>
            <Label
              htmlFor="image"
              className="text-lg font-semibold text-gray-700"
            >
              Room Image
            </Label>
            <div className="flex items-center gap-10">
              <div className="mt-1 flex items-center space-x-4">
                <Button
                  type="button"
                  onClick={() => fileInput2DRef.current?.click()}
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  <Upload className="mr-2 h-4 w-4" />{" "}
                  {image2DPreview ? "Change 2D Image" : "Upload 2D Image"}
                </Button>
                <Input
                  id="image"
                  type="file"
                  onChange={handleImage2DChange}
                  accept="image/*"
                  required
                  className="hidden"
                  ref={fileInput2DRef}
                />
                {image2DPreview && (
                  <div className="relative h-32 w-32">
                    <Image
                      width={32}
                      height={32}
                      src={image2DPreview}
                      alt="Room preview"
                      className="h-full w-full rounded-lg object-cover"
                    />
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
                  </div>
                )}
              </div>
              <div className="mt-1 flex items-center space-x-4">
                <Button
                  type="button"
                  onClick={() => fileInput3DRef.current?.click()}
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  <Upload className="mr-2 h-4 w-4" />{" "}
                  {image3DPreview ? "Change 3D Image" : "Upload 3D Image"}
                </Button>
                <Input
                  id="image"
                  type="file"
                  onChange={handleImage3DChange}
                  accept="image/*"
                  required
                  className="hidden"
                  ref={fileInput3DRef}
                />
                {image3DPreview && (
                  <div className="relative h-32 w-32">
                    <Image
                      width={32}
                      height={32}
                      src={image3DPreview}
                      alt="Room preview"
                      className="h-full w-full rounded-lg object-cover"
                    />
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
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Features Section */}
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

                  // Find the currently selected feature for this type
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
                          value={currentSelection?.toString() || ""} // Use the current selection value as string
                          onValueChange={(value) => {
                            const selectedFeatureId = Number(value); // Convert string back to number
                            setFeatures((prev) => {
                              // Filter out any existing feature in the current category
                              return prev
                                .filter(
                                  (f) =>
                                    !filteredFeatures.some((ff) => ff.id === f)
                                )
                                .concat(selectedFeatureId)
                                .filter((f) => f !== 0);
                            });
                          }}
                        >
                          {filteredFeatures.map((feature) => (
                            <div
                              key={feature.id}
                              className="flex items-center space-x-2"
                            >
                              <ToggleGroupItem
                                value={feature.id.toString()}
                                id={`feature-${feature.name}`}
                              >
                                {feature.name}
                              </ToggleGroupItem>
                            </div>
                          ))}
                        </ToggleGroup>
                      </div>
                    )
                  );
                }
              )}
            </ScrollArea>
          </div>

          {/* <div className="flex space-x-2">
              <Input
                value={customFeature}
                onChange={(e) => setCustomFeature(e.target.value)}
                placeholder="Add custom feature"
                className="flex-grow"
              />
              <Button type="button" onClick={handleAddCustomFeature} className="bg-green-500 text-white hover:bg-green-600">
                <PlusCircle className="mr-2 h-4 w-4" /> Add
              </Button>
            </div> */}

          {/* Badges Section */}
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
                    onCheckedChange={() => handleBadgeToggle(badge.id)}
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
            {/* <div className="flex space-x-2">
              <Input
                value={customBadge}
                onChange={(e) => setCustomBadge(e.target.value)}
                placeholder="Add custom badge"
                className="flex-grow"
              />
              <Button type="button" onClick={handleAddCustomBadge} className="bg-purple-500 text-white hover:bg-purple-600">
                <PlusCircle className="mr-2 h-4 w-4" /> Add
              </Button>
            </div> */}
          </div>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 py-6 text-xl text-white hover:from-blue-600 hover:to-purple-600"
      disabled={pending}
    >
      {pending ? "Adding Room..." : "Add Room"}
    </Button>
  );
};
