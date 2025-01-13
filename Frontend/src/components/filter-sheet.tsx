"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Filter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";

const allFeatures = [
  { name: "King-size bed", description: "King-size bed", id: 1 },
  { name: "Queen-size bed", description: "Queen-size bed", id: 2 },
  { name: "Twin beds", description: "Twin beds", id: 3 },
  { name: "Ocean view", description: "Ocean view", id: 4 },
  { name: "City view", description: "City view", id: 5 },
  { name: "Mountain view", description: "Mountain view", id: 6 },
  { name: "Free WiFi", description: "Free WiFi", id: 7 },
  { name: "Flat-screen TV", description: "Flat-screen TV", id: 8 },
  { name: "Air conditioning", description: "Air conditioning", id: 9 },
  { name: "Mini-bar", description: "Mini-bar", id: 10 },
  { name: "Coffee machine", description: "Coffee machine", id: 11 },
  { name: "In-room safe", description: "In-room safe", id: 12 },
  { name: "Bathtub", description: "Bathtub", id: 13 },
  { name: "Shower", description: "Shower", id: 14 },
  { name: "Balcony", description: "Balcony", id: 15 },
  { name: "Terrace", description: "Terrace", id: 16 },
  { name: "Room service", description: "Room service", id: 17 },
  { name: "Soundproof", description: "Soundproof", id: 18 },
  { name: "Non-smoking", description: "Non-smoking", id: 19 },
  {
    name: "Interconnected rooms available",
    description: "Interconnected rooms available",
    id: 20,
  },
  { name: "Up to 3 guests", description: "Up to 3 guests", id: 21 },
  { name: '55" 4K Smart TV', description: '55" 4K Smart TV', id: 22 },
];

const allBadges = [
  { name: "Ocean View", description: "Ocean View", id: 1 },
  { name: "Mountain View", description: "Mountain View", id: 2 },
  { name: "Beachfront", description: "Beachfront", id: 3 },
  { name: "Family-friendly", description: "Family-friendly", id: 4 },
  { name: "Romantic", description: "Romantic", id: 5 },
  { name: "Non-smoking", description: "Non-smoking", id: 6 },
  { name: "Business", description: "Business", id: 7 },
  { name: "Spa", description: "Spa", id: 8 },
  { name: "Pet-friendly", description: "Pet-friendly", id: 9 },
  { name: "Accessible", description: "Accessible", id: 10 },
  { name: "Eco-friendly", description: "Eco-friendly", id: 11 },
  { name: "Luxury", description: "Luxury", id: 12 },
  { name: "Budget", description: "Budget", id: 13 },
  { name: "All-inclusive", description: "All-inclusive", id: 14 },
  { name: "Adults only", description: "Adults only", id: 15 },
  { name: "Free Cancellation", description: "Free Cancellation", id: 16 },
  { name: "No prepayment", description: "No prepayment", id: 17 },
  { name: "Breakfast included", description: "Breakfast included", id: 18 },
  { name: "Pool access", description: "Pool access", id: 19 },
  { name: "Fitness center", description: "Fitness center", id: 20 },
  { name: "Restaurant on-site", description: "Restaurant on-site", id: 21 },
  { name: "Bar on-site", description: "Bar on-site", id: 22 },
  { name: "Free Breakfast", description: "Free Breakfast", id: 23 },
];

export default function FilterSheet() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const minPrice = 0;
  const maxPrice = 2000;

  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([]);
  const [selectedBadges, setSelectedBadges] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState([minPrice, maxPrice]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const featuresParam = searchParams.get("features");
    const badgesParam = searchParams.get("badges");

    if (minPriceParam && maxPriceParam) {
      setPriceRange([parseInt(minPriceParam), parseInt(maxPriceParam)]);
    }

    if (featuresParam) {
      setSelectedFeatures(featuresParam.split(",").map(Number));
    }

    if (badgesParam) {
      setSelectedBadges(badgesParam.split(",").map(Number));
    }
  }, [searchParams]);

  const toggleFeature = (featureId: number) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId)
        ? prev.filter((id) => id !== featureId)
        : [...prev, featureId]
    );
  };

  const toggleBadge = (badgeId: number) => {
    setSelectedBadges((prev) =>
      prev.includes(badgeId)
        ? prev.filter((id) => id !== badgeId)
        : [...prev, badgeId]
    );
  };

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    params.set("minPrice", priceRange[0].toString());
    params.set("maxPrice", priceRange[1].toString());

    if (selectedFeatures.length > 0) {
      params.set("features", selectedFeatures.join(","));
    } else {
      params.delete("features");
    }

    if (selectedBadges.length > 0) {
      params.set("badges", selectedBadges.join(","));
    } else {
      params.delete("badges");
    }

    replace(`${pathname}?${params.toString()}`);
    setIsFilterOpen(false);
  };

  return (
    <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Adjust your room preferences</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-180px)] pr-4">
          <div className="mt-6 space-y-6">
            <div>
              <h2 className="mb-2 text-lg font-semibold">Price Range</h2>
              <div className="space-y-2">
                <Slider
                  min={minPrice}
                  max={maxPrice}
                  step={50}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </div>
            </div>
            <div>
              <h2 className="mb-2 text-lg font-semibold">Features</h2>
              <div className="flex flex-wrap gap-2">
                {allFeatures.map((feature) => (
                  <Badge
                    key={feature.id}
                    variant={
                      selectedFeatures.includes(feature.id)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => toggleFeature(feature.id)}
                  >
                    {feature.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-2 text-lg font-semibold">Badges</h2>
              <div className="flex flex-wrap gap-2">
                {allBadges.map((badge) => (
                  <Badge
                    key={badge.id}
                    variant={
                      selectedBadges.includes(badge.id) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => toggleBadge(badge.id)}
                  >
                    {badge.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="mt-6">
          <Button onClick={applyFilters} className="w-full">
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
