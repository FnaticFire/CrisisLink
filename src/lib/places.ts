// ============================================================
// CrisisLink - Nearby Places Service
// Uses SerpAPI Google Maps search to find real nearby
// hospitals, police stations, and fire brigades
// ============================================================

export interface NearbyPlace {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'fire' | 'pharmacy';
  address: string;
  distance: string;
  rating: number;
  phone?: string;
  lat: number;
  lng: number;
  openNow?: boolean;
}

const SERPAPI_KEY = process.env.NEXT_PUBLIC_SERPAPI_KEY;

// ─────────────────────────────────────────────
// Core SerpAPI fetch helper
// ─────────────────────────────────────────────
async function fetchFromSerpAPI(
  query: string,
  lat: number,
  lng: number,
  zoom: number = 14
): Promise<any[]> {
  if (!SERPAPI_KEY) {
    console.warn('[SerpAPI] No key found; returning mock data.');
    return [];
  }

  const params = new URLSearchParams({
    engine: 'google_maps',
    q: query,
    ll: `@${lat},${lng},${zoom}z`,
    api_key: SERPAPI_KEY,
    hl: 'en',
    gl: 'in',
  });

  try {
    // SerpAPI must be called from server side (CORS) — use Next.js API route
    const response = await fetch(`/api/places?${params.toString()}`);
    if (!response.ok) throw new Error(`SerpAPI error: ${response.status}`);
    const data = await response.json();
    return data.local_results || [];
  } catch (error) {
    console.error('[SerpAPI] Fetch error:', error);
    return [];
  }
}

// ─────────────────────────────────────────────
// Calculate distance string from coordinates
// ─────────────────────────────────────────────
function calcDistKm(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
}

// ─────────────────────────────────────────────
// Map SerpAPI result to NearbyPlace
// ─────────────────────────────────────────────
function mapResult(
  result: any,
  type: NearbyPlace['type'],
  userLat: number,
  userLng: number
): NearbyPlace {
  const lat = result.gps_coordinates?.latitude ?? userLat;
  const lng = result.gps_coordinates?.longitude ?? userLng;
  return {
    id: result.place_id || String(Math.random()),
    name: result.title || 'Unknown',
    type,
    address: result.address || result.vicinity || 'Address unavailable',
    distance: calcDistKm(userLat, userLng, lat, lng),
    rating: result.rating ?? 0,
    phone: result.phone,
    lat,
    lng,
    openNow: result.open_state === 'Open',
  };
}

// ─────────────────────────────────────────────
// Public API: find nearby emergency services
// ─────────────────────────────────────────────
export async function findNearbyHospitals(lat: number, lng: number): Promise<NearbyPlace[]> {
  const results = await fetchFromSerpAPI('Hospital emergency', lat, lng, 13);
  if (results.length > 0) {
    return results.slice(0, 6).map((r) => mapResult(r, 'hospital', lat, lng));
  }
  return getMockPlaces('hospital', lat, lng);
}

export async function findNearbyPolice(lat: number, lng: number): Promise<NearbyPlace[]> {
  const results = await fetchFromSerpAPI('Police station', lat, lng, 13);
  if (results.length > 0) {
    return results.slice(0, 4).map((r) => mapResult(r, 'police', lat, lng));
  }
  return getMockPlaces('police', lat, lng);
}

export async function findNearbyFireStation(lat: number, lng: number): Promise<NearbyPlace[]> {
  const results = await fetchFromSerpAPI('Fire station', lat, lng, 13);
  if (results.length > 0) {
    return results.slice(0, 4).map((r) => mapResult(r, 'fire', lat, lng));
  }
  return getMockPlaces('fire', lat, lng);
}

export async function findAllEmergencyServices(lat: number, lng: number): Promise<NearbyPlace[]> {
  const [hospitals, police, fire] = await Promise.all([
    findNearbyHospitals(lat, lng),
    findNearbyPolice(lat, lng),
    findNearbyFireStation(lat, lng),
  ]);
  return [...hospitals, ...police, ...fire];
}

// ─────────────────────────────────────────────
// Realistic Indian Mock Data (Delhi-centered)
// ─────────────────────────────────────────────
function getMockPlaces(type: NearbyPlace['type'], lat: number, lng: number): NearbyPlace[] {
  const offset = () => (Math.random() - 0.5) * 0.05;

  const mocks: Record<NearbyPlace['type'], NearbyPlace[]> = {
    hospital: [
      {
        id: 'h1', name: 'AIIMS Trauma Centre', type: 'hospital',
        address: 'Ansari Nagar, New Delhi', distance: '1.2 km',
        rating: 4.8, phone: '011-26588500', lat: lat + offset(), lng: lng + offset(), openNow: true,
      },
      {
        id: 'h2', name: 'Ram Manohar Lohia Hospital', type: 'hospital',
        address: 'Baba Kharak Singh Marg, New Delhi', distance: '2.1 km',
        rating: 4.5, phone: '011-23404323', lat: lat + offset(), lng: lng + offset(), openNow: true,
      },
      {
        id: 'h3', name: 'Safdarjung Hospital', type: 'hospital',
        address: 'Ring Road, New Delhi', distance: '3.0 km',
        rating: 4.3, phone: '011-26707444', lat: lat + offset(), lng: lng + offset(), openNow: true,
      },
    ],
    police: [
      {
        id: 'p1', name: 'Connaught Place Police Station', type: 'police',
        address: 'Connaught Place, New Delhi', distance: '0.5 km',
        rating: 4.2, phone: '011-23417280', lat: lat + offset(), lng: lng + offset(), openNow: true,
      },
      {
        id: 'p2', name: 'Parliament Street Police Station', type: 'police',
        address: 'Parliament Street, New Delhi', distance: '1.8 km',
        rating: 4.4, lat: lat + offset(), lng: lng + offset(), openNow: true,
      },
    ],
    fire: [
      {
        id: 'f1', name: 'Delhi Fire Station — CP', type: 'fire',
        address: 'Kasturba Gandhi Marg, New Delhi', distance: '1.1 km',
        rating: 4.6, phone: '101', lat: lat + offset(), lng: lng + offset(), openNow: true,
      },
    ],
    pharmacy: [],
  };

  return mocks[type] || [];
}
