"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RestaurantMap } from "@/components/map/restaurant-map";
import { NearbyBottomSheet } from "@/components/map/nearby-bottom-sheet";
import type { RestaurantWithDetails } from "@/types/restaurant";

const DEFAULT_CENTER = { lat: 40.7, lng: -74 };
const DEFAULT_ZOOM = 10;
const SELECTED_ZOOM = 15;

interface MapViewProps {
  restaurants: RestaurantWithDetails[];
  highlightRestaurantId?: string | null;
}

export function MapView({
  restaurants,
  highlightRestaurantId = null,
}: MapViewProps) {
  const router = useRouter();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);

  useEffect(() => {
    if (!highlightRestaurantId || !restaurants.some((r) => r.id === highlightRestaurantId)) return;
    const id = highlightRestaurantId;
    const rest = restaurants.find((r) => r.id === id);
    const t = setTimeout(() => {
      setSelectedRestaurantId(id);
      setSheetOpen(true);
      if (rest?.latitude != null && rest?.longitude != null) {
        setMapCenter({ lat: rest.latitude, lng: rest.longitude });
        setMapZoom(SELECTED_ZOOM);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [highlightRestaurantId, restaurants]);

  const handleMarkerClick = useCallback(
    (id: string) => {
      if (selectedRestaurantId === id) {
        router.push(`/restaurants/${id}`);
        return;
      }
      const rest = restaurants.find((r) => r.id === id);
      if (rest?.latitude != null && rest?.longitude != null) {
        setMapCenter({ lat: rest.latitude, lng: rest.longitude });
        setMapZoom(SELECTED_ZOOM);
      }
      setSelectedRestaurantId(id);
      setSheetOpen(true);
    },
    [selectedRestaurantId, restaurants, router],
  );

  const handleCameraChange = useCallback(
    (ev: { detail: { center?: { lat: number; lng: number }; zoom?: number } }) => {
      const { center, zoom } = ev.detail ?? {};
      if (center) setMapCenter(center);
      if (typeof zoom === "number") setMapZoom(zoom);
    },
    [],
  );

  const handleRestaurantClick = useCallback(
    (id: string) => {
      if (selectedRestaurantId === id) {
        router.push(`/restaurants/${id}`);
        return;
      }
      const rest = restaurants.find((r) => r.id === id);
      if (rest?.latitude != null && rest?.longitude != null) {
        setMapCenter({ lat: rest.latitude, lng: rest.longitude });
        setMapZoom(SELECTED_ZOOM);
      }
      setSelectedRestaurantId(id);
      setSheetOpen(true);
    },
    [selectedRestaurantId, restaurants, router],
  );

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) setSelectedRestaurantId(null);
  };

  return (
    <>
      <RestaurantMap
        restaurants={restaurants}
        selectedRestaurantId={selectedRestaurantId}
        onMarkerClick={handleMarkerClick}
        center={mapCenter}
        zoom={mapZoom}
        onCameraChanged={handleCameraChange}
      />
      <NearbyBottomSheet
        restaurants={restaurants}
        highlightedRestaurantId={selectedRestaurantId}
        isOpen={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        onRestaurantClick={handleRestaurantClick}
      />
    </>
  );
}
