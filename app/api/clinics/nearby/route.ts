import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSetting } from "@/lib/settings";

interface PlacesResult {
  name:                 string;
  place_id:             string;
  vicinity?:            string;
  formatted_address?:   string;
  rating?:              number;
  opening_hours?:       { open_now?: boolean };
  geometry:             { location: { lat: number; lng: number } };
  formatted_phone_number?: string;
  international_phone_number?: string;
}

function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R  = 3958.8; // Earth radius in miles
  const dL = ((lat2 - lat1) * Math.PI) / 180;
  const dG = ((lng2 - lng1) * Math.PI) / 180;
  const a  =
    Math.sin(dL / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dG / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng are required." }, { status: 400 });
  }

  const apiKey = await getSetting("google_places_key");
  if (!apiKey) {
    return NextResponse.json({ error: "Google Places API key not configured." }, { status: 503 });
  }

  // 10 miles ≈ 16093 metres
  const radius = 16093;
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=veterinary_care&key=${apiKey}`;

  try {
    const res  = await fetch(url);
    const data = await res.json() as { results: PlacesResult[]; status: string };

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Places API error: ${data.status}`);
    }

    const clinics = (data.results ?? []).slice(0, 8).map((place) => {
      const distance = distanceMiles(lat, lng, place.geometry.location.lat, place.geometry.location.lng);
      return {
        placeId:     place.place_id,
        name:        place.name,
        address:     place.vicinity ?? place.formatted_address ?? "",
        distance:    Math.round(distance * 10) / 10,
        rating:      place.rating ?? null,
        isOpenNow:   place.opening_hours?.open_now ?? null,
        lat:         place.geometry.location.lat,
        lng:         place.geometry.location.lng,
        directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.name)}&destination_place_id=${place.place_id}`,
      };
    });

    // Sort by distance
    clinics.sort((a, b) => a.distance - b.distance);

    return NextResponse.json({ clinics });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch nearby clinics." },
      { status: 500 }
    );
  }
}
